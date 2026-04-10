/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { ax } from '@styles/ax'
import { FileIcon } from './FileIcon'

export const meta = {
  slug: 'file-icon',
  category: 'ui' as const,
  label: 'FileIcon',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'row', gap: 'md' })}>
      <FileIcon name="src" type="directory" />
      <FileIcon name="src" type="directory" expanded />
      <FileIcon name="app.tsx" type="file" />
      <FileIcon name="style.css" type="file" />
      <FileIcon name="data.json" type="file" />
      <FileIcon name="readme.md" type="file" />
      <FileIcon name="photo.png" type="file" />
      <FileIcon name="config.yaml" type="file" />
      <FileIcon name="run.sh" type="file" />
    </div>
  )
}
