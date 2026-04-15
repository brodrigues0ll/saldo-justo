'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Plus } from 'lucide-react'
import AddTransactionModal from '@/components/AddTransactionModal'
import ApproveRejectButtons from '@/components/ApproveRejectButtons'
import CanCreatePaymentToggle from '@/components/CanCreatePaymentToggle'
import DisplayModeToggle from '@/components/DisplayModeToggle'
import { formatBRL } from '@/lib/money'

/**
 * Agrupa toda a interatividade da página de detalhe do devedor (admin).
 * Importar com dynamic({ ssr: false }) para evitar mismatch de IDs Radix UI.
 */
export default function DebtorAdminActions({
  debtorId,
  displayMode,
  canCreatePayment,
  pendingTransactions,
}) {
  const isDebtMode = displayMode === 'debt'

  return (
    <>
      {/* Pendentes para aprovação */}
      {pendingTransactions.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-3">
            Aguardando aprovação ({pendingTransactions.length})
          </h3>
          <div className="space-y-3">
            {pendingTransactions.map(t => (
              <div key={t._id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t.description || '—'}</p>
                  <p className="text-xs text-neutral-500">
                    {formatBRL(t.amount)} · {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <ApproveRejectButtons transactionId={t._id} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex gap-2">
        <AddTransactionModal debtorId={debtorId} type="deposit" displayMode={displayMode}>
          <Button variant="outline" className="flex-1">
            <Plus className="w-4 h-4 mr-1" />
            {isDebtMode ? 'Nova Dívida' : 'Depósito'}
          </Button>
        </AddTransactionModal>
        <AddTransactionModal debtorId={debtorId} type="payment" displayMode={displayMode}>
          <Button variant="outline" className="flex-1">
            <Plus className="w-4 h-4 mr-1" />
            Pagamento
          </Button>
        </AddTransactionModal>
      </div>

      <Separator />

      {/* Configurações */}
      <div className="space-y-4">
        <DisplayModeToggle debtorId={debtorId} initialMode={displayMode} />
        <Separator />
        <CanCreatePaymentToggle debtorId={debtorId} initialValue={canCreatePayment} />
      </div>
    </>
  )
}
