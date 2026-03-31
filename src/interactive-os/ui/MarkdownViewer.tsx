import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeRaw from 'rehype-raw'
import { MermaidBlock } from '../../pages/MermaidBlock'
import { CodeBlock } from './CodeBlock'
import defaultStyles from './MarkdownViewer.module.css'

export type MarkdownStyles = typeof defaultStyles
export type CodeVariant = 'bordered' | 'flush' | 'compact'

export function MarkdownViewer({ content, styles = defaultStyles, codeVariant }: { content: string; styles?: MarkdownStyles; codeVariant?: CodeVariant }) {
  return (
    <div className={styles.markdown}>
      <Markdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw]}
        children={content}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className ?? '')
            const codeStr = String(children).replace(/\n$/, '')

            if (match?.[1] === 'mermaid') {
              return <MermaidBlock code={codeStr} />
            }

            if (match) {
              return <CodeBlock code={codeStr} filename={`x.${match[1]}`} variant={codeVariant} />
            }

            return <code className={className} {...props}>{children}</code>
          },
        }}
      />
    </div>
  )
}
