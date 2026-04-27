'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { RefreshCw, Trash2, Bell, BellOff, Check, AlertTriangle, Loader2 } from 'lucide-react'

export default function SettingsView() {
  const [swVersion, setSwVersion] = useState(null)
  const [updateStatus, setUpdateStatus] = useState('idle') // idle | checking | available | up-to-date | updating
  const [notifStatus, setNotifStatus] = useState('unknown')

  useEffect(() => {
    // Lê a versão do SW ativo via MessageChannel
    async function readSwVersion() {
      if (!('serviceWorker' in navigator)) return
      const reg = await navigator.serviceWorker.getRegistration()
      const sw = reg?.active
      if (!sw) return
      const ch = new MessageChannel()
      ch.port1.onmessage = (e) => setSwVersion(e.data?.version ?? null)
      sw.postMessage({ type: 'GET_VERSION' }, [ch.port2])
    }

    // Status das notificações
    function readNotifStatus() {
      if (!('Notification' in window)) { setNotifStatus('unsupported'); return }
      setNotifStatus(Notification.permission) // granted | denied | default
    }

    // Detecta SW esperando na fila (atualização já baixada mas não aplicada)
    async function checkWaiting() {
      if (!('serviceWorker' in navigator)) return
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg?.waiting) setUpdateStatus('available')
    }

    readSwVersion()
    readNotifStatus()
    checkWaiting()
  }, [])

  async function checkForUpdate() {
    if (!('serviceWorker' in navigator)) {
      toast.error('Service Worker não disponível')
      return
    }
    setUpdateStatus('checking')
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      if (!reg) { setUpdateStatus('idle'); return }

      // Se já tem um SW esperando, não precisa baixar de novo
      if (reg.waiting) {
        setUpdateStatus('available')
        return
      }

      // Força o browser a re-baixar o sw.js e verificar mudanças
      await reg.update()

      // Escuta se um novo SW for encontrado
      let found = false
      reg.addEventListener('updatefound', () => {
        found = true
        const newSW = reg.installing
        newSW?.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && reg.waiting) {
            setUpdateStatus('available')
          }
        })
      })

      // Aguarda um pouco para ver se houve update
      await new Promise(r => setTimeout(r, 2000))
      if (!found && !reg.waiting) setUpdateStatus('up-to-date')
    } catch {
      setUpdateStatus('idle')
      toast.error('Erro ao verificar atualização')
    }
  }

  async function applyUpdate() {
    if (!('serviceWorker' in navigator)) return
    setUpdateStatus('updating')
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      if (!reg?.waiting) {
        toast.error('Nenhuma atualização na fila')
        setUpdateStatus('idle')
        return
      }

      // Quando o novo SW assumir o controle, recarrega a página
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })

      reg.waiting.postMessage({ type: 'SKIP_WAITING' })
    } catch {
      setUpdateStatus('idle')
      toast.error('Erro ao aplicar atualização')
    }
  }

  async function clearCache() {
    try {
      const keys = await caches.keys()
      await Promise.all(keys.map(k => caches.delete(k)))
      toast.success('Cache limpo! Recarregando...')
      setTimeout(() => window.location.reload(), 800)
    } catch {
      toast.error('Erro ao limpar cache')
    }
  }

  const notifLabel = {
    granted: 'Ativas',
    denied: 'Bloqueadas pelo navegador',
    default: 'Não configuradas',
    unsupported: 'Não suportadas',
    unknown: '...',
  }

  return (
    <div className="space-y-8">

      {/* Atualização */}
      <section className="glass rounded-2xl p-5 border border-border/50 space-y-4">
        <div>
          <h2 className="font-semibold text-foreground">Atualização do App</h2>
          {swVersion && (
            <p className="text-xs text-muted-foreground mt-0.5">Versão instalada: {swVersion}</p>
          )}
        </div>

        <Separator />

        {updateStatus === 'available' && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Atualização disponível</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Uma nova versão foi baixada e está pronta para ser instalada.
              </p>
            </div>
          </div>
        )}

        {updateStatus === 'up-to-date' && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
            <Check className="w-4 h-4 shrink-0" />
            O app está atualizado.
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          {updateStatus !== 'available' && (
            <Button
              variant="outline"
              onClick={checkForUpdate}
              disabled={updateStatus === 'checking' || updateStatus === 'updating'}
              className="flex-1"
            >
              {updateStatus === 'checking'
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verificando...</>
                : <><RefreshCw className="w-4 h-4 mr-2" /> Verificar atualização</>
              }
            </Button>
          )}

          {updateStatus === 'available' && (
            <Button
              onClick={applyUpdate}
              disabled={updateStatus === 'updating'}
              className="flex-1"
            >
              {updateStatus === 'updating'
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Atualizando...</>
                : <><RefreshCw className="w-4 h-4 mr-2" /> Atualizar agora</>
              }
            </Button>
          )}
        </div>
      </section>

      {/* Cache */}
      <section className="glass rounded-2xl p-5 border border-border/50 space-y-4">
        <div>
          <h2 className="font-semibold text-foreground">Cache</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Use se o app estiver mostrando dados desatualizados mesmo após atualizar.
          </p>
        </div>
        <Separator />
        <Button variant="outline" onClick={clearCache} className="w-full sm:w-auto text-destructive hover:text-destructive hover:border-destructive/50">
          <Trash2 className="w-4 h-4 mr-2" />
          Limpar cache e recarregar
        </Button>
      </section>

      {/* Notificações */}
      <section className="glass rounded-2xl p-5 border border-border/50 space-y-4">
        <div>
          <h2 className="font-semibold text-foreground">Notificações</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Status da permissão neste dispositivo.
          </p>
        </div>
        <Separator />
        <div className="flex items-center gap-2 text-sm">
          {notifStatus === 'granted'
            ? <Bell className="w-4 h-4 text-emerald-500 shrink-0" />
            : <BellOff className="w-4 h-4 text-muted-foreground shrink-0" />
          }
          <span className={notifStatus === 'granted' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
            {notifLabel[notifStatus]}
          </span>
        </div>
        {notifStatus === 'denied' && (
          <p className="text-xs text-muted-foreground">
            Para ativar, vá em <strong>Configurações do navegador → Permissões → Notificações</strong> e libere este site.
          </p>
        )}
      </section>

    </div>
  )
}
