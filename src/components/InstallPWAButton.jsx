'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export default function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    const handler = e => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setCanInstall(false)
    setDeferredPrompt(null)
  }

  if (!canInstall) return null

  return (
    <Button variant="outline" size="sm" onClick={handleInstall}>
      <Download className="w-4 h-4 mr-1" aria-hidden="true" />
      Instalar App
    </Button>
  )
}
