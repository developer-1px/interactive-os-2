import React from 'react'

import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { accordion } from '../behaviors/accordion'
import { core } from '../plugins/core'
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
  const cls = styles.header + (state.focused ? ' ' + styles.headerFocused : '')
  return (
    <div {...props} className={cls}>
      <span>{label}</span>
      <span className={styles.chevron}>{state.expanded ? '−' : '+'}</span>
    </div>
  )
}

export function Accordion({
  data,
  plugins = [core()],
  onChange,
  renderItem = defaultRenderItem,
}: AccordionProps) {
  return (
    <Aria behavior={accordion} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
