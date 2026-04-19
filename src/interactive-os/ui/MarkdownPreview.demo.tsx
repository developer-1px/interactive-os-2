/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { MarkdownPreview } from './MarkdownPreview'

export const meta = {
  slug: 'markdown-viewer',
  category: 'ui',
  label: 'MarkdownPreview',
}

const content = `# Heading

A paragraph with **bold** and *italic* text.

- Item one
- Item two
`

export function Demo() {
  return <MarkdownPreview content={content} />
}
