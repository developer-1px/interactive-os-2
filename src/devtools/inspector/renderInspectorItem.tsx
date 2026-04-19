import type React from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { NodeState } from '@os/pattern/types'
import { ax } from '@styles/ax'
import './renderInspectorItem.css'

const TYPE_COLORS: Record<string, string> = {
  command: '#3b82f6',
  key: '#10b981',
  plugin: '#8b5cf6',
  meta: '#f59e0b',
  entity: '#3b82f6',
  rel: '#8b5cf6',
  field: '#6366f1',
}

function truncate(str: string, max = 80): string {
  if (!str || str.length <= max) return str
  return str.slice(0, max) + '…'
}

export function renderInspectorItem(props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState) {
  const d = node.data as Record<string, unknown>
  const type = d?.type as string
  const label = d?.label as string
  const value = d?.value as string | undefined
  const count = d?.count as number | undefined
  const changed = d?.changed as boolean | undefined
  const indent = ((state.level ?? 1) - 1) * 16

  const isGroup = type === 'group'

  return (
    <div
      {...props}
      className={`${props.className ?? ''} inspector-item ${ax({ layout: 'bar', textStyle: 'code', surface: changed ? 'action' : state.focused ? 'ghost' : undefined })}`}
      style={{ '--_indent': `${indent}px` } as React.CSSProperties}
      data-focused={state.focused || undefined}
      data-changed={changed || undefined}
    >
      {isGroup ? (
        <>
          <span className={ax({ textStyle: 'caption' })}>
            {state.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
          <span className={ax({ })}>{label}</span>
          {count !== undefined && (
            <span className={ax({ textStyle: 'caption' })}>({count})</span>
          )}
        </>
      ) : (
        <>
          <span className={ax({ textStyle: 'caption' })}>·</span>
          <span className={`inspector-item-type ${ax({ textStyle: 'caption' })}`} style={{ '--_type-color': TYPE_COLORS[type] } as React.CSSProperties}>
            {type}
          </span>
          <span>{label}</span>
          {value && (
            <span className={ax({ textStyle: 'caption' })}>
              {truncate(value)}
            </span>
          )}
        </>
      )}
    </div>
  )
}
