import React from 'react'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { useTabList } from './useTabList'
import { ROOT_ID } from '../store/types'
import { getChildren } from '../store/createStore'
import { ax } from '@styles/ax'

interface TabListProps extends AriaComponentProps {
  enableEditing?: boolean
  keyMap?: Record<string, import('../axis/types').KeyHandler>
  initialFocus?: string
  /** When true, uses tabsManual pattern (selection does NOT follow focus). */
  manual?: boolean
}

const defaultRenderItem = (_props: React.HTMLAttributes<HTMLElement>, tab: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = (tab.data as Record<string, unknown>)?.label as string
    ?? (tab.data as Record<string, unknown>)?.name as string
    ?? tab.id as string
  return (
    <span className={ax({
      surface: 'ghost', controlSize: 'sm', padding: 'sm', content: 'text',
      textStyle: 'caption', text: state.selected ? 'primary' : 'muted',
    })}>
      {label}
    </span>
  )
}

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
      className={ax({ layout: 'bar', gap: 'xs', padding: 'xs' })}
    >
      {childIds.map((id) => {
        const entity = store.entities[id]
        if (!entity) return null
        const state = tl.getItemState(id)
        const props = tl.getItemProps(id)
        return (
          <div
            key={id}
            {...(props as React.HTMLAttributes<HTMLDivElement>)}
          >
            {renderItem({} as React.HTMLAttributes<HTMLElement>, entity, state)}
          </div>
        )
      })}
    </div>
  )
}
