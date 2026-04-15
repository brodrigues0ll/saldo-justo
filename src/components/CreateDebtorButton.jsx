'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

export default function CreateDebtorButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [canCreatePayment, setCanCreatePayment] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/debtor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, canCreatePayment }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erro ao criar devedor')
        return
      }
      toast.success(`Devedor criado! Código: ${data.code}`)
      setOpen(false)
      setName('')
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
        <Button size="icon" className="rounded-full w-9 h-9 sm:w-auto sm:h-auto sm:rounded-md sm:px-3 sm:py-1.5 sm:text-sm" title="Novo Devedor">
          <Plus className="w-4 h-4 sm:mr-1" />
          <span className="hidden sm:inline">Novo Devedor</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Devedor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: João (meu pai)"
              required
              disabled={loading}
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="canCreate"
              checked={canCreatePayment}
              onChange={e => setCanCreatePayment(e.target.checked)}
              className="w-4 h-4"
              disabled={loading}
            />
            <Label htmlFor="canCreate" className="cursor-pointer">
              Permitir que o devedor registre pagamentos
            </Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
