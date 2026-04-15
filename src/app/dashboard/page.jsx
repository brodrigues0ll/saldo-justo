import { requireAdmin } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Image from 'next/image'
import Debtor from '@/models/Debtor'
import Transaction from '@/models/Transaction'
import DebtorCard from '@/components/DebtorCard'
import CreateDebtorButton from '@/components/CreateDebtorButton'
import LogoutButton from '@/components/LogoutButton'
import EnableNotificationsButton from '@/components/EnableNotificationsButton'
import ThemeToggle from '@/components/ThemeToggle'
import mongoose from 'mongoose'

async function getDebtors(adminId) {
  await connectDB()

  const debtors = await Debtor.find({ createdBy: new mongoose.Types.ObjectId(adminId) }).lean()
  const debtorIds = debtors.map(d => d._id)

  const aggregation = await Transaction.aggregate([
    { $match: { debtorId: { $in: debtorIds } } },
    {
      $group: {
        _id: '$debtorId',
        totalDeposits: {
          $sum: { $cond: [{ $and: [{ $eq: ['$type', 'deposit'] }, { $eq: ['$status', 'approved'] }] }, '$amount', 0] },
        },
        totalPaid: {
          $sum: { $cond: [{ $and: [{ $eq: ['$type', 'payment'] }, { $eq: ['$status', 'approved'] }] }, '$amount', 0] },
        },
        pendingCount: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
        },
      },
    },
  ])

  const totalsMap = {}
  for (const t of aggregation) totalsMap[t._id.toString()] = t

  return debtors.map(d => {
    const t = totalsMap[d._id.toString()] || { totalDeposits: 0, totalPaid: 0, pendingCount: 0 }
    return {
      _id: d._id.toString(),
      name: d.name,
      code: d.code,
      displayMode: d.displayMode || 'deposit',
      totalDeposits: t.totalDeposits,
      totalPaid: t.totalPaid,
      pendingCount: t.pendingCount,
      balance: t.totalDeposits - t.totalPaid,
    }
  })
}

export default async function DashboardPage() {
  const session = await requireAdmin()
  const debtors = await getDebtors(session.sub)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Image src="/icon-logo.png" alt="Saldo Justo" width={32} height={32} className="shrink-0" />
            <p className="text-xs text-muted-foreground truncate max-w-30 sm:max-w-none">Olá, {session.name}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <EnableNotificationsButton role="admin" />
            <ThemeToggle />
            <CreateDebtorButton />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Devedores
        </h2>
        {debtors.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>Nenhum devedor cadastrado ainda.</p>
            <p className="text-sm mt-1">Use o botão acima para adicionar o primeiro.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {debtors.map(debtor => (
              <DebtorCard key={debtor._id} debtor={debtor} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
