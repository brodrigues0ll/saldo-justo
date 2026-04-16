'use client'
import { useEffect } from 'react'
import { useFetch } from '@/lib/useFetch'
import SummaryCard from '@/components/SummaryCard'
import TransactionItem from '@/components/TransactionItem'
import DebtorAdminActions from '@/components/DebtorAdminActions'
import { Separator } from '@/components/ui/separator'

export default function DebtorContent({ debtorId }) {
  const { data, loading, refetch } = useFetch(debtorId ? `/api/debtor/${debtorId}` : null)

  // Expor refetch globalmente para modals chamar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__refetchDebtor = refetch
    }
  }, [refetch])

  useEffect(() => {
    if (debtorId) {
      refetch()
    }
  }, [debtorId, refetch])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex-1 h-24 bg-muted/30 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return <div>Devedor não encontrado</div>

  const { totalDeposits, totalPaid, balance, transactions } = data
  const pendingTransactions = transactions?.filter(t => t.status === 'pending') || []
  const approvedTransactions = transactions?.filter(t => t.status === 'approved') || []

  const isDebtMode = data.displayMode === 'debt'
  const labels = isDebtMode
    ? { credit: 'Dívida Total', paid: 'Já Pago', balance: 'Saldo Devedor' }
    : { credit: 'Depositado', paid: 'Pago', balance: 'Saldo' }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SummaryCard label={labels.credit} value={totalDeposits} />
        <SummaryCard label={labels.paid} value={totalPaid} />
        <SummaryCard label={labels.balance} value={balance} highlight />
      </div>

      <div className="lg:grid lg:grid-cols-[340px_1fr] lg:gap-6 lg:items-start space-y-6 lg:space-y-0">
        <div className="space-y-6">
          <DebtorAdminActions
            debtorId={debtorId}
            displayMode={data.displayMode}
            canCreatePayment={data.canCreatePayment}
            pendingTransactions={pendingTransactions}
          />
        </div>

        <div>
          <Separator className="lg:hidden" />
          <h3 className="font-semibold mb-3 text-foreground mt-6 lg:mt-0">
            Histórico de transações
          </h3>
          {approvedTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma transação registrada ainda.
            </p>
          ) : (
            <div>
              {approvedTransactions.map(t => (
                <TransactionItem
                  key={t._id}
                  transaction={t}
                  displayMode={data.displayMode}
                  showDeleteButton
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
