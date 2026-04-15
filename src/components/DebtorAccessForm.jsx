'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import GlassCard from '@/components/GlassCard'

export default function DebtorAccessForm() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Se já tem código salvo, redirecionar
  useEffect(() => {
    const saved = localStorage.getItem('sj_debtor_code')
    if (saved) router.replace(`/devedor/${saved}`)
  }, [router])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const cleanCode = code.trim().toUpperCase()

    try {
      const res = await fetch(`/api/debtor/by-code/${encodeURIComponent(cleanCode)}`)
      if (!res.ok) {
        setError('Código inválido. Verifique e tente novamente.')
        return
      }
      localStorage.setItem('sj_debtor_code', cleanCode)
      router.push(`/devedor/${cleanCode}`)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <GlassCard>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code" className="text-sm font-medium">Código de acesso</Label>
          <input
            id="code"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="SJ-XXXX-XXXX"
            required
            disabled={loading}
            maxLength={12}
            className="w-full h-12 text-center font-mono text-lg tracking-[0.3em] rounded-xl border bg-background/50 border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 px-4 disabled:opacity-50"
          />
        </div>
        {error && <p className="text-sm text-destructive text-center">{error}</p>}
        <Button
          type="submit"
          disabled={loading || code.length < 3}
          className="w-full h-11 gradient-primary text-white rounded-xl font-semibold glow-primary hover:opacity-90 transition-all duration-200"
        >
          {loading ? 'Verificando...' : 'Acessar'}
        </Button>
      </form>
    </GlassCard>
  )
}
