'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function DeleteTransactionButton({ transactionId, onDelete }) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Tem certeza que quer deletar essa transação? Isso não pode ser desfeito.')) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/transaction/${transactionId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erro ao deletar')
        return
      }
      toast.success('Transação deletada')
      if (onDelete) onDelete(transactionId)
      else window.location.reload()
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
      className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8 w-8 p-0"
      title="Deletar transação"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  )
}
