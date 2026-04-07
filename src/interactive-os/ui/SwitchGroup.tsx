/** @catalog 온/오프 스위치 그룹 */
import React from 'react'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import { Aria } from '../primitives/aria'
import { switchPattern } from '../pattern/roles/switch'
import { SwitchIndicator } from './indicators'
import { ax } from '@styles/ax'
import '@styles/ax.css'

type SwitchGroupProps = AriaComponentProps

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  return (
    <div {...props} className={ax({ layout: 'spread', interactive: 'check', shape: 'md', text: state.checked ? 'primary' : undefined })} data-focused={state.focused || undefined}>
      <span className={ax({ textStyle: 'body', text: state.focused ? 'primary' : 'secondary' })}>{label}</span>
      <SwitchIndicator />
    </div>
  )
}

export function SwitchGroup({
  data,
  plugins = [],
  onChange,
  renderItem = defaultRenderItem,
  'aria-label': ariaLabel,
}: SwitchGroupProps) {
  return (
    <Aria pattern={switchPattern} data={data} plugins={plugins} onChange={onChange} aria-label={ariaLabel}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
