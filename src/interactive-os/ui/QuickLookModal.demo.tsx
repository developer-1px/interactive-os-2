/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { useState } from 'react'
import { QuickLookModal } from './QuickLookModal'
import { Button } from './Button'

export const meta = {
  slug: 'file-viewer-modal',
  category: 'ui',
  label: 'QuickLookModal',
}

export function Demo() {
  const [path, setPath] = useState<string | null>(null)

  return (
    <>
      <Button variant="ghost" onClick={() => setPath('/Users/user/Desktop/aria/src/interactive-os/ui/Button.tsx')}>
        Open File Viewer
      </Button>
      <QuickLookModal filePath={path} onClose={() => setPath(null)} />
    </>
  )
}
