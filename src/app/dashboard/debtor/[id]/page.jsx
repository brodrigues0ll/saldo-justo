import { Suspense } from 'react'
import { requireAdmin } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Debtor from '@/models/Debtor'
import Transaction from '@/models/Transaction'
import { notFound } from 'next/navigation'
import mongoose from 'mongoose'
import SummaryCard from '@/components/SummaryCard'
import TransactionItem from '@/components/TransactionItem'
import DebtorAdminActions from '@/components/DebtorAdminActions'
import ThemeToggle from '@/components/ThemeToggle'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

async function getDebtor(id) {
  await connectDB()
  if (!mongoose.Types.ObjectId.isValid(id)) return null
  const debtor = await Debtor.findById(id).lean()
  if (!debtor) return null
  return {
    ...debtor,
    _id: debtor._id.toString(),
    createdBy: debtor.createdBy.toString(),
    displayMode: debtor.displayMode || 'deposit',
  }
}

async function getTransactionData(id) {
  await connectDB()
  const raw = await Transaction.find({ debtorId: id })
    .sort({ createdAt: -1 })
    .lean()

  const transactions = raw.map(t => ({
    ...t,
    _id: t._id.toString(),
    debtorId: t.debtorId.toString(),
  }))

  return { transactions, totals: computeTotals(transactions) }
}

// Componente assíncrono de servidor — renderiza via streaming
async function DebtorFinancials({ debtorId, displayMode, canCreatePayment }) {
  const { transactions, totals } = await getTransactionData(debtorId)

  const isDebtMode = displayMode === 'debt'
  const labels = isDebtMode
    ? { credit: 'Dívida Total', paid: 'Já Pago', balance: 'Saldo Devedor' }
    : { credit: 'Depositado', paid: 'Pago', balance: 'Saldo' }

  const pendingTransactions = transactions.filter(t => t.status === 'pending')
  const historyTransactions = transactions.filter(t => t.status !== 'pending')

  return (
    <>
      {/* Resumo financeiro */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SummaryCard label={labels.credit} value={totals.totalDeposits} />
        <SummaryCard label={labels.paid} value={totals.totalPaid} />
        <SummaryCard label={labels.balance} value={totals.balance} highlight />
      </div>

      {/* Layout de duas colunas no desktop */}
      <div className="lg:grid lg:grid-cols-[340px_1fr] lg:gap-6 lg:items-start space-y-6 lg:space-y-0">
        {/* Coluna esquerda: ações e configurações */}
        <div className="space-y-6">
          <DebtorAdminActions
            debtorId={debtorId}
            displayMode={displayMode}
            canCreatePayment={canCreatePayment}
            pendingTransactions={pendingTransactions}
          />
        </div>

        {/* Coluna direita: histórico */}
        <div>
          <Separator className="lg:hidden" />
          <h3 className="font-semibold mb-3 text-foreground mt-6 lg:mt-0">
            Histórico de transações
          </h3>
          {historyTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma transação registrada ainda.
            </p>
          ) : (
            <div>
              {historyTransactions.map(t => (
                <TransactionItem
                  key={t._id}
                  transaction={t}
                  displayMode={displayMode}
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

function FinancialsSkeleton() {
  return (
    <>
      {/* Summary cards skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex-1 glass rounded-2xl p-5 space-y-2">
            <div className="h-3 w-16 bg-muted/40 rounded animate-pulse" />
            <div className="h-6 w-24 bg-muted/50 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="lg:grid lg:grid-cols-[340px_1fr] lg:gap-6 space-y-6 lg:space-y-0">
        <div className="space-y-3">
          <div className="h-10 w-full bg-muted/30 rounded animate-pulse" />
          <div className="h-10 w-full bg-muted/30 rounded animate-pulse" />
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
      </div>
    </>
  )
}

export default async function DebtorDetailPage({ params }) {
  const { id } = await params

  // requireAdmin (JWT, rápido) e getDebtor (1 doc) rodam em paralelo
  const [, debtor] = await Promise.all([requireAdmin(), getDebtor(id)])

  if (!debtor) notFound()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full hover:bg-primary/10 hover:text-primary"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold gradient-text truncate">{debtor.name}</h1>
            <p className="text-xs text-muted-foreground font-mono">{debtor.code}</p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <Suspense fallback={<FinancialsSkeleton />}>
          <DebtorFinancials
            debtorId={id}
            displayMode={debtor.displayMode}
            canCreatePayment={debtor.canCreatePayment}
          />
        </Suspense>
      </main>
    </div>
  )
}
