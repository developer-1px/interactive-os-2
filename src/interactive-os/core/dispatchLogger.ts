import type { Command, BatchCommand } from './types'
import type { StoreDiff } from './computeStoreDiff'

export interface LogEntry {
  seq: number
  type: string
  payload: unknown
  diff: StoreDiff[]
  parent?: number
  error?: string
}

export type Logger = (entry: LogEntry) => void

export interface EngineOptions {
  logger?: boolean | Logger
}

function truncatePayload(payload: unknown): string {
  const str = JSON.stringify(payload)
  if (str && str.length > 200) {
    const keys = typeof payload === 'object' && payload !== null ? Object.keys(payload) : []
    return `{ ...truncated (${keys.length} keys) }`
  }
  return str ?? 'undefined'
}

export function summarizeValue(val: unknown): string {
  if (val && typeof val === 'object' && !Array.isArray(val) && 'id' in val) return JSON.stringify((val as { id: string }).id)
  if (Array.isArray(val) && val.length > 5) return `[${val.slice(0, 3).map(v => JSON.stringify(v)).join(', ')}, ...(${val.length})]`
  return JSON.stringify(val)
}

function formatDiff(diff: StoreDiff[]): string {
  if (diff.length === 0) return '(no change)'
  return diff
    .map((d) => {
      if (d.kind === 'added') return `∆ ${d.path}: +${summarizeValue(d.after)}`
      if (d.kind === 'removed') return `∆ ${d.path}: -${summarizeValue(d.before)}`
      return `∆ ${d.path}: ${summarizeValue(d.before)} → ${summarizeValue(d.after)}`
    })
    .join(' | ')
}

export const defaultLogger: Logger = (entry) => {
  const indent = entry.parent != null ? '  ' : ''
  const prefix = `${indent}[dispatch #${entry.seq}]`

  if (entry.error) {
    console.log(`${prefix} ERROR ${entry.type} | ${truncatePayload(entry.payload)} | "${entry.error}" | (rollback)`)
    return
  }

  console.log(`${prefix} ${entry.type} | ${truncatePayload(entry.payload)} | ${formatDiff(entry.diff)}`)
}

export function isBatchCommand(cmd: Command): cmd is BatchCommand {
  return cmd.type === 'batch' && 'commands' in cmd
}
