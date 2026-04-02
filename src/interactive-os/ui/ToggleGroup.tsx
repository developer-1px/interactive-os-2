import React from 'react'
import { CircleDot, Circle } from 'lucide-react'

import { ax } from '@styles/ax'
import '@styles/ax.css'
import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import { Aria } from '../primitives/aria'
import { toolbar } from '../pattern/roles/toolbar'

const toggleGroupPattern = toolbar({ toggle: true })

interface ToggleGroupProps extends AriaComponentProps {
  orientation?: 'horizontal' | 'vertical'
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  return (
    <div {...props} className={ax({ surface: 'ghost', controlSize: 'sm', gap: 'xs' })} data-focused={state.focused || undefined} data-selected={state.selected || undefined}>
      <span className={ax({ layout: 'center', text: state.selected ? 'accent' : 'muted' })} data-selected={state.selected || undefined}>{state.selected ? <CircleDot size={18} /> : <Circle size={18} />}</span>
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
