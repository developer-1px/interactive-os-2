/** @catalog Shiki 구문 강조 코드 블록 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { codeToHtml } from 'shiki'
import { ax } from '@styles/ax'
import { IDENTIFIER_RE, EXT_TO_LANG, useShikiTheme } from './shikiUtils'
import { CopyButton } from './CopyButton'
import './CodeBlock.css'

// HighlightTone: used by replay edit animation for tone-coded line highlights
export type HighlightTone = 'edited' | 'selected' | 'deleted' | 'inserted'

export function CodeBlock({ code, filename, highlightLines, variant = 'bordered' }: { code: string; filename: string; highlightLines?: Set<number> | Map<number, HighlightTone>; variant?: 'bordered' | 'flush' | 'compact' }) {
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
            const tone = highlightLines instanceof Map ? highlightLines.get(line) ?? 'edited' : 'edited'
            const cls = `code-line--${tone}`
            const existing = (node.properties['class'] as string) ?? ''
            node.properties['class'] = existing ? `${existing} ${cls}` : cls
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

  const baseAx = ax({ textStyle: 'code' })
  const cls = variant === 'flush'
    ? `${baseAx} code-block code-block--flush select-text`
    : variant === 'compact'
      ? `${baseAx} code-block code-block--compact select-text`
      : `${baseAx} code-block select-text`
  if (!html) return (
    <div className={ax({ placement: 'relative' })}>
      <pre className={`${cls} ${ax({ padding: 'xl', surface: 'base', shape: 'xl', textStyle: 'code' })}`}><code>{code}</code></pre>
      <CopyButton text={code} />
    </div>
  )
  return (
    <div className={ax({ placement: 'relative' })}>
      <div
        ref={containerRef}
        className={cls}
        dangerouslySetInnerHTML={{ __html: html }}
        onClick={handleClick}
      />
      <CopyButton text={code} />
    </div>
  )
}
