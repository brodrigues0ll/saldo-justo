import mongoose from 'mongoose'
import { connectDB } from '@/lib/db'
import { jsonOk, jsonError } from '@/lib/api-helpers'
import { getSession } from '@/lib/auth'
import { validateTransaction } from '@/lib/validators'
import Debtor from '@/models/Debtor'
import Transaction from '@/models/Transaction'
import { notifyAdminNewPayment, notifyDebtorNewDeposit } from '@/lib/push'

export async function POST(request) {
  await connectDB()

  const body = await request.json()
  const { debtorId, type, amount, description, debtorCode, transactionDate } = body

  // Arredondar para 2 casas decimais antes de validar (evita imprecisão de float)
  const safeAmount = typeof amount === 'number' ? Math.round(amount * 100) / 100 : amount

  // Cap amount to prevent overflow or abuse (max R$ 1,000,000.00)
  if (typeof safeAmount === 'number' && safeAmount > 1_000_000) return jsonError('Valor máximo por transação é R$ 1.000.000,00', 422)

  const validationError = validateTransaction({ type, amount: safeAmount, description })
  if (validationError) return jsonError(validationError, 422)

  const session = await getSession()

  let resolvedDebtorId
  let resolvedDebtorName
  let status
  let approvedAt
  let createdBy

  if (session) {
    // Admin flow
    if (!debtorId) return jsonError('debtorId é obrigatório', 422)
    if (!mongoose.Types.ObjectId.isValid(debtorId)) return jsonError('debtorId inválido', 400)

    const debtor = await Debtor.findById(debtorId)
    if (!debtor) return jsonError('Devedor não encontrado', 404)

    resolvedDebtorId = debtor._id
    resolvedDebtorName = debtor.name
    status = 'approved'
    approvedAt = new Date()
    createdBy = 'admin'
  } else if (debtorCode) {
    // Debtor flow
    if (type === 'deposit') return jsonError('Devedor não pode criar depósito', 403)

    const debtor = await Debtor.findOne({ code: debtorCode.toUpperCase() })
    if (!debtor) return jsonError('Devedor não encontrado', 404)

    if (!debtor.canCreatePayment) {
      return jsonError('Você não tem permissão para registrar pagamentos', 403)
    }

    resolvedDebtorId = debtor._id
    resolvedDebtorName = debtor.name
    status = 'pending'
    approvedAt = undefined
    createdBy = 'debtor'
  } else {
    return jsonError('Não autenticado', 401)
  }

  const parsedDate = transactionDate ? (() => {
    const [year, month, day] = transactionDate.split('-').map(Number)
    return new Date(year, month - 1, day)
  })() : undefined
  const safeTransactionDate = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : undefined

  const transaction = await Transaction.create({
    debtorId: resolvedDebtorId,
    type,
    amount: safeAmount,
    description: typeof description === 'string' ? description.trim() : '',
    createdBy,
    status,
    ...(approvedAt && { approvedAt }),
    ...(safeTransactionDate && { transactionDate: safeTransactionDate }),
  })

  // Fire-and-forget — não bloqueia a resposta
  const safeDescription = typeof description === 'string' ? description.trim() : ''
  if (createdBy === 'debtor' && type === 'payment') {
    notifyAdminNewPayment({
      debtorName: resolvedDebtorName,
      amount: safeAmount,
      description: safeDescription,
    }).catch(console.error)
  } else if (createdBy === 'admin' && type === 'deposit') {
    notifyDebtorNewDeposit({
      debtorId: resolvedDebtorId.toString(),
      amount: safeAmount,
      description: safeDescription,
    }).catch(console.error)
  }

  return jsonOk(transaction, 201)
}
