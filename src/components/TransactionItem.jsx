import { cn } from '@/lib/utils'
import { formatBRL } from '@/lib/money'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import DeleteTransactionButton from '@/components/DeleteTransactionButton'

const statusConfig = {
  approved: { label: 'Aprovado', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  pending:  { label: 'Pendente', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  rejected: { label: 'Rejeitado', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
}

export default function TransactionItem({ transaction, displayMode = 'deposit', showDeleteButton = false, onDelete }) {
  const { type, amount, description, status, createdBy, createdAt, transactionDate, _id: transactionId } = transaction
  const st = statusConfig[status] || statusConfig.approved
  const isDeposit = type === 'deposit'
  const depositLabel = displayMode === 'debt' ? 'Dívida' : 'Depósito'
  const displayDate = transactionDate || createdAt
  const date = new Date(displayDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0 group transition-colors hover:bg-primary/5 -mx-2 px-2 rounded-lg">
      {/* Ícone */}
      <div className={cn(
        'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200',
        isDeposit
          ? 'bg-primary/10 text-primary dark:bg-primary/20'
          : 'bg-foreground/5 text-foreground/60'
      )}>
        {isDeposit
          ? <ArrowDownLeft className="w-4 h-4" />
          : <ArrowUpRight className="w-4 h-4" />
        }
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            'text-sm font-medium',
            isDeposit ? 'text-primary dark:text-primary' : 'text-foreground'
          )}>
            {isDeposit ? depositLabel : 'Pagamento'}
          </span>
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full border font-medium',
            st.className
          )}>
            {st.label}
          </span>
          {createdBy === 'debtor' && (
            <span className="text-xs px-2 py-0.5 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium">
              Pelo devedor
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{description}</p>
        )}
        <p className="text-xs text-muted-foreground/60 mt-0.5">{date}</p>
      </div>

      {/* Delete button (admin) */}
      {showDeleteButton && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <DeleteTransactionButton transactionId={transactionId} onDelete={onDelete} />
        </div>
      )}

      {/* Valor */}
      <span className={cn(
        'font-semibold text-sm whitespace-nowrap',
        isDeposit ? 'text-primary' : 'text-foreground',
        status === 'approved' && !isDeposit && 'text-emerald-500 dark:text-emerald-400'
      )}>
        {isDeposit ? '+' : '-'}{formatBRL(amount)}
      </span>
    </div>
  )
}
