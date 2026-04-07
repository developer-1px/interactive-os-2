/** @catalog 마크다운 렌더링 뷰어 */
// ② 2026-03-31-chat-perf-prd.md
import { Component, createElement, memo, useMemo, type ReactNode } from 'react'
import { ax } from '@styles/ax'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeRaw from 'rehype-raw'
import remarkRender from '../../pages/showcase/remarkRender'
import { parseJsx } from '../../pages/showcase/parseJsx'
import { mdComponents } from '../../pages/showcase/mdComponents'
import { MermaidBlock } from '../../pages/showcase/MermaidBlock'
import { CodeBlock } from './CodeBlock'
import './MarkdownViewer.css'

export type CodeVariant = 'bordered' | 'flush' | 'compact'

const remarkPlugins = [remarkGfm, remarkBreaks, remarkRender]
const rehypePlugins = [rehypeRaw]

class RenderErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null }
  static getDerivedStateFromError(err: Error) { return { error: err.message } }
  render() {
    if (this.state.error) {
      return <div className={ax({ tone: 'danger', textStyle: 'caption', padding: 'xs' })}>Render error: {this.state.error}</div>
    }
    return this.props.children
  }
}

function RenderBlock({ children }: { children: string }) {
  const lines = children.trim().split('\n')
  const elements: ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const parsed = parseJsx(line)
    if (!parsed) {
      elements.push(
        <div key={i} className={ax({ tone: 'danger', textStyle: 'caption', padding: 'xs' })}>
          Parse error: {line}
        </div>
      )
      continue
    }
    const Component = mdComponents[parsed.name]
    if (!Component) {
      elements.push(
        <div key={i} className={ax({ tone: 'danger', textStyle: 'caption', padding: 'xs' })}>
          Unknown component: {parsed.name}
        </div>
      )
      continue
    }
    elements.push(
      <RenderErrorBoundary key={i}>
        {createElement(Component, parsed.props)}
      </RenderErrorBoundary>
    )
  }

  return <>{elements}</>
}

export const MarkdownViewer = memo(function MarkdownViewer({ content, className, codeVariant, prose = true, linkTransform }: { content: string; className?: string; codeVariant?: CodeVariant; prose?: boolean; linkTransform?: (href: string) => { href: string; onClick?: React.MouseEventHandler } }) {
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
    div(props: React.HTMLAttributes<HTMLDivElement> & { node?: unknown }) {
      const { node: _, children, ...rest } = props
      const dataRender = (rest as Record<string, unknown>)['data-render']
      if (typeof dataRender === 'string') {
        const decoded = atob(dataRender)
        return <RenderBlock>{decoded}</RenderBlock>
      }
      return <div {...rest}>{children}</div>
    },
    code({ className, children, ...props }: { className?: string; children?: React.ReactNode }) {
      const match = /language-(\w+)/.exec(className || '')
      const lang = match?.[1]
      const text = String(children).replace(/\n$/, '')

      if (lang === 'mermaid') {
        return <MermaidBlock code={text} />
      }

      if (lang) {
        return <CodeBlock code={text} filename={`code.${lang}`} variant={codeVariant} />
      }

      return <code className={className} {...props}>{children}</code>
    },
  }), [codeVariant, linkTransform])

  return (
    <div className={`break-word ${ax({ text: 'primary', width: 'prose' })}${prose ? ' markdown' : ''}${className ? ` ${className}` : ''}`}>
      <Markdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        children={content}
        components={components}
      />
    </div>
  )
})
