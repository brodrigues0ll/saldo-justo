'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocalFirst } from '@/lib/useLocalFirst'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

export default function DebtorSettingsView({ debtorId }) {
  const router = useRouter()
  const { data, sync } = useLocalFirst(`/api/debtor/${debtorId}`, `debtor:${debtorId}`, debtorId)

  const [name, setName] = useState('')
  const [nameLoading, setNameLoading] = useState(false)
  const [nameReady, setNameReady] = useState(false)

  const [modeLoading, setModeLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)

  const [confirming, setConfirming] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  if (!data) return (
    <div className="space-y-6">
      <div className="h-6 w-48 bg-muted/30 rounded animate-pulse" />
      <div className="h-32 bg-muted/20 rounded-2xl animate-pulse" />
      <div className="h-32 bg-muted/20 rounded-2xl animate-pulse" />
    </div>
  )

  if (!nameReady) {
    setName(data.name)
    setNameReady(true)
  }

  async function handleSaveName() {
    if (!name.trim()) { toast.error('Nome não pode ser vazio'); return }
    setNameLoading(true)
    try {
      const res = await fetch(`/api/debtor/${debtorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const body = await res.json()
      if (!res.ok) { toast.error(body.error || 'Erro ao salvar'); return }
      toast.success('Nome atualizado')
      sync()
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setNameLoading(false)
    }
  }

  async function handleToggleMode() {
    const next = data.displayMode === 'debt' ? 'deposit' : 'debt'
    setModeLoading(true)
    try {
      const res = await fetch(`/api/debtor/${debtorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayMode: next }),
      })
      const body = await res.json()
      if (!res.ok) { toast.error(body.error || 'Erro ao salvar'); return }
      toast.success('Modo atualizado')
      sync()
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setModeLoading(false)
    }
  }

  async function handleTogglePayment() {
    const next = !data.canCreatePayment
    setPaymentLoading(true)
    try {
      const res = await fetch(`/api/debtor/${debtorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canCreatePayment: next }),
      })
      const body = await res.json()
      if (!res.ok) { toast.error(body.error || 'Erro ao salvar'); return }
      toast.success('Permissão atualizada')
      sync()
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setPaymentLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirming) { setConfirming(true); return }
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/debtor/${debtorId}`, { method: 'DELETE' })
      const body = await res.json()
      if (!res.ok) { toast.error(body.error || 'Erro ao excluir'); return }
      toast.success('Devedor excluído')
      router.push('/dashboard')
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setDeleteLoading(false)
      setConfirming(false)
    }
  }

  const isDebtMode = data.displayMode === 'debt'

  return (
    <div className="space-y-6">
      {/* Nome */}
      <div className="glass rounded-2xl p-4 space-y-4">
        <h2 className="font-semibold text-sm text-foreground">Informações</h2>
        <div className="space-y-2">
          <Label>Nome</Label>
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={nameLoading}
              placeholder="Nome do devedor"
              className="flex-1"
            />
            <Button onClick={handleSaveName} disabled={nameLoading || name.trim() === data.name}>
              {nameLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-muted-foreground">Código</Label>
          <p className="text-sm font-mono text-foreground">{data.code}</p>
        </div>
      </div>

      <Separator />

      {/* Modo de exibição */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold text-sm text-foreground">Modo de exibição</h2>
        <p className="text-xs text-muted-foreground">
          {isDebtMode
            ? 'Modo Dívida: transações de entrada são exibidas como "dívida".'
            : 'Modo Depósito: transações de entrada são exibidas como "depósito".'}
        </p>
        <Button
          variant="outline"
          onClick={handleToggleMode}
          disabled={modeLoading}
          className="w-full"
        >
          {modeLoading ? 'Alterando...' : isDebtMode ? 'Mudar para Modo Depósito' : 'Mudar para Modo Dívida'}
        </Button>
      </div>

      {/* Permissão de pagamento */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold text-sm text-foreground">Registrar pagamentos</h2>
        <p className="text-xs text-muted-foreground">
          {data.canCreatePayment
            ? 'O devedor pode registrar pagamentos para aprovação.'
            : 'O devedor não pode registrar pagamentos.'}
        </p>
        <Button
          variant="outline"
          onClick={handleTogglePayment}
          disabled={paymentLoading}
          className="w-full"
        >
          {paymentLoading
            ? 'Alterando...'
            : data.canCreatePayment ? 'Desativar para o devedor' : 'Ativar para o devedor'}
        </Button>
      </div>

      <Separator />

      {/* Excluir devedor */}
      <div className="glass rounded-2xl p-4 space-y-3 border border-destructive/20">
        <h2 className="font-semibold text-sm text-destructive">Zona de perigo</h2>
        <p className="text-xs text-muted-foreground">
          Excluir o devedor remove todas as transações associadas. Esta ação não pode ser desfeita.
        </p>
        <Button
          variant={confirming ? 'destructive' : 'outline'}
          className={confirming ? 'w-full' : 'w-full text-destructive hover:text-destructive hover:border-destructive/50'}
          onClick={handleDelete}
          disabled={deleteLoading}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {confirming ? 'Confirmar exclusão' : 'Excluir devedor'}
        </Button>
        {confirming && (
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => setConfirming(false)}
            disabled={deleteLoading}
          >
            Cancelar
          </Button>
        )}
      </div>
    </div>
  )
}
