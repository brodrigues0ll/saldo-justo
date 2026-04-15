'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function ApproveRejectButtons({ transactionId }) {
  const router = useRouter()
  const [loading, setLoading] = useState(null) // 'approve' | 'reject' | null

  async function handleAction(action) {
    setLoading(action)
    try {
      const res = await fetch(`/api/transaction/${transactionId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erro ao processar')
        return
      }
      toast.success(action === 'approve' ? 'Pagamento aprovado' : 'Pagamento rejeitado')
      router.refresh()
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={() => handleAction('approve')}
        disabled={loading !== null}
        className="bg-emerald-500 hover:bg-emerald-600 text-white glow-success transition-all duration-200 rounded-lg text-xs"
      >
        {loading === 'approve' ? '...' : 'Aprovar'}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => handleAction('reject')}
        disabled={loading !== null}
        className="rounded-lg text-xs transition-all duration-200"
      >
        {loading === 'reject' ? '...' : 'Rejeitar'}
      </Button>
    </div>
  )
}
