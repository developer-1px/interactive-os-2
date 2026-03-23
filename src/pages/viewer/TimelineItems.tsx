import styles from './TimelineColumn.module.css'
import { memo, type ReactNode } from 'react'
import {
  Circle, FileText, Terminal,
  Pencil, Search, FilePlus, Zap,
} from 'lucide-react'
import { DEFAULT_ROOT } from './types'
import type { TimelineEvent, ToolGroup } from './groupEvents'
import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

// --- Helpers ---

export function relPath(absPath: string): string {
  return absPath.replace(DEFAULT_ROOT + '/', '')
}

export function eventLabel(evt: TimelineEvent): string {
  if (evt.type === 'user') return evt.text ?? ''
  if (evt.type === 'assistant') return evt.text ?? ''
  if (evt.tool === 'Skill') return `/${evt.text ?? 'skill'}`
  if (evt.tool === 'Read' && evt.filePath) return `Read ${relPath(evt.filePath)}`
  if (evt.tool === 'Edit' && evt.filePath) return `Edit ${relPath(evt.filePath)}`
  if (evt.tool === 'Write' && evt.filePath) return `Write ${relPath(evt.filePath)}`
  if (evt.tool === 'Bash') return `$ ${evt.text ?? ''}`
  if (evt.tool === 'Grep') return `grep "${evt.text ?? ''}"`
  if (evt.tool === 'Glob') return `glob "${evt.text ?? ''}"`
  return evt.tool ?? evt.type
}

// --- Event icon ---

function EventIcon({ evt }: { evt: TimelineEvent }) {
  if (evt.tool === 'Skill') return <Zap size={12} />
  if (evt.tool === 'Read') return <FileText size={12} />
  if (evt.tool === 'Edit') return <Pencil size={12} />
  if (evt.tool === 'Write') return <FilePlus size={12} />
  if (evt.tool === 'Bash') return <Terminal size={12} />
  if (evt.tool === 'Grep' || evt.tool === 'Glob') return <Search size={12} />
  return <Circle size={12} />
}

// --- File path detection in markdown text ---

const FILE_PATH_RE = /(?<![a-zA-Z0-9:/.])([a-zA-Z._][a-zA-Z0-9._-]*\/[a-zA-Z0-9._\-/]+\.[a-zA-Z0-9]+)/g

function splitByFilePaths(text: string, onFileClick: (absPath: string) => void): ReactNode[] {
  const parts: ReactNode[] = []
  let lastIndex = 0
  for (const match of text.matchAll(FILE_PATH_RE)) {
    const path = match[1]
    const start = match.index!
    if (start > lastIndex) parts.push(text.slice(lastIndex, start))
    const absPath = `${DEFAULT_ROOT}/${path}`
    parts.push(
      <span
        key={`fp-${start}`}
        className={styles.tcFilePath}
        onClick={(e) => { e.stopPropagation(); onFileClick(absPath) }}
      >
        {path}
      </span>,
    )
    lastIndex = start + path.length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

function createMarkdownComponents(onFileClick: (absPath: string) => void): Components {
  return {
    p({ children }) {
      return <p>{processChildren(children, onFileClick)}</p>
    },
    li({ children }) {
      return <li>{processChildren(children, onFileClick)}</li>
    },
    td({ children }) {
      return <td>{processChildren(children, onFileClick)}</td>
    },
    code({ children, className }) {
      if (className) return <code className={className}>{children}</code>
      const text = typeof children === 'string' ? children : ''
      if (text && FILE_PATH_RE.test(text)) {
        FILE_PATH_RE.lastIndex = 0
        return <code>{splitByFilePaths(text, onFileClick)}</code>
      }
      return <code>{children}</code>
    },
  }
}

function processChildren(children: ReactNode, onFileClick: (absPath: string) => void): ReactNode {
  if (typeof children === 'string') {
    const parts = splitByFilePaths(children, onFileClick)
    return parts.length === 1 && typeof parts[0] === 'string' ? children : parts
  }
  if (Array.isArray(children)) {
    return children.map((child, i) => {
      if (typeof child === 'string') {
        const parts = splitByFilePaths(child, onFileClick)
        return parts.length === 1 && typeof parts[0] === 'string'
          ? child
          : <span key={i}>{parts}</span>
      }
      return child
    })
  }
  return children
}

// --- Timeline item (memoized) ---

export const TimelineItem = memo(function TimelineItem({ evt, onFileClick }: { evt: TimelineEvent; onFileClick: (absPath: string) => void }) {
  if (evt.type === 'assistant') {
    return (
      <div className={`${styles.tcItem} ${styles.tcAssistant}`}>
        <span className={styles.tcText}>
          {evt.text
            ? <Markdown remarkPlugins={[remarkGfm, remarkBreaks]} components={createMarkdownComponents(onFileClick)}>{evt.text}</Markdown>
            : eventLabel(evt)}
        </span>
      </div>
    )
  }

  return (
    <div className={`${styles.tcItem} ${styles.tcUser}`}>
      <span className={styles.tcText}>{eventLabel(evt)}</span>
    </div>
  )
})

export const ToolGroupCard = memo(function ToolGroupCard({ group, onClick }: { group: ToolGroup; onClick: (evt: TimelineEvent) => void }) {
  return (
    <div className={styles.tcToolGroup}>
      {group.events.map((evt, i) => {
        const toolClass = styles[`tc${evt.tool ?? ''}`] ?? ''
        return (
          <div
            key={`${evt.ts}-${i}`}
            className={`${styles.tcToolRow} ${toolClass}${evt.filePath ? ` ${styles.tcFile}` : ''}${i < group.events.length - 1 ? ` ${styles.tcToolDivider}` : ''}`}
            onClick={() => onClick(evt)}
          >
            <span className={styles.tcIcon}>
              <EventIcon evt={evt} />
            </span>
            <span className={styles.tcText}>{eventLabel(evt)}</span>
          </div>
        )
      })}
    </div>
  )
})
