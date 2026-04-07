/** @catalog 가상 스크롤 코드 블록 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { codeToTokens, type BundledLanguage } from 'shiki'
import { IDENTIFIER_RE, EXT_TO_LANG, useShikiTheme, escapeHtml } from './shikiUtils'
import { useVirtualScrollState } from '../plugins/virtualScroll'
import { ax } from '@styles/ax'
import './CodeBlock.css'
export type { HighlightTone } from './CodeBlock'

interface VirtualCodeBlockProps {
  code: string
  filename: string
  highlightLines?: Map<number, import('./CodeBlock').HighlightTone>
  variant?: 'bordered' | 'flush' | 'compact'
  lineHeight?: number
}

function tokensToHtml(tokens: { content: string; color?: string }[]): string {
  return tokens.map(t => {
    const escaped = escapeHtml(t.content)
    const isIdent = IDENTIFIER_RE.test(t.content)
    if (isIdent) {
      return `<span style="color:${t.color ?? 'inherit'}" class="code-token" data-token="${escaped}">${escaped}</span>`
    }
    return t.color ? `<span style="color:${t.color}">${escaped}</span>` : escaped
  }).join('')
}

export function VirtualCodeBlock({
  code,
  filename,
  highlightLines,
  variant = 'flush',
  lineHeight = 20,
}: VirtualCodeBlockProps) {
  const [cachedLines, setCachedLines] = useState<string[] | null>(null)
  const [highlightToken, setHighlightToken] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const codeRef = useRef<HTMLElement>(null)
  const spacerRef = useRef<HTMLDivElement>(null)

  const lines = useMemo(() => code.split('\n'), [code])
  const ext = filename.split('.').pop() ?? ''
  const lang = EXT_TO_LANG[ext] ?? 'text'
  const theme = useShikiTheme()

  // Tokenize once, pre-build HTML per line
  useEffect(() => {
    let cancelled = false
    codeToTokens(code, { lang: lang as BundledLanguage, theme }).then(result => {
      if (!cancelled) {
        setCachedLines(result.tokens.map(line =>
          tokensToHtml(line.map(t => ({ content: t.content, color: t.color }))),
        ))
      }
    })
    return () => { cancelled = true }
  }, [code, lang, theme])

  const { totalHeight, visibleRange, offsetTop } = useVirtualScrollState({
    itemCount: lines.length,
    estimatedItemHeight: lineHeight,
    overscan: 10,
    containerRef,
  })

  // Apply dynamic heights via DOM
  useEffect(() => {
    if (codeRef.current) codeRef.current.style.height = `${totalHeight}px`
  }, [totalHeight])

  useEffect(() => {
    if (spacerRef.current) spacerRef.current.style.height = `${offsetTop}px`
  }, [offsetTop])

  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const token = target.getAttribute('data-token')
    if (token) {
      setHighlightToken(prev => prev === token ? null : token)
    } else {
      setHighlightToken(null)
    }
  }, [])

  // Apply token highlight via DOM — only on highlightToken change
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const prev = el.querySelectorAll('.code-token--highlighted')
    for (const p of prev) p.classList.remove('code-token--highlighted')
    if (highlightToken) {
      const matches = el.querySelectorAll(`[data-token="${CSS.escape(highlightToken)}"]`)
      for (const m of matches) m.classList.add('code-token--highlighted')
    }
  }, [highlightToken, visibleRange.start, visibleRange.end])

  const visibleLineHtmls = useMemo(() => {
    const result: { index: number; html: string | null; raw: string }[] = []
    for (let i = visibleRange.start; i < visibleRange.end && i < lines.length; i++) {
      result.push({
        index: i,
        html: cachedLines?.[i] ?? null,
        raw: lines[i],
      })
    }
    return result
  }, [visibleRange.start, visibleRange.end, cachedLines, lines])

  const cls = variant === 'flush'
    ? `overflow-hidden code-block code-block--flush`
    : variant === 'compact'
      ? `overflow-hidden code-block code-block--compact`
      : `overflow-hidden code-block`

  const gutterCls = `text-right select-none ${ax({ text: 'muted', textStyle: 'code' })} `

  return (
    <div ref={containerRef} className={`${cls} `} onClick={handleClick}>
      <pre className={`shiki ${ax({ surface: 'base' })} `}>
        <code ref={codeRef} className={ax({ layout: 'column' })}>
          <div ref={spacerRef} className={""} />
          {visibleLineHtmls.map(({ index, html, raw }) => {
            const lineNum = index + 1
            const tone = highlightLines?.get(lineNum)
            const lineCls = `line${tone ? ` code-line--${tone}` : ''}`

            return html
              ? <span key={index} className={lineCls} data-line={lineNum} dangerouslySetInnerHTML={{ __html: `<span class="${gutterCls}">${lineNum}</span>${html}` }} />
              : <span key={index} className={lineCls} data-line={lineNum}><span className={gutterCls}>{lineNum}</span>{raw}</span>
          })}
        </code>
      </pre>
    </div>
  )
}
