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
import ClientOnly from '@/components/ClientOnly'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

async function getDebtorData(id) {
  await connectDB()

  if (!mongoose.Types.ObjectId.isValid(id)) return null

  const debtor = await Debtor.findById(id).lean()
  if (!debtor) return null

  const transactions = await Transaction.find({ debtorId: id })
    .sort({ createdAt: -1 })
    .lean()

  const aggregation = await Transaction.aggregate([
    { $match: { debtorId: new mongoose.Types.ObjectId(id) } },
    {
      $group: {
        _id: null,
        totalDeposits: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$type', 'deposit'] }, { $eq: ['$status', 'approved'] }] },
              '$amount', 0,
            ],
          },
        },
        totalPaid: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$type', 'payment'] }, { $eq: ['$status', 'approved'] }] },
              '$amount', 0,
            ],
          },
        },
        pendingCount: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
        },
        pendingAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] },
        },
      },
    },
  ])

  const totals = aggregation[0] || { totalDeposits: 0, totalPaid: 0, pendingCount: 0, pendingAmount: 0 }

  return {
    debtor: {
      ...debtor,
      _id: debtor._id.toString(),
      createdBy: debtor.createdBy.toString(),
      displayMode: debtor.displayMode || 'deposit',
    },
    transactions: transactions.map(t => ({
      ...t,
      _id: t._id.toString(),
      debtorId: t.debtorId.toString(),
    })),
    totals: {
      ...totals,
      balance: totals.totalDeposits - totals.totalPaid,
    },
  }
}

export default async function DebtorDetailPage({ params }) {
  await requireAdmin()
  const { id } = await params
  const data = await getDebtorData(id)

  if (!data) notFound()

  const { debtor, transactions, totals } = data
  const pendingTransactions = transactions.filter(t => t.status === 'pending')
  const historyTransactions = transactions.filter(t => t.status !== 'pending')

  const isDebtMode = debtor.displayMode === 'debt'
  const labels = isDebtMode
    ? { credit: 'Dívida Total', paid: 'Já Pago', balance: 'Saldo Devedor' }
    : { credit: 'Depositado', paid: 'Pago', balance: 'Saldo' }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="rounded-full hover:bg-primary/10 hover:text-primary">
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
        {/* Resumo financeiro */}
        <div className="flex gap-3">
          <SummaryCard label={labels.credit} value={totals.totalDeposits} />
          <SummaryCard label={labels.paid} value={totals.totalPaid} />
          <SummaryCard label={labels.balance} value={totals.balance} highlight />
        </div>

        {/* Layout de duas colunas no desktop */}
        <div className="lg:grid lg:grid-cols-[340px_1fr] lg:gap-6 lg:items-start space-y-6 lg:space-y-0">
          {/* Coluna esquerda: ações e configurações */}
          <div className="space-y-6">
            <ClientOnly>
              <DebtorAdminActions
                debtorId={debtor._id}
                displayMode={debtor.displayMode}
                canCreatePayment={debtor.canCreatePayment}
                pendingTransactions={pendingTransactions}
              />
            </ClientOnly>
          </div>

          {/* Coluna direita: histórico */}
          <div>
            <Separator className="lg:hidden" />
            <h3 className="font-semibold mb-3 text-foreground mt-6 lg:mt-0">Histórico de transações</h3>
            {historyTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma transação registrada ainda.
              </p>
            ) : (
              <div>
                {historyTransactions.map(t => (
                  <TransactionItem key={t._id} transaction={t} displayMode={debtor.displayMode} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
