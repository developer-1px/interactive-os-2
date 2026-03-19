import React from 'react'
import './kanban.css'
import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { kanban as kanbanBehavior } from '../behaviors/kanban'
import { core } from '../plugins/core'
import { getChildren } from '../core/createStore'

interface KanbanProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  'aria-label'?: string
}

export function Kanban({
  data,
  plugins = [core()],
  onChange,
  'aria-label': ariaLabel,
}: KanbanProps) {
  // Count columns to set CSS column-count dynamically
  const columnCount = (data.relationships['__root__'] ?? []).length

  const renderItem = (node: Record<string, unknown>, state: NodeState): React.ReactNode => {
    const d = node.data as Record<string, unknown> | undefined
    const title = (d?.title as string) ?? ''

    // Level 0 = column header
    if (state.level === 0) {
      const cardCount = getChildren(data, node.id as string).length
      return (
        <div className="kanban-column-header-inner">
          <span>{title}</span>
          <span className="kanban-column-count">{cardCount}</span>
        </div>
      )
    }

    // Level 1 = card
    return (
      <Aria.Editable field="title">{title}</Aria.Editable>
    )
  }

  return (
    <div className="kanban-board" style={{ ['--kanban-columns' as string]: columnCount }}>
      <Aria
        behavior={kanbanBehavior}
        data={data}
        plugins={plugins}
        onChange={onChange}
        aria-label={ariaLabel}
      >
        <Aria.Item render={renderItem} />
      </Aria>
    </div>
  )
}
