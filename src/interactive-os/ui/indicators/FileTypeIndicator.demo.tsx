/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { FileTypeIndicator } from './FileTypeIndicator'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'file-type-indicator',
  category: 'indicator' as const,
  label: 'FileTypeIndicator',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'bar', gap: 'md' })}>
      <FileTypeIndicator name="src" isFolder />
      <FileTypeIndicator name="readme.md" isFolder={false} />
      <FileTypeIndicator name="index.tsx" isFolder={false} />
      <FileTypeIndicator name="data.json" isFolder={false} />
      <FileTypeIndicator name="photo.png" isFolder={false} />
      <FileTypeIndicator name="unknown.xyz" isFolder={false} />
    </div>
  )
}
