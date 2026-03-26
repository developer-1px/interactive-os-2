import { useState, useEffect, useCallback, useRef } from 'react'
import { codeToHtml } from 'shiki'
import styles from './CodeBlock.module.css'

// --- Theme detection (single observer shared across all CodeBlock instances) ---

function getShikiTheme(): string {
  return document.documentElement.getAttribute('data-theme') === 'light'
    ? 'github-light'
    : 'github-dark'
}

const themeListeners = new Set<() => void>()
let shikiThemeCache = getShikiTheme()

if (typeof MutationObserver !== 'undefined') {
  const themeObserver = new MutationObserver(() => {
    shikiThemeCache = getShikiTheme()
    themeListeners.forEach(fn => fn())
  })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
}

function useShikiTheme(): string {
  const [theme, setTheme] = useState(shikiThemeCache)
  useEffect(() => {
    const cb = () => setTheme(getShikiTheme())
    themeListeners.add(cb)
    return () => { themeListeners.delete(cb) }
  }, [])
  return theme
}

// --- Shiki code highlighting ---

const IDENTIFIER_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/

const EXT_TO_LANG: Record<string, string> = {
  ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx',
  json: 'json', css: 'css', html: 'html', yaml: 'yaml', yml: 'yaml',
  sh: 'bash', bash: 'bash', py: 'python', md: 'markdown',
}

export function CodeBlock({ code, filename, highlightLines, variant = 'bordered' }: { code: string; filename: string; highlightLines?: Set<number>; variant?: 'bordered' | 'flush' }) {
  const [html, setHtml] = useState('')
  const [highlightToken, setHighlightToken] = useState<string | null>(null)
  const currentTheme = useShikiTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const ext = filename.split('.').pop() ?? ''
  const lang = EXT_TO_LANG[ext] ?? 'text'

  useEffect(() => {
    let cancelled = false
    codeToHtml(code, {
      lang,
      theme: currentTheme,
      transformers: [{
        line(node, line) {
          node.properties['data-line'] = line
          if (highlightLines?.has(line)) {
            const existing = (node.properties['class'] as string) ?? ''
            node.properties['class'] = existing ? `${existing} code-line--edited` : 'code-line--edited'
          }
        },
        span(node) {
          const text = (node.children?.[0] as { type: string; value: string })?.value
          if (text && IDENTIFIER_RE.test(text)) {
            node.properties['data-token'] = text
            const existing = node.properties['class'] ?? ''
            node.properties['class'] = existing ? `${existing} code-token` : 'code-token'
          }
        },
      }],
    }).then((result) => {
      if (!cancelled) setHtml(result)
    })
    return () => { cancelled = true }
  }, [code, lang, currentTheme, highlightLines])

  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const token = target.getAttribute('data-token')
    if (token) {
      setHighlightToken((prev) => prev === token ? null : token)
    } else {
      setHighlightToken(null)
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const tokens = container.querySelectorAll('.code-token')
    for (const el of tokens) {
      if (highlightToken && el.getAttribute('data-token') === highlightToken) {
        (el as HTMLElement).classList.add('code-token--highlighted')
      } else {
        (el as HTMLElement).classList.remove('code-token--highlighted')
      }
    }
  }, [highlightToken, html])

  const cls = variant === 'flush' ? `${styles.codeBlock} ${styles.codeBlockFlush}` : styles.codeBlock
  if (!html) return <pre className={`${cls} ${styles.codeBlockLoading}`}><code>{code}</code></pre>
  return (
    <div
      ref={containerRef}
      className={cls}
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={handleClick}
    />
  )
}
