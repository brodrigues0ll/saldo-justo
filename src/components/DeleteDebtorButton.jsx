'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function DeleteDebtorButton({ debtorId }) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Tem certeza que quer deletar esse devedor? Isso não pode ser desfeito.')) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/debtor/${debtorId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erro ao deletar')
        return
      }
      toast.success('Devedor deletado')
      window.location.reload()
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
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        handleDelete()
      }}
      disabled={loading}
      className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8 w-8 p-0"
      title="Deletar devedor"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  )
}
