import { connectDB } from '@/lib/db'
import { jsonOk, jsonError } from '@/lib/api-helpers'
import { getDebtorTotals } from '@/lib/debtor-totals'
import Debtor from '@/models/Debtor'
import Transaction from '@/models/Transaction'

export async function GET(request, context) {
  const { code } = await context.params

  if (!code) return jsonError('Código inválido', 400)

  await connectDB()

  const debtor = await Debtor.findOne({ code: code.toUpperCase() }).lean()
  if (!debtor) return jsonError('Devedor não encontrado', 404)

  const totals = await getDebtorTotals(debtor._id)
  const transactions = await Transaction.find({ debtorId: debtor._id })
    .select("-createdBy")
    .sort({ createdAt: -1 })
    .lean()

  // Sanitize: omit createdBy to avoid exposing admin data
  const { createdBy, ...sanitizedDebtor } = debtor

  return jsonOk({ ...sanitizedDebtor, ...totals, transactions })
}
