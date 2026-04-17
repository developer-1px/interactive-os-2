/** @catalog Shiki 구문 강조 코드 뷰어 */
// ② code-viewer-prd.md
import { useState, useEffect, useCallback, useRef, useMemo, useId } from 'react'
import { codeToHtml, codeToTokens, type BundledLanguage } from 'shiki'
import { ax } from '@styles/ax'
import { IDENTIFIER_RE, EXT_TO_LANG, useShikiTheme, escapeHtml } from './shikiUtils'
import { CopyButton } from './CopyButton'
import { useVirtualScrollState } from '../plugins/virtualScroll'
import './CodeViewer.css'

// ② code-viewer-prd.md — HighlightTone: replay/diff의 5 tone 라벨
export type HighlightTone = 'edited' | 'selected' | 'deleted' | 'inserted' | 'context'

// ② code-viewer-prd.md — preset: 용도별 레시피 (shadcn size×role 방식)
export type CodeViewerPreset = 'presentation' | 'doc' | 'chat' | 'replay'

export interface CodeViewerProps {
  code: string
  filename?: string
  preset?: CodeViewerPreset
  highlightLines?: Set<number> | Map<number, HighlightTone>
  startLine?: number
  showLineNumbers?: boolean
  wrap?: boolean
  virtualized?: boolean | number
}

interface PresetRecipe {
  showLineNumbers: boolean
  wrap: boolean
  region: boolean
  chrome: 'frame' | 'bordered' | 'compact'
}

const PRESET_RECIPES: Record<CodeViewerPreset, PresetRecipe> = {
  presentation: { showLineNumbers: true, wrap: false, region: true, chrome: 'frame' },
  doc: { showLineNumbers: true, wrap: false, region: true, chrome: 'bordered' },
  chat: { showLineNumbers: false, wrap: true, region: false, chrome: 'compact' },
  replay: { showLineNumbers: true, wrap: false, region: false, chrome: 'compact' },
}

const VIRTUAL_AUTO_THRESHOLD = 500

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

// ② code-viewer-prd.md
export function CodeViewer({
  code,
  filename,
  preset = 'doc',
  highlightLines,
  startLine,
  showLineNumbers,
  wrap,
  virtualized,
}: CodeViewerProps) {
  const recipe = PRESET_RECIPES[preset]
  const captionId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const preRef = useRef<HTMLPreElement>(null)
  const currentTheme = useShikiTheme()

  const resolvedShowLineNumbers = showLineNumbers ?? recipe.showLineNumbers
  const resolvedWrap = wrap ?? recipe.wrap
  const resolvedStartLine = Math.max(1, startLine ?? 1)

  const ext = (filename ?? '').split('.').pop() ?? ''
  const lang = EXT_TO_LANG[ext] ?? 'text'

  const lines = useMemo(() => code.split('\n'), [code])

  // virtualized 분기 결정 (wrap + virtualized 충돌 시 wrap 우선)
  const wantsVirtualized = virtualized === true
    ? true
    : virtualized === false
      ? false
      : typeof virtualized === 'number'
        ? lines.length >= virtualized
        : lines.length >= VIRTUAL_AUTO_THRESHOLD

  const useVirtualized = wantsVirtualized && !resolvedWrap

  useEffect(() => {
    if (wantsVirtualized && resolvedWrap) {
      console.warn('[CodeViewer] wrap=true conflicts with virtualized. wrap takes priority; virtualized is disabled.')
    }
  }, [wantsVirtualized, resolvedWrap])

  const ariaLabel = filename ? undefined : `Code example, ${lang}`
  const ariaLabelledBy = filename ? captionId : undefined

  return (
    <div className={ax({ placement: 'relative' })}>
      <figure
        className={`code-viewer code-viewer--${preset}${resolvedWrap ? ' code-viewer--wrap' : ''}${!resolvedShowLineNumbers ? ' code-viewer--no-gutter' : ''} ${ax({ layout: 'stack', textStyle: 'code', surface: 'raised', scroll: 'hidden' })}`}
        role={recipe.region ? 'region' : undefined}
        aria-labelledby={ariaLabelledBy}
        aria-label={ariaLabel}
      >
        {(filename || recipe.chrome === 'frame') && (
          <figcaption
            id={captionId}
            className={`code-viewer-caption ${ax({ layout: 'bar', gap: 'sm', padding: 'sm', textStyle: 'caption', text: 'muted', border: 'bottom' })}`}
          >
            {recipe.chrome === 'frame' && (
              <span aria-hidden="true" className={`code-viewer-chrome-dots ${ax({ layout: 'bar', gap: 'xs' })}`}>
                <span className="code-viewer-chrome-dot" />
                <span className="code-viewer-chrome-dot" />
                <span className="code-viewer-chrome-dot" />
              </span>
            )}
            {filename && <span>{filename}</span>}
          </figcaption>
        )}
        {useVirtualized
          ? (
            <VirtualizedBody
              code={code}
              lang={lang}
              theme={currentTheme}
              highlightLines={highlightLines}
              startLine={resolvedStartLine}
              showLineNumbers={resolvedShowLineNumbers}
              containerRef={containerRef}
              preRef={preRef}
              lines={lines}
            />
          )
          : (
            <StandardBody
              code={code}
              lang={lang}
              theme={currentTheme}
              highlightLines={highlightLines}
              startLine={resolvedStartLine}
              showLineNumbers={resolvedShowLineNumbers}
              containerRef={containerRef}
              preRef={preRef}
            />
          )
        }
      </figure>
      <CopyButton text={code} />
    </div>
  )
}

// ── Standard (non-virtualized) body ──

interface BodyProps {
  code: string
  lang: string
  theme: string
  highlightLines?: Set<number> | Map<number, HighlightTone>
  startLine: number
  showLineNumbers: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
  preRef: React.RefObject<HTMLPreElement | null>
}

