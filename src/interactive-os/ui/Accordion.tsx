import React from 'react'
import { ExpandIndicator } from './indicators'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import { Aria } from '../primitives/aria'
import { accordion } from '../pattern/roles/accordion'
import styles from './Accordion.module.css'

type AccordionProps = AriaComponentProps

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  const isGroup = state.level === 1

  if (isGroup) {
    return (
      <div>
        <div {...props} className={styles.header}>
          <span>{label}</span>
          <span className={`${styles.chevron} ${state.expanded ? styles.chevronExpanded : ''}`}>
            <ExpandIndicator />
          </span>
        </div>
        {state.slotProps && (
          <div {...state.slotProps} className={styles.panel}>
            <span>{label} content</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div {...props} className={styles.item}>
      <span>{label}</span>
    </div>
  )
}

export function Accordion({
  data,
  plugins = [],
  onChange,
  renderItem = defaultRenderItem,
  className,
  'aria-label': ariaLabel,
}: AccordionProps) {
  return (
    <div className={className ?? styles.root}>
      <Aria pattern={accordion} data={data} plugins={plugins} onChange={onChange} aria-label={ariaLabel}>
        <Aria.Item render={renderItem} />
      </Aria>
    </div>
  )
}
