'use client'
import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function CanCreatePaymentToggle({ debtorId, initialValue, onSuccess }) {
  const [enabled, setEnabled] = useState(initialValue)
  const [loading, setLoading] = useState(false)

  async function handleToggle(value) {
    setEnabled(value)
    setLoading(true)
    try {
      const res = await fetch(`/api/debtor/${debtorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canCreatePayment: value }),
      })
      if (!res.ok) {
        setEnabled(!value) // revert
        toast.error('Erro ao atualizar permissão')
        return
      }
      toast.success(value ? 'Devedor pode registrar pagamentos' : 'Devedor não pode mais registrar pagamentos')
      if (onSuccess) onSuccess()
      else window.location.reload()
    } catch {
      setEnabled(!value)
      toast.error('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Switch
        id="canCreate"
        checked={enabled}
        onCheckedChange={handleToggle}
        disabled={loading}
      />
      <Label htmlFor="canCreate" className="cursor-pointer">
        Permitir que o devedor registre pagamentos
      </Label>
    </div>
  )
}
