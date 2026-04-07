import React from 'react'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import { Aria } from '../primitives/aria'
import { switchPattern } from '../pattern/roles/switch'
import { ax } from '@styles/ax'
import '@styles/ax.css'

type ToggleProps = AriaComponentProps

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  const checked = state.expanded ?? false
  return (
    <div {...props} className={ax({ layout: 'spread', interactive: 'check', shape: 'md' })} data-focused={state.focused || undefined}>
      <span className={ax({ textStyle: 'body', text: state.focused ? 'primary' : 'secondary' })}>{label}</span>
      <span className={`${ax({ textStyle: 'caption', tone: checked ? 'success' : undefined, text: checked ? undefined : 'muted', weight: 'semi' })}`} data-checked={checked || undefined}>{checked ? 'On' : 'Off'}</span>
    </div>
  )
}

export function Toggle({
  data,
  plugins = [],
  onChange,
  renderItem = defaultRenderItem,
}: ToggleProps) {
  return (
    <Aria pattern={switchPattern} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
