'use client'
import { useState } from 'react'
import SummaryCard from '@/components/SummaryCard'
import TransactionItem from '@/components/TransactionItem'
import DebtorAdminActions from '@/components/DebtorAdminActions'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLocalFirst } from '@/lib/useLocalFirst'

function getMonthKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}`
}

function getTxMonth(t) {
  if (t.transactionDate) {
    const [y, m] = t.transactionDate.split('T')[0].split('-').map(Number)
    return `${y}-${m - 1}`
  }
  const d = new Date(t.createdAt)
  return `${d.getFullYear()}-${d.getMonth()}`
}

function formatMonthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export default function DebtorView({ debtorId }) {
  const { data, sync } = useLocalFirst(
    `/api/debtor/${debtorId}`,
    `debtor:${debtorId}`,
    debtorId
  )

  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth()

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

  const { totalDeposits, totalPaid, balance, transactions = [], displayMode } = data
  const isDebtMode = displayMode === 'debt'
  const labels = isDebtMode
    ? { credit: 'Dívida Total', paid: 'Já Pago', balance: 'Saldo Devedor' }
    : { credit: 'Depositado', paid: 'Pago', balance: 'Saldo' }

  const pendingTransactions = transactions.filter(t => t.status === 'pending')
  const currentKey = `${viewYear}-${viewMonth}`
  const approvedTransactions = transactions
    .filter(t => t.status === 'approved' && getTxMonth(t) === currentKey)
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
            pendingTransactions={pendingTransactions}
            onSuccess={sync}
          />
        </div>

        <div>
          <Separator className="lg:hidden" />

          <div className="flex items-center justify-between mt-6 lg:mt-0 mb-3">
            <h3 className="font-semibold text-foreground">Histórico de transações</h3>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="rounded-full w-7 h-7 p-0" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs font-medium text-muted-foreground w-28 text-center capitalize">
                {formatMonthLabel(viewYear, viewMonth)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full w-7 h-7 p-0"
                onClick={nextMonth}
                disabled={isCurrentMonth}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {approvedTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma transação neste mês.
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
                  onUpdate={sync}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
