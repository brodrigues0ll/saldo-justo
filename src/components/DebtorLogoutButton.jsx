'use client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default function DebtorLogoutButton() {
  const router = useRouter()

  function handleLogout() {
    localStorage.removeItem('sj_debtor_code')
    router.push('/acesso')
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout}>
      <LogOut className="w-4 h-4" />
    </Button>
  )
}
