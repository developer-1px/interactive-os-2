import { useState, useRef } from 'react'
import { Up, Down } from './kbdIcons'
import { ListBox } from '../interactive-os/ui/ListBox'
import { createStore } from '../interactive-os/store/createStore'
import { ROOT_ID } from '../interactive-os/store/types'
import type { NormalizedData } from '../interactive-os/store/types'
import type { StoreDiff } from '../interactive-os/store/computeStoreDiff'
import { computeStoreDiff, applyDelta } from '../interactive-os/store/computeStoreDiff'
import type { NodeState } from '../interactive-os/pattern/types'
import { core } from '../interactive-os/plugins/core'
import { crud } from '../interactive-os/plugins/crud'
import { focusRecovery } from '../interactive-os/plugins/focusRecovery'
import { summarizeValue } from '../interactive-os/engine/dispatchLogger'

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
  const [plugins] = useState(() => [core(), crud(), focusRecovery()])
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
      <div className="page-keys">
        <kbd><Up /><Down /></kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>Enter</kbd> <span className="key-hint">create</span>{' '}
        <kbd>Del</kbd> <span className="key-hint">delete</span>
      </div>
      <div className="card">
        <ListBox
          data={data}
          onChange={handleChange}
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
        <h3 className="page-section-title">Diff Log ({entries.length})</h3>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 'var(--type-caption-size)', lineHeight: 1.8, maxHeight: '200px', overflow: 'auto' }}>
          {entries.length === 0 ? (
            <span style={{ opacity: 0.5 }}>Interact with the list to generate diffs…</span>
          ) : (
            entries.map((e) => (
              <div
                key={e.seq}
                onClick={() => setSelection({ seq: e.seq, reversed: false })}
                style={{
                  borderBottom: '1px solid var(--color-border, rgba(128,128,128,0.15))',
                  cursor: 'pointer',
                  background: selection?.seq === e.seq ? 'var(--color-surface-hover, rgba(128,128,128,0.08))' : undefined,
                  padding: '2px 4px',
                }}
              >
                <span style={{ opacity: 0.4, marginRight: '6px' }}>#{e.seq}</span>
                <span style={{ fontWeight: 600 }}>{e.type}</span>
                <span style={{ opacity: 0.4, marginLeft: '8px' }}>{e.diffs.length} diff{e.diffs.length !== 1 ? 's' : ''}</span>
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
              style={{
                marginLeft: 'var(--space-md)',
                fontSize: 'var(--type-caption-size)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid var(--color-border, rgba(128,128,128,0.3))',
                background: 'var(--color-surface, transparent)',
                cursor: 'pointer',
                color: 'inherit',
              }}
            >
              {selection?.reversed ? 'applyDelta(forward)' : 'applyDelta(reverse)'}
            </button>
          </h3>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 'var(--type-caption-size)', lineHeight: 1.8 }}>
            {selectedEntry.diffs.map((d, i) => (
              <div key={i} style={{ padding: '2px 0' }}>
                <span style={{ opacity: 0.5 }}>{d.path}</span>{' '}
                {d.kind === 'added' && (
                  <span style={{ color: 'var(--color-success, #22c55e)' }}>+{summarizeValue(d.after)}</span>
                )}
                {d.kind === 'removed' && (
                  <span style={{ color: 'var(--color-destructive, #ef4444)' }}>-{summarizeValue(d.before)}</span>
                )}
                {d.kind === 'changed' && (
                  <>
                    <span style={{ color: 'var(--color-destructive, #ef4444)' }}>{summarizeValue(d.before)}</span>
                    <span style={{ opacity: 0.4 }}> → </span>
                    <span style={{ color: 'var(--color-success, #22c55e)' }}>{summarizeValue(d.after)}</span>
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
