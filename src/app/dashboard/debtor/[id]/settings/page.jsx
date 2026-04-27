import { requireAdmin } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/ThemeToggle'
import DebtorSettingsView from './DebtorSettingsView'

export default async function DebtorSettingsPage({ params }) {
  const { id } = await params
  await requireAdmin()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href={`/dashboard/debtor/${id}`}>
            <Button variant="ghost" size="sm" className="rounded-full hover:bg-primary/10 hover:text-primary">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <span className="font-semibold text-sm flex-1">Configurações do Devedor</span>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <DebtorSettingsView debtorId={id} />
      </main>
    </div>
  )
}
