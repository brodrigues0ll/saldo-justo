import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { connectDB } from '@/lib/db'
import Debtor from '@/models/Debtor'
import Transaction from '@/models/Transaction'
import SummaryCard from '@/components/SummaryCard'
import TransactionItem from '@/components/TransactionItem'
import DebtorPaymentButton from '@/components/DebtorPaymentButton'
import DebtorLogoutButton from '@/components/DebtorLogoutButton'
import InstallPWAButton from '@/components/InstallPWAButton'
import EnableNotificationsButton from '@/components/EnableNotificationsButton'
import ThemeToggle from '@/components/ThemeToggle'
import { Separator } from '@/components/ui/separator'
import { formatBRL } from '@/lib/money'

export const dynamic = 'force-dynamic'

function computeTotals(transactions) {
  let totalDeposits = 0
  let totalPaid = 0
  let pendingCount = 0
  let pendingAmount = 0

  for (const t of transactions) {
    if (t.status === 'approved') {
      if (t.type === 'deposit') totalDeposits += t.amount
      else if (t.type === 'payment') totalPaid += t.amount
    } else if (t.status === 'pending') {
      pendingCount++
      pendingAmount += t.amount
    }
  }

  return { totalDeposits, totalPaid, pendingCount, pendingAmount, balance: totalDeposits - totalPaid }
}

async function getDebtor(code) {
  await connectDB()
  const debtor = await Debtor.findOne({ code: code.toUpperCase() }).lean()
  if (!debtor) return null
  return {
    _id: debtor._id.toString(),
    name: debtor.name,
    code: debtor.code,
    canCreatePayment: debtor.canCreatePayment,
    displayMode: debtor.displayMode || 'deposit',
    rawId: debtor._id,
  }
}

async function getTransactionData(debtorRawId) {
  await connectDB()
  const raw = await Transaction.find({ debtorId: debtorRawId })
    .sort({ createdAt: -1 })
    .lean()

  const transactions = raw.map(t => ({
    _id: t._id.toString(),
    debtorId: t.debtorId.toString(),
    type: t.type,
    amount: t.amount,
    description: t.description,
    status: t.status,
    createdBy: t.createdBy,
    createdAt: t.createdAt,
    approvedAt: t.approvedAt ?? null,
    rejectionReason: t.rejectionReason ?? null,
  }))

  return { transactions, totals: computeTotals(transactions) }
}

// Componente assíncrono de servidor para a seção financeira
async function DebtorFinancials({ debtor }) {
  const { transactions, totals } = await getTransactionData(debtor.rawId)

  const isDebtMode = debtor.displayMode === 'debt'
  const labels = isDebtMode
    ? { credit: 'Dívida Total', paid: 'Já Pago', balance: 'Saldo Devedor' }
    : { credit: 'Depositado', paid: 'Pago', balance: 'Saldo' }

  const pendingTransactions = transactions.filter(t => t.status === 'pending')
  const approvedTransactions = transactions.filter(t => t.status !== 'pending')

  return (
    <>
      {/* Resumo financeiro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryCard label={labels.credit} value={totals.totalDeposits} />
        <SummaryCard label={labels.paid} value={totals.totalPaid} />
        <SummaryCard label={labels.balance} value={totals.balance} highlight />
      </div>

      {/* Layout duas colunas no desktop */}
      <div className="lg:grid lg:grid-cols-[300px_1fr] lg:gap-6 lg:items-start space-y-6 lg:space-y-0">
        {/* Coluna esquerda: pendentes + botão de pagamento */}
        <div className="space-y-4">
          {pendingTransactions.length > 0 && (
            <div className="glass rounded-2xl p-4 border border-amber-500/20 glow-warning">
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-2">
                Pagamentos aguardando aprovação
              </p>
              {pendingTransactions.map(t => (
                <div
                  key={t._id}
                  className="flex items-center justify-between gap-2 py-1"
                >
                  <span className="text-sm text-foreground truncate">
                    {t.description || '—'}
                  </span>
                  <span className="text-sm font-medium text-foreground shrink-0">
                    {formatBRL(t.amount)}
                  </span>
                </div>
              ))}
              <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-2">
                Total pendente: {formatBRL(totals.pendingAmount)}
              </p>
            </div>
          )}

          {debtor.canCreatePayment && (
            <DebtorPaymentButton
              debtorCode={debtor.code}
              debtorId={debtor._id}
            />
          )}
        </div>

        {/* Coluna direita: histórico */}
        <div>
          <Separator className="lg:hidden" />
          <h3 className="font-semibold mb-3 text-foreground mt-6 lg:mt-0">
            Histórico
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
                  displayMode={debtor.displayMode}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function FinancialsSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="glass rounded-2xl p-5 space-y-2">
            <div className="h-3 w-16 bg-muted/40 rounded animate-pulse" />
            <div className="h-6 w-24 bg-muted/50 rounded animate-pulse" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="h-4 w-32 bg-muted/40 rounded animate-pulse" />
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-border/50">
            <div className="w-9 h-9 rounded-full bg-muted/40 animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-28 bg-muted/50 rounded animate-pulse" />
              <div className="h-3 w-20 bg-muted/30 rounded animate-pulse" />
            </div>
            <div className="h-4 w-16 bg-muted/40 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </>
  )
}

export default async function DebtorPage({ params }) {
  const { code } = await params
  const debtor = await getDebtor(code)

  if (!debtor) notFound()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold gradient-text truncate">{debtor.name}</h1>
            <p className="text-xs text-muted-foreground font-mono">{debtor.code}</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <EnableNotificationsButton role="debtor" debtorCode={debtor.code} />
            <InstallPWAButton />
            <ThemeToggle />
            <DebtorLogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <Suspense fallback={<FinancialsSkeleton />}>
          <DebtorFinancials debtor={debtor} />
        </Suspense>
      </main>
    </div>
  )
}
