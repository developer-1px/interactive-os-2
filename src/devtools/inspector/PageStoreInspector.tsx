import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Up, Down, Left, Right } from '../../pages/shared/kbdIcons'
import type { NormalizedData } from '@os/store/types'
import type { Plugin } from '@os/plugins/types'
import type { NodeState } from '@os/pattern/types'
import { key } from '@os/axis/types'
import type { KeyHandler } from '@os/axis/types'
import type { LogEntry } from '@os/engine/logger'
import { Aria } from '@os/primitives/aria'
import { TreeView } from '@os/ui/TreeView'
import { tree } from '@os/pattern/roles/tree'
import { history } from '@os/plugins/history'
import { crud, crudCommands } from '@os/plugins/crud'
import { dnd, dndCommands } from '@os/plugins/dnd'
import { focusRecovery } from '@os/plugins/focusRecovery'
import { storeToInspectorTree } from '@os/store/storeToInspectorTree'
import { treeData } from '../../pages/shared/sharedTreeData'
import { renderInspectorItem } from './renderInspectorItem'
import { ax } from '@styles/ax'
import './PageStoreInspector.css'

// --- Stateless module-level constants ---

const inspectorPlugins: Plugin[] = []

const editorKeyMap: Record<string, KeyHandler> = {
  'Delete': key(['crud:remove'], (ctx) => crudCommands.remove(ctx.focused)),
  'Alt+ArrowUp': key(['dnd:moveUp'], (ctx) => dndCommands.moveUp(ctx.focused)),
  'Alt+ArrowDown': key(['dnd:moveDown'], (ctx) => dndCommands.moveDown(ctx.focused)),
}

function makeEditorPlugins(): { plugins: Plugin[]; keyMap: Record<string, KeyHandler> } {
  let nodeCounter = 0
  const createKeyMap: Record<string, KeyHandler> = {
    'Enter': key(['crud:create'], (ctx) => {
      const id = `node-${++nodeCounter}`
      return crudCommands.create(
        { id, data: { name: `New Item ${nodeCounter}`, type: 'file' } },
        ctx.focused || undefined,
      )
    }),
  }
  return {
    plugins: [crud(), dnd(), history(), focusRecovery()],
    keyMap: { ...editorKeyMap, ...createKeyMap },
  }
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
        fontSize: 'var(--type-body-size)',
        background: state.focused ? 'var(--bg-hover)' : undefined,
        outline: state.focused ? '1.5px solid var(--focus)' : undefined,
      }}
    >
      <span style={{ opacity: 0.5, width: 10, textAlign: 'center' }}>
        {hasChildren ? (state.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : ''}
      </span>
      <span style={{ opacity: 0.4, fontSize: 'var(--type-caption-size)' }}>{type === 'folder' ? '📁' : '📄'}</span>
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

  const inspectorData = useMemo(() => storeToInspectorTree(data), [data])

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
          Inspector (right) shows the raw store via storeToInspectorTree transform. Log (bottom) captures dispatched commands.
        </p>
      </div>
      <div className="page-keys inline-flex flex-wrap items-center">
        <kbd><Up /><Down /></kbd> <span className="key-hint">navigate</span>{' '}
        <kbd><Left /><Right /></kbd> <span className="key-hint">expand/collapse</span>{' '}
        <kbd>Enter</kbd> <span className="key-hint">create child</span>{' '}
        <kbd>Del</kbd> <span className="key-hint">delete</span>{' '}
        <kbd>Alt+<Up /><Down /></kbd> <span className="key-hint">move</span>{' '}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>{' '}
        <kbd>⌘⇧Z</kbd> <span className="key-hint">redo</span>
      </div>

      <div className="card overflow-hidden">
        <div className={`${ax({ gap: 'md' })} store-inspector-split grid`}>

          {/* Editor panel */}
          <div className="min-h-0 overflow-auto">
            <div className={`${ax({ textStyle: 'caption' })} store-inspector-panel-label`}>Editor</div>
            <Aria
              pattern={tree}
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
          <div className="min-h-0 overflow-auto">
            <div className={`${ax({ textStyle: 'caption' })} store-inspector-panel-label`}>Inspector — NormalizedData</div>
            <TreeView
              data={inspectorData}
              plugins={inspectorPlugins}
              renderItem={renderInspectorItem}
              aria-label="Store inspector"
            />
          </div>

          {/* Log panel */}
          <div
            className={`${ax({ textStyle: 'caption', surface: 'sunken', shape: 'sm' })} store-inspector-log overflow-y-auto`}
            ref={logRef}
            aria-label="Operation Log"
          >
            <div className={`${ax({ textStyle: 'caption' })} store-inspector-panel-label`}>Operation Log</div>
            {log.length === 0 ? (
              <div style={{ opacity: 0.4 }}>Interact with the editor to see operations here.</div>
            ) : (
              log.map((entry) => (
                <div
                  key={entry.seq}
                  className="store-inspector-log-entry whitespace-nowrap"
                  {...(entry.parent != null ? { 'data-batch-child': '' } : {})}
                >
                  <span style={{ opacity: 0.5 }}>#{entry.seq}</span>{' '}
                  <span>{entry.type}</span>{' '}
                  <span className={ax({ tone: 'accent' })}>| {formatDiffSummary(entry)}</span>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
