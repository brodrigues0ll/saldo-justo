'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'
import { toast } from 'sonner'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export default function EnableNotificationsButton({ role, debtorCode }) {
  const [status, setStatus] = useState('idle') // idle | loading | enabled | denied | unsupported

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'granted') setStatus('enabled')
    else if (Notification.permission === 'denied') setStatus('denied')
  }, [])

  async function handleEnable() {
    if (!('Notification' in window)) return
    setStatus('loading')

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        toast.error('Permissão de notificação negada')
        return
      }

      // Buscar chave pública VAPID
      const keyRes = await fetch('/api/push/vapid-public-key')
      const { key } = await keyRes.json()
      if (!key) {
        toast.error('Push não configurado no servidor')
        setStatus('idle')
        return
      }

      const reg = await navigator.serviceWorker.ready
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      })

      const body = {
        subscription: subscription.toJSON(),
        role,
        ...(role === 'debtor' && debtorCode ? { debtorCode } : {}),
      }

      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        toast.error('Erro ao salvar subscription')
        setStatus('idle')
        return
      }

      setStatus('enabled')
      toast.success('Notificações ativadas!')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao ativar notificações')
      setStatus('idle')
    }
  }

  if (status === 'unsupported' || status === 'denied') return null
  if (status === 'enabled') return (
    <div className="flex items-center gap-1 text-xs text-green-600">
      <Bell className="w-3 h-3" />
      <span>Notificações ativas</span>
    </div>
  )

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleEnable}
      disabled={status === 'loading'}
    >
      <Bell className="w-4 h-4 mr-1" />
      {status === 'loading' ? 'Ativando...' : 'Ativar notificações'}
    </Button>
  )
}
