'use client'
import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Trash2, Pencil } from 'lucide-react'
import MoneyInput, { parseMoneyValue } from '@/components/MoneyInput'
import { formatBRL } from '@/lib/money'

function formatDisplayDate(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
}

function toInputDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().split('T')[0]
}

export default function TransactionModal({ transaction, displayMode = 'deposit', open, onOpenChange, onUpdate, onDelete }) {
  const { _id, type, amount, description, status, transactionDate, createdAt, createdBy } = transaction

  const [editing, setEditing] = useState(false)
  const [editAmount, setEditAmount] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDate, setEditDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const isDeposit = type === 'deposit'
  const typeLabel = isDeposit
    ? (displayMode === 'debt' ? 'Dívida' : 'Depósito')
    : 'Pagamento'

  const displayDate = transactionDate
    ? formatDisplayDate(transactionDate)
    : new Date(createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  function openEdit() {
    setEditAmount(String(amount))
    setEditDescription(description || '')
    setEditDate(transactionDate ? toInputDate(transactionDate) : '')
    setEditing(true)
    setConfirming(false)
  }

  function cancelEdit() {
    setEditing(false)
  }

  async function handleSave() {
    const parsedAmount = parseMoneyValue(editAmount)
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('Informe um valor válido')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/transaction/${_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parsedAmount,
          description: editDescription,
          transactionDate: editDate || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erro ao salvar')
        return
      }
      toast.success('Transação atualizada')
      setEditing(false)
      onUpdate?.()
      onOpenChange(false)
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/transaction/${_id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erro ao excluir')
        return
      }
      toast.success('Transação excluída')
      onDelete?.(_id)
      onOpenChange(false)
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(false); setConfirming(false) } onOpenChange(v) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{typeLabel}</DialogTitle>
        </DialogHeader>

        {!editing ? (
          <div className="space-y-4">
            {/* Detalhes */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Valor</span>
                <span className="font-semibold">{formatBRL(amount)}</span>
              </div>
              {description && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Descrição</span>
                  <span className="text-right">{description}</span>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Data</span>
                <span>{displayDate}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Status</span>
                <span className="capitalize">{
                  status === 'approved' ? 'Aprovado' : status === 'pending' ? 'Pendente' : 'Rejeitado'
                }</span>
              </div>
              {createdBy === 'debtor' && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Criado por</span>
                  <span>Devedor</span>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={openEdit} disabled={loading}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button
                variant={confirming ? 'destructive' : 'outline'}
                className={confirming ? 'flex-1' : 'flex-1 text-destructive hover:text-destructive hover:border-destructive/50'}
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {confirming ? 'Confirmar exclusão' : 'Excluir'}
              </Button>
            </div>
            {confirming && (
              <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setConfirming(false)} disabled={loading}>
                Cancelar
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Valor</Label>
              <MoneyInput value={editAmount} onChange={setEditAmount} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label>Descrição <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Input
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                placeholder="Ex: PIX, dinheiro em mãos..."
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Data <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Input
                type="date"
                value={editDate}
                onChange={e => setEditDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                disabled={loading}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={cancelEdit} disabled={loading}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
