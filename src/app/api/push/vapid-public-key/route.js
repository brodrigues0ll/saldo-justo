import { jsonOk, jsonError } from '@/lib/api-helpers'

export function GET() {
  if (!process.env.VAPID_PUBLIC_KEY) {
    return jsonError('Push notifications não configuradas no servidor', 503)
  }
  return jsonOk({ key: process.env.VAPID_PUBLIC_KEY })
}
