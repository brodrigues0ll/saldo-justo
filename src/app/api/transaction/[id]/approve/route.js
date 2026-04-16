import mongoose from 'mongoose'
import { connectDB } from '@/lib/db'
import { jsonOk, jsonError } from '@/lib/api-helpers'
import { getSession } from '@/lib/auth'
import Transaction from '@/models/Transaction'
import { notifyDebtorPaymentApproved } from '@/lib/push'
import { wsBroadcast } from '@/lib/ws-broadcast'

export async function POST(request, context) {
  const session = await getSession()
  if (!session) return jsonError('Não autenticado', 401)

  const { id } = await context.params

  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError('ID inválido', 400)

  await connectDB()

  const transaction = await Transaction.findById(id)
  if (!transaction) return jsonError('Transação não encontrada', 404)

  if (transaction.status !== 'pending') {
    return jsonError('Apenas transações pendentes podem ser aprovadas', 422)
  }

  if (transaction.type !== 'payment') {
    return jsonError('Apenas pagamentos podem ser aprovados por este endpoint', 422)
  }

  transaction.status = 'approved'
  transaction.approvedAt = new Date()
  await transaction.save()

  wsBroadcast(transaction.debtorId, {
    type: 'tx:update',
    payload: JSON.parse(JSON.stringify(transaction)),
  })

  // Fire-and-forget — não bloqueia a resposta
  notifyDebtorPaymentApproved({
    debtorId: transaction.debtorId.toString(),
    amount: transaction.amount,
    description: transaction.description,
  }).catch(console.error)

  return jsonOk(transaction)
}
