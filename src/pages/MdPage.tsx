import { createElement, type ReactNode } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import remarkRender from './remarkRender'
import { parseJsx } from './parseJsx'
import { mdComponents } from './mdComponents'
import areaStyles from './AreaViewer.module.css'

interface MdPageProps {
  md: string
}

const mdModules = import.meta.glob<{ default: string }>('/docs/2-areas/**/*.md', {
  query: '?raw',
  eager: true,
})

function RenderBlock({ children }: { children: string }) {
  const lines = children.trim().split('\n')
  const elements: ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const parsed = parseJsx(line)
    if (!parsed) {
      elements.push(
        <div key={i} style={{ color: 'var(--color-destructive)', padding: '4px 8px' }}>
          Parse error: {line}
        </div>
      )
      continue
    }
    const Component = mdComponents[parsed.name]
    if (!Component) {
      elements.push(
        <div key={i} style={{ color: 'var(--color-destructive)', padding: '4px 8px' }}>
          Unknown component: {parsed.name}
        </div>
      )
      continue
    }
    elements.push(createElement(Component, { key: i, ...parsed.props }))
  }

  return <>{elements}</>
}

export default function MdPage({ md }: MdPageProps) {
  const mdPath = `/docs/2-areas/${md}.md`
  const mod = mdModules[mdPath]

  if (!mod) {
    return <div className="page-header"><p className="page-desc">Not found: {mdPath}</p></div>
  }

  const content = mod.default

  return (
    <div className={areaStyles.root}>
      <Markdown
        remarkPlugins={[remarkGfm, remarkRender]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          div({ children, node, ...rest }) {
            const dataRender = (rest as Record<string, unknown>)['data-render']
            if (typeof dataRender === 'string') {
              const decoded = atob(dataRender)
              return <RenderBlock>{decoded}</RenderBlock>
            }
            return <div {...rest}>{children}</div>
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  )
}
