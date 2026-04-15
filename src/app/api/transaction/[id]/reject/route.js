import mongoose from 'mongoose'
import { revalidatePath } from 'next/cache'
import { connectDB } from '@/lib/db'
import { jsonOk, jsonError } from '@/lib/api-helpers'
import { getSession } from '@/lib/auth'
import Transaction from '@/models/Transaction'
import { notifyDebtorPaymentRejected } from '@/lib/push'

export async function POST(request, context) {
  const session = await getSession()
  if (!session) return jsonError('Não autenticado', 401)

  const { id } = await context.params

  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError('ID inválido', 400)

  await connectDB()

  const transaction = await Transaction.findById(id)
  if (!transaction) return jsonError('Transação não encontrada', 404)

  if (transaction.type !== 'payment') {
    return jsonError('Apenas pagamentos podem ser rejeitados', 422)
  }

  if (transaction.status !== 'pending') {
    return jsonError('Apenas transações pendentes podem ser rejeitadas', 422)
  }

  const body = await request.json().catch(() => ({}))

  const rejectionReason =
    body.reason && typeof body.reason === 'string' && body.reason.trim().length > 0
      ? body.reason.trim()
      : undefined

  transaction.status = 'rejected'
  if (rejectionReason) {
    transaction.rejectionReason = rejectionReason
  }
  await transaction.save()

  // Fire-and-forget — não bloqueia a resposta
  notifyDebtorPaymentRejected({
    debtorId: transaction.debtorId.toString(),
    amount: transaction.amount,
    description: transaction.description,
    reason: rejectionReason,
  }).catch(console.error)

  revalidatePath('/dashboard')
  return jsonOk(transaction)
}
