import type React from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { NodeState } from '@os/pattern/types'

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
  const indent = ((state.level ?? 1) - 1) * 16

  const isGroup = type === 'group'

  return (
    <div
      {...props}
      style={{
        paddingLeft: `calc(var(--space-sm) + ${indent}px)`,
        paddingTop: 2,
        paddingBottom: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'var(--mono)',
        fontSize: 'var(--type-body-size)',
        opacity: state.focused ? 1 : 0.85,
        background: state.focused ? 'var(--bg-hover)' : undefined,
        outline: state.focused ? '1.5px solid var(--focus)' : undefined,
        cursor: 'default',
      }}
    >
      {isGroup ? (
        <>
          <span style={{ opacity: 0.6, fontSize: 'var(--type-caption-size)' }}>
            {state.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
          <span style={{ fontWeight: 600 }}>{label}</span>
          {count !== undefined && (
            <span style={{ opacity: 0.5, fontSize: 'var(--type-caption-size)' }}>({count})</span>
          )}
        </>
      ) : (
        <>
          <span style={{ opacity: 0.3, fontSize: 'var(--type-caption-size)' }}>·</span>
          <span style={{ color: TYPE_COLORS[type] ?? 'inherit', fontSize: 'var(--type-caption-size)', opacity: 0.8 }}>
            {type}
          </span>
          <span>{label}</span>
          {value && (
            <span style={{ opacity: 0.5, fontSize: 'var(--type-caption-size)' }}>
              {truncate(value)}
            </span>
          )}
        </>
      )}
    </div>
  )
}
