var e=`/* eslint-disable react-hooks/refs */
// @useState-hatch
import type React from 'react'
import { useState, useRef } from 'react'
import { ax } from '@styles/ax'
import { ScrollArea } from '@os/ui/ScrollArea'
import { Up, Down } from '../shared/kbdIcons'
import { ListBox } from '@os/ui/ListBox'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import { useStore } from '@os/store/useStore'
import type { Command, Middleware } from '@os/engine/types'
import { crud } from '@os/plugins/crud'
import { history } from '@os/plugins/history'
import { focusRecovery } from '@os/plugins/focusRecovery'
import { definePlugin } from '@os/plugins/definePlugin'

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
  return [recorder, crud(), traceHistory, history(), traceFocusRecovery, focusRecovery()]
}

export default function EngineCommandDemo() {
  const [data, setData] = useStore(initialData)
  // @useState-hatch — entries is a growing demo log
  const [entries, setEntries] = useState<DispatchEntry[]>([])
  const stateRef = useRef<{ seqBox: MutableBox<number>; traceBox: MutableBox<string[]>; plugins: ReturnType<typeof createPlugins> } | null>(null)
  if (!stateRef.current) {
    const seqBox: MutableBox<number> = { current: 0 }
    const traceBox: MutableBox<string[]> = { current: [] }
    stateRef.current = { seqBox, traceBox, plugins: createPlugins(seqBox, traceBox, setEntries) }
  }
  const plugins = stateRef.current.plugins

  return (
    <>
      <div className={\`page-keys \${ax({ layout: 'wrap' })}\`}>
        <kbd><Up /><Down /></kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>Enter</kbd> <span className="key-hint">create</span>{' '}
        <kbd>Del</kbd> <span className="key-hint">delete</span>{' '}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>{' '}
        <kbd>⌘⇧Z</kbd> <span className="key-hint">redo</span>
      </div>
      <div className={\`card \${ax({ scroll: 'hidden' })}\`}>
        <ListBox
          data={data}
          onChange={setData}
          plugins={plugins}
        />
      </div>

      <div className="page-section">
        <h3 className="page-section-title">Dispatch Log ({entries.length})</h3>
        <ScrollArea className={ax({ textStyle: 'code' })}>
          {entries.length === 0 ? (
            <span className="op-dim">Interact with the list to see dispatched commands…</span>
          ) : (
            entries.map((e) => (
              <div key={e.seq} className="debug-log-entry">
                <span className="op-faint">#{e.seq}</span>{' '}
                <span className={ax({ tone: 'accent', weight: 'semi' })}>{e.type}</span>{' '}
                <span className="op-dim">{e.payload}</span>
                {e.middlewares.length > 0 && (
                  <span className="op-faint">
                    {' '}via {e.middlewares.join(' → ')}
                  </span>
                )}
              </div>
            ))
          )}
        </ScrollArea>
      </div>
    </>
  )
}
`;export{e as default};