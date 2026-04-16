'use client'
import { useEffect } from 'react'
import { useFetch } from '@/lib/useFetch'
import TransactionItem from '@/components/TransactionItem'
import { Separator } from '@/components/ui/separator'

export default function TransactionHistory({ initialTransactions, displayMode, debtorId }) {
  const { data, refetch } = useFetch(`/api/debtor/${debtorId}`)

  // Expor refetch globalmente para AddTransactionModal chamar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__refetchTransactions = refetch
    }
  }, [refetch])

  // Usar dados da API se disponível, senão usar inicial
  const transactions = data?.transactions?.filter(t => t.status === 'approved') || initialTransactions

  return (
    <div>
      <Separator className="lg:hidden" />
      <h3 className="font-semibold mb-3 text-foreground mt-6 lg:mt-0">
        Histórico de transações
      </h3>
      {transactions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhuma transação registrada ainda.
        </p>
      ) : (
        <div>
          {transactions.map(t => (
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
  )
}
