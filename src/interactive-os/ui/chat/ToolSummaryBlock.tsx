// ② 2026-04-03-command-unification-prd.md
import { useMemo } from 'react'
import {
  FileText, Terminal, Pencil, FilePlus,
  Search, Zap, Wrench, Globe, Layers,
} from 'lucide-react'
import { ExpandIndicator } from '../indicators/ExpandIndicator'
import { CodeBlock } from '../CodeBlock'
import { DiffBlock } from './DiffBlock'
import { ax } from '@styles/ax'
import '@styles/ax.css'
import { useChatFeatures } from './chatFeatures'
import { useDisclosure } from './useDisclosure'
import styles from './ToolSummaryBlock.module.css'
import type { DataBlock } from './types'

const toolIcons: Record<string, typeof Wrench> = {
  Read: FileText, Edit: Pencil, Write: FilePlus,
  Bash: Terminal, Grep: Search, Glob: Search,
  Skill: Zap, WebSearch: Globe, WebFetch: Globe,
}

function FilePathLink({ path, children }: { path: string; children: React.ReactNode }) {
  const open = () => window.dispatchEvent(new CustomEvent('inspector:open-source', { detail: { fileName: path } }))
  return (
    <span
      className={`${ax({ text: 'muted', clamp: '1', shape: 'sm' })} ${styles.toolDetail} ${styles.filePathLink}`}
      role="button"
      tabIndex={0}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); open() }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open() } }}
    >
      {children}
    </span>
  )
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
    <div className={`${ax({ layout: 'bar', textStyle: 'caption', text: 'secondary' })} ${styles.toolRow}`}>
      <span className={`${ax({ layout: 'center' })} ${styles.rowIcon}`}><Icon size={12} /></span>
      <span><span className={ax({ weight: 'semi' })}>{name}</span>{detail ? ' ' : ''}<span className={`${ax({ text: 'muted', clamp: '1' })} ${styles.toolDetail}`}>{detail}</span></span>
    </div>
  )
}

// --- Standalone tool_result (no tool_use context) ---

export function ToolResultBlock({ block }: { block: DataBlock }) {
  const { expandByDefault, isLatest } = useChatFeatures()
  const { expanded, toggle, toggleProps } = useDisclosure({
    initialOpen: isLatest || expandByDefault,
    isLatest,
  })

  const text = extractResultText(block)

  if (!text) return null

  const lines = text.split('\n')
  const preview = lines[0].slice(0, 120)
  const isLong = lines.length > 3 || text.length > 200

  if (!isLong) {
    return <pre className={`${ax({ text: 'muted', textStyle: 'code', padding: 'sm' })} ${styles.toolResult}`}>{text}</pre>
  }

  return (
    <div>
      <div
        {...toggleProps}
        className={`${ax({ layout: 'bar', textStyle: 'code', text: 'muted' })} ${styles.toolResultSummary}`}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onClick={toggle}
      >
        <ExpandIndicator variant="expand" expanded={expanded} />
        <span className={`${ax({ clamp: '1' })} ${styles.toolResultPreview}`}>{preview}{lines.length > 1 ? ` (+${lines.length - 1} lines)` : ''}</span>
      </div>
      {expanded && <pre className={`${ax({ text: 'muted', textStyle: 'code', padding: 'sm' })} ${styles.toolResult}`}>{text}</pre>}
    </div>
  )
}

// --- Line range label from Read input ---

function formatReadRange(input: Record<string, unknown>, lineCount: number): string {
  const offset = typeof input.offset === 'number' ? input.offset : 0
  const start = offset || 1
  const end = start + lineCount - 1
  return `L${start}–${end} (${lineCount} lines)`
}

// --- Unified ToolGroup: single 1-tier collapsible card ---

