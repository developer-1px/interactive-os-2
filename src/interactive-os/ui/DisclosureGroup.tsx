import React from 'react'

import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { disclosure } from '../behaviors/disclosure'
import { core } from '../plugins/core'

interface DisclosureGroupProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (item: Record<string, unknown>, state: NodeState, props: React.HTMLAttributes<HTMLElement>) => React.ReactElement
}

const defaultRenderItem = (item: Record<string, unknown>, state: NodeState, props: React.HTMLAttributes<HTMLElement>): React.ReactElement => (
  <span {...props} className="item-inner">
    <span className="chevron item-chevron">{state.expanded ? '▾' : '▸'}</span>
    <span>{(item.data as Record<string, unknown>)?.label as string ?? (item.data as Record<string, unknown>)?.name as string ?? item.id as string}</span>
  </span>
)

export function DisclosureGroup({
  data,
  plugins = [core()],
  onChange,
  renderItem = defaultRenderItem,
}: DisclosureGroupProps) {
  return (
    <Aria behavior={disclosure} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
