'use client'
import { useEffect } from 'react'
import { useFetch } from '@/lib/useFetch'
import DebtorCard from '@/components/DebtorCard'

export default function DashboardContent() {
  const { data, loading, refetch } = useFetch('/api/debtor')

  useEffect(() => {
    refetch()
  }, [])

  const debtors = data || []

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-32 bg-muted/30 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

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
