// ② 2026-03-27-chat-module-prd.md
import styles from './DiffBlock.module.css'
import type { DiffBlock as DiffBlockType } from './types'

export function DiffBlock({ block }: { block: DiffBlockType }) {
  const oldLines = block.old.split('\n')
  const newLines = block.new.split('\n')

  return (
    <div className={styles.diff}>
      {block.filePath && (
        <div className={styles.diffHeader}>{block.filePath}</div>
      )}
      <div className={styles.diffBody}>
        <div className={styles.diffPane}>
          <pre className={styles.diffCode}>
            {oldLines.map((line, i) => (
              <div key={i} className={styles.diffLineOld}>{line || ' '}</div>
            ))}
          </pre>
        </div>
        <div className={styles.diffPane}>
          <pre className={styles.diffCode}>
            {newLines.map((line, i) => (
              <div key={i} className={styles.diffLineNew}>{line || ' '}</div>
            ))}
          </pre>
        </div>
      </div>
    </div>
  )
}
