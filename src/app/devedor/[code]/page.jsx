import DebtorLogoutButton from '@/components/DebtorLogoutButton'
import InstallPWAButton from '@/components/InstallPWAButton'
import EnableNotificationsButton from '@/components/EnableNotificationsButton'
import ThemeToggle from '@/components/ThemeToggle'
import DebtorPageView from './DebtorPageView'
import Link from 'next/link'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function DebtorPage({ params }) {
  const { code } = await params

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0" />
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <EnableNotificationsButton role="debtor" debtorCode={code} />
            <InstallPWAButton />
            <Link href="/configuracoes">
              <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 hover:bg-primary/10 hover:text-primary" title="Configurações">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            <ThemeToggle />
            <DebtorLogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <DebtorPageView debtorCode={code} />
      </main>
    </div>
  )
}