function StandardBody({ code, lang, theme, highlightLines, startLine, showLineNumbers, containerRef, preRef }: BodyProps) {
  const [html, setHtml] = useState('')
  const [highlightToken, setHighlightToken] = useState<string | null>(null)
  const [scrollable, setScrollable] = useState(false)

  useEffect(() => {
    if (!code) return
    let cancelled = false
    codeToHtml(code, {
      lang,
      theme,
      transformers: [{
        line(node, line) {
          node.properties['data-line'] = line
          if (highlightLines?.has(line)) {
            const tone = highlightLines instanceof Map ? highlightLines.get(line) ?? 'edited' : 'edited'
            const cls = `code-line--${tone}`
            const existing = (node.properties['class'] as string) ?? ''
            node.properties['class'] = existing ? `${existing} ${cls}` : cls
          }
          if (showLineNumbers) {
            const existing = (node.properties['class'] as string) ?? ''
            node.properties['class'] = existing ? `${existing} code-line--with-gutter` : 'code-line--with-gutter'
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
  }, [code, lang, theme, highlightLines, showLineNumbers])

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
  }, [highlightToken, html, containerRef])

  useEffect(() => {
    const pre = preRef.current
    if (!pre) return
    const check = () => setScrollable(pre.scrollWidth > pre.clientWidth)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(pre)
    return () => ro.disconnect()
  }, [html, preRef])

  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const token = target.getAttribute('data-token')
    if (token) {
      setHighlightToken((prev) => prev === token ? null : token)
    } else {
      setHighlightToken(null)
    }
  }, [])

  const gutterOffset = startLine - 1

  if (html) {
    return (
      <div
        ref={containerRef}
        className="code-viewer-body select-text"
        data-gutter-offset={gutterOffset}
        style={{ '--_gutter-offset': gutterOffset } as React.CSSProperties}
        onClick={handleClick}
      >
        <pre
          ref={preRef}
          className={`shiki code-viewer-pre ${ax({ scroll: 'x' })}`}
          tabIndex={scrollable ? 0 : undefined}
          dangerouslySetInnerHTML={{ __html: extractShikiInner(html) }}
        />
      </div>
    )
  }
  return (
    <div
      ref={containerRef}
      className="code-viewer-body select-text"
      data-gutter-offset={gutterOffset}
      style={{ '--_gutter-offset': gutterOffset } as React.CSSProperties}
    >
      <pre ref={preRef} className="shiki code-viewer-pre" tabIndex={scrollable ? 0 : undefined}>
        <code>{code}</code>
      </pre>
    </div>
  )
}

// shiki returns `<pre class="shiki ..."><code>...</code></pre>`. We provide our own <pre>.
function extractShikiInner(html: string): string {
  const match = /<pre[^>]*>([\s\S]*)<\/pre>/.exec(html)
  return match ? match[1] : html
}

// ── Virtualized body ──

interface VirtualBodyProps extends BodyProps {
  lines: string[]
}

function VirtualizedBody({ code, lang, theme, highlightLines, startLine, showLineNumbers, containerRef, preRef, lines }: VirtualBodyProps) {
  const [cachedLines, setCachedLines] = useState<string[] | null>(null)
  const [highlightToken, setHighlightToken] = useState<string | null>(null)
  const spacerRef = useRef<HTMLDivElement>(null)
  const codeRef = useRef<HTMLElement>(null)
  const lineHeight = 20

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

  useEffect(() => {
    if (codeRef.current) codeRef.current.style.height = `${totalHeight}px`
  }, [totalHeight])

  useEffect(() => {
    if (spacerRef.current) spacerRef.current.style.height = `${offsetTop}px`
  }, [offsetTop])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const prev = el.querySelectorAll('.code-token--highlighted')
    for (const p of prev) p.classList.remove('code-token--highlighted')
    if (highlightToken) {
      const matches = el.querySelectorAll(`[data-token="${CSS.escape(highlightToken)}"]`)
      for (const m of matches) m.classList.add('code-token--highlighted')
    }
  }, [highlightToken, visibleRange.start, visibleRange.end, containerRef])

  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const token = target.getAttribute('data-token')
    if (token) {
      setHighlightToken(prev => prev === token ? null : token)
    } else {
      setHighlightToken(null)
    }
  }, [])

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

  return (
    <div
      ref={containerRef}
      className={`code-viewer-body select-text ${ax({ scroll: 'hidden' })}`}
      onClick={handleClick}
    >
      <pre ref={preRef} className="shiki code-viewer-pre" tabIndex={0}>
        <code ref={codeRef} className={ax({ layout: 'stack' })}>
          <div ref={spacerRef} />
          {visibleLineHtmls.map(({ index, html, raw }) => {
            const dataLine = index + 1
            const displayLine = index + startLine
            const tone = highlightLines instanceof Map ? highlightLines.get(dataLine) : (highlightLines?.has(dataLine) ? 'edited' : undefined)
            const lineCls = `line${tone ? ` code-line--${tone}` : ''}${showLineNumbers ? ' code-line--with-gutter' : ''}`
            const gutter = showLineNumbers
              ? `<span class="code-viewer-gutter" aria-hidden="true">${displayLine}</span>`
              : ''

            return html
              ? (
                <span
                  key={index}
                  className={lineCls}
                  data-line={dataLine}
                  dangerouslySetInnerHTML={{ __html: `${gutter}${html}` }}
                />
              )
              : (
                <span key={index} className={lineCls} data-line={dataLine}>
                  {showLineNumbers && <span className="code-viewer-gutter" aria-hidden="true">{displayLine}</span>}
                  {raw}
                </span>
              )
          })}
        </code>
      </pre>
    </div>
  )
}
