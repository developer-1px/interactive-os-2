import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import type { NormalizedData } from '../interactive-os/store/types'
import type { Command } from '../interactive-os/engine/types'
import type { Plugin } from '../interactive-os/plugins/types'
import type { PatternContext, NodeState } from '../interactive-os/pattern/types'
import type { LogEntry } from '../interactive-os/engine/dispatchLogger'
import { Aria } from '../interactive-os/primitives/aria'
import { TreeView } from '../interactive-os/ui/TreeView'
import { tree } from '../interactive-os/pattern/tree'
import { core } from '../interactive-os/plugins/core'
import { history } from '../interactive-os/plugins/history'
import { crud, crudCommands } from '../interactive-os/plugins/crud'
import { dnd, dndCommands } from '../interactive-os/plugins/dnd'
import { focusRecovery } from '../interactive-os/plugins/focusRecovery'
import { storeToTree } from '../interactive-os/store/storeToTree'
import { treeData } from './shared-tree-data'
import styles from './PageStoreInspector.module.css'

// --- Stateless module-level constants ---

const inspectorPlugins: Plugin[] = [core()]

const editorKeyMap: Record<string, (ctx: PatternContext) => Command | void> = {
  'Delete': (ctx) => crudCommands.remove(ctx.focused),
  'Alt+ArrowUp': (ctx) => dndCommands.moveUp(ctx.focused),
  'Alt+ArrowDown': (ctx) => dndCommands.moveDown(ctx.focused),
}

function makeEditorPlugins(): { plugins: Plugin[]; keyMap: Record<string, (ctx: PatternContext) => Command | void> } {
  let nodeCounter = 0
  const createKeyMap: Record<string, (ctx: PatternContext) => Command> = {
    'Enter': (ctx) => {
      const id = `node-${++nodeCounter}`
      return crudCommands.create(
        { id, data: { name: `New Item ${nodeCounter}`, type: 'file' } },
        ctx.focused || undefined,
      )
    },
  }
  return {
    plugins: [core(), crud(), dnd(), history(), focusRecovery()],
    keyMap: { ...editorKeyMap, ...createKeyMap },
  }
}

// --- Inspector render helpers ---

const TYPE_COLORS: Record<string, string> = {
  meta: '#f59e0b',
  entity: '#3b82f6',
  rel: '#8b5cf6',
}

function truncate(str: string, max = 60): string {
  if (!str || str.length <= max) return str
  return str.slice(0, max) + '…'
}

function renderInspectorItem(props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState) {
  const d = node.data as Record<string, unknown>
  const type = d?.type as string
  const label = d?.label as string
  const value = d?.value as string | undefined
  const count = d?.count as number | undefined
  const indent = ((state.level ?? 1) - 1) * 16

  const isGroup = type === 'group'

  return (
    <div
      {...props}
      style={{
        paddingLeft: `calc(var(--space-sm) + ${indent}px)`,
        paddingTop: 2,
        paddingBottom: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'var(--mono)',
        fontSize: 'var(--text-sm)',
        opacity: state.focused ? 1 : 0.85,
        background: state.focused ? 'var(--bg-hover)' : undefined,
        outline: state.focused ? '1.5px solid var(--focus)' : undefined,
        cursor: 'default',
      }}
    >
      {isGroup ? (
        <>
          <span style={{ opacity: 0.6, fontSize: 'var(--text-xs)' }}>
            {state.expanded ? '▾' : '▸'}
          </span>
          <span style={{ fontWeight: 600 }}>{label}</span>
          {count !== undefined && (
            <span style={{ opacity: 0.5, fontSize: 'var(--text-xs)' }}>({count})</span>
          )}
        </>
      ) : (
        <>
          <span style={{ opacity: 0.3, fontSize: 'var(--text-xs)' }}>·</span>
          <span style={{ color: TYPE_COLORS[type] ?? 'inherit', fontSize: 'var(--text-xs)', opacity: 0.8 }}>
            {type}
          </span>
          <span>{label}</span>
          {value && (
            <span style={{ opacity: 0.5, fontSize: 'var(--text-xs)' }}>
              {truncate(value)}
            </span>
          )}
        </>
      )}
    </div>
  )
}

// --- Editor render ---

