var e=`import type { StoreDiff } from '../store/computeStoreDiff'
import type { NormalizedData } from '../store/types'

export interface DispatchLogEntry {
  seq: number
  kind?: 'dispatch'
  type: string
  payload: unknown
  diff: StoreDiff[]
  parent?: number
  error?: string
  /** Store snapshot before command execution (null for ring-buffer-evicted entries) */
  prev?: NormalizedData | null
  /** Store snapshot after command execution (null for ring-buffer-evicted entries) */
  next?: NormalizedData | null
  /** Original command type before middleware transformation */
  originalType?: string
  /** Original command payload before middleware transformation */
  originalPayload?: unknown
}

export interface UnhandledKeyEntry {
  seq: number
  kind: 'unhandled-key'
  key: string
  code: string
  modifiers: string
}

export type LogEntry = DispatchLogEntry | UnhandledKeyEntry

export type Logger = (entry: LogEntry) => void

function truncatePayload(payload: unknown): string {
  const str = JSON.stringify(payload) ?? 'undefined'
  if (str.length > 200) {
    const keys = typeof payload === 'object' && payload !== null ? Object.keys(payload) : []
    return \`{ ...truncated (\${keys.length} keys) }\`
  }
  return str
}

export function summarizeValue(val: unknown): string {
  if (val && typeof val === 'object' && !Array.isArray(val) && 'id' in val) return JSON.stringify((val as { id: string }).id)
  if (Array.isArray(val) && val.length > 5) return \`[\${val.slice(0, 3).map(v => JSON.stringify(v)).join(', ')}, ...(\${val.length})]\`
  return JSON.stringify(val)
}

function formatDiff(diff: StoreDiff[]): string {
  if (diff.length === 0) return '(no change)'
  return diff
    .map((d) => {
      if (d.kind === 'added') return \`∆ \${d.path}: +\${summarizeValue(d.after)}\`
      if (d.kind === 'removed') return \`∆ \${d.path}: -\${summarizeValue(d.before)}\`
      return \`∆ \${d.path}: \${summarizeValue(d.before)} → \${summarizeValue(d.after)}\`
    })
    .join(' | ')
}

export const defaultLogger: Logger = (entry) => {
  if (entry.kind === 'unhandled-key') {
    console.log(\`[unhandled-key #\${entry.seq}] \${entry.modifiers}\${entry.key} (\${entry.code})\`)
    return
  }

  const indent = entry.parent != null ? '  ' : ''
  const prefix = \`\${indent}[dispatch #\${entry.seq}]\`

  if (entry.error) {
    console.log(\`\${prefix} ERROR \${entry.type} | \${truncatePayload(entry.payload)} | "\${entry.error}" | (rollback)\`)
    return
  }

  const from = entry.originalType ? \` (from: \${entry.originalType})\` : ''
  console.log(\`\${prefix} \${entry.type}\${from} | \${truncatePayload(entry.payload)} | \${formatDiff(entry.diff)}\`)
}

`;export{e as default};