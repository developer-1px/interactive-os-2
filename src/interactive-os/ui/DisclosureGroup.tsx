import React from 'react'
import { ExpandIndicator } from './indicators'

import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { disclosure } from '../pattern/roles/disclosure'

interface DisclosureGroupProps {
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
    <div {...props} className="flex-row items-center gap-xs">
      <ExpandIndicator expanded={state.expanded} />
      <span>{label}</span>
    </div>
  )
}

export function DisclosureGroup({
  data,
  plugins = [],
  onChange,
  renderItem = defaultRenderItem,
}: DisclosureGroupProps) {
  return (
    <Aria pattern={disclosure} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
