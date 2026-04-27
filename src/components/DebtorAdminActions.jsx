'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
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
    </>
  )
}
