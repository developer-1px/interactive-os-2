import { useState } from 'react'
import {
  FileText, Terminal, Pencil, FilePlus,
  Search, Zap, Wrench, Globe,
} from 'lucide-react'
import { ExpandIndicator } from '../indicators/ExpandIndicator'
import { CodeBlock } from '../CodeBlock'
import { DiffBlock } from './DiffBlock'
import { useChatFeatures } from './chatFeatures'
import styles from './ToolSummaryBlock.module.css'
import type { DataBlock } from './types'

const toolIcons: Record<string, typeof Wrench> = {
  Read: FileText, Edit: Pencil, Write: FilePlus,
  Bash: Terminal, Grep: Search, Glob: Search,
  Skill: Zap, WebSearch: Globe, WebFetch: Globe,
}

function formatInput(input: unknown): string {
  if (!input || typeof input !== 'object') return ''
  const obj = input as Record<string, unknown>
  if (obj.command) return `$ ${obj.command}`
  if (obj.file_path) return String(obj.file_path).replace(/.*\/aria\//, '')
  if (obj.pattern) return `"${obj.pattern}"`
  if (obj.query) return `"${obj.query}"`
  if (obj.url) return String(obj.url)
  return JSON.stringify(input).slice(0, 100)
}

// Strip cat -n line number prefix: "  1\tcontent" → "content"
const CAT_N_RE = /^\s*\d+\t/

function stripLineNumbers(text: string): string {
  const lines = text.split('\n')
  if (lines.length < 2) return text
  // Only strip if most lines match the pattern (avoid false positives)
  const matchCount = lines.filter(l => CAT_N_RE.test(l) || l === '').length
  if (matchCount < lines.length * 0.8) return text
  return lines.map(l => l.replace(CAT_N_RE, '')).join('\n')
}

function getToolMeta(block: DataBlock): { name: string; detail: string; input: Record<string, unknown> } {
  const data = block.data as { name?: string; input?: unknown } | string
  const name = typeof data === 'string' ? data : (data.name ?? 'tool')
  const detail = typeof data === 'string' ? '' : formatInput(data.input)
  const input = (typeof data === 'object' && data.input && typeof data.input === 'object')
    ? data.input as Record<string, unknown>
    : {}
  return { name, detail, input }
}

function extractResultText(block: DataBlock): string {
  const content = block.data
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((c: { type?: string; text?: string }) => c.type === 'text' ? c.text : '')
      .filter(Boolean)
      .join('\n')
  }
  return JSON.stringify(content, null, 2)
}

// --- Standalone tool_use row (no result attached) ---

export function ToolSummaryBlock({ block }: { block: DataBlock }) {
  const { name, detail } = getToolMeta(block)
  const Icon = toolIcons[name] ?? Wrench

  return (
    <div className={`relative flex-row items-center ${styles.toolRow}`}>
      <span className={`absolute flex-row items-center justify-center ${styles.rowIcon}`}><Icon size={12} /></span>
      <span><span className={styles.toolName}>{name}</span>{detail ? ' ' : ''}<span className={`overflow-hidden whitespace-nowrap min-w-0 ${styles.toolDetail}`}>{detail}</span></span>
    </div>
  )
}

// --- Standalone tool_result (no tool_use context) ---

