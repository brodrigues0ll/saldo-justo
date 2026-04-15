import webpush from 'web-push'

let initialized = false

function initWebPush() {
  if (initialized) return
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn('[push] VAPID keys não configuradas — push desabilitado')
    return
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@saldojusto.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )
  initialized = true
}

/**
 * Envia notificação para uma subscription.
 * Se retornar 410 Gone, retorna { gone: true } para sinalizar que deve deletar.
 */
async function sendPush(subscription, payload) {
  initWebPush()
  if (!initialized) return { ok: false }

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
    return { ok: true }
  } catch (err) {
    if (err.statusCode === 410) {
      return { ok: false, gone: true }
    }
    console.error('[push] Erro ao enviar:', err.message)
    return { ok: false }
  }
}

/**
 * Notifica o admin sobre novo pagamento pendente (criado pelo devedor)
 */
export async function notifyAdminNewPayment({ debtorName, amount, description }) {
  const { connectDB } = await import('@/lib/db')
  const PushSubscription = (await import('@/models/PushSubscription')).default

  await connectDB()
  const subs = await PushSubscription.find({ role: 'admin' }).lean()

  const payload = {
    title: 'Novo pagamento pendente',
    body: `${debtorName} registrou um pagamento de R$ ${amount.toFixed(2).replace('.', ',')} — ${description}`,
    url: '/dashboard',
  }

  await Promise.allSettled(
    subs.map(async sub => {
      const result = await sendPush({ endpoint: sub.endpoint, keys: sub.keys }, payload)
      if (result.gone) {
        await PushSubscription.deleteOne({ _id: sub._id })
      }
    })
  )
}

/**
 * Notifica o devedor sobre aprovação de pagamento
 */
export async function notifyDebtorPaymentApproved({ debtorId, amount, description }) {
  const { connectDB } = await import('@/lib/db')
  const PushSubscription = (await import('@/models/PushSubscription')).default
  const mongoose = (await import('mongoose')).default

  await connectDB()
  const subs = await PushSubscription.find({
    role: 'debtor',
    debtorId: new mongoose.Types.ObjectId(debtorId),
  }).lean()

  const payload = {
    title: 'Pagamento aprovado!',
    body: `Seu pagamento de R$ ${amount.toFixed(2).replace('.', ',')} foi aprovado — ${description}`,
    url: '#',
  }

  await Promise.allSettled(
    subs.map(async sub => {
      const result = await sendPush({ endpoint: sub.endpoint, keys: sub.keys }, payload)
      if (result.gone) {
        await PushSubscription.deleteOne({ _id: sub._id })
      }
    })
  )
}

/**
 * Notifica o devedor sobre rejeição de pagamento
 */
export async function notifyDebtorPaymentRejected({ debtorId, amount, description, reason }) {
  const { connectDB } = await import('@/lib/db')
  const PushSubscription = (await import('@/models/PushSubscription')).default
  const mongoose = (await import('mongoose')).default

  await connectDB()
  const subs = await PushSubscription.find({
    role: 'debtor',
    debtorId: new mongoose.Types.ObjectId(debtorId),
  }).lean()

  const body = reason
    ? `Pagamento de R$ ${amount.toFixed(2).replace('.', ',')} rejeitado: ${reason}`
    : `Seu pagamento de R$ ${amount.toFixed(2).replace('.', ',')} foi rejeitado — ${description}`

  const payload = {
    title: 'Pagamento rejeitado',
    body,
    url: '#',
  }

  await Promise.allSettled(
    subs.map(async sub => {
      const result = await sendPush({ endpoint: sub.endpoint, keys: sub.keys }, payload)
      if (result.gone) {
        await PushSubscription.deleteOne({ _id: sub._id })
      }
    })
  )
}

/**
 * Notifica o devedor sobre novo depósito
 */
export async function notifyDebtorNewDeposit({ debtorId, amount, description }) {
  const { connectDB } = await import('@/lib/db')
  const PushSubscription = (await import('@/models/PushSubscription')).default
  const mongoose = (await import('mongoose')).default

  await connectDB()
  const subs = await PushSubscription.find({
    role: 'debtor',
    debtorId: new mongoose.Types.ObjectId(debtorId),
  }).lean()

  const payload = {
    title: 'Novo crédito adicionado',
    body: `R$ ${amount.toFixed(2).replace('.', ',')} depositado — ${description}`,
    url: '#',
  }

  await Promise.allSettled(
    subs.map(async sub => {
      const result = await sendPush({ endpoint: sub.endpoint, keys: sub.keys }, payload)
      if (result.gone) {
        await PushSubscription.deleteOne({ _id: sub._id })
      }
    })
  )
}
