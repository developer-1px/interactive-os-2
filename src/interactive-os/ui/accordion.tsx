import React from 'react'
import './Accordion.css'
import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { accordion } from '../behaviors/accordion'
import { core } from '../plugins/core'

interface AccordionProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (item: Record<string, unknown>, state: NodeState) => React.ReactNode
}

const defaultRenderItem = (item: Record<string, unknown>, state: NodeState): React.ReactNode => (
  <span className="accordion-inner">
    <span>{(item.data as Record<string, unknown>)?.label as string ?? (item.data as Record<string, unknown>)?.name as string ?? item.id as string}</span>
    <span className="chevron accordion-chevron">{state.expanded ? '−' : '+'}</span>
  </span>
)

export function Accordion({
  data,
  plugins = [core()],
  onChange,
  renderItem = defaultRenderItem,
}: AccordionProps) {
  return (
    <Aria behavior={accordion} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Node render={renderItem} />
    </Aria>
  )
}
