import { cn } from '@/lib/utils'
import { formatBRL } from '@/lib/money'
import GlassCard from '@/components/GlassCard'

export default function SummaryCard({ label, value, highlight = false, large = false }) {
  const isPositive = value > 0
  const isNegative = value < 0

  return (
    <GlassCard
      className={cn(
        'flex-1 flex flex-col gap-1 min-w-0',
        highlight && isPositive && 'glow-success',
        highlight && isNegative && 'border-red-400/30',
        large && 'p-6'
      )}
    >
      <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">{label}</p>
      <p className={cn(
        'font-bold leading-none truncate',
        large ? 'text-2xl sm:text-3xl' : 'text-base sm:text-xl',
        highlight && isPositive && 'text-emerald-500 dark:text-emerald-400',
        highlight && isNegative && 'text-red-500',
        !highlight && 'text-foreground'
      )}>
        {formatBRL(value)}
      </p>
    </GlassCard>
  )
}
