import React from 'react'
import { ExpandIndicator } from './indicators'

import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { disclosure } from '../pattern/roles/disclosure'
import styles from './DisclosureGroup.module.css'

type DisclosureGroupProps = AriaComponentProps

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  return (
    <div {...props} className={`flex-row items-center ${styles.item}`} data-focused={state.focused || undefined}>
      <ExpandIndicator expanded={state.expanded} />
      <span className={styles.label}>{label}</span>
    </div>
  )
}

export function DisclosureGroup({
  data,
  plugins = [],
  onChange,
  renderItem = defaultRenderItem,
  onActivate,
  'aria-label': ariaLabel,
}: DisclosureGroupProps) {
  return (
    <Aria
      pattern={disclosure}
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
