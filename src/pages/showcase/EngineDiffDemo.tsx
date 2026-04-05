import { useState, useRef } from 'react'
import { ax } from '@styles/ax'
import { Up, Down } from '../shared/kbdIcons'
import { ListBox } from '@os/ui/ListBox'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import type { StoreDiff } from '@os/store/computeStoreDiff'
import { computeStoreDiff, applyDelta } from '@os/store/computeStoreDiff'
import type { NodeState } from '@os/pattern/types'
import { crud } from '@os/plugins/crud'
import { focusRecovery } from '@os/plugins/focusRecovery'
import { summarizeValue } from '@os/engine/logger'

interface DiffEntry {
  seq: number
  type: string
  diffs: StoreDiff[]
}

const MAX_LOG_ENTRIES = 30

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

function inferType(diffs: StoreDiff[]): string {
  for (const d of diffs) {
    if (d.path === 'entities' && d.kind === 'added') return 'add'
    if (d.path === 'entities' && d.kind === 'removed') return 'remove'
    if (d.path === 'entities' && d.kind === 'changed') return 'update'
  }
  const hasMetaFocus = diffs.some((d) => d.path.startsWith('__focus__'))
  const hasMetaSelection = diffs.some((d) => d.path.startsWith('__selection__'))
  const hasRelChange = diffs.some((d) => d.path !== 'entities' && !d.path.startsWith('__'))
  if (hasRelChange) return 'move'
  if (hasMetaFocus) return 'focus'
  if (hasMetaSelection) return 'select'
  return 'change'
}

export default function EngineDiffDemo() {
  const [data, setData] = useState<NormalizedData>(initialData)
  const [entries, setEntries] = useState<DiffEntry[]>([])
  const [selection, setSelection] = useState<{ seq: number; reversed: boolean } | null>(null)
  const seqRef = useRef(0)
  const [plugins] = useState(() => [crud(), focusRecovery()])
  const prevRef = useRef<NormalizedData>(initialData)

  const selectedEntry = selection ? entries.find((e) => e.seq === selection.seq) ?? null : null

  const handleChange = (newData: NormalizedData) => {
    const diffs = computeStoreDiff(prevRef.current, newData)
    prevRef.current = newData
    setData(newData)
    if (diffs.length > 0) {
      seqRef.current++
      const entry: DiffEntry = { seq: seqRef.current, type: inferType(diffs), diffs }
      setEntries((prev) => [...prev.slice(-(MAX_LOG_ENTRIES - 1)), entry])
      setSelection({ seq: seqRef.current, reversed: false })
    }
  }

  const handleReverse = () => {
    if (!selectedEntry || !selection) return
    const direction = selection.reversed ? 'forward' : 'reverse'
    const newData = applyDelta(data, selectedEntry.diffs, direction)
    prevRef.current = newData
    setData(newData)
    setSelection({ seq: selection.seq, reversed: !selection.reversed })
  }

  return (
    <>
      <div className="page-keys inline-flex flex-wrap items-center">
        <kbd><Up /><Down /></kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>Enter</kbd> <span className="key-hint">create</span>{' '}
        <kbd>Del</kbd> <span className="key-hint">delete</span>
      </div>
      <div className="card overflow-hidden">
        <ListBox
          data={data}
          onChange={handleChange}
          plugins={plugins}
          renderItem={(props, item, state: NodeState) => {
            const d = item.data as Record<string, unknown>
            const cls = [
              'list-item flex-row items-center justify-between',
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
        <h3 className="page-section-title">Diff Log ({entries.length})</h3>
        <div className={ax({ textStyle: 'code', layout: 'scroll' })}>
          {entries.length === 0 ? (
            <span className="op-dim">Interact with the list to generate diffs…</span>
          ) : (
            entries.map((e) => (
              <div
                key={e.seq}
                onClick={() => setSelection({ seq: e.seq, reversed: false })}
                className={`debug-log-entry ${selection?.seq === e.seq ? 'st-selected' : ''}`}
              >
                <span className="op-faint">#{e.seq}</span>{' '}
                <span className={ax({ weight: 'semi' })}>{e.type}</span>{' '}
                <span className="op-faint">{e.diffs.length} diff{e.diffs.length !== 1 ? 's' : ''}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedEntry && (
        <div className="page-section">
          <h3 className="page-section-title">
            #{selectedEntry.seq} — {selectedEntry.type}
            <button
              onClick={handleReverse}
              className={ax({ surface: 'ghost', controlSize: 'sm', shape: 'sm', textStyle: 'caption' })}
            >
              {selection?.reversed ? 'applyDelta(forward)' : 'applyDelta(reverse)'}
            </button>
          </h3>
          <div className={ax({ textStyle: 'code' })}>
            {selectedEntry.diffs.map((d, i) => (
              <div key={i} className={ax({ padding: 'xs' })}>
                <span className="op-dim">{d.path}</span>{' '}
                {d.kind === 'added' && (
                  <span className={ax({ text: 'success' })}>+{summarizeValue(d.after)}</span>
                )}
                {d.kind === 'removed' && (
                  <span className={ax({ text: 'danger' })}>-{summarizeValue(d.before)}</span>
                )}
                {d.kind === 'changed' && (
                  <>
                    <span className={ax({ text: 'danger' })}>{summarizeValue(d.before)}</span>
                    <span className="op-faint"> → </span>
                    <span className={ax({ text: 'success' })}>{summarizeValue(d.after)}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
