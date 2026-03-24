import React from 'react'

import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { Command } from '../engine/types'
import type { PatternContext, NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { toolbar } from '../pattern/toolbar'
import { core } from '../plugins/core'

interface ToolbarProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  onActivate?: (nodeId: string) => void
  renderItem?: (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState) => React.ReactElement
  orientation?: 'horizontal' | 'vertical'
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, _state: NodeState): React.ReactElement => (
  <span {...props}>{(item.data as Record<string, unknown>)?.label as string ?? (item.data as Record<string, unknown>)?.name as string ?? item.id as string}</span>
)

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
  plugins = [core()],
  onChange,
  onActivate,
  renderItem = defaultRenderItem,
  orientation = 'horizontal',
}: ToolbarProps) {
  return (
    <Aria
      behavior={toolbar}
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
