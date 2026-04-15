import { cn } from '@/lib/utils'

export default function GlassCard({ children, className, hover = false, glow = false }) {
  return (
    <div className={cn(
      'glass rounded-2xl p-5 transition-all duration-300',
      hover && 'card-hover cursor-pointer',
      glow && 'glow-primary',
      className
    )}>
      {children}
    </div>
  )
}
