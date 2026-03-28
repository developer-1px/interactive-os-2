import React from 'react'
import { ExpandIndicator } from './indicators'

import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { accordion } from '../pattern/roles/accordion'
import styles from './Accordion.module.css'

interface AccordionProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState) => React.ReactElement
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = (item.data as Record<string, unknown>)?.label as string
    ?? (item.data as Record<string, unknown>)?.name as string
    ?? item.id as string
  const isGroup = state.level === 1

  if (isGroup) {
    return (
      <div {...props} className={styles.header}>
        <span>{label}</span>
        <span className={`${styles.chevron} ${state.expanded ? styles.chevronExpanded : ''}`}>
          <ExpandIndicator />
        </span>
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
}: AccordionProps) {
  return (
    <Aria behavior={accordion} data={data} plugins={plugins} onChange={onChange} className={styles.root}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
