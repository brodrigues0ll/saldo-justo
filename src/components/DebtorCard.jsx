import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatBRL } from '@/lib/money'
import { ChevronRight, AlertCircle } from 'lucide-react'
import GlassCard from '@/components/GlassCard'

export default function DebtorCard({ debtor }) {
  const { _id, name, code, balance, pendingCount, totalDeposits, totalPaid } = debtor

  return (
    <Link href={`/dashboard/debtor/${_id}`} className="block">
      <GlassCard hover className="group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
              {name}
            </h3>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{code}</p>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
                <AlertCircle className="w-3 h-3" />
                {pendingCount}
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 truncate">Depositado</p>
            <p className="text-xs sm:text-sm font-semibold text-primary truncate">{formatBRL(totalDeposits)}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 truncate">Pago</p>
            <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{formatBRL(totalPaid)}</p>
          </div>
          <div className="text-right min-w-0">
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 truncate">Saldo</p>
            <p className={cn(
              'text-xs sm:text-sm font-bold truncate',
              balance > 0 ? 'text-emerald-500 dark:text-emerald-400' : balance < 0 ? 'text-red-500' : 'text-muted-foreground'
            )}>
              {formatBRL(balance)}
            </p>
          </div>
        </div>
      </GlassCard>
    </Link>
  )
}
