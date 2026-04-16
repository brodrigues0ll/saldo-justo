'use client'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export default function EnableNotificationsButton({ role, debtorCode }) {
  const [status, setStatus] = useState('idle') // idle | loading | enabled | denied | unsupported
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'granted') setStatus('enabled')
    else if (Notification.permission === 'denied') setStatus('denied')
  }, [])

  // Fecha o menu ao clicar fora
  useEffect(() => {
    if (!showMenu) return
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMenu])

  async function doSubscribe(forceNew = false) {
    setStatus('loading')
    setShowMenu(false)

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        toast.error('Permissão de notificação negada')
        return
      }

      const keyRes = await fetch('/api/push/vapid-public-key')
      const { key } = await keyRes.json()
      if (!key) {
        toast.error('Push não configurado no servidor')
        setStatus('enabled')
        return
      }

      const reg = await navigator.serviceWorker.ready

      if (forceNew) {
        const existing = await reg.pushManager.getSubscription()
        if (existing) await existing.unsubscribe()
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      })

      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          role,
          ...(role === 'debtor' && debtorCode ? { debtorCode } : {}),
        }),
      })

      if (!res.ok) {
        toast.error('Erro ao salvar subscription')
        setStatus(forceNew ? 'idle' : 'enabled')
        return
      }

      setStatus('enabled')
      toast.success(forceNew ? 'Dispositivo recadastrado!' : 'Notificações ativadas!')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao ativar notificações')
      setStatus('idle')
    }
  }

  if (status === 'unsupported') return null

  if (status === 'denied') return (
    <div
      className="flex items-center gap-1 text-xs text-muted-foreground"
      title="Notificações bloqueadas — libere nas configurações do navegador"
    >
      <BellOff className="w-3.5 h-3.5" />
    </div>
  )

  if (status === 'enabled') return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(v => !v)}
        className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:opacity-70 transition-opacity px-1 py-1 rounded"
        title="Notificações ativas"
      >
        <Bell className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Notificações ativas</span>
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden w-48">
          <button
            onClick={() => doSubscribe(true)}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            Recadastrar dispositivo
          </button>
        </div>
      )}
    </div>
  )

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => doSubscribe(false)}
      disabled={status === 'loading'}
      className="rounded-full w-9 h-9 hover:bg-primary/10 hover:text-primary"
      title={status === 'loading' ? 'Ativando...' : 'Ativar notificações'}
    >
      <Bell className="w-4 h-4" />
    </Button>
  )
}
