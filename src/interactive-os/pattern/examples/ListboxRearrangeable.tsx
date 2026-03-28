import { useState, useMemo, useCallback, useRef } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { SELECTION_ID } from '../../axis/select'
import { listbox } from '../../pattern/roles/listbox'
import styles from './listbox.module.css'

// APG #37: Listbox with Rearrangeable Options (Example 2 — Multi-Select)
// https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-rearrangeable/
// Two independent Aria listboxes + toolbar, items move between them

interface Item {
  id: string
  label: string
}

const ALL_ITEMS: Item[] = [
  { id: 'leather', label: 'Leather seats' },
  { id: 'heated', label: 'Front and rear heated seats' },
  { id: 'audio', label: 'Premium audio system' },
  { id: 'navigation', label: 'Built-in navigation' },
  { id: 'cruise', label: 'Adaptive cruise control' },
  { id: 'sunroof', label: 'Panoramic sunroof' },
  { id: 'camera', label: '360-degree camera' },
  { id: 'wireless', label: 'Wireless charging pad' },
]

const ITEMS_MAP = Object.fromEntries(ALL_ITEMS.map(item => [item.id, item]))

function buildListboxStore(ids: string[]): NormalizedData {
  const entities: Record<string, { id: string; [key: string]: unknown }> = {}
  for (const id of ids) {
    const item = ITEMS_MAP[id]!
    entities[id] = { id, data: { label: item.label } }
  }
  entities[SELECTION_ID] = { id: SELECTION_ID, selectedIds: [] }
  return createStore({ entities, relationships: { [ROOT_ID]: ids } })
}

const multiSelectListbox = listbox()

function ListboxZone({
  label,
  ids,
  onSelectionChange,
  listboxRef,
}: {
  label: string
  ids: string[]
  onSelectionChange: (selectedIds: string[]) => void
  listboxRef: React.RefObject<HTMLDivElement | null>
}) {
  const store = useMemo(() => buildListboxStore(ids), [ids])

  const onChange = useCallback((nextStore: NormalizedData) => {
    const selectedIds = (nextStore.entities[SELECTION_ID]?.selectedIds as string[]) ?? []
    onSelectionChange(selectedIds)
  }, [onSelectionChange])

  const renderOption = useCallback((
    props: React.HTMLAttributes<HTMLElement>,
    node: Record<string, unknown>,
    state: NodeState,
  ): React.ReactElement => {
    const nodeLabel = (node.data as Record<string, unknown>)?.label as string
    return (
      <div
        {...props}
        className={styles.option}
        data-focused={state.focused || undefined}
        data-selected={state.selected || undefined}
      >
        {state.selected && <span aria-hidden="true" className={styles.check}>✓</span>}
        {nodeLabel}
      </div>
    )
  }, [])

  return (
    <div className={styles.listboxZone}>
      <span className={styles.zoneLabel} id={`label-${label.toLowerCase().replace(/\s/g, '-')}`}>
        {label}
      </span>
      <div ref={listboxRef}>
        <Aria
          pattern={multiSelectListbox}
          data={store}
          plugins={[]}
          onChange={onChange}
          aria-labelledby={`label-${label.toLowerCase().replace(/\s/g, '-')}`}
        >
          <Aria.Item render={renderOption} />
        </Aria>
      </div>
    </div>
  )
}

export function ListboxRearrangeable() {
  const [availableIds, setAvailableIds] = useState(() =>
    ALL_ITEMS.slice(0, 5).map(i => i.id),
  )
  const [chosenIds, setChosenIds] = useState(() =>
    ALL_ITEMS.slice(5).map(i => i.id),
  )
  const [availableSelected, setAvailableSelected] = useState<string[]>([])
  const [chosenSelected, setChosenSelected] = useState<string[]>([])

  const availableRef = useRef<HTMLDivElement>(null)
  const chosenRef = useRef<HTMLDivElement>(null)

  const addToChosen = useCallback(() => {
    if (availableSelected.length === 0) return
    setAvailableIds(prev => prev.filter(id => !availableSelected.includes(id)))
    setChosenIds(prev => [...prev, ...availableSelected])
    setAvailableSelected([])
  }, [availableSelected])

  const removeFromChosen = useCallback(() => {
    if (chosenSelected.length === 0) return
    setChosenIds(prev => prev.filter(id => !chosenSelected.includes(id)))
    setAvailableIds(prev => [...prev, ...chosenSelected])
    setChosenSelected([])
  }, [chosenSelected])

  return (
    <div className={styles.rearrangeable}>
      <ListboxZone
        label="Available upgrades"
        ids={availableIds}
        onSelectionChange={setAvailableSelected}
        listboxRef={availableRef}
      />

      <div role="toolbar" aria-label="Actions" className={styles.toolbar}>
        <button
          className={styles.toolbarButton}
          aria-keyshortcuts="Enter"
          disabled={availableSelected.length === 0}
          onClick={addToChosen}
        >
          Add →
        </button>
        <button
          className={styles.toolbarButton}
          aria-keyshortcuts="Delete"
          disabled={chosenSelected.length === 0}
          onClick={removeFromChosen}
        >
          ← Remove
        </button>
      </div>

      <ListboxZone
        label="Chosen upgrades"
        ids={chosenIds}
        onSelectionChange={setChosenSelected}
        listboxRef={chosenRef}
      />
    </div>
  )
}
