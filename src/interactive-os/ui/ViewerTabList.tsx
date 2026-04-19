/** @catalog 뷰어 전용 탭 목록 */
// ② 2026-04-03-viewer-command-prd.md
import React from 'react'

import type { AriaComponentProps } from './types'
import { useTabList } from './useTabList'
import { ROOT_ID } from '../store/types'
import { getChildren } from '../store/createStore'
import { ViewerTabItem } from './items'
import { ax } from '@styles/ax'

interface ViewerTabListProps extends AriaComponentProps {
  initialFocus?: string
}

export function ViewerTabList({
  data,
  plugins,
  onChange,
  onActivate,
  initialFocus,
  'aria-label': ariaLabel,
}: ViewerTabListProps) {
  const tl = useTabList({
    data,
    plugins,
    onChange,
    onActivate,
    initialFocus,
    'aria-label': ariaLabel,
  })

  const store = tl.getStore()
  const childIds = getChildren(store, ROOT_ID)

  return (
    <div
      {...(tl.rootProps as React.HTMLAttributes<HTMLDivElement>)}
      className={`${(tl.rootProps as Record<string, string>).className || ''} ${ax({ layout: 'bar' })}`}
    >
      {childIds.map((id) => {
        const entity = store.entities[id]
        if (!entity) return null
        const state = tl.getItemState(id)
        const props = { ...tl.getItemProps(id), key: id } as React.HTMLAttributes<HTMLElement>
        return ViewerTabItem(props, entity, state)
      })}
    </div>
  )
}
