// ② 2026-03-27-chat-module-prd.md
import { memo } from 'react'
import {
  Circle, FileText, Terminal,
  Pencil, Search, FilePlus, Zap,
} from 'lucide-react'
import { DEFAULT_ROOT } from './types'
import type { TimelineEvent, ToolGroup } from './groupEvents'
import type { DataBlock } from '../../interactive-os/ui/chat/types'
import styles from './TimelineColumn.module.css'

// --- Helpers ---

function relPath(absPath: string): string {
  return absPath.replace(DEFAULT_ROOT + '/', '')
}

function eventLabel(evt: TimelineEvent): string {
  if (evt.type === 'user') return evt.text ?? ''
  if (evt.type === 'assistant') return evt.text ?? ''
  if (evt.tool === 'Read' && evt.filePath) return `Read ${relPath(evt.filePath)}`
  if (evt.tool === 'Edit' && evt.filePath) return `Edit ${relPath(evt.filePath)}`
  if (evt.tool === 'Write' && evt.filePath) return `Write ${relPath(evt.filePath)}`
  if (evt.tool === 'Bash') return `$ ${evt.text ?? ''}`
  if (evt.tool === 'Grep') return `grep "${evt.text ?? ''}"`
  if (evt.tool === 'Glob') return `glob "${evt.text ?? ''}"`
  if (evt.tool === 'Skill') return `/${evt.text ?? 'skill'}`
  return evt.tool ?? evt.type
}

function EventIcon({ evt }: { evt: TimelineEvent }) {
  if (evt.tool === 'Read') return <FileText size={12} />
  if (evt.tool === 'Edit') return <Pencil size={12} />
  if (evt.tool === 'Write') return <FilePlus size={12} />
  if (evt.tool === 'Bash') return <Terminal size={12} />
  if (evt.tool === 'Grep' || evt.tool === 'Glob') return <Search size={12} />
  if (evt.tool === 'Skill') return <Zap size={12} />
  return <Circle size={12} />
}

function ToolCodePreview({ code, maxLines = 8 }: { code: string; maxLines?: number }) {
  const lines = code.split('\n')
  const truncated = lines.length > maxLines
  const display = truncated ? lines.slice(0, maxLines).join('\n') : code
  return (
    <div className={styles.tcCodePreview}>
      <pre>{display}</pre>
      {truncated && <div className={styles.tcCodeFade}>+{lines.length - maxLines} lines</div>}
    </div>
  )
}

// --- ToolGroupBlock (viewer-specific block renderer) ---

export const ToolGroupBlock = memo(function ToolGroupBlock({ block }: { block: DataBlock }) {
  const group = block.data as ToolGroup
  return (
    <div className={styles.tcToolGroup}>
      {group.events.map((evt, i) => {
        const toolClass = styles[`tc${evt.tool ?? ''}`] ?? ''
        const hasPreview = (evt.tool === 'Edit' || evt.tool === 'Write') && evt.editNew
        return (
          <div key={`${evt.ts}-${i}`}>
            <div
              className={`${styles.tcToolRow} ${toolClass}${evt.filePath ? ` ${styles.tcFile}` : ''
                }${!hasPreview && i < group.events.length - 1 ? ` ${styles.tcToolDivider}` : ''}`}
            >
              <span className={styles.tcIcon}>
                <EventIcon evt={evt} />
              </span>
              <span className={styles.tcText}>{eventLabel(evt)}</span>
            </div>
            {hasPreview && (
              <div className={i < group.events.length - 1 ? styles.tcToolDivider : undefined}>
                <ToolCodePreview code={evt.editNew!} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
})
