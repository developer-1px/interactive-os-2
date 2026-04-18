import { useState, useEffect } from 'react'

export type Theme = 'dark' | 'light' | 'lifted'

const THEME_VALUES: readonly Theme[] = ['dark', 'light', 'lifted'] as const

function isTheme(v: unknown): v is Theme {
  return typeof v === 'string' && (THEME_VALUES as readonly string[]).includes(v)
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme')
    return isTheme(stored) ? stored : 'dark'
  })

  useEffect(() => {
    if (document.documentElement.getAttribute('data-theme') !== theme) {
      document.documentElement.setAttribute('data-theme', theme)
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : t === 'light' ? 'lifted' : 'dark')

  return { theme, toggle } as const
}
