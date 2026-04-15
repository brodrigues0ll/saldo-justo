'use client'
import { useState, useCallback } from 'react'
import TransactionItem from '@/components/TransactionItem'
import { Separator } from '@/components/ui/separator'

export default function TransactionHistory({ initialTransactions, displayMode, debtorId }) {
  const [transactions, setTransactions] = useState(initialTransactions)

  const refreshTransactions = useCallback(async () => {
    try {
      const res = await fetch(`/api/debtor/${debtorId}`)
      if (!res.ok) return
      const data = await res.json()
      const approved = data.transactions?.filter(t => t.status !== 'pending') || []
      setTransactions(approved)
    } catch (error) {
      console.error('Erro ao atualizar transações:', error)
    }
  }, [debtorId])

  // Expor função de refresh globalmente para que AddTransactionModal possa chamar
  if (typeof window !== 'undefined' && !window.__refreshTransactions) {
    window.__refreshTransactions = refreshTransactions
  }

  const historyTransactions = transactions.length

  return (
    <div>
      <Separator className="lg:hidden" />
      <h3 className="font-semibold mb-3 text-foreground mt-6 lg:mt-0">
        Histórico de transações
      </h3>
      {historyTransactions === 0 ? (
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
