'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

export default function UpdateBanner() {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    function show() { setVisible(true) }
    window.addEventListener('sw:update-available', show)
    return () => window.removeEventListener('sw:update-available', show)
  }, [])

  async function applyUpdate() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      if (!reg?.waiting) { window.location.reload(); return }
      navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload())
      reg.waiting.postMessage({ type: 'SKIP_WAITING' })
    } catch {
      window.location.reload()
    }
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="glass rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md p-4 flex items-center gap-3 shadow-lg">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Nova versão disponível</p>
          <p className="text-xs text-muted-foreground">Atualize para usar a versão mais recente.</p>
        </div>
        <Button size="sm" onClick={applyUpdate} disabled={loading} className="shrink-0">
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>
    </div>
  )
}
