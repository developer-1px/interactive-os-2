// ② 2026-03-31-chat-perf-prd.md
import { memo, useMemo } from 'react'
import { ax } from '@styles/ax'

import type { DiffBlock as DiffBlockType } from './types'

export const DiffBlock = memo(function DiffBlock({ block }: { block: DiffBlockType }) {
  const oldLines = useMemo(() => block.old.split('\n'), [block.old])
  const newLines = useMemo(() => block.new.split('\n'), [block.new])

  return (
    <div className={ax({ role: 'cell', surface: 'display' })}>
      {block.filePath && (
        <div className={ax({ role: 'item', textStyle: 'code', content: 'text' })}>{block.filePath}</div>
      )}
      <div className={ax({ layout: 'grid-2' })}>
        <div className={ax({ })}>
          <pre className={`pre-wrap break-word ${ax({ textStyle: 'code' })}`}>
            {oldLines.map((line, i) => (
              <div key={i} className={ax({ role: 'item', tone: 'danger-dim', content: 'code' })}>{line || ' '}</div>
            ))}
          </pre>
        </div>
        <div className={ax({ })}>
          <pre className={`pre-wrap break-word ${ax({ textStyle: 'code' })}`}>
            {newLines.map((line, i) => (
              <div key={i} className={ax({ role: 'item', tone: 'success-dim', content: 'code' })}>{line || ' '}</div>
            ))}
          </pre>
        </div>
      </div>
    </div>
  )
})
