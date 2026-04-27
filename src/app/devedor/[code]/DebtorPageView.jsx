'use client'
import { useState } from 'react'
import SummaryCard from '@/components/SummaryCard'
import TransactionItem from '@/components/TransactionItem'
import DebtorPaymentButton from '@/components/DebtorPaymentButton'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatBRL } from '@/lib/money'
import { useLocalFirst } from '@/lib/useLocalFirst'

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

export default function DebtorPageView({ debtorCode }) {
  const { data, sync } = useLocalFirst(
    `/api/debtor/by-code/${debtorCode}`,
    `debtor-code:${debtorCode}`
    // debtorId não é conhecido ainda — será resolvido após o primeiro fetch
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
      <div className="h-6 w-40 bg-muted/30 rounded animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-24 bg-muted/30 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="h-48 bg-muted/20 rounded-2xl animate-pulse" />
    </div>
  )

  const {
    _id, name, code, canCreatePayment, displayMode = 'deposit',
    totalDeposits, totalPaid, balance, transactions = [],
  } = data

  const isDebtMode = displayMode === 'debt'
  const labels = isDebtMode
    ? { credit: 'Dívida Total', paid: 'Já Pago', balance: 'Saldo Devedor' }
    : { credit: 'Depositado', paid: 'Pago', balance: 'Saldo' }

  const pendingTransactions = transactions.filter(t => t.status === 'pending')
  const currentKey = `${viewYear}-${viewMonth}`
  const approvedTransactions = transactions
    .filter(t => t.status === 'approved' && getTxMonth(t) === currentKey)
    .sort((a, b) => new Date(b.transactionDate || b.createdAt) - new Date(a.transactionDate || a.createdAt))
  const pendingAmount = pendingTransactions.reduce((s, t) => s + t.amount, 0)

  return (
    <>
      <div>
        <h1 className="text-lg font-bold gradient-text truncate">{name}</h1>
        <p className="text-xs text-muted-foreground font-mono">{code}</p>
      </div>

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
                Total pendente: {formatBRL(pendingAmount)}
              </p>
            </div>
          )}

          {canCreatePayment && (
            <DebtorPaymentButton debtorCode={code} debtorId={_id} onSuccess={sync} />
          )}
        </div>

        <div>
          <Separator className="lg:hidden" />

          <div className="flex items-center justify-between mt-6 lg:mt-0 mb-3">
            <h3 className="font-semibold text-foreground">Histórico</h3>
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
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
