'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import GlassCard from '@/components/GlassCard'

export default function AdminLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Credenciais inválidas')
        return
      }

      router.push('/dashboard')
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <GlassCard>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="admin@saldojusto.com"
            required
            disabled={loading}
            className="h-11 rounded-xl border-border bg-background/50 focus:border-primary focus:ring-primary/20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
            className="h-11 rounded-xl border-border bg-background/50 focus:border-primary focus:ring-primary/20"
          />
        </div>
        {error && <p className="text-sm text-destructive text-center">{error}</p>}
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 gradient-primary text-white rounded-xl font-semibold glow-primary hover:opacity-90 transition-all duration-200"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </GlassCard>
  )
}
