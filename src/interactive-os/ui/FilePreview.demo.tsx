/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { FilePreview } from './FilePreview'

export const meta = {
  slug: 'file-preview',
  category: 'ui',
  label: 'FilePreview',
}

const content = `export function greet(name: string): string {
  return \`Hello, \${name}!\`
}

greet('World')`

export function Demo() {
  return <FilePreview content={content} filename="greet.ts" />
}
