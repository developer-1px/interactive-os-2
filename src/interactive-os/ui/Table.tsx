/** @catalog 데이터 테이블 */
import React from 'react'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import { Aria } from '../primitives/aria'
import { table } from '../pattern/roles/table'
import { ax } from '@styles/ax'

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  const level = state.level ?? 1
  const isHeader = item.data && typeof item.data === 'object' && 'header' in item.data && (item.data as Record<string, unknown>).header === true
  // level 1 = rowgroup, level 2 = row, level 3 = cell
  if (level === 1) return <div {...props} />
  if (level === 2) return <div {...props} className={`${props.className || ''} ${ax({ role: 'item', border: 'bottom', interactive: 'item' })}`} />
  if (isHeader) return <div {...props} className={`${props.className || ''} ${ax({ padding: 'sm', })}`}>{label}</div>
  return <div {...props} className={`${props.className || ''} ${ax({ padding: 'sm' })}`}>{label}</div>
}

export function Table({ data, plugins = [], onChange, renderItem = defaultRenderItem, 'aria-label': ariaLabel }: AriaComponentProps) {
  return (
    <Aria pattern={table} data={data} plugins={plugins} onChange={onChange} aria-label={ariaLabel}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
