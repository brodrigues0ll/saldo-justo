# Estratégia de Fetch Simplificada

## Princípios
1. **Fetch direto** - Sem abstrações, sem cache intermediário
2. **Estado local** - Cada componente Client gerencia seus dados
3. **Sem transformações** - Use dados da API diretamente
4. **Refetch explícito** - Chamadas diretas ao fazer mutations

## Hook Simples: `useFetch`

```js
// lib/useFetch.js
import { useState, useCallback } from 'react'

export function useFetch(url, options = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetch = useCallback(async (body = null) => {
    setLoading(true)
    setError(null)
    try {
      const res = await window.fetch(url, {
        method: body ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        ...(body && { body: JSON.stringify(body) }),
        ...options,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro na requisição')
      }

      const json = await res.json()
      setData(json)
      return json
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [url, options])

  return { data, loading, error, fetch }
}
```

## Padrão: Componente Client com Fetch

```js
'use client'
import { useEffect } from 'react'
import { useFetch } from '@/lib/useFetch'

export function TransactionsList({ debtorId }) {
  const { data, loading, error, fetch } = useFetch(`/api/debtor/${debtorId}`)

  useEffect(() => {
    fetch() // Busca inicial
  }, [debtorId])

  if (loading) return <div>Carregando...</div>
  if (error) return <div>Erro: {error}</div>

  const transactions = data?.transactions || []

  return (
    <div>
      {transactions.map(t => (
        <div key={t._id}>
          <p>{t.description}</p>
          <p>R$ {t.amount}</p>
        </div>
      ))}
    </div>
  )
}
```

## Padrão: Mutation + Refetch

```js
'use client'
import { useState } from 'react'
import { toast } from 'sonner'

export function AddTransactionForm({ debtorId, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debtorId,
          type: 'deposit',
          amount: parseFloat(amount),
          description: '',
        }),
      })

      if (!res.ok) throw new Error('Erro ao criar')

      toast.success('Transação criada')
      setAmount('')
      onSuccess?.() // Callback para parent refetch
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={amount} onChange={e => setAmount(e.target.value)} />
      <button disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
    </form>
  )
}
```

## Padrão: Parent gerencia refetch

```js
'use client'
import { useState } from 'react'
import { TransactionsList } from './TransactionsList'
import { AddTransactionForm } from './AddTransactionForm'

export function DebtorDetail({ debtorId }) {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div>
      <AddTransactionForm
        debtorId={debtorId}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
      />
      <TransactionsList key={refreshKey} debtorId={debtorId} />
    </div>
  )
}
```

## Rules para aplicação:

### ✅ Faça assim
- Server Components para renderização inicial
- Client Components para qualquer interatividade
- `useFetch` para dados que mudam
- Refetch explícito após mutations
- Dados brutos da API no estado

### ❌ Não faça assim
- Transformações intermediárias de dados
- Cache manual ou revalidation no cliente
- Abstrações complexas de fetch
- Estados sincronizados entre componentes (use prop drilling ou context simples)
- `window.__refreshTransactions` ou padrões globais

## Migração:

1. **RemoverTransactionHistory** - simplificar em componente único
2. **AddTransactionModal** - refetch via callback do parent
3. **DebtorDetail page** - apenas renderizar, deixar Client Components gerenciarem fetch

## Exemplo Real (Dashboard):

```js
// /dashboard/debtor/[id]/content.jsx
'use client'
import { useEffect, useState } from 'react'

export function DebtorContent({ debtorId }) {
  const [debtor, setDebtor] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/debtor/${debtorId}`)
      if (!res.ok) throw new Error('Erro')
      const data = await res.json()
      setDebtor(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [debtorId])

  if (loading) return <LoadingSkeleton />
  if (!debtor) return <div>Não encontrado</div>

  return (
    <div>
      <h1>{debtor.name}</h1>

      {/* Seção de adicionar */}
      <AddTransactionForm
        debtorId={debtorId}
        onSuccess={loadData}
      />

      {/* Seção de histórico */}
      <div>
        <h3>Histórico</h3>
        {debtor.transactions?.map(t => (
          <div key={t._id}>
            <p>{t.description}</p>
            <p>R$ {t.amount}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Benefícios:**
- Sem cache surpresa
- Refetch é explícito: `onSuccess={loadData}`
- Dados sempre atualizados
- Fácil de debugar: fetch → estado → render
