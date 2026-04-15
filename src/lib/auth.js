import { getServerSession } from 'next-auth'
import { handler } from '@/auth'
import { redirect } from 'next/navigation'

export async function getSession() {
  const session = await getServerSession(handler)
  if (!session) return null
  return {
    sub: session.user.id,
    name: session.user.name,
    email: session.user.email,
  }
}

export async function requireAdmin() {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}