export function ToolResultBlock({ block }: { block: DataBlock }) {
  const { expandByDefault } = useChatFeatures()
  const [open, setOpen] = useState(expandByDefault)
  const text = extractResultText(block)

  if (!text) return null

  const lines = text.split('\n')
  const preview = lines[0].slice(0, 120)
  const isLong = lines.length > 3 || text.length > 200

  if (!isLong) {
    return <pre className={`overflow-y-auto ${styles.toolResult}`}>{text}</pre>
  }

  return (
    <details open={open} onToggle={e => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className={`relative flex-row items-center cursor-pointer ${styles.toolResultSummary}`}>
        <ExpandIndicator variant="expand" />
        <span className={`overflow-hidden whitespace-nowrap min-w-0 ${styles.toolResultPreview}`}>{preview}{lines.length > 1 ? ` (+${lines.length - 1} lines)` : ''}</span>
      </summary>
      <pre className={`overflow-y-auto ${styles.toolResult}`}>{text}</pre>
    </details>
  )
}

// --- Line range label from Read input ---

function formatReadRange(input: Record<string, unknown>, lineCount: number): string {
  const offset = typeof input.offset === 'number' ? input.offset : 0
  const start = offset || 1
  const end = start + lineCount - 1
  return `L${start}–${end} (${lineCount} lines)`
}

// --- Grouped tool_use + tool_result bordered card ---

export function ToolGroup({ toolUse, toolResult }: { toolUse: DataBlock; toolResult?: DataBlock }) {
  const { expandByDefault } = useChatFeatures()
  const { name, detail, input } = getToolMeta(toolUse)
  const Icon = toolIcons[name] ?? Wrench

  const text = toolResult ? extractResultText(toolResult) : ''
  const lines = text ? text.split('\n') : []
  const isLong = lines.length > 3 || text.length > 200

  // Read/Edit/Write → code highlight by file extension
  const isCodeResult = (name === 'Read' || name === 'Edit' || name === 'Write') && !!input.file_path
  const filename = isCodeResult ? String(input.file_path).split('/').pop() ?? 'file.txt' : ''
  const codeText = isCodeResult ? stripLineNumbers(text) : text

  // Read: 1-tier collapsible (header=toggle), default collapsed
  const isRead = name === 'Read'
  const [open, setOpen] = useState(isRead ? false : expandByDefault)

  if (isRead && text) {
    const range = formatReadRange(input, lines.length)
    const label = `${detail} · ${range}`

    return (
      <details className={`overflow-hidden ${styles.toolGroup}`} open={open} onToggle={e => setOpen((e.target as HTMLDetailsElement).open)}>
        <summary className={`relative flex-row items-center cursor-pointer ${styles.toolGroupSummary}`}>
          <span className={`absolute flex-row items-center justify-center ${styles.rowIcon}`}><ExpandIndicator variant="expand" /></span>
          <Icon size={12} /> <span className={styles.toolName}>{name}</span> <span className={`overflow-hidden whitespace-nowrap min-w-0 ${styles.toolDetail}`}>{label}</span>
        </summary>
        <div className={`overflow-auto ${styles.toolGroupCode}`}>
          <CodeBlock code={codeText} filename={filename} variant="compact" />
        </div>
      </details>
    )
  }

  // Edit: show diff from old_string → new_string
  const isEdit = name === 'Edit'
  if (isEdit && typeof input.old_string === 'string' && typeof input.new_string === 'string') {
    const filePath = typeof input.file_path === 'string' ? String(input.file_path).replace(/.*\/aria\//, '') : undefined

    return (
      <details className={`overflow-hidden ${styles.toolGroup}`} open={open} onToggle={e => setOpen((e.target as HTMLDetailsElement).open)}>
        <summary className={`relative flex-row items-center cursor-pointer ${styles.toolGroupSummary}`}>
          <span className={`absolute flex-row items-center justify-center ${styles.rowIcon}`}><ExpandIndicator variant="expand" /></span>
          <Icon size={12} /> <span className={styles.toolName}>{name}</span> <span className={`overflow-hidden whitespace-nowrap min-w-0 ${styles.toolDetail}`}>{detail}</span>
        </summary>
        <DiffBlock block={{ type: 'diff', old: input.old_string as string, new: input.new_string as string, filePath }} />
      </details>
    )
  }

  // Other tools: 2-tier (header always visible, result below)
  const preview = lines.length > 0 ? lines[0].slice(0, 120) : ''

  return (
    <div className={`overflow-hidden ${styles.toolGroup}`}>
      <div className={`relative flex-row items-center ${styles.toolGroupHeader}`}>
        <span className={`absolute flex-row items-center justify-center ${styles.rowIcon}`}><Icon size={12} /></span>
        <span className={styles.toolGroupHeaderContent}><span className={styles.toolName}>{name}</span>{detail ? ' ' : ''}<span className={`overflow-hidden whitespace-nowrap min-w-0 ${styles.toolDetail}`}>{detail}</span></span>
      </div>

      {text && !isLong && (
        <pre className={`overflow-y-auto ${styles.toolGroupResult}`}>{text}</pre>
      )}

      {text && isLong && (
        <details open={open} onToggle={e => setOpen((e.target as HTMLDetailsElement).open)}>
          <summary className={`relative flex-row items-center cursor-pointer ${styles.toolGroupResultSummary}`}>
            <ExpandIndicator variant="expand" />
            <span className={`overflow-hidden whitespace-nowrap min-w-0 ${styles.toolResultPreview}`}>{preview}{lines.length > 1 ? ` (+${lines.length - 1} lines)` : ''}</span>
          </summary>
          <pre className={`overflow-y-auto ${styles.toolGroupResult}`}>{text}</pre>
        </details>
      )}
    </div>
  )
}
