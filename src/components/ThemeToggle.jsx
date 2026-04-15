'use client'
import { useTheme } from '@/components/ThemeProvider'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="rounded-full w-9 h-9 transition-all duration-300 hover:bg-primary/10 hover:text-primary"
      aria-label="Alternar tema"
    >
      {theme === 'dark'
        ? <Sun className="w-4 h-4" />
        : <Moon className="w-4 h-4" />
      }
    </Button>
  )
}
