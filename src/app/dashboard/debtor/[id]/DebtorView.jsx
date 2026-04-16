'use client'
import { useEffect, useState } from 'react'
import SummaryCard from '@/components/SummaryCard'
import TransactionItem from '@/components/TransactionItem'
import DebtorAdminActions from '@/components/DebtorAdminActions'
import { Separator } from '@/components/ui/separator'

export default function DebtorView({ debtorId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/debtor/${debtorId}`)
      const json = await res.json()
      setData(json)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [debtorId])

  function removeTransaction(transactionId) {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t._id.toString() !== transactionId),
    }))
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex-1 h-24 bg-muted/30 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="h-48 bg-muted/20 rounded-2xl animate-pulse" />
    </div>
  )

  if (!data) return null

  const { totalDeposits, totalPaid, balance, transactions = [], displayMode, canCreatePayment } = data
  const isDebtMode = displayMode === 'debt'
  const labels = isDebtMode
    ? { credit: 'Dívida Total', paid: 'Já Pago', balance: 'Saldo Devedor' }
    : { credit: 'Depositado', paid: 'Pago', balance: 'Saldo' }

  const pendingTransactions = transactions.filter(t => t.status === 'pending')
  const approvedTransactions = transactions.filter(t => t.status === 'approved')

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
            onSuccess={load}
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
                  onDelete={removeTransaction}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
