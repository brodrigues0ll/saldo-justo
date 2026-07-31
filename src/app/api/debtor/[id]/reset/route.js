import { connectDB } from '@/lib/db'
import { jsonOk, jsonError } from '@/lib/api-helpers'
import { getSession } from '@/lib/auth'
import mongoose from 'mongoose'
import Debtor from '@/models/Debtor'
import { wsBroadcast } from '@/lib/ws-broadcast'

export async function POST(request, context) {
  const session = await getSession()
  if (!session) return jsonError('Não autenticado', 401)

  const { id } = await context.params

  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError('ID inválido', 400)

  await connectDB()

  const debtor = await Debtor.findByIdAndUpdate(
    id,
    { debtResetAt: new Date() },
    { returnDocument: 'after' }
  )
  if (!debtor) return jsonError('Devedor não encontrado', 404)

  wsBroadcast(id, { type: 'debtor:reset', payload: { debtResetAt: debtor.debtResetAt } })

  return jsonOk({ message: 'Dívida zerada com sucesso' })
}
