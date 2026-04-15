'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import GlassCard from '@/components/GlassCard'
import Link from 'next/link'

export default function RegisterForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('As senhas não coincidem')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao criar conta')
        return
      }

      // Faz login automaticamente após cadastro
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        router.push('/login')
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
          <Label htmlFor="name" className="text-sm font-medium">Nome</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Seu nome"
            required
            disabled={loading}
            className="h-11 rounded-xl border-border bg-background/50 focus:border-primary focus:ring-primary/20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com"
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
            placeholder="Mínimo 6 caracteres"
            required
            disabled={loading}
            className="h-11 rounded-xl border-border bg-background/50 focus:border-primary focus:ring-primary/20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm" className="text-sm font-medium">Confirmar senha</Label>
          <Input
            id="confirm"
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repita a senha"
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
          {loading ? 'Criando conta...' : 'Criar conta'}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Entrar
          </Link>
        </p>
      </form>
    </GlassCard>
  )
}
