'use client'
import { useEffect } from 'react'

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .then(reg => console.log('[SW] Registrado:', reg.scope))
        .catch(err => console.error('[SW] Erro:', err))
    }
  }, [])

  return null
}
