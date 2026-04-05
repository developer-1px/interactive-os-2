// ② 2026-03-31-chat-perf-prd.md
import { memo, useMemo } from 'react'
import { ax } from '@styles/ax'
import '@styles/ax.css'
import styles from './DiffBlock.module.css'
import type { DiffBlock as DiffBlockType } from './types'

export const DiffBlock = memo(function DiffBlock({ block }: { block: DiffBlockType }) {
  const oldLines = useMemo(() => block.old.split('\n'), [block.old])
  const newLines = useMemo(() => block.new.split('\n'), [block.new])

  return (
    <div className={`overflow-hidden ${ax({ surface: 'display', shape: 'md' })} ${styles.diff}`}>
      {block.filePath && (
        <div className={`${ax({ text: 'secondary', textStyle: 'caption' })} ${styles.diffHeader}`}>{block.filePath}</div>
      )}
      <div className={`grid ${styles.diffBody}`}>
        <div className={`overflow-hidden min-w-0 ${ax({ surface: 'display' })}`}>
          <pre className={`pre-wrap break-word ${ax({ textStyle: 'caption' })} ${styles.diffCode}`}>
            {oldLines.map((line, i) => (
              <div key={i} className={styles.diffLineOld}>{line || ' '}</div>
            ))}
          </pre>
        </div>
        <div className={`overflow-hidden min-w-0 ${ax({ surface: 'display' })}`}>
          <pre className={`pre-wrap break-word ${ax({ textStyle: 'caption' })} ${styles.diffCode}`}>
            {newLines.map((line, i) => (
              <div key={i} className={styles.diffLineNew}>{line || ' '}</div>
            ))}
          </pre>
        </div>
      </div>
    </div>
  )
})
