/** @catalog 혼합(indeterminate) 상태를 지원하는 체크박스 */
import React from 'react'

import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { checkboxMixed } from '../pattern/roles/checkboxMixed'
import { CheckIndicator, IndeterminateIndicator } from './indicators'
import { ax } from '@styles/ax'
import '@styles/ax.css'

type CheckboxMixedProps = AriaComponentProps

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  const isMixed = state.checked === 'mixed'
  const isChecked = state.checked === true
  return (
    <div {...props} className={ax({ layout: 'bar', interactive: 'check', shape: 'md', controlSize: 'md', padding: 'sm', content: 'text', gap: 'sm' })} data-focused={state.focused || undefined}>
      {isMixed ? <IndeterminateIndicator /> : <CheckIndicator checked={isChecked} />}
      <span className={ax({ textStyle: 'body', text: state.focused ? 'primary' : 'secondary' })}>{label}</span>
    </div>
  )
}

export function CheckboxMixed({
  data,
  plugins = [],
  onChange,
  renderItem = defaultRenderItem,
  'aria-label': ariaLabel,
}: CheckboxMixedProps) {
  return (
    <Aria pattern={checkboxMixed} data={data} plugins={plugins} onChange={onChange} aria-label={ariaLabel}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
