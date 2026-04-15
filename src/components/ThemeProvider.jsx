'use client'
import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({ theme: 'dark', toggle: () => {} })

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    const saved = localStorage.getItem('sj_theme') || 'dark'
    setTheme(saved)
    document.documentElement.classList.toggle('dark', saved === 'dark')
  }, [])

  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('sj_theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
