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

const remarkPlugins = [remarkGfm, remarkBreaks]
const rehypePlugins = [rehypeRaw]

export const MarkdownViewer = memo(function MarkdownViewer({ content, styles = defaultStyles, codeVariant }: { content: string; styles?: MarkdownStyles; codeVariant?: CodeVariant }) {
  const components = useMemo(() => ({
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
