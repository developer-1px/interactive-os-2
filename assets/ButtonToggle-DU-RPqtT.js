var e=`/** @catalog 눌림 상태를 토글하는 버튼 */
import React from 'react'

import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { buttonToggle } from '../pattern/roles/buttonToggle'

type ButtonToggleProps = AriaComponentProps

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  return (
    <div {...props} data-focused={state.focused || undefined} data-pressed={state.checked || undefined}>
      {label}
    </div>
  )
}

export function ButtonToggle({
  data,
  plugins = [],
  onChange,
  renderItem = defaultRenderItem,
  'aria-label': ariaLabel,
}: ButtonToggleProps) {
  return (
    <Aria pattern={buttonToggle} data={data} plugins={plugins} onChange={onChange} aria-label={ariaLabel}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
`;export{e as default};