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
  renderItem?: (item: Record<string, unknown>, state: NodeState) => React.ReactNode
}

const defaultRenderItem = (item: Record<string, unknown>, state: NodeState): React.ReactNode => (
  <div style={{
    padding: '12px 16px',
    background: state.focused ? 'var(--accordion-focus-bg, #e3f2fd)' : 'transparent',
    cursor: 'default',
    userSelect: 'none',
    fontSize: 14,
    fontWeight: state.expanded ? 600 : 400,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--accordion-border, #e0e0e0)',
  }}>
    <span>{item.label as string ?? item.name as string ?? item.id as string}</span>
    <span style={{ opacity: 0.5 }}>{state.expanded ? '−' : '+'}</span>
  </div>
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
