import mongoose from 'mongoose'
import { revalidatePath } from 'next/cache'
import { connectDB } from '@/lib/db'
import { jsonOk, jsonError } from '@/lib/api-helpers'
import { getSession } from '@/lib/auth'
import { generateCode } from '@/lib/code'
import { validateDebtor } from '@/lib/validators'
import { getDebtorTotals } from '@/lib/debtor-totals'
import Debtor from '@/models/Debtor'

export async function GET() {
  const session = await getSession()
  if (!session) return jsonError('Não autenticado', 401)

  await connectDB()

  const debtors = await Debtor.find().sort({ createdAt: -1 }).lean()

  const debtorsWithTotals = await Promise.all(
    debtors.map(async (debtor) => {
      const totals = await getDebtorTotals(debtor._id)
      const { createdBy, ...rest } = debtor
      return { ...rest, ...totals }
    })
  )

  return jsonOk(debtorsWithTotals)
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return jsonError('Não autenticado', 401)

  await connectDB()

  const body = await request.json()
  const validationError = validateDebtor(body)
  if (validationError) return jsonError(validationError, 422)

  const { name } = body

  let code = null
  const MAX_ATTEMPTS = 10
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const candidate = generateCode()
    const existing = await Debtor.findOne({ code: candidate })
    if (!existing) {
      code = candidate
      break
    }
  }

  if (!code) return jsonError('Não foi possível gerar um código único. Tente novamente.', 500)

  const debtor = await Debtor.create({
    name: name.trim(),
    code,
    createdBy: new mongoose.Types.ObjectId(session.sub),
    canCreatePayment: false,
  })

  revalidatePath('/dashboard')
  return jsonOk(debtor, 201)
}
