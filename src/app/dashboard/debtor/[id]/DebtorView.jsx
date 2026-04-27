'use client'
import SummaryCard from '@/components/SummaryCard'
import TransactionItem from '@/components/TransactionItem'
import DebtorAdminActions from '@/components/DebtorAdminActions'
import { Separator } from '@/components/ui/separator'
import { useLocalFirst } from '@/lib/useLocalFirst'

export default function DebtorView({ debtorId }) {
  const { data, sync } = useLocalFirst(
    `/api/debtor/${debtorId}`,
    `debtor:${debtorId}`,
    debtorId
  )

  if (!data) return (
    <div className="space-y-6">
      <div className="h-6 w-48 bg-muted/30 rounded animate-pulse" />
      <div className="flex flex-col sm:flex-row gap-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex-1 h-24 bg-muted/30 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="h-48 bg-muted/20 rounded-2xl animate-pulse" />
    </div>
  )

  const { totalDeposits, totalPaid, balance, transactions = [], displayMode, canCreatePayment } = data
  const isDebtMode = displayMode === 'debt'
  const labels = isDebtMode
    ? { credit: 'Dívida Total', paid: 'Já Pago', balance: 'Saldo Devedor' }
    : { credit: 'Depositado', paid: 'Pago', balance: 'Saldo' }

  const pendingTransactions = transactions.filter(t => t.status === 'pending')
  const approvedTransactions = transactions
    .filter(t => t.status === 'approved')
    .sort((a, b) => new Date(b.transactionDate || b.createdAt) - new Date(a.transactionDate || a.createdAt))

  return (
    <>
      <div>
        <h1 className="text-lg font-bold gradient-text truncate">{data.name}</h1>
        <p className="text-xs text-muted-foreground font-mono">{data.code}</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SummaryCard label={labels.credit} value={totalDeposits} />
        <SummaryCard label={labels.paid} value={totalPaid} />
        <SummaryCard label={labels.balance} value={balance} highlight />
      </div>

      <div className="lg:grid lg:grid-cols-[340px_1fr] lg:gap-6 lg:items-start space-y-6 lg:space-y-0">
        <div className="space-y-6">
          <DebtorAdminActions
            debtorId={debtorId}
            displayMode={displayMode}
            canCreatePayment={canCreatePayment}
            pendingTransactions={pendingTransactions}
            onSuccess={sync}
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
                  displayMode={displayMode}
                  showDeleteButton
                  onDelete={sync}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
