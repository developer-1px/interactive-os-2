/** @catalog Shiki 구문 강조 코드 뷰어 */
// ② code-viewer-prd.md
import { useState, useEffect, useCallback, useRef, useId } from 'react'
import { codeToHtml } from 'shiki'
import { ax } from '@styles/ax'
import { IDENTIFIER_RE, EXT_TO_LANG, useShikiTheme } from './shikiUtils'
import { CopyButton } from './CopyButton'
import './CodePreview.css'

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

// ② code-viewer-prd.md
export function CodePreview({
  code,
  filename,
  preset = 'doc',
  highlightLines,
  startLine,
  showLineNumbers,
  wrap,
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

  const ariaLabel = filename ? undefined : `Code example, ${lang}`
  const ariaLabelledBy = filename ? captionId : undefined

  return (
    <div className={ax({ placement: 'relative' })}>
      <figure
        className={`code-viewer code-viewer--${preset}${resolvedWrap ? ' code-viewer--wrap' : ''}${!resolvedShowLineNumbers ? ' code-viewer--no-gutter' : ''} ${ax({
            role: 'control-group',
            layout: 'stack', surface: 'raised' })}`}
        role={recipe.region ? 'region' : undefined}
        aria-labelledby={ariaLabelledBy}
        aria-label={ariaLabel}
      >
        {(filename || recipe.chrome === 'frame') && (
          <figcaption
            id={captionId}
            className={`code-viewer-caption ${ax({ layout: 'bar', textStyle: 'caption' })}`}
          >
            {recipe.chrome === 'frame' && (
              <span aria-hidden="true" className={`code-viewer-chrome-dots ${ax({ layout: 'bar' })}`}>
                <span className="code-viewer-chrome-dot" />
                <span className="code-viewer-chrome-dot" />
                <span className="code-viewer-chrome-dot" />
              </span>
            )}
            {filename && <span>{filename}</span>}
          </figcaption>
        )}
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
      </figure>
      <CopyButton text={code} />
    </div>
  )
}

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
          node.properties['data-display-line'] = line + startLine - 1
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
  }, [code, lang, theme, highlightLines, showLineNumbers, startLine])

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

  if (html) {
    return (
      <div
        ref={containerRef}
        className="code-viewer-body select-text"
        onClick={handleClick}
      >
        <pre
          ref={preRef}
          className={`shiki code-viewer-pre ${ax({ })}`}
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
