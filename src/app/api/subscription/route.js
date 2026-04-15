import { connectDB } from '@/lib/db'
import { jsonOk, jsonError } from '@/lib/api-helpers'
import { getSession } from '@/lib/auth'
import PushSubscription from '@/models/PushSubscription'
import Debtor from '@/models/Debtor'

export async function POST(request) {
  const body = await request.json().catch(() => null)

  if (!body || !body.subscription || !body.role) {
    return jsonError('Dados inválidos', 400)
  }

  const { subscription, role, debtorCode } = body

  if (!['admin', 'debtor'].includes(role)) {
    return jsonError('Role inválido', 400)
  }

  if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    return jsonError('Subscription incompleta', 400)
  }

  await connectDB()

  let debtorId = null

  if (role === 'admin') {
    const session = await getSession()
    if (!session) return jsonError('Não autenticado', 401)
  } else {
    // role === 'debtor'
    if (!debtorCode) return jsonError('debtorCode é obrigatório para devedores', 422)

    const cleanCode = debtorCode.toUpperCase()
    if (!/^SJ-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(cleanCode)) {
      return jsonError('Formato de código inválido', 400)
    }

    const debtor = await Debtor.findOne({ code: cleanCode }).lean()
    if (!debtor) return jsonError('Devedor não encontrado', 404)

    debtorId = debtor._id
  }

  await PushSubscription.updateOne(
    { endpoint: subscription.endpoint },
    {
      $set: {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        role,
        debtorId,
      },
    },
    { upsert: true }
  )

  return jsonOk({ ok: true })
}

export async function DELETE(request) {
  const body = await request.json().catch(() => null)

  if (!body || !body.endpoint) {
    return jsonError('endpoint é obrigatório', 400)
  }

  await connectDB()

  // Require authentication: admin session OR valid debtorCode that owns the subscription
  const session = await getSession()

  if (session) {
    // Admin: can only delete their own (admin-role) subscriptions
    await PushSubscription.deleteOne({ endpoint: body.endpoint, role: 'admin' })
    return jsonOk({ ok: true })
  }

  if (body.debtorCode) {
    const debtor = await Debtor.findOne({ code: body.debtorCode.toUpperCase() }).lean()
    if (!debtor) return jsonError('Devedor não encontrado', 404)
    await PushSubscription.deleteOne({
      endpoint: body.endpoint,
      role: 'debtor',
      debtorId: debtor._id,
    })
    return jsonOk({ ok: true })
  }

  return jsonError('Não autenticado', 401)
}
