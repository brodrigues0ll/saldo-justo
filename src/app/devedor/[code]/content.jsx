'use client'
import { useEffect } from 'react'
import { useFetch } from '@/lib/useFetch'
import SummaryCard from '@/components/SummaryCard'
import TransactionItem from '@/components/TransactionItem'
import DebtorPaymentButton from '@/components/DebtorPaymentButton'
import { Separator } from '@/components/ui/separator'
import { formatBRL } from '@/lib/money'

export default function DebtorPageContent({ code }) {
  const { data, loading, refetch } = useFetch(`/api/debtor/by-code/${code}`)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__refetchDebtor = refetch
    }
  }, [refetch])

  useEffect(() => {
    refetch()
  }, [code])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-24 bg-muted/30 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return <div>Devedor não encontrado</div>

  const { totalDeposits, totalPaid, balance, transactions, canCreatePayment, displayMode, _id: debtorId, code: debtorCode } = data
  const pendingTransactions = transactions?.filter(t => t.status === 'pending') || []
  const approvedTransactions = transactions?.filter(t => t.status === 'approved') || []

  const isDebtMode = displayMode === 'debt'
  const labels = isDebtMode
    ? { credit: 'Dívida Total', paid: 'Já Pago', balance: 'Saldo Devedor' }
    : { credit: 'Depositado', paid: 'Pago', balance: 'Saldo' }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryCard label={labels.credit} value={totalDeposits} />
        <SummaryCard label={labels.paid} value={totalPaid} />
        <SummaryCard label={labels.balance} value={balance} highlight />
      </div>

      <div className="lg:grid lg:grid-cols-[300px_1fr] lg:gap-6 lg:items-start space-y-6 lg:space-y-0">
        <div className="space-y-4">
          {pendingTransactions.length > 0 && (
            <div className="glass rounded-2xl p-4 border border-amber-500/20 glow-warning">
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-2">
                Pagamentos aguardando aprovação
              </p>
              {pendingTransactions.map(t => (
                <div key={t._id} className="flex items-center justify-between gap-2 py-1">
                  <span className="text-sm text-foreground truncate">{t.description || '—'}</span>
                  <span className="text-sm font-medium text-foreground shrink-0">{formatBRL(t.amount)}</span>
                </div>
              ))}
              <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-2">
                Total pendente: {formatBRL(pendingTransactions.reduce((sum, t) => sum + t.amount, 0))}
              </p>
            </div>
          )}

          {canCreatePayment && (
            <DebtorPaymentButton debtorCode={debtorCode} debtorId={debtorId} />
          )}
        </div>

        <div>
          <Separator className="lg:hidden" />
          <h3 className="font-semibold mb-3 text-foreground mt-6 lg:mt-0">Histórico</h3>
          {approvedTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma transação registrada ainda.
            </p>
          ) : (
            <div>
              {approvedTransactions.map(t => (
                <TransactionItem key={t._id} transaction={t} displayMode={displayMode} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