function renderEditorItem(props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState) {
  const d = node.data as Record<string, unknown>
  const name = d?.name as string
  const type = d?.type as string
  const indent = ((state.level ?? 1) - 1) * 18
  const hasChildren = state.expanded !== undefined

  return (
    <div
      {...props}
      style={{
        paddingLeft: `calc(var(--space-md) + ${indent}px)`,
        paddingTop: 3,
        paddingBottom: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'var(--mono)',
        fontSize: 'var(--text-sm)',
        background: state.focused ? 'var(--bg-hover)' : undefined,
        outline: state.focused ? '1.5px solid var(--focus)' : undefined,
      }}
    >
      <span style={{ opacity: 0.5, width: 10, textAlign: 'center' }}>
        {hasChildren ? (state.expanded ? '▾' : '▸') : ''}
      </span>
      <span style={{ opacity: 0.4, fontSize: 'var(--text-xs)' }}>{type === 'folder' ? '📁' : '📄'}</span>
      <span>{name}</span>
    </div>
  )
}

// --- Log diff formatter ---

function formatDiffSummary(entry: LogEntry): string {
  if (entry.error) return `ERROR: ${entry.error}`
  if (entry.diff.length === 0) return '(no change)'
  return entry.diff
    .slice(0, 3)
    .map((d) => {
      if (d.kind === 'added') return `+${d.path}`
      if (d.kind === 'removed') return `-${d.path}`
      return `~${d.path}`
    })
    .join(' | ') + (entry.diff.length > 3 ? ` … +${entry.diff.length - 3} more` : '')
}

// --- Page component ---

export default function PageStoreInspector() {
  const [data, setData] = useState<NormalizedData>(treeData)
  const [log, setLog] = useState<LogEntry[]>([])
  const logRef = useRef<HTMLDivElement>(null)
  const editor = useMemo(() => makeEditorPlugins(), [])

  const captureLogger = useCallback((entry: LogEntry) => {
    setLog((prev) => {
      const next = [...prev, entry]
      return next.length > 50 ? next.slice(next.length - 50) : next
    })
  }, [])

  const inspectorData = useMemo(() => storeToTree(data), [data])

  // Auto-scroll log to bottom
  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [log])

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Store Inspector</h2>
        <p className="page-desc">
          Live view of NormalizedData structure. Editor (left) uses treegrid + crud + dnd + history.
          Inspector (right) shows the raw store via storeToTree transform. Log (bottom) captures dispatched commands.
        </p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>←→</kbd> <span className="key-hint">expand/collapse</span>{' '}
        <kbd>Enter</kbd> <span className="key-hint">create child</span>{' '}
        <kbd>Del</kbd> <span className="key-hint">delete</span>{' '}
        <kbd>Alt+↑↓</kbd> <span className="key-hint">move</span>{' '}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>{' '}
        <kbd>⌘⇧Z</kbd> <span className="key-hint">redo</span>
      </div>

      <div className="card">
        <div className={styles.splitContainer}>

          {/* Editor panel */}
          <div className={styles.panel}>
            <div className={styles.panelLabel}>Editor</div>
            <Aria
              behavior={tree}
              data={data}
              plugins={editor.plugins}
              keyMap={editor.keyMap}
              onChange={setData}
              logger={captureLogger}
              aria-label="Store editor"
            >
              <Aria.Item render={renderEditorItem} />
            </Aria>
          </div>

          {/* Inspector panel */}
          <div className={styles.panel}>
            <div className={styles.panelLabel}>Inspector — NormalizedData</div>
            <TreeView
              data={inspectorData}
              plugins={inspectorPlugins}
              renderItem={renderInspectorItem}
              aria-label="Store inspector"
            />
          </div>

          {/* Log panel */}
          <div
            className={styles.logPanel}
            ref={logRef}
            aria-label="Operation Log"
          >
            <div className={styles.panelLabel}>Operation Log</div>
            {log.length === 0 ? (
              <div style={{ opacity: 0.4 }}>Interact with the editor to see operations here.</div>
            ) : (
              log.map((entry) => (
                <div
                  key={entry.seq}
                  className={styles.logEntry}
                  {...(entry.parent != null ? { 'data-batch-child': '' } : {})}
                >
                  <span style={{ opacity: 0.5 }}>#{entry.seq}</span>{' '}
                  <span>{entry.type}</span>{' '}
                  <span className={styles.logDiff}>| {formatDiffSummary(entry)}</span>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
