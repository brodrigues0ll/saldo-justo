import { connectDB } from '@/lib/db'
import { jsonOk, jsonError } from '@/lib/api-helpers'
import { getSession } from '@/lib/auth'
import { validateDebtor } from '@/lib/validators'
import { getDebtorTotals } from '@/lib/debtor-totals'
import mongoose from 'mongoose'
import Debtor from '@/models/Debtor'
import Transaction from '@/models/Transaction'
import PushSubscription from '@/models/PushSubscription'
import { wsBroadcast } from '@/lib/ws-broadcast'

export async function GET(request, context) {
  const session = await getSession()
  if (!session) return jsonError('Não autenticado', 401)

  const { id } = await context.params

  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError('ID inválido', 400)

  await connectDB()

  const debtor = await Debtor.findById(id).lean()
  if (!debtor) return jsonError('Devedor não encontrado', 404)

  const totals = await getDebtorTotals(id)
  const transactions = await Transaction.find({ debtorId: id })
    .sort({ createdAt: -1 })
    .lean()

  const { createdBy, ...sanitizedDebtor } = debtor
  return jsonOk({ ...sanitizedDebtor, ...totals, transactions })
}

export async function PATCH(request, context) {
  const session = await getSession()
  if (!session) return jsonError('Não autenticado', 401)

  const { id } = await context.params

  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError('ID inválido', 400)

  await connectDB()

  const body = await request.json()
  const updates = {}

  if (body.name !== undefined) {
    const validationError = validateDebtor({ name: body.name })
    if (validationError) return jsonError(validationError, 422)
    updates.name = body.name.trim()
  }

  if (body.canCreatePayment !== undefined) {
    updates.canCreatePayment = Boolean(body.canCreatePayment)
  }

  if (body.displayMode !== undefined && ['deposit', 'debt'].includes(body.displayMode)) {
    updates.displayMode = body.displayMode
  }

  if (Object.keys(updates).length === 0) return jsonError('Nenhum campo para atualizar', 422)

  const debtor = await Debtor.findByIdAndUpdate(id, updates, { returnDocument: 'after', runValidators: true })
  if (!debtor) return jsonError('Devedor não encontrado', 404)

  wsBroadcast(id, {
    type: 'debtor:update',
    payload: { displayMode: debtor.displayMode, canCreatePayment: debtor.canCreatePayment, name: debtor.name },
  })

  return jsonOk(debtor)
}

export async function DELETE(request, context) {
  const session = await getSession()
  if (!session) return jsonError('Não autenticado', 401)

  const { id } = await context.params

  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError('ID inválido', 400)

  await connectDB()

  const debtor = await Debtor.findByIdAndDelete(id)
  if (!debtor) return jsonError('Devedor não encontrado', 404)

  await Transaction.deleteMany({ debtorId: id })
  await PushSubscription.deleteMany({ debtorId: id })

  return jsonOk({ message: 'Devedor excluído com sucesso' })
}
