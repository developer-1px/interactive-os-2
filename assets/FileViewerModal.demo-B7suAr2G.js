import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { useState } from 'react'
import { FileViewerModal } from './FileViewerModal'
import { Button } from './Button'

export const meta = {
  slug: 'file-viewer-modal',
  category: 'ui',
  label: 'FileViewerModal',
}

export function Demo() {
  const [path, setPath] = useState<string | null>(null)

  return (
    <>
      <Button variant="ghost" onClick={() => setPath('/Users/user/Desktop/aria/src/interactive-os/ui/Button.tsx')}>
        Open File Viewer
      </Button>
      <FileViewerModal filePath={path} onClose={() => setPath(null)} />
    </>
  )
}
`;export{t as n,n as t};