// Code block renderer — delegates to CodeViewer.
import type React from 'react'
import type { BlockData } from '../../deck/deckTypes'
import { ax } from '@styles/ax'
import { CodeViewer } from '@os/ui/CodeViewer'

type CodeData = Extract<BlockData, { type: 'code' }>

export interface CodeBlockProps {
  data: CodeData
  editable?: boolean
  onEdit?: (patch: Partial<CodeData>) => void
}

export function CodeBlock({ data, editable: _editable, onEdit: _onEdit }: CodeBlockProps): React.ReactElement {
  return (
    <div className={ax({ width: 'full' })}>
      <CodeViewer
        code={data.source}
        filename={data.language}
        preset="presentation"
      />
    </div>
  )
}
