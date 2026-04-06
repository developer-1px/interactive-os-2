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
        interactive: 'tab', controlSize: 'sm', padding: 'sm', content: 'text',
        textStyle: 'caption', text: state.selected ? 'primary' : 'muted',
        layout: 'row', gap: 'xs', flex: 'none',
      })}
    >
      <Icon size={12} /> {label}
    </span>
  )
}
