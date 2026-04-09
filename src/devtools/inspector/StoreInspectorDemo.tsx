import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { ChevronDown, ChevronRight, Folder, File } from 'lucide-react'
import { Up, Down, Left, Right } from '../../pages/shared/kbdIcons'
import type { NormalizedData } from '@os/store/types'
import type { Plugin } from '@os/plugins/types'
import type { NodeState } from '@os/pattern/types'
import { key } from '@os/axis/types'
import type { KeyHandler } from '@os/axis/types'
import type { LogEntry } from '@os/engine/logger'
import { ax } from '@styles/ax'
import { Aria } from '@os/primitives/aria'
import { TreeView } from '@os/ui/TreeView'
import { renderInspectorItem } from './renderInspectorItem'
import { tree } from '@os/pattern/roles/tree'
import { history } from '@os/plugins/history'
import { crud, crudCommands } from '@os/plugins/crud'
import { dnd, dndCommands } from '@os/plugins/dnd'
import { focusRecovery } from '@os/plugins/focusRecovery'
import { storeToInspectorTree } from '@os/store/storeToInspectorTree'
import { treeData } from '../../pages/shared/sharedTreeData'
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
      <span className={ax({ opacity: 'faint', textStyle: 'caption' })}>{type === 'folder' ? <Folder size={12} /> : <File size={12} />}</span>
      <span>{name}</span>
    </div>
  )
}

// --- Log diff formatter ---

function formatDiffSummary(entry: LogEntry): string {
  if (entry.kind === 'unhandled-key') return `${entry.modifiers}${entry.key} (${entry.code})`
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

export default function StoreInspectorDemo() {
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
    <>
      <div className={`page-keys ${ax({ layout: 'wrap' })}`}>
        <kbd><Up /><Down /></kbd> <span className="key-hint">navigate</span>{' '}
        <kbd><Left /><Right /></kbd> <span className="key-hint">expand/collapse</span>{' '}
        <kbd>Enter</kbd> <span className="key-hint">create child</span>{' '}
        <kbd>Del</kbd> <span className="key-hint">delete</span>{' '}
        <kbd>Alt+<Up /><Down /></kbd> <span className="key-hint">move</span>{' '}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>{' '}
        <kbd>⌘⇧Z</kbd> <span className="key-hint">redo</span>
      </div>

      <div className={`card ${ax({ scroll: 'hidden' })}`}>
        <div className={`store-inspector-split grid`}>

          {/* Editor panel */}
          <div className={ax({ scroll: 'auto' })}>
            <div className={`${ax({ textStyle: 'caption', opacity: 'faint' })} store-inspector-panel-label`}>Editor</div>
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
          <div className={ax({ scroll: 'auto' })}>
            <div className={`${ax({ textStyle: 'caption', opacity: 'faint' })} store-inspector-panel-label`}>Inspector — NormalizedData</div>
            <TreeView
              data={inspectorData}
              plugins={inspectorPlugins}
              renderItem={renderInspectorItem}
              aria-label="Store inspector"
            />
          </div>

          {/* Log panel */}
          <div
            className={`${ax({ scroll: 'y' })} store-inspector-log`}
            ref={logRef}
            aria-label="Operation Log"
          >
            <div className={`${ax({ textStyle: 'caption', opacity: 'faint' })} store-inspector-panel-label`}>Operation Log</div>
            {log.length === 0 ? (
              <div className={ax({ opacity: 'faint' })}>Interact with the editor to see operations here.</div>
            ) : (
              log.map((entry) => (
                <div
                  key={entry.seq}
                  className={`${ax({ opacity: 'dim', clamp: '1' })} store-inspector-log-entry${entry.kind !== 'unhandled-key' && entry.parent != null ? ` ${ax({ padding: 'md' })}` : ''}`}
                  {...(entry.kind !== 'unhandled-key' && entry.parent != null ? { 'data-batch-child': '' } : {})}
                >
                  <span className={ax({ text: 'muted' })}>#{entry.seq}</span>{' '}
                  {entry.kind === 'unhandled-key' ? (
                    <>
                      <span className={ax({ tone: 'warning-dim' })}>unhandled</span>{' '}
                      <span className={ax({ tone: 'warning-dim' })}>| {formatDiffSummary(entry)}</span>
                    </>
                  ) : (
                    <>
                      <span>{entry.type}</span>{' '}
                      <span className="store-inspector-log-diff">| {formatDiffSummary(entry)}</span>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </>
  )
}
