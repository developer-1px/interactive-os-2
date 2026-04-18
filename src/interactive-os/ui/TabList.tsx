/** @catalog 탭 목록 */
import React from 'react'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { useTabList } from './useTabList'
import { ROOT_ID } from '../store/types'
import { getChildren } from '../store/createStore'
import { TabItem } from './items'
import { ax } from '@styles/ax'

interface TabListProps extends AriaComponentProps {
  enableEditing?: boolean
  keyMap?: Record<string, import('../axis/types').KeyHandler>
  initialFocus?: string
  /** When true, uses tabsManual pattern (selection does NOT follow focus). */
  manual?: boolean
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, tab: Record<string, unknown>, state: NodeState): React.ReactElement =>
  TabItem(props, tab, state)

export function TabList({
  data,
  plugins,
  onChange,
  onActivate,
  renderItem = defaultRenderItem,
  enableEditing = false,
  keyMap,
  initialFocus,
  manual = false,
  'aria-label': ariaLabel,
}: TabListProps) {
  const tl = useTabList({
    data,
    plugins,
    onChange,
    onActivate,
    enableEditing,
    keyMap,
    initialFocus,
    manual,
    'aria-label': ariaLabel,
  })

  const store = tl.getStore()
  const childIds = getChildren(store, ROOT_ID)

  return (
    <div
      {...(tl.rootProps as React.HTMLAttributes<HTMLDivElement>)}
      className={`${(tl.rootProps as Record<string, string>).className || ''} ${ax({ layout: 'bar', gap: 'xs', padding: 'xs', surface: 'sunken', shape: 'md', text: 'muted' })}`}
    >
      {childIds.map((id) => {
        const entity = store.entities[id]
        if (!entity) return null
        const state = tl.getItemState(id)
        const props = { ...tl.getItemProps(id), key: id } as React.HTMLAttributes<HTMLElement>
        return renderItem(props, entity, state)
      })}
    </div>
  )
}
