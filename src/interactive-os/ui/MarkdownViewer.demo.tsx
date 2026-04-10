/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { MarkdownViewer } from './MarkdownViewer'

export const meta = {
  slug: 'markdown-viewer',
  category: 'ui',
  label: 'MarkdownViewer',
}

const content = `# Heading

A paragraph with **bold** and *italic* text.

- Item one
- Item two
- Item three

\`\`\`ts
const x = 42
\`\`\`
`

export function Demo() {
  return <MarkdownViewer content={content} />
}
