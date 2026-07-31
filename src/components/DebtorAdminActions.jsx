'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, RotateCcw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import AddTransactionModal from '@/components/AddTransactionModal'
import ApproveRejectButtons from '@/components/ApproveRejectButtons'
import { formatBRL } from '@/lib/money'

export default function DebtorAdminActions({
  debtorId,
  displayMode,
  pendingTransactions,
  onSuccess,
}) {
  const isDebtMode = displayMode === 'debt'
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleReset() {
    setLoading(true)
    try {
      const res = await fetch(`/api/debtor/${debtorId}/reset`, { method: 'POST' })
      if (res.ok) {
        setConfirmOpen(false)
        onSuccess?.()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Pendentes para aprovação */}
      {pendingTransactions.length > 0 && (
        <div className="glass rounded-2xl p-4 border border-amber-500/20">
          <h3 className="font-semibold text-amber-600 dark:text-amber-400 mb-3">
            Aguardando aprovação ({pendingTransactions.length})
          </h3>
          <div className="space-y-3">
            {pendingTransactions.map(t => (
              <div key={t._id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{t.description || '—'}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBRL(t.amount)} · {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="shrink-0">
                  <ApproveRejectButtons transactionId={t._id} onSuccess={onSuccess} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex gap-2">
        <AddTransactionModal debtorId={debtorId} type="deposit" displayMode={displayMode} onSuccess={onSuccess}>
          <Button variant="outline" className="flex-1 min-w-0">
            <Plus className="w-4 h-4 mr-1 shrink-0" />
            <span className="truncate">{isDebtMode ? 'Nova Dívida' : 'Depósito'}</span>
          </Button>
        </AddTransactionModal>
        <AddTransactionModal debtorId={debtorId} type="payment" displayMode={displayMode} onSuccess={onSuccess}>
          <Button variant="outline" className="flex-1 min-w-0">
            <Plus className="w-4 h-4 mr-1 shrink-0" />
            <span className="truncate">Pagamento</span>
          </Button>
        </AddTransactionModal>
      </div>

      {/* Botão zerar dívida */}
      <Button
        variant="outline"
        className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setConfirmOpen(true)}
      >
        <RotateCcw className="w-4 h-4 mr-2 shrink-0" />
        Zerar Dívida
      </Button>

      {/* Diálogo de confirmação */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zerar dívida?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Isso vai apagar todas as transações e zerar a dívida total, já pago e saldo devedor. Essa ação não pode ser desfeita.
          </p>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" disabled={loading}>Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleReset} disabled={loading}>
              {loading ? 'Zerando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
