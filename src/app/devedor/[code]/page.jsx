import { notFound } from 'next/navigation'
import mongoose from 'mongoose'
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
import ClientOnly from '@/components/ClientOnly'
import { Separator } from '@/components/ui/separator'
import { formatBRL } from '@/lib/money'

export const dynamic = 'force-dynamic'

async function getDebtorByCode(code) {
  await connectDB()

  const debtor = await Debtor.findOne({ code: code.toUpperCase() }).lean()
  if (!debtor) return null

  const transactions = await Transaction.find({ debtorId: debtor._id })
    .sort({ createdAt: -1 })
    .lean()

  const aggregation = await Transaction.aggregate([
    { $match: { debtorId: new mongoose.Types.ObjectId(debtor._id) } },
    {
      $group: {
        _id: null,
        totalDeposits: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$type', 'deposit'] }, { $eq: ['$status', 'approved'] }] },
              '$amount',
              0,
            ],
          },
        },
        totalPaid: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$type', 'payment'] }, { $eq: ['$status', 'approved'] }] },
              '$amount',
              0,
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

  const agg = aggregation[0] || {
    totalDeposits: 0,
    totalPaid: 0,
    pendingCount: 0,
    pendingAmount: 0,
  }

  return {
    debtor: {
      _id: debtor._id.toString(),
      name: debtor.name,
      code: debtor.code,
      canCreatePayment: debtor.canCreatePayment,
      displayMode: debtor.displayMode || 'deposit',
      // createdBy omitido intencionalmente — nunca expor ao devedor
    },
    totals: {
      totalDeposits: agg.totalDeposits,
      totalPaid: agg.totalPaid,
      pendingCount: agg.pendingCount,
      pendingAmount: agg.pendingAmount,
      balance: agg.totalDeposits - agg.totalPaid,
    },
    transactions: transactions.map(t => ({
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
    })),
  }
}

export default async function DebtorPage({ params }) {
  const { code } = await params
  const data = await getDebtorByCode(code)

  if (!data) notFound()

  const { debtor, totals, transactions } = data
  const pendingTransactions = transactions.filter(t => t.status === 'pending')
  const approvedTransactions = transactions.filter(t => t.status !== 'pending')

  const isDebtMode = debtor.displayMode === 'debt'
  const labels = isDebtMode
    ? { credit: 'Dívida Total', paid: 'Já Pago', balance: 'Saldo Devedor' }
    : { credit: 'Depositado', paid: 'Pago', balance: 'Saldo' }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold gradient-text">{debtor.name}</h1>
            <p className="text-xs text-muted-foreground font-mono">{debtor.code}</p>
          </div>
          <div className="flex items-center gap-2">
            <ClientOnly>
              <EnableNotificationsButton role="debtor" debtorCode={debtor.code} />
            </ClientOnly>
            <ClientOnly>
              <InstallPWAButton />
            </ClientOnly>
            <ThemeToggle />
            <DebtorLogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Resumo financeiro */}
        <div className="flex gap-3">
          <SummaryCard label={labels.credit} value={totals.totalDeposits} />
          <SummaryCard label={labels.paid} value={totals.totalPaid} />
          <SummaryCard label={labels.balance} value={totals.balance} highlight />
        </div>

        {/* Pendentes (pagamentos aguardando aprovação) */}
        {pendingTransactions.length > 0 && (
          <div className="glass rounded-2xl p-4 border-amber-500/20 glow-warning">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-2">
              Pagamentos aguardando aprovação
            </p>
            {pendingTransactions.map(t => (
              <div key={t._id} className="flex items-center justify-between py-1">
                <span className="text-sm text-foreground">{t.description || '—'}</span>
                <span className="text-sm font-medium text-foreground">{formatBRL(t.amount)}</span>
              </div>
            ))}
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-2">
              Total pendente: {formatBRL(totals.pendingAmount)}
            </p>
          </div>
        )}

        {/* Botão de registrar pagamento (condicional) */}
        {debtor.canCreatePayment && (
          <ClientOnly>
            <DebtorPaymentButton debtorCode={debtor.code} debtorId={debtor._id} />
          </ClientOnly>
        )}

        <Separator />

        {/* Histórico */}
        <div>
          <h3 className="font-semibold mb-3 text-foreground">Histórico</h3>
          {approvedTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma transação registrada ainda.
            </p>
          ) : (
            <div>
              {approvedTransactions.map(t => (
                <TransactionItem key={t._id} transaction={t} displayMode={debtor.displayMode} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
