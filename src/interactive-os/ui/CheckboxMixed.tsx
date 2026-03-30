import React from 'react'

import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { checkboxMixed } from '../pattern/roles/checkboxMixed'
import { CheckIndicator, IndeterminateIndicator } from './indicators'
import styles from './Checkbox.module.css'

type CheckboxMixedProps = AriaComponentProps

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  const isMixed = state.checked === 'mixed'
  const isChecked = state.checked === true
  return (
    <div {...props} className={styles.item} data-focused={state.focused || undefined}>
      {isMixed ? <IndeterminateIndicator /> : <CheckIndicator checked={isChecked} />}
      <span className={styles.label}>{label}</span>
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
