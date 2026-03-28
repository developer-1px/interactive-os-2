import React from 'react'
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Undo, Redo, Copy, Scissors, Clipboard, Trash2, Plus, Minus, Search, Settings, type LucideIcon } from 'lucide-react'

import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { Command } from '../engine/types'
import type { PatternContext, NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { toolbar } from '../pattern/roles/toolbar'
import styles from './Toolbar.module.css'

const iconMap: Record<string, LucideIcon> = {
  bold: Bold, italic: Italic, underline: Underline,
  'align-left': AlignLeft, 'align-center': AlignCenter, 'align-right': AlignRight,
  undo: Undo, redo: Redo, copy: Copy, cut: Scissors, paste: Clipboard,
  delete: Trash2, add: Plus, remove: Minus, search: Search, settings: Settings,
}

interface ToolbarProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  onActivate?: (nodeId: string) => void
  renderItem?: (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState) => React.ReactElement
  orientation?: 'horizontal' | 'vertical'
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const data = item.data as Record<string, unknown> | undefined
  const label = data?.label as string ?? data?.name as string ?? item.id as string
  const iconKey = data?.icon as string | undefined
  const Icon = iconKey ? iconMap[iconKey] : undefined
  const cls = 'inline-flex items-center justify-center ' + styles.toolbarBtn + (state.focused ? ' ' + styles.toolbarBtnFocused : '') + (state.selected ? ' ' + styles.toolbarBtnSelected : '')
  return (
    <span {...props} className={cls} aria-label={Icon ? label : undefined}>
      {Icon ? <Icon size={18} /> : label}
    </span>
  )
}

// Override toolbar's horizontal keyMap to use vertical arrows instead
const verticalKeyMap: Record<string, ((ctx: PatternContext) => Command | void) | undefined> = {
  ArrowDown: (ctx: PatternContext) => ctx.focusNext(),
  ArrowUp: (ctx: PatternContext) => ctx.focusPrev(),
  ArrowRight: undefined,
  ArrowLeft: undefined,
  Home: (ctx: PatternContext) => ctx.focusFirst(),
  End: (ctx: PatternContext) => ctx.focusLast(),
}

export function Toolbar({
  data,
  plugins = [],
  onChange,
  onActivate,
  renderItem = defaultRenderItem,
  orientation = 'horizontal',
}: ToolbarProps) {
  return (
    <Aria
      pattern={toolbar}
      data={data}
      plugins={plugins}
      onChange={onChange}
      onActivate={onActivate}
      keyMap={orientation === 'vertical' ? verticalKeyMap as Record<string, (ctx: PatternContext) => Command | void> : undefined}
    >
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
