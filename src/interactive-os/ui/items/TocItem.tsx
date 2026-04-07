// ② pages/book 소급 마이그레이션
import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { ax } from '@styles/ax'

export function TocItem(
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement {
  const data = node.data as Record<string, unknown>
  const label = data.label as string
  const depth = data.depth as number
  return (
    <div
      {...props}
      className={ax({ recipe: 'item-sm', interactive: 'item', text: state.selected ? 'bright' : 'muted' })}
      data-indent={depth > 0 ? '' : undefined}
      aria-current={state.selected ? 'page' : undefined}
    >
      <span className={ax({ textStyle: 'caption', text: 'muted' })}>{(data.pageIndex as number) + 1}</span>
      {label}
    </div>
  )
}
