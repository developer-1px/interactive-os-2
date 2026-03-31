import { useState, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { MenuButton } from '../../ui/MenuButton'
import styles from './menu.module.css'

// APG #41: Actions Menu Button Using element.focus()
// https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/examples/menu-button-actions/

const items = [
  { id: 'cut', label: 'Cut' },
  { id: 'copy', label: 'Copy' },
  { id: 'paste', label: 'Paste' },
  { id: 'select-all', label: 'Select All' },
]

const data: NormalizedData = createStore({
  entities: {
    actions: { id: 'actions', data: { label: 'Actions' } },
    ...Object.fromEntries(
      items.map(item => [item.id, { id: item.id, data: { label: item.label } }]),
    ),
  },
  relationships: {
    [ROOT_ID]: ['actions'],
    actions: items.map(item => item.id),
  },
})

const renderTrigger = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  _state: NodeState & { isOpen: boolean },
): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
  return (
    <button {...props} className={`${styles.trigger} inline-flex items-center`} type="button">
      {label} ▾
    </button>
  )
}

const renderMenuItem = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
  return (
    <div
      {...props}
      className={`${styles.menuitem} flex-row items-center`}
      data-focused={state.focused || undefined}
    >
      {label}
    </div>
  )
}

export function MenuActions() {
  const [store, setStore] = useState<NormalizedData>(data)
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <MenuButton
      data={store}
      onChange={onChange}
      renderTrigger={renderTrigger}
      renderItem={renderMenuItem}
      aria-label="Actions"
    />
  )
}
