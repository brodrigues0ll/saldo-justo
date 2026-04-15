import { Suspense } from 'react'
import { requireAdmin } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Image from 'next/image'
import Debtor from '@/models/Debtor'
import DebtorCard from '@/components/DebtorCard'
import CreateDebtorButton from '@/components/CreateDebtorButton'
import LogoutButton from '@/components/LogoutButton'
import EnableNotificationsButton from '@/components/EnableNotificationsButton'
import ThemeToggle from '@/components/ThemeToggle'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

async function getDebtorsWithTotals(adminId) {
  await connectDB()

  // Uma única query com $lookup — elimina a segunda round-trip ao banco
  const debtors = await Debtor.aggregate([
    { $match: { createdBy: new mongoose.Types.ObjectId(adminId) } },
    {
      $lookup: {
        from: 'transactions',
        localField: '_id',
        foreignField: 'debtorId',
        as: 'txns',
      },
    },
    {
      $addFields: {
        totalDeposits: {
          $sum: {
            $map: {
              input: '$txns',
              as: 'tx',
              in: {
                $cond: [
                  { $and: [{ $eq: ['$$tx.type', 'deposit'] }, { $eq: ['$$tx.status', 'approved'] }] },
                  '$$tx.amount',
                  0,
                ],
              },
            },
          },
        },
        totalPaid: {
          $sum: {
            $map: {
              input: '$txns',
              as: 'tx',
              in: {
                $cond: [
                  { $and: [{ $eq: ['$$tx.type', 'payment'] }, { $eq: ['$$tx.status', 'approved'] }] },
                  '$$tx.amount',
                  0,
                ],
              },
            },
          },
        },
        pendingCount: {
          $sum: {
            $map: {
              input: '$txns',
              as: 'tx',
              in: { $cond: [{ $eq: ['$$tx.status', 'pending'] }, 1, 0] },
            },
          },
        },
      },
    },
    { $project: { txns: 0 } },
  ])

  return debtors.map(d => ({
    ...d,
    _id: d._id.toString(),
    createdBy: d.createdBy.toString(),
    balance: d.totalDeposits - d.totalPaid,
  }))
}

async function DebtorList({ adminId }) {
  const debtors = await getDebtorsWithTotals(adminId)

  if (debtors.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Nenhum devedor cadastrado ainda.</p>
        <p className="text-sm mt-1">Use o botão acima para adicionar o primeiro.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {debtors.map(debtor => (
        <DebtorCard key={debtor._id} debtor={debtor} />
      ))}
    </div>
  )
}

function DebtorListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {[0, 1, 2].map(i => (
        <div key={i} className="glass rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-4 w-28 bg-muted/50 rounded animate-pulse" />
              <div className="h-3 w-20 bg-muted/30 rounded animate-pulse" />
            </div>
            <div className="h-6 w-12 bg-muted/40 rounded animate-pulse" />
          </div>
          <div className="flex justify-between">
            <div className="h-3 w-16 bg-muted/30 rounded animate-pulse" />
            <div className="h-4 w-20 bg-muted/50 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function DashboardPage() {
  const session = await requireAdmin()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Image src="/icon-logo.png" alt="Saldo Justo" width={32} height={32} className="invert dark:invert-0 shrink-0" />
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
        <Suspense fallback={<DebtorListSkeleton />}>
          <DebtorList adminId={session.sub} />
        </Suspense>
      </main>
    </div>
  )
}
