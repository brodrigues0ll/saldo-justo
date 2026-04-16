'use client'
import { useState, useCallback } from 'react'

/**
 * Hook simples para fetch de dados
 *
 * @param {string} url - URL da API
 * @param {object} options - Opções do fetch (headers, etc)
 * @returns {object} { data, loading, error, fetch, refetch }
 */
export function useFetch(url, options = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async (body = null, method = 'GET') => {
    if (!url) {
      setError('URL não definida')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const config = {
        method: body ? 'POST' : method,
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
      }

      if (body) {
        config.body = JSON.stringify(body)
      }

      const res = await fetch(url, config)

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(err.error || `Erro ${res.status}`)
      }

      const json = await res.json()
      setData(json)
      return json
    } catch (err) {
      const msg = err.message || 'Erro ao buscar dados'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [url, options])

  const refetch = useCallback(() => {
    return fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    fetch: fetchData,
    refetch,
  }
}
