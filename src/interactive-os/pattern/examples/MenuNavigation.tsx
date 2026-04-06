import { useState, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { MenuList } from '../../ui/MenuList'
import { ax } from '@styles/ax'

// APG #43: Navigation Menu Button
// https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/examples/menu-button-links/

const items = [
  { id: 'w3c-home', label: 'W3C Home Page' },
  { id: 'w3c-spec', label: 'W3C Specification' },
  { id: 'aria-practices', label: 'ARIA Practices' },
]

const data: NormalizedData = createStore({
  entities: Object.fromEntries(
    items.map(item => [item.id, { id: item.id, data: { label: item.label } }]),
  ),
  relationships: { [ROOT_ID]: items.map(item => item.id) },
})

const renderMenuItem = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
  return (
    <div
      {...props}
      className={`${ax({ textStyle: 'body', text: 'primary', padding: 'xs', content: 'text', interactive: 'item' })} flex-row items-center cursor-default`}
      data-focused={state.focused || undefined}
    >
      {label}
    </div>
  )
}

export function MenuNavigation() {
  const [store, setStore] = useState<NormalizedData>(data)
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <MenuList
      data={store}
      onChange={onChange}
      renderItem={renderMenuItem}
      aria-label="Navigation"
    />
  )
}