export function ToolGroup({ toolUse, toolResult }: { toolUse: DataBlock; toolResult?: DataBlock }) {
  const { expandByDefault, isLatest } = useChatFeatures()
  const { name, detail, input } = useMemo(() => getToolMeta(toolUse), [toolUse])
  const Icon = toolIcons[name] ?? Wrench

  const text = useMemo(() => toolResult ? extractResultText(toolResult) : '', [toolResult])
  const lines = useMemo(() => text ? text.split('\n') : [], [text])

  const isRead = name === 'Read'
  const isWrite = name === 'Write'
  const isEdit = name === 'Edit'
  const isCodeResult = (isRead || isEdit || isWrite) && !!input.file_path
  const filename = isCodeResult ? String(input.file_path).split('/').pop() ?? 'file.txt' : ''
  const codeText = useMemo(() => isCodeResult ? stripLineNumbers(text) : text, [isCodeResult, text])

  const { expanded, toggle, toggleProps } = useDisclosure({
    initialOpen: isLatest ? true : (isRead || isWrite ? false : expandByDefault),
    isLatest,
  })

  // --- Summary label (single line, tool-specific) ---
  let summaryLabel: React.ReactNode
  if (isRead && text) {
    const range = formatReadRange(input, lines.length)
    summaryLabel = <FilePathLink path={String(input.file_path)}>{detail} · {range}</FilePathLink>
  } else if (isWrite && typeof input.content === 'string') {
    const lineCount = (input.content as string).split('\n').length
    summaryLabel = <FilePathLink path={String(input.file_path)}>{detail} ({lineCount} lines)</FilePathLink>
  } else if (isEdit && input.file_path) {
    summaryLabel = <FilePathLink path={String(input.file_path)}>{detail}</FilePathLink>
  } else {
    summaryLabel = detail ? <span className={`${ax({ text: 'muted', clamp: '1' })} ${styles.toolDetail}`}>{detail}</span> : null
  }

  // --- Content (no duplicate info — summary is the sole source) ---
  let content: React.ReactNode = null
  if (isRead && text) {
    content = (
      <div className={`${ax({ border: 'top' })} ${styles.toolGroupCode}`}>
        <CodeBlock code={codeText} filename={filename} variant="compact" />
      </div>
    )
  } else if (isWrite && typeof input.content === 'string') {
    content = (
      <div className={`${ax({ border: 'top' })} ${styles.toolGroupCode}`}>
        <CodeBlock code={input.content as string} filename={filename} variant="compact" />
      </div>
    )
  } else if (isEdit && typeof input.old_string === 'string' && typeof input.new_string === 'string') {
    content = (
      <DiffBlock block={{ type: 'diff', old: input.old_string as string, new: input.new_string as string }} />
    )
  } else if (text) {
    content = <pre className={`${ax({ text: 'muted', textStyle: 'code', padding: 'sm', border: 'top' })} ${styles.toolGroupResult}`}>{text}</pre>
  }

  // No content → non-collapsible row
  if (!content) {
    return (
      <div className={`${ax({ shape: 'md', border: 'subtle', surface: 'sunken' })} ${styles.toolGroup}`}>
        <div className={`${ax({ layout: 'bar', text: 'secondary', gap: 'xs' })} ${styles.toolGroupSummary}`}>
          <span className={`${ax({ layout: 'center' })} ${styles.rowIcon}`}><Icon size={12} /></span>
          <span className={ax({ weight: 'semi' })}>{name}</span> {summaryLabel}
        </div>
      </div>
    )
  }

  return (
    <div className={`${ax({ shape: 'md', border: 'subtle', surface: 'sunken' })} ${styles.toolGroup}`}>
      <div
        {...toggleProps}
        className={`${ax({ layout: 'bar', text: 'secondary', gap: 'xs' })} ${styles.toolGroupSummary}`}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onClick={toggle}
      >
        <span className={`${ax({ layout: 'center' })} ${styles.rowIcon}`}><ExpandIndicator variant="expand" expanded={expanded} /></span>
        <Icon size={12} /> <span className={ax({ weight: 'semi' })}>{name}</span> {summaryLabel}
      </div>
      {expanded && content}
    </div>
  )
}

// --- ToolChainGroup: collapsed group of process tools ---

interface ToolPair { toolUse: DataBlock; toolResult?: DataBlock }

interface ToolTypeGroup { name: string; details: string[] }

function groupByToolType(pairs: ToolPair[]): ToolTypeGroup[] {
  const map = new Map<string, string[]>()
  const order: string[] = []
  for (const pair of pairs) {
    const { name, detail } = getToolMeta(pair.toolUse)
    if (!map.has(name)) { map.set(name, []); order.push(name) }
    if (detail) map.get(name)!.push(detail)
  }
  return order.map(name => ({ name, details: map.get(name)! }))
}

function buildChainSummary(groups: ToolTypeGroup[]): string {
  return groups
    .map(g => g.details.length > 1 ? `${g.name} ${g.details.length}` : g.name)
    .join(', ')
}

export function ToolChainGroup({ pairs }: { pairs: ToolPair[] }) {
  const { isLatest } = useChatFeatures()
  const { expanded, toggle, toggleProps } = useDisclosure({
    initialOpen: isLatest,
    isLatest,
  })

  const typeGroups = useMemo(() => groupByToolType(pairs), [pairs])
  const summary = useMemo(() => buildChainSummary(typeGroups), [typeGroups])

  return (
    <div className={`${ax({ shape: 'md', border: 'subtle', surface: 'sunken' })} ${styles.toolChain}`}>
      <div
        {...toggleProps}
        className={`${ax({ layout: 'bar', text: 'secondary', gap: 'xs' })} ${styles.toolChainSummary}`}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onClick={toggle}
      >
        <span className={`${ax({ layout: 'center' })} ${styles.rowIcon}`}><ExpandIndicator variant="expand" expanded={expanded} /></span>
        <Layers size={12} /> <span className={ax({ text: 'muted', textStyle: 'code' })}>{summary}</span>
      </div>
      {expanded && (
        <div className={`${ax({ layout: 'column', border: 'top' })} ${styles.toolChainContent}`}>
          {typeGroups.map(g => {
            const Icon = toolIcons[g.name] ?? Wrench
            return (
              <div key={g.name} className={`${ax({ layout: 'bar', text: 'secondary', gap: 'xs' })} ${styles.toolChainRow}`}>
                <span className={`${ax({ layout: 'center' })} ${styles.rowIcon}`}><Icon size={12} /></span>
                <span className={ax({ weight: 'semi' })}>{g.name}</span>
                <span className={`${ax({ text: 'muted', textStyle: 'code', clamp: '1' })} ${styles.toolChainDetails}`}>
                  {g.details.join(' · ')}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
