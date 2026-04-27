import { ArrowLeft } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import SettingsView from './SettingsView'
import BackButton from '@/components/BackButton'

export const metadata = { title: 'Configurações — Saldo Justo' }

export default function ConfiguracoesPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50 px-4 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <BackButton />
          <h1 className="flex-1 text-base font-semibold text-foreground">Configurações</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <SettingsView />
      </main>
    </div>
  )
}
