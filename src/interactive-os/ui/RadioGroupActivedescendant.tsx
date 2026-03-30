import React from 'react'

import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { radiogroupActivedescendant } from '../pattern/roles/radiogroupActivedescendant'
import { RadioIndicator } from './indicators'
import styles from './RadioGroup.module.css'

type RadioGroupActivedescendantProps = AriaComponentProps

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  return (
    <div {...props} className={styles.item} data-focused={state.focused || undefined}>
      <RadioIndicator />
      <span className={styles.label}>{label}</span>
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
