'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'

export default function DisplayModeToggle({ debtorId, initialMode }) {
  const router = useRouter()
  const [mode, setMode] = useState(initialMode || 'deposit')
  const [loading, setLoading] = useState(false)

  async function handleChange(newMode) {
    if (newMode === mode) return
    const prevMode = mode
    setMode(newMode)
    setLoading(true)
    try {
      const res = await fetch(`/api/debtor/${debtorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayMode: newMode }),
      })
      if (!res.ok) {
        setMode(prevMode)
        toast.error('Erro ao atualizar modo')
        return
      }
      toast.success(newMode === 'deposit' ? 'Modo: Depósito / Crédito' : 'Modo: Saldo Devedor')
      router.refresh()
    } catch {
      setMode(prevMode)
      toast.error('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Modo de exibição</Label>
      <div className="flex gap-2">
        <button
          onClick={() => handleChange('deposit')}
          disabled={loading}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
            mode === 'deposit'
              ? 'bg-neutral-900 text-white border-neutral-900'
              : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
          }`}
        >
          Depósito / Crédito
        </button>
        <button
          onClick={() => handleChange('debt')}
          disabled={loading}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
            mode === 'debt'
              ? 'bg-neutral-900 text-white border-neutral-900'
              : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
          }`}
        >
          Saldo Devedor
        </button>
      </div>
      <p className="text-xs text-neutral-400">
        {mode === 'deposit'
          ? 'Exibe o que foi depositado/creditado e o que foi pago de volta.'
          : 'Exibe o total da dívida e quanto já foi quitado.'}
      </p>
    </div>
  )
}
