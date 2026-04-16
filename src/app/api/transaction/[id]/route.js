import mongoose from 'mongoose'
import { connectDB } from '@/lib/db'
import { jsonOk, jsonError } from '@/lib/api-helpers'
import { getSession } from '@/lib/auth'
import Transaction from '@/models/Transaction'
import { wsBroadcast } from '@/lib/ws-broadcast'

export async function GET(request, context) {
  const session = await getSession()
  if (!session) return jsonError('Não autenticado', 401)

  const { id } = await context.params

  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError('ID inválido', 400)

  await connectDB()

  const transaction = await Transaction.findById(id).lean()
  if (!transaction) return jsonError('Transação não encontrada', 404)

  return jsonOk(transaction)
}

export async function DELETE(request, context) {
  const session = await getSession()
  if (!session) return jsonError('Não autenticado', 401)

  const { id } = await context.params

  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError('ID inválido', 400)

  await connectDB()

  const transaction = await Transaction.findById(id)
  if (!transaction) return jsonError('Transação não encontrada', 404)

  const debtorId = transaction.debtorId.toString()
  const transactionId = transaction._id.toString()
  await transaction.deleteOne()

  wsBroadcast(debtorId, { type: 'tx:delete', payload: { _id: transactionId } })

  return jsonOk({ message: 'Transação excluída com sucesso' })
}
