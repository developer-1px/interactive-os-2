/** @catalog TreeGrid 행 래퍼 — colIndex === -1일 때 data-row-mode 노출 (CSS가 행 전체를 selection target으로 칠함) */
import React from 'react'
import { AriaInternalContext } from '../primitives/AriaInternalContext'
import { GRID_COL_ID } from '../axis/navigate'
import { ax } from '@styles/ax'

interface TreeGridRowProps {
  ariaProps: React.HTMLAttributes<HTMLElement>
  focused: boolean
  selected: boolean
  children: React.ReactNode
}

export function TreeGridRow({ ariaProps, focused, selected, children }: TreeGridRowProps): React.ReactElement {
  const aria = React.useContext(AriaInternalContext)
  const store = aria?.getStore()
  const colIndex = (store?.entities[GRID_COL_ID]?.colIndex as number | undefined) ?? -1
  const rowMode = colIndex < 0
  return (
    <div
      className={ax({ role: 'item', interactive: 'item' })}
      data-focused={focused || undefined}
      data-selected={selected || undefined}
      data-row-mode={rowMode && focused ? '' : undefined}
      {...ariaProps}
    >
      {children}
    </div>
  )
}
