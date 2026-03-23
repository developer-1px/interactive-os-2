import React from 'react'

import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { accordion } from '../behaviors/accordion'
import { core } from '../plugins/core'

interface AccordionProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (item: Record<string, unknown>, state: NodeState) => React.ReactElement
}

const defaultRenderItem = (item: Record<string, unknown>, state: NodeState): React.ReactElement => (
  <span className="item-inner item-spread">
    <span>{(item.data as Record<string, unknown>)?.label as string ?? (item.data as Record<string, unknown>)?.name as string ?? item.id as string}</span>
    <span className="chevron item-chevron">{state.expanded ? '−' : '+'}</span>
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
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
