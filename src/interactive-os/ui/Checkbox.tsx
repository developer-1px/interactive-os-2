import React from 'react'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import { Aria } from '../primitives/aria'
import { checkbox } from '../pattern/roles/checkbox'
import { CheckIndicator } from './indicators'
import styles from './Checkbox.module.css'

type CheckboxProps = AriaComponentProps

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  const checked = state.checked === true
  return (
    <div {...props} className={`flex-row items-center ${styles.item}`} data-focused={state.focused || undefined}>
      <CheckIndicator checked={checked} />
      <span className={styles.label}>{label}</span>
    </div>
  )
}

export function Checkbox({
  data,
  plugins = [],
  onChange,
  renderItem = defaultRenderItem,
  'aria-label': ariaLabel,
}: CheckboxProps) {
  return (
    <Aria pattern={checkbox} data={data} plugins={plugins} onChange={onChange} aria-label={ariaLabel}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
