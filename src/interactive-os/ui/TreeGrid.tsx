import React from 'react'
import { ExpandIndicator } from './indicators'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { Aria } from '../primitives/aria'
import { treegrid } from '../pattern/roles/treegrid'
import { history } from '../plugins/history'
import { edit, replaceEditPlugin } from '../plugins/edit'
import { ax } from '@styles/ax'
import '@styles/ax.css'

interface TreeGridProps extends AriaComponentProps {
  id?: string
  enableEditing?: boolean
  columns?: number
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
    ?? (node.data as Record<string, unknown>)?.name as string
    ?? node.id as string
  const hasChildren = state.expanded !== undefined
  const depth = (state.level ?? 1) - 1
  return (
    <div {...props} className={ax({ surface: 'ghost', controlSize: 'md', padding: 'sm', content: 'text', layout: 'bar', gap: 'xs' })} style={{ paddingLeft: `calc(${depth} * var(--space-md) + var(--space-sm))` }}>
      <ExpandIndicator expanded={state.expanded} hasChildren={hasChildren} />
      <span className={ax({ text: state.focused ? 'primary' : 'secondary' })}>{label}</span>
    </div>
  )
}

// Re-export Cell for grid consumers (e.g. TreegridEmail)
// eslint-disable-next-line react-refresh/only-export-components
export const Cell = Aria.Cell

export function TreeGrid({
  id,
  data,
  plugins = [history()],
  onChange,
  renderItem = defaultRenderItem,
  enableEditing = false,
  columns,
  onActivate,
  'aria-label': ariaLabel,
}: TreeGridProps) {
  const pattern = React.useMemo(
    () => columns ? treegrid(columns) : treegrid(1),
    [columns],
  )

  const mergedPlugins = React.useMemo(
    () => enableEditing ? [...plugins, edit({ tree: true }), replaceEditPlugin()] : plugins,
    [plugins, enableEditing],
  )

  return (
    <Aria
      id={id}
      pattern={pattern}
      data={data}
      plugins={mergedPlugins}
      onChange={onChange}
      onActivate={onActivate}
      aria-label={ariaLabel}
    >
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
