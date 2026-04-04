import React from 'react'

import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { radiogroup } from '../pattern/roles/radiogroup'
import { RadioIndicator } from './indicators'
import { ax } from '@styles/ax'
import '@styles/ax.css'

type RadioGroupProps = AriaComponentProps

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  return (
    <div {...props} className={ax({ layout: 'bar', surface: 'ghost', gap: 'sm', text: state.checked ? 'primary' : undefined })} data-focused={state.focused || undefined}>
      <RadioIndicator />
      <span className={ax({ textStyle: 'body', text: state.focused ? 'primary' : 'secondary' })}>{label}</span>
    </div>
  )
}

export function RadioGroup({
  data,
  plugins = [],
  onChange,
  renderItem = defaultRenderItem,
  'aria-label': ariaLabel,
}: RadioGroupProps) {
  return (
    <Aria pattern={radiogroup} data={data} plugins={plugins} onChange={onChange} aria-label={ariaLabel}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
