import type React from 'react'
import { useState } from 'react'
import { Up, Down } from './kbdIcons'
import { ListBox } from '../interactive-os/ui/ListBox'
import { createStore } from '../interactive-os/store/createStore'
import { ROOT_ID } from '../interactive-os/store/types'
import type { NormalizedData } from '../interactive-os/store/types'
import type { Command, Middleware } from '../interactive-os/engine/types'
import type { NodeState } from '../interactive-os/pattern/types'
import { core } from '../interactive-os/plugins/core'
import { crud } from '../interactive-os/plugins/crud'
import { history } from '../interactive-os/plugins/history'
import { focusRecovery } from '../interactive-os/plugins/focusRecovery'
import { definePlugin } from '../interactive-os/plugins/definePlugin'

const MAX_LOG_ENTRIES = 30

interface DispatchEntry {
  seq: number
  type: string
  payload: string
  middlewares: string[]
}

const initialData = createStore({
  entities: {
    a: { id: 'a', data: { label: 'Alpha' } },
    b: { id: 'b', data: { label: 'Beta' } },
    c: { id: 'c', data: { label: 'Gamma' } },
  },
  relationships: {
    [ROOT_ID]: ['a', 'b', 'c'],
  },
})

function truncate(str: string, max = 60): string {
  return str.length > max ? str.slice(0, max) + '…' : str
}

interface MutableBox<T> { current: T }

function createTracingMiddleware(name: string, trace: MutableBox<string[]>): Middleware {
  return (next) => (command: Command) => {
    trace.current.push(name)
    next(command)
  }
}

function createPlugins(
  seqBox: MutableBox<number>,
  traceBox: MutableBox<string[]>,
  setEntries: React.Dispatch<React.SetStateAction<DispatchEntry[]>>,
) {
  const recorder = definePlugin({
    name: 'recorder',
    middleware: (next: (command: Command) => void) => (command: Command) => {
      traceBox.current = []
      next(command)
      seqBox.current++
      setEntries((prev) => [...prev.slice(-(MAX_LOG_ENTRIES - 1)), {
        seq: seqBox.current,
        type: command.type,
        payload: truncate(JSON.stringify(command.payload)),
        middlewares: [...traceBox.current],
      }])
    },
  })
  const traceHistory = definePlugin({
    name: 'trace:history',
    middleware: createTracingMiddleware('history', traceBox),
  })
  const traceFocusRecovery = definePlugin({
    name: 'trace:focusRecovery',
    middleware: createTracingMiddleware('focusRecovery', traceBox),
  })
  return [recorder, core(), crud(), traceHistory, history(), traceFocusRecovery, focusRecovery()]
}

export default function EngineCommandDemo() {
  const [data, setData] = useState<NormalizedData>(initialData)
  const [entries, setEntries] = useState<DispatchEntry[]>([])
  const [state] = useState(() => {
    const seqBox: MutableBox<number> = { current: 0 }
    const traceBox: MutableBox<string[]> = { current: [] }
    return { seqBox, traceBox, plugins: createPlugins(seqBox, traceBox, setEntries) }
  })
  const plugins = state.plugins

  return (
    <>
      <div className="page-keys">
        <kbd><Up /><Down /></kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>Enter</kbd> <span className="key-hint">create</span>{' '}
        <kbd>Del</kbd> <span className="key-hint">delete</span>{' '}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>{' '}
        <kbd>⌘⇧Z</kbd> <span className="key-hint">redo</span>
      </div>
      <div className="card">
        <ListBox
          data={data}
          onChange={setData}
          plugins={plugins}
          renderItem={(props, item, state: NodeState) => {
            const d = item.data as Record<string, unknown>
            const cls = [
              'list-item',
              state.focused && 'list-item--focused',
              state.selected && !state.focused && 'list-item--selected',
            ].filter(Boolean).join(' ')
            return (
              <div {...props} className={cls}>
                <span className="list-item__label">{d?.label as string}</span>
              </div>
            )
          }}
        />
      </div>

      <div className="page-section">
        <h3 className="page-section-title">Dispatch Log ({entries.length})</h3>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 'var(--type-caption-size)', lineHeight: 1.8, maxHeight: '240px', overflow: 'auto' }}>
          {entries.length === 0 ? (
            <span style={{ opacity: 0.5 }}>Interact with the list to see dispatched commands…</span>
          ) : (
            entries.map((e) => (
              <div key={e.seq} style={{ borderBottom: '1px solid var(--color-border, rgba(128,128,128,0.15))' }}>
                <span style={{ opacity: 0.4, marginRight: '6px' }}>#{e.seq}</span>
                <span style={{ color: 'var(--color-primary, #6366f1)', fontWeight: 600 }}>{e.type}</span>
                <span style={{ opacity: 0.5, marginLeft: '8px' }}>{e.payload}</span>
                {e.middlewares.length > 0 && (
                  <span style={{ opacity: 0.35, marginLeft: '8px' }}>
                    via {e.middlewares.join(' → ')}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
