import React from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { accordion } from '../pattern/accordion'
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
  return (
    <div {...props} className="flex-row items-center justify-between">
      <span>{label}</span>
      <span className={styles.chevron}>{state.expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
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
