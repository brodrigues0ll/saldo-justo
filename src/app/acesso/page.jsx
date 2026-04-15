import DebtorAccessForm from '@/components/DebtorAccessForm'
import InstallPWAButton from '@/components/InstallPWAButton'
import { Wallet } from 'lucide-react'

export default function AcessoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/15 dark:bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/15 dark:bg-primary/10 blur-3xl" />
      </div>
      <div className="relative w-full max-w-sm px-6 z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 glow-primary">
            <Wallet className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text mb-1">Saldo Justo</h1>
          <p className="text-muted-foreground text-sm">Digite seu código para acessar</p>
          <div className="mt-3 flex justify-center">
            <InstallPWAButton />
          </div>
        </div>
        <DebtorAccessForm />
      </div>
    </div>
  )
}
