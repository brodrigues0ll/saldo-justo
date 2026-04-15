'use client'
import { useEffect, useState } from 'react'

/**
 * Renderiza os filhos apenas após a montagem no cliente.
 * Use para componentes que usam APIs do browser (Notification, localStorage)
 * ou que geram IDs aleatórios (Radix Dialog, Switch) — evita hydration mismatch.
 */
export default function ClientOnly({ children, fallback = null }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return fallback
  return children
}
