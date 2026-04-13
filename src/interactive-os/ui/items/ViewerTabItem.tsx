// ② 2026-04-03-viewer-command-prd.md
import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { getNodeLabel } from '../types'
import { ax } from '@styles/ax'
import { FileText, Search, Terminal } from 'lucide-react'

const tabIcons: Record<string, typeof FileText> = {
  file: FileText,
  search: Search,
  terminal: Terminal,
}

export function ViewerTabItem(
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement {
  const label = getNodeLabel(node)
  const d = node.data as Record<string, unknown> | undefined
  const type = (d?.type as string) ?? 'file'
  const Icon = tabIcons[type] ?? FileText
  return (
    <span
      {...props}
      className={ax({
        recipe: 'item-sm', interactive: 'tab',
        padding: 'xs', gap: 'sm', shape: '2xs', layout: 'row', width: 'full',
        text: state.selected ? 'primary' : 'muted',
        flex: 'none',
      })}
    >
      <Icon size={12} /> {label}
    </span>
  )
}
