// Todo 도메인 전용 아이템 — data.done=true면 회색 + 취소선.
// ListBox.renderItem에 전달. ARIA props(props)는 ListBox가 주입한 것을 그대로 spread.
import type React from 'react'
import type { NodeState } from '@os/pattern/types'
import { ax } from '@styles/ax'
import { CheckIndicator } from '@os/ui/indicators/CheckIndicator'
import styles from './TodoItem.module.css'

interface TodoData {
  label?: string
  done?: boolean
}

export function TodoItem(
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement {
  const data = (node.data ?? {}) as TodoData
  const done = data.done === true
  const label = data.label ?? String(node.id)

  return (
    <div
      {...props}
      className={ax({
        role: 'item',
        interactive: 'item',
        content: 'text',
        layout: 'row',
        width: 'full',
      })}
      data-focused={state.focused || undefined}
      data-selected={state.selected || undefined}
      data-done={done || undefined}
    >
      <CheckIndicator />
      <span
        className={`${ax({ clamp: '1', flex: '1', text: done ? 'muted' : 'primary' })} ${done ? styles.doneText : ''}`}
      >
        {label}
      </span>
    </div>
  )
}
