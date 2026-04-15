'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import MoneyInput, { parseMoneyValue } from '@/components/MoneyInput'

export default function DebtorPaymentButton({ debtorCode, debtorId }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

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
          type: 'payment',
          amount: parsedAmount,
          description,
          debtorCode, // autorização do devedor
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erro ao registrar pagamento')
        return
      }
      toast.success('Pagamento registrado! Aguardando aprovação do admin.')
      setOpen(false)
      setAmount('')
      setDescription('')
      router.refresh()
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Registrar Pagamento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-neutral-500">
          O pagamento ficará pendente até ser aprovado pelo administrador.
        </p>
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
            <Label>Descrição</Label>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: PIX enviado"
              required
              disabled={loading}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar para aprovação'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
