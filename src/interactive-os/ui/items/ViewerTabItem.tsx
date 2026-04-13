// ② 2026-04-03-viewer-command-prd.md
import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { TabItem } from './TabItem'
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
  const d = node.data as Record<string, unknown> | undefined
  const type = (d?.type as string) ?? 'file'
  const Icon = tabIcons[type] ?? FileText
  return TabItem(props, node, state, { icon: <Icon size={12} /> })
}
