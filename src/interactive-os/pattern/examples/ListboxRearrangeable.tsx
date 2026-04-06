import React, { useState, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { SELECTION_ID } from '../../axis/select'
import { ListBox } from '../../ui/ListBox'
import { ax } from '@styles/ax'

// APG #37: Listbox with Rearrangeable Options (Example 2 — Multi-Select)
// https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-rearrangeable/
// Two independent ListBox instances + toolbar, items move between them

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

const renderOption = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
  return (
    <div
      {...props}
      className={`${ax({ textStyle: 'body', text: 'primary', gap: 'sm', padding: 'xs', content: 'text', interactive: 'item' })} flex-row items-center`}
      data-focused={state.focused || undefined}
      data-selected={state.selected || undefined}
    >
      {state.selected && <span aria-hidden="true" className={`${ax({ textStyle: 'caption', text: 'accent' })}`}>✓</span>}
      {label}
    </div>
  )
}

function ListboxZone({
  label,
  ids,
  onSelectionChange,
}: {
  label: string
  ids: string[]
  onSelectionChange: (selectedIds: string[]) => void
}) {
  const store = React.useMemo(() => buildListboxStore(ids), [ids])

  const onChange = useCallback((nextStore: NormalizedData) => {
    const selectedIds = (nextStore.entities[SELECTION_ID]?.selectedIds as string[]) ?? []
    onSelectionChange(selectedIds)
  }, [onSelectionChange])

  return (
    <div className="flex-1 min-w-0">
      <span className={`${ax({ textStyle: 'label', text: 'primary' })} block`} id={`label-${label.toLowerCase().replace(/\s/g, '-')}`}>
        {label}
      </span>
      <ListBox
        data={store}
        plugins={[]}
        onChange={onChange}
        renderItem={renderOption}
        aria-label={label}
      />
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
    <div className={`${ax({ gap: 'md' })} flex-row items-start`}>
      <ListboxZone
        label="Available upgrades"
        ids={availableIds}
        onSelectionChange={setAvailableSelected}
      />

      <div role="toolbar" aria-label="Actions" className={`${ax({ gap: 'xs', padding: 'md' })} flex-col`}>
        <button
          className={`${ax({ textStyle: 'caption', text: 'primary', surface: 'display', shape: 'sm', interactive: 'button' })} whitespace-nowrap`}
          aria-keyshortcuts="Enter"
          disabled={availableSelected.length === 0}
          onClick={addToChosen}
        >
          Add →
        </button>
        <button
          className={`${ax({ textStyle: 'caption', text: 'primary', surface: 'display', shape: 'sm', interactive: 'button' })} whitespace-nowrap`}
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
      />
    </div>
  )
}
