/** @catalog aria-activedescendant 방식 메뉴 */
import React from 'react'

import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { menuActivedescendant } from '../pattern/roles/menuActivedescendant'

type MenuActivedescendantProps = AriaComponentProps

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  return (
    <div {...props} data-focused={state.focused || undefined}>
      {label}
    </div>
  )
}

export function MenuActivedescendant({
  data,
  plugins = [],
  onChange,
  renderItem = defaultRenderItem,
  'aria-label': ariaLabel,
}: MenuActivedescendantProps) {
  return (
    <Aria pattern={menuActivedescendant} data={data} plugins={plugins} onChange={onChange} aria-label={ariaLabel}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
