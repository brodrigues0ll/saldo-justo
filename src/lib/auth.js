import { getServerSession } from 'next-auth'
import { cookies } from 'next/headers'
import { authOptions } from '@/auth'
import { redirect } from 'next/navigation'

export async function getSession() {
  await cookies() // sinaliza ao Next.js que essa rota depende de cookies (opt-out de cache estático)
  const session = await getServerSession(authOptions)
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
