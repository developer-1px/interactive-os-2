import { useState, useEffect } from 'react'

export const IDENTIFIER_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/

export const EXT_TO_LANG: Record<string, string> = {
  ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx',
  json: 'json', css: 'css', html: 'html', yaml: 'yaml', yml: 'yaml',
  sh: 'bash', bash: 'bash', py: 'python', md: 'markdown',
}

export function getShikiTheme(): string {
  return document.documentElement.getAttribute('data-theme') === 'light'
    ? 'github-light'
    : 'github-dark'
}

const themeListeners = new Set<() => void>()
let shikiThemeCache = typeof document !== 'undefined' && typeof document.documentElement !== 'undefined'
  ? getShikiTheme()
  : 'github-dark'

if (typeof MutationObserver !== 'undefined') {
  const themeObserver = new MutationObserver(() => {
    shikiThemeCache = getShikiTheme()
    themeListeners.forEach(fn => fn())
  })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
}

export function useShikiTheme(): string {
  const [theme, setTheme] = useState(shikiThemeCache)
  useEffect(() => {
    const cb = () => setTheme(getShikiTheme())
    themeListeners.add(cb)
    return () => { themeListeners.delete(cb) }
  }, [])
  return theme
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
