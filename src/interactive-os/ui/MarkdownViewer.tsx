// ② 2026-03-31-chat-perf-prd.md
import { memo, useMemo } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeRaw from 'rehype-raw'
import { MermaidBlock } from '../../pages/MermaidBlock'
import { CodeBlock } from './CodeBlock'
import defaultStyles from './MarkdownViewer.module.css'

export type MarkdownStyles = typeof defaultStyles
export type CodeVariant = 'bordered' | 'flush' | 'compact'

const FILE_EXT_RE = /^(.+\.(?:tsx?|jsx?|css|md|mdx|json|ya?ml|html?|svg|sh|py|rs|go|toml|sql|graphql|vue|svelte))(?::(\d+))?$/

const remarkPlugins = [remarkGfm, remarkBreaks]
const rehypePlugins = [rehypeRaw]

function parseFilePath(text: string): { path: string; line?: number } | null {
  const m = FILE_EXT_RE.exec(text.trim())
  if (!m) return null
  return { path: m[1], line: m[2] ? Number(m[2]) : undefined }
}

function openFilePreview(path: string, line?: number) {
  window.dispatchEvent(new CustomEvent('inspector:open-source', {
    detail: { fileName: path, lineNumber: line },
  }))
}

export const MarkdownViewer = memo(function MarkdownViewer({ content, styles = defaultStyles, codeVariant }: { content: string; styles?: MarkdownStyles; codeVariant?: CodeVariant }) {
  const components = useMemo(() => ({
    code({ className, children, ...props }: { className?: string; children?: React.ReactNode }) {
      const match = /language-(\w+)/.exec(className || '')
      const lang = match?.[1]
      const text = String(children).replace(/\n$/, '')

      if (lang === 'mermaid') {
        return <MermaidBlock chart={text} />
      }

      if (lang) {
        return <CodeBlock code={text} filename={`code.${lang}`} variant={codeVariant} />
      }

      return <code className={className} {...props}>{children}</code>
    },
  }), [codeVariant, styles])

  return (
    <div className={styles.markdown}>
      <Markdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        children={content}
        components={components}
      />
    </div>
  )
})
