import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminLoginForm from '@/components/AdminLoginForm'

export default async function LoginPage() {
  const session = await getSession()
  if (session) redirect('/dashboard')

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Gradient orbs de fundo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/20 dark:bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-violet-500/20 dark:bg-violet-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm px-6 z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">Saldo Justo</h1>
          <p className="text-muted-foreground text-sm">Acesso administrativo</p>
        </div>
        <AdminLoginForm />
      </div>
    </div>
  )
}
