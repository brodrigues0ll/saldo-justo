'use client'
import { useEffect } from 'react'

function notifyUpdateAvailable() {
  window.dispatchEvent(new Event('sw:update-available'))
}

function trackInstalling(sw) {
  sw.addEventListener('statechange', () => {
    if (sw.state === 'installed' && navigator.serviceWorker.controller) {
      notifyUpdateAvailable()
    }
  })
}

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let reg

    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then(r => {
        reg = r

        // Já tem atualização esperando (aba aberta durante deploy)
        if (reg.waiting) {
          notifyUpdateAvailable()
          return
        }

        // Novo SW instalando agora
        if (reg.installing) trackInstalling(reg.installing)

        // SW encontrado após reg.update()
        reg.addEventListener('updatefound', () => {
          if (reg.installing) trackInstalling(reg.installing)
        })
      })
      .catch(err => console.error('[SW] Erro:', err))

    // Polling a cada 30 min para detectar deploys com app aberto
    const interval = setInterval(async () => {
      try {
        if (reg) await reg.update()
      } catch { /* silencioso */ }
    }, 30 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return null
}
