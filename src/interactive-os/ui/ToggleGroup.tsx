import React from 'react'

import { ax } from '@styles/ax'
import '@styles/ax.css'
import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import { Aria } from '../primitives/aria'
import { toolbar } from '../pattern/roles/toolbar'
import { CheckIndicator } from './indicators'

const toggleGroupPattern = toolbar({ toggle: true })

interface ToggleGroupProps extends AriaComponentProps {
  orientation?: 'horizontal' | 'vertical'
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  return (
    <div {...props} className={ax({ layout: 'bar', interactive: 'check', gap: 'xs' })} data-focused={state.focused || undefined} data-selected={state.selected || undefined}>
      <CheckIndicator checked={state.selected} />
      <span className={ax({ textStyle: 'body', text: 'primary' })}>{label}</span>
    </div>
  )
}

export function ToggleGroup({
  data,
  plugins = [],
  onChange,
  renderItem = defaultRenderItem,
  orientation: _orientation = 'horizontal',
}: ToggleGroupProps) {
  return (
    <Aria
      pattern={toggleGroupPattern}
      data={data}
      plugins={plugins}
      onChange={onChange}
    >
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
