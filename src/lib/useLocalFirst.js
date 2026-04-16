'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { sessionGet, sessionSet, idbGet, idbSet } from './localdb'

/**
 * Hook local-first: lê cache (sessionStorage → IndexedDB) e busca da API em
 * background. Recebe atualizações em tempo real via WebSocket.
 *
 * @param {string} url        - URL da API (ex: /api/debtor/123)
 * @param {string} cacheKey   - Chave de cache (ex: debtor:123)
 * @param {string} [debtorId] - ID do devedor (se já conhecido, assina WS imediatamente)
 */
export function useLocalFirst(url, cacheKey, debtorId = null) {
  const [data, setData] = useState(null)

  const wsRef = useRef(null)
  const subIdRef = useRef(debtorId)

  // Persiste em sessionStorage + IndexedDB sem bloquear a UI
  const persist = useCallback((next) => {
    if (!cacheKey || !next) return
    sessionSet(cacheKey, next)
    idbSet(cacheKey, next).catch(() => {})
  }, [cacheKey])

  // Aplica atualização ao estado e persiste
  const applyUpdate = useCallback((updater) => {
    setData(prev => {
      if (!prev) return prev
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      persist(next)
      return next
    })
  }, [persist])

  // Carrega cache local imediatamente após a hidratação
  // sessionStorage (sync) → sem flash visível na maioria dos casos
  // IndexedDB (async ~5ms) → fallback entre sessões
  useEffect(() => {
    if (!cacheKey) return

    // Tenta sessionStorage primeiro (síncrono)
    const session = sessionGet(cacheKey)
    if (session) {
      setData(session)
      return
    }

    // Fallback: IndexedDB (persistente entre sessões)
    idbGet(cacheKey).then(cached => {
      if (cached) setData(prev => prev ?? cached)
    })
  }, [cacheKey])

  // Busca da API em background (silent — não limpa o estado enquanto carrega)
  const sync = useCallback(async () => {
    if (!url) return
    try {
      const res = await fetch(url)
      if (!res.ok) return
      const json = await res.json()
      setData(json)
      persist(json)

      // Resolve o debtorId para assinar o WS (ex: página do devedor que só tem code)
      const resolvedId = json._id?.toString()
      if (resolvedId && resolvedId !== subIdRef.current) {
        subIdRef.current = resolvedId
        if (wsRef.current?.readyState === 1) {
          wsRef.current.send(JSON.stringify({ type: 'subscribe', debtorId: resolvedId }))
        }
      }
    } catch {}
  }, [url, persist])

  useEffect(() => { sync() }, [sync])

  // WebSocket: atualizações em tempo real
  useEffect(() => {
    if (typeof window === 'undefined') return

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${proto}//${window.location.host}/ws`)
    wsRef.current = ws

    ws.onopen = () => {
      if (subIdRef.current) {
        ws.send(JSON.stringify({ type: 'subscribe', debtorId: subIdRef.current }))
      }
    }

    ws.onmessage = (e) => {
      try { applyWsMessage(JSON.parse(e.data), applyUpdate) } catch {}
    }

    ws.onerror = () => {}

    return () => ws.close()
  }, [applyUpdate])

  return { data, sync }
}

// --- Aplica mensagens do WebSocket ao estado local ---

function applyWsMessage(msg, applyUpdate) {
  const { type, payload } = msg

  if (type === 'tx:insert') {
    applyUpdate(prev => {
      if (prev.transactions.some(t => t._id === payload._id)) return prev
      const transactions = [payload, ...prev.transactions]
      return { ...prev, transactions, ...computeTotals(transactions) }
    })
  } else if (type === 'tx:delete') {
    applyUpdate(prev => {
      const transactions = prev.transactions.filter(t => t._id !== payload._id)
      return { ...prev, transactions, ...computeTotals(transactions) }
    })
  } else if (type === 'tx:update') {
    applyUpdate(prev => {
      const transactions = prev.transactions.map(t =>
        t._id === payload._id ? { ...t, ...payload } : t
      )
      return { ...prev, transactions, ...computeTotals(transactions) }
    })
  } else if (type === 'debtor:update') {
    applyUpdate(prev => ({ ...prev, ...payload }))
  }
}

function computeTotals(transactions) {
  let totalDeposits = 0, totalPaid = 0
  for (const t of transactions) {
    if (t.status !== 'approved') continue
    if (t.type === 'deposit') totalDeposits += t.amount
    else if (t.type === 'payment') totalPaid += t.amount
  }
  return { totalDeposits, totalPaid, balance: totalDeposits - totalPaid }
}
