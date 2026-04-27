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

export async function PATCH(request, context) {
  const session = await getSession()
  if (!session) return jsonError('Não autenticado', 401)

  const { id } = await context.params
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError('ID inválido', 400)

  await connectDB()

  const transaction = await Transaction.findById(id)
  if (!transaction) return jsonError('Transação não encontrada', 404)

  const body = await request.json()
  const updates = {}

  if (body.amount !== undefined) {
    const amount = Math.round(Number(body.amount) * 100) / 100
    if (!amount || amount <= 0 || amount > 1_000_000) return jsonError('Valor inválido', 422)
    updates.amount = amount
  }

  if (body.description !== undefined) {
    updates.description = String(body.description).trim()
  }

  if (body.transactionDate !== undefined) {
    if (body.transactionDate === null || body.transactionDate === '') {
      updates.transactionDate = undefined
      updates.$unset = { transactionDate: 1 }
    } else {
      const [year, month, day] = String(body.transactionDate).split('-').map(Number)
      const d = new Date(Date.UTC(year, month - 1, day))
      if (isNaN(d.getTime())) return jsonError('Data inválida', 422)
      updates.transactionDate = d
    }
  }

  if (Object.keys(updates).length === 0) return jsonError('Nenhum campo para atualizar', 422)

  const { $unset, ...setFields } = updates
  const op = { $set: setFields }
  if ($unset) op.$unset = $unset

  const updated = await Transaction.findByIdAndUpdate(id, op, { returnDocument: 'after', runValidators: true })
  wsBroadcast(updated.debtorId, { type: 'tx:update', payload: JSON.parse(JSON.stringify(updated)) })

  return jsonOk(updated)
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
