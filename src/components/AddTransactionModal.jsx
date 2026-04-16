'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import MoneyInput, { parseMoneyValue } from '@/components/MoneyInput'

export default function AddTransactionModal({ debtorId, type, displayMode = 'deposit', children }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(false)

  const isDebt = displayMode === 'debt'
  const isPayment = type === 'payment'

  const labels = {
    title: isPayment ? 'Registrar Pagamento' : (isDebt ? 'Adicionar Dívida' : 'Adicionar Depósito'),
    descPlaceholder: isPayment
      ? 'Ex: PIX recebido, dinheiro em mãos...'
      : (isDebt ? 'Ex: Swile Abril, Saco de lixo comprado, ...' : 'Ex: Vale Swile Abril, Bônus...'),
    descRequired: isPayment,
  }

  function handleOpenChange(val) {
    setOpen(val)
    if (!val) {
      setAmount('')
      setDescription('')
      setDate('')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const parsedAmount = parseMoneyValue(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('Informe um valor válido')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debtorId,
          type,
          amount: parsedAmount,
          description: description.trim(),
          ...(date && { transactionDate: date }),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erro ao registrar')
        return
      }
      toast.success(`${labels.title} registrado com sucesso`)
      handleOpenChange(false)
      // Refetch dados no cliente via função exposta pelo componente
      if (typeof window !== 'undefined' && window.__refetchDebtor) {
        await window.__refetchDebtor()
      }
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Valor</Label>
            <MoneyInput
              value={amount}
              onChange={setAmount}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label>
              Descrição{!labels.descRequired && <span className="text-neutral-400 font-normal"> (opcional)</span>}
            </Label>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={labels.descPlaceholder}
              required={labels.descRequired}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label>
              Data <span className="text-neutral-400 font-normal">(opcional)</span>
            </Label>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              disabled={loading}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
