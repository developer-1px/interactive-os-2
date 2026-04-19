/** @catalog 마크다운 렌더링 뷰어 */
// ② 2026-03-31-chat-perf-prd.md
import { Component, createElement, memo, useMemo, type ComponentType, type ReactNode } from 'react'
import type { Plugin } from 'unified'
import { parse as parseYaml } from 'yaml'
import { ax } from '@styles/ax'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeRaw from 'rehype-raw'
import { CodeViewer, type CodeViewerPreset } from './CodeViewer'
import { FrontmatterCard } from './FrontmatterCard'
import { LightboxProvider, useLightbox } from './Lightbox'
import './MarkdownViewer.css'

export type CodePreset = CodeViewerPreset

export interface MarkdownRendererConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  remarkPlugins?: Plugin<any[], any>[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  componentRegistry?: Record<string, ComponentType<any>>
  parseComponent?: (input: string) => { name: string; props: Record<string, string | boolean> } | null
  mermaidComponent?: ComponentType<{ code: string; onClick?: (svgHtml: string) => void }>
}

const baseRemarkPlugins = [remarkGfm, remarkBreaks]
const rehypePlugins = [rehypeRaw]

class RenderErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null }
  static getDerivedStateFromError(err: Error) { return { error: err.message } }
  render() {
    if (this.state.error) {
      return <div className={ax({ tone: 'danger', textStyle: 'caption' })}>Render error: {this.state.error}</div>
    }
    return this.props.children
  }
}

function RenderBlock({ children, config }: { children: string; config?: MarkdownRendererConfig }) {
  if (!config?.parseComponent || !config?.componentRegistry) {
    return (
      <div className={ax({ tone: 'danger', textStyle: 'caption' })}>
        No config provided for render block
      </div>
    )
  }

  const lines = children.trim().split('\n')
  const elements: ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const parsed = config.parseComponent(line)
    if (!parsed) {
      elements.push(
        <div key={i} className={ax({ tone: 'danger', textStyle: 'caption' })}>
          Parse error: {line}
        </div>
      )
      continue
    }
    const Comp = config.componentRegistry[parsed.name]
    if (!Comp) {
      elements.push(
        <div key={i} className={ax({ tone: 'danger', textStyle: 'caption' })}>
          Unknown component: {parsed.name}
        </div>
      )
      continue
    }
    elements.push(
      <RenderErrorBoundary key={i}>
        {createElement(Comp, parsed.props)}
      </RenderErrorBoundary>
    )
  }

  return <>{elements}</>
}

// ② lightbox-prd.md — img/mermaid click → Lightbox
/** YAML frontmatter를 파싱하여 data와 body로 분리한다. */
export function parseFrontmatter(content: string): { data: Record<string, unknown>; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(content)
  if (!match) return { data: {}, body: content }
  try {
    const parsed = parseYaml(match[1]) as Record<string, unknown> | null
    return { data: parsed ?? {}, body: content.slice(match[0].length) }
  } catch {
    return { data: {}, body: content }
  }
}

function MarkdownContent({ content, className, codePreset, prose, linkTransform, config, showFrontmatter }: { content: string; className?: string; codePreset?: CodePreset; prose: boolean; linkTransform?: (href: string) => { href: string; onClick?: React.MouseEventHandler }; config?: MarkdownRendererConfig; showFrontmatter: boolean }) {
  const lightbox = useLightbox()
  const { data: frontmatter, body } = useMemo(() => parseFrontmatter(content), [content])

  const components = useMemo(() => ({
    ...(linkTransform ? {
      a({ href, children, node: _, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { node?: unknown }) {
        if (href) {
          const transformed = linkTransform(href)
          return <a {...rest} href={transformed.href} onClick={transformed.onClick}>{children}</a>
        }
        return <a {...rest} href={href}>{children}</a>
      },
    } : {}),
    // V1: lightbox-prd.md — image click opens lightbox (unless inside <a>)
    img(props: React.ImgHTMLAttributes<HTMLImageElement> & { node?: unknown }) {
      const { src, alt, node: rawNode, ...rest } = props
      // V5: lightbox-prd.md — skip if parent is <a> (link navigation takes priority)
      const node = rawNode as Record<string, unknown> | undefined
      const parentTag = node?.parent as { tagName?: string } | undefined
      const isInsideLink = parentTag?.tagName === 'a'
      if (isInsideLink || !src) {
        return <img src={src} alt={alt ?? ''} {...rest} />
      }
      return (
        <img
          src={src}
          alt={alt ?? ''}
          {...rest}
          className="lightbox-trigger"
          onClick={() => lightbox.open({ type: 'image', src, alt })}
        />
      )
    },
    div(props: React.HTMLAttributes<HTMLDivElement> & { node?: unknown }) {
      const { node: _, children, ...rest } = props
      const dataRender = (rest as Record<string, unknown>)['data-render']
      if (typeof dataRender === 'string') {
        const decoded = atob(dataRender)
        return <RenderBlock config={config}>{decoded}</RenderBlock>
      }
      return <div {...rest}>{children}</div>
    },
    code({ className, children, ...props }: { className?: string; children?: React.ReactNode }) {
      const match = /language-(\w+)/.exec(className || '')
      const lang = match?.[1]
      const text = String(children).replace(/\n$/, '')

      if (lang === 'mermaid') {
        // V2: lightbox-prd.md — mermaid click opens lightbox with SVG
        if (config?.mermaidComponent) {
          const Mermaid = config.mermaidComponent
          return <Mermaid code={text} onClick={() => lightbox.open({ type: 'mermaid', code: text })} />
        }
        return <CodeViewer code={text} filename="code.mermaid" preset={codePreset} />
      }

      if (lang) {
        return <CodeViewer code={text} filename={`code.${lang}`} preset={codePreset} />
      }

      return <code className={className} {...props}>{children}</code>
    },
  }), [codePreset, linkTransform, lightbox, config])

  const remarkPlugins = useMemo(
    () => [...baseRemarkPlugins, ...(config?.remarkPlugins ?? [])],
    [config?.remarkPlugins],
  )

  return (
    <div className={`break-word select-text ${ax({ width: 'prose', layout: 'stack', flex: 'none' })}${prose ? ' markdown' : ''}${className ? ` ${className}` : ''}`}>
      {showFrontmatter && Object.keys(frontmatter).length > 0 && <FrontmatterCard data={frontmatter} />}
      <Markdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        children={body}
        components={components}
      />
    </div>
  )
}

export const MarkdownViewer = memo(function MarkdownViewer({ content, className, codePreset, prose = true, linkTransform, config, showFrontmatter = true }: { content: string; className?: string; codePreset?: CodePreset; prose?: boolean; linkTransform?: (href: string) => { href: string; onClick?: React.MouseEventHandler }; config?: MarkdownRendererConfig; showFrontmatter?: boolean }) {
  return (
    <LightboxProvider>
      <MarkdownContent content={content} className={className} codePreset={codePreset} prose={prose} linkTransform={linkTransform} config={config} showFrontmatter={showFrontmatter} />
    </LightboxProvider>
  )
})
