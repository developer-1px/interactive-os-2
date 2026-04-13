/** @catalog aria-activedescendant 방식 라디오 그룹 */
import React from 'react'

import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { radiogroupActivedescendant } from '../pattern/roles/radiogroupActivedescendant'
import { RadioIndicator } from './indicators'
import { ax } from '@styles/ax'

type RadioGroupActivedescendantProps = AriaComponentProps

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  return (
    <div {...props} className={ax({ layout: 'bar', interactive: 'check', recipe: 'item', text: state.checked ? 'primary' : undefined, padding: 'sm', gap: 'sm', shape: '2xs', width: 'full' })} data-focused={state.focused || undefined}>
      <RadioIndicator />
      <span className={ax({ textStyle: 'body', text: state.focused ? 'primary' : 'secondary' })}>{label}</span>
    </div>
  )
}

export function RadioGroupActivedescendant({
  data,
  plugins = [],
  onChange,
  renderItem = defaultRenderItem,
  'aria-label': ariaLabel,
}: RadioGroupActivedescendantProps) {
  return (
    <Aria pattern={radiogroupActivedescendant} data={data} plugins={plugins} onChange={onChange} aria-label={ariaLabel}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
