/** @catalog 접기/펼치기 디스클로저 그룹 */
import React from 'react'
import { ExpandIndicator } from './indicators'

import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { disclosure } from '../pattern/roles/disclosure'
import { ax } from '@styles/ax'
import '@styles/ax.css'

type DisclosureGroupProps = AriaComponentProps

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  return (
    <div {...props} className={ax({ layout: 'bar', interactive: 'item', shape: 'md', gap: 'xs' })} style={{ justifyContent: 'flex-start' }} data-focused={state.focused || undefined}>
      <ExpandIndicator expanded={state.expanded} />
      <span className={ax({ text: state.focused ? 'bright' : 'primary' })}>{label}</span>
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
