import mongoose from 'mongoose'
import { connectDB } from '@/lib/db'
import { jsonOk, jsonError } from '@/lib/api-helpers'
import { getSession } from '@/lib/auth'
import Transaction from '@/models/Transaction'

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

  await transaction.deleteOne()
  return jsonOk({ message: 'Transação excluída com sucesso' })
}
