import React from 'react'
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Undo, Redo, Copy, Scissors, Clipboard, Trash2, Plus, Minus, Search, Settings, type LucideIcon } from 'lucide-react'

import type { NodeState } from '../pattern/types'
import { key, type KeyHandler } from '../axis/types'
import type { AriaComponentProps } from './types'
import { Aria } from '../primitives/aria'
import { toolbar } from '../pattern/roles/toolbar'
import { getNodeLabel } from './types'
import { ax } from '@styles/ax'
import '@styles/ax.css'

const toolbarPattern = toolbar()

const iconMap: Record<string, LucideIcon> = {
  bold: Bold, italic: Italic, underline: Underline,
  'align-left': AlignLeft, 'align-center': AlignCenter, 'align-right': AlignRight,
  undo: Undo, redo: Redo, copy: Copy, cut: Scissors, paste: Clipboard,
  delete: Trash2, add: Plus, remove: Minus, search: Search, settings: Settings,
}

interface ToolbarProps extends AriaComponentProps {
  orientation?: 'horizontal' | 'vertical'
  keyMap?: Record<string, import('../axis/types').KeyHandler>
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  const iconKey = (item.data as Record<string, unknown>)?.icon as string | undefined
  const Icon = iconKey ? iconMap[iconKey] : undefined
  return (
    <span
      {...props}
      className={ax({ surface: 'ghost', controlSize: 'sm', layout: Icon ? 'center' : undefined, padding: Icon ? undefined : 'sm', content: Icon ? undefined : 'text', state: state.focused ? 'focused' : state.selected ? 'selected' : undefined })}
      aria-label={Icon ? label : undefined}
    >
      {Icon ? <Icon size={18} /> : label}
    </span>
  )
}

// Override toolbar's horizontal keyMap to use vertical arrows instead
const verticalKeyMap: Record<string, KeyHandler> = {
  ArrowDown: key(['core:focus:next'], (ctx) => ctx.focusNext()),
  ArrowUp: key(['core:focus:prev'], (ctx) => ctx.focusPrev()),
  ArrowRight: key([], () => undefined), // suppress horizontal nav
  ArrowLeft: key([], () => undefined), // suppress horizontal nav
  Home: key(['core:focus:first'], (ctx) => ctx.focusFirst()),
  End: key(['core:focus:last'], (ctx) => ctx.focusLast()),
}

export function Toolbar({
  data,
  plugins = [],
  onChange,
  onActivate,
  onFocusChange,
  renderItem = defaultRenderItem,
  orientation = 'horizontal',
  keyMap,
  'aria-label': ariaLabel,
}: ToolbarProps) {
  const mergedKeyMap = React.useMemo(() => {
    const base = orientation === 'vertical' ? verticalKeyMap : undefined
    if (!base && !keyMap) return undefined
    if (!base) return keyMap
    if (!keyMap) return base
    return { ...base, ...keyMap }
  }, [orientation, keyMap])

  return (
    <Aria
      pattern={toolbarPattern}
      data={data}
      plugins={plugins}
      onChange={onChange}
      onActivate={onActivate}
      onFocusChange={onFocusChange}
      keyMap={mergedKeyMap}
      aria-label={ariaLabel}
    >
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
