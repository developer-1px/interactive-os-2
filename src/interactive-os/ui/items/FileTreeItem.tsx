import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { ExpandIndicator } from '../indicators'
import { FileIcon } from '../FileIcon'
import { ax } from '@styles/ax'

/**
 * TreeView item for file/directory nodes.
 * Expects node.data to have: { name: string, type: 'file' | 'directory', path: string }
 */
export function FileTreeItem(
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement {
  const data = node.data as { name: string; type: 'file' | 'directory'; path: string }
  const depth = (state.level ?? 1) - 1
  return (
    <div
      {...props}
      className={ax({ interactive: 'item', layout: 'bar', gap: 'xs', padding: 'xs' })}
      style={{ paddingLeft: `calc(${depth} * var(--space-md) + var(--space-xs))` }}
    >
      {data.type === 'directory' ? (
        <span className={ax({ layout: 'center', text: 'muted', flex: 'none' })}>
          <ExpandIndicator expanded={state.expanded} />
        </span>
      ) : (
        <span className={ax({ layout: 'center', text: 'muted', flex: 'none' })} />
      )}
      <FileIcon name={data.name} type={data.type} expanded={state.expanded} />
      <span className={`${ax({ clamp: '1' })}${data.type === 'directory' ? ` ${ax({ weight: 'medium' })}` : ''}`}>
        {data.name}
      </span>
    </div>
  )
}
