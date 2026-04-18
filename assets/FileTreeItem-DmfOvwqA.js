var e=`import type React from 'react'
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
      className={ax({ role: 'item', interactive: 'item', content: 'text', layout: 'row', width: 'full' })}
      style={{ paddingLeft: \`calc(\${depth} * var(--space-md) + var(--space-sm))\` }}
    >
      {data.type === 'directory' ? (
        <span className={\`\${ax({ layout: 'center', flex: 'none' })} \${ax.raw({ text: 'muted' })}\`}>
          <ExpandIndicator expanded={state.expanded} />
        </span>
      ) : (
        <span className={\`\${ax({ layout: 'center', flex: 'none' })} \${ax.raw({ text: 'muted' })}\`} />
      )}
      <FileIcon name={data.name} type={data.type} expanded={state.expanded} />
      <span className={\`\${ax({ clamp: '1' })}\${data.type === 'directory' ? \` \${ax.raw({ weight: 'medium' })}\` : ''}\`}>
        {data.name}
      </span>
    </div>
  )
}
`;export{e as default};