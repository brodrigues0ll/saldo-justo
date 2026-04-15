'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'

function formatCurrency(rawValue) {
  let val = rawValue.replace(/\D/g, '')
  if (val.length > 15) val = val.slice(0, 15)
  const formatted = (Number(val) / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return formatted === 'NaN' ? '' : formatted
}

/**
 * Converte "1.234,56" → 1234.56
 * Converte "0,00" → 0
 */
export function parseMoneyValue(formatted) {
  if (!formatted) return 0
  return parseFloat(formatted.replace(/\./g, '').replace(',', '.')) || 0
}

export default function MoneyInput({ value, onChange, placeholder = '0,00', disabled }) {
  const [focused, setFocused] = useState(false)

  function handleChange(e) {
    onChange(formatCurrency(e.target.value.replace(/\D/g, '')))
  }

  return (
    <div className="relative">
      <span className={cn(
        'absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold pointer-events-none select-none transition-colors duration-200',
        focused ? 'text-primary' : 'text-muted-foreground'
      )}>
        R$
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full h-11 pl-10 pr-3 rounded-xl text-sm font-medium transition-all duration-200 outline-none',
          'bg-background border text-foreground placeholder:text-muted-foreground/50',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          focused
            ? 'border-primary ring-3 ring-primary/20 glow-primary'
            : 'border-border hover:border-primary/40'
        )}
      />
    </div>
  )
}
