import React from 'react'
import { ExpandIndicator } from './indicators'

import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { menu } from '../pattern/roles/menu'
import { ax } from '@styles/ax'
import '@styles/ax.css'

type MenuListProps = AriaComponentProps

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  const textColor = state.focused ? 'bright' as const : 'primary' as const
  return (
    <div {...props} className={ax({ layout: 'spread' })} data-focused={state.focused || undefined}>
      <span className={ax({ textStyle: 'body', text: textColor })}>{label}</span>
      {state.expanded !== undefined && (
        <span className={ax({ layout: 'bar', text: 'muted' })}>
          <ExpandIndicator expanded={state.expanded} />
        </span>
      )}
    </div>
  )
}

export function MenuList({
  data,
  plugins = [],
  onChange,
  renderItem = defaultRenderItem,
  onActivate,
  'aria-label': ariaLabel,
}: MenuListProps) {
  return (
    <Aria
      pattern={menu}
      data={data}
      plugins={plugins}
      onChange={onChange}
      onActivate={onActivate}
      aria-label={ariaLabel}
    >
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
