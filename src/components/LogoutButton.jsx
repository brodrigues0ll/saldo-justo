'use client'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useState } from 'react'

export default function LogoutButton() {
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    if (loading) return
    setLoading(true)
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} disabled={loading}>
      <LogOut className="w-4 h-4" />
    </Button>
  )
}
