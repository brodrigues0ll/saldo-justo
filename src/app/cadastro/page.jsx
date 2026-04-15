import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import RegisterForm from '@/components/RegisterForm'
import Image from 'next/image'

export default async function CadastroPage() {
  const session = await getSession()
  if (session) redirect('/dashboard')

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/20 dark:bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-violet-500/20 dark:bg-violet-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm px-6 z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Image
              src="/long-logo.png"
              alt="Saldo Justo"
              width={180}
              height={48}
              className="invert dark:invert-0"
              priority
            />
          </div>
          <p className="text-muted-foreground text-sm">Crie sua conta gratuita</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}
