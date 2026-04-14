/** @catalog 접기/펼치기 섹션 그룹 */
import React from 'react'
import { ExpandIndicator } from './indicators'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import { Aria } from '../primitives/aria'
import { accordion } from '../pattern/roles/accordion'
import { ax } from '@styles/ax'
import './Accordion.css'

type AccordionProps = AriaComponentProps

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  const isGroup = state.level === 1

  if (isGroup) {
    return (
      <div>
        <div {...props} className={ax({ role: 'item', interactive: 'item', content: 'text', layout: 'spread', weight: 'semi', width: 'full' })}>
          <span className={ax({ text: state.focused ? 'primary' : 'secondary' })}>{label}</span>
          <span className={`accordion-chevron ${ax({ flex: 'none', text: 'muted' })}`} data-expanded={state.expanded || undefined}>
            <ExpandIndicator />
          </span>
        </div>
        {state.slotProps && (
          <div {...state.slotProps} className={ax({ layout: 'column' })}>
            <span>{label} content</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div {...props} className={ax({ textStyle: 'body', text: 'secondary', padding: 'md' })}>
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
    <div className={className ?? ax({ layout: 'column' })}>
      <Aria pattern={accordion} data={data} plugins={plugins} onChange={onChange} aria-label={ariaLabel}>
        <Aria.Item render={renderItem} />
      </Aria>
    </div>
  )
}
