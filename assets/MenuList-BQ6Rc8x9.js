var e=`/** @catalog 메뉴 항목 리스트 */
import React from 'react'

import type { AriaComponentProps } from './types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { menu } from '../pattern/roles/menu'
import { MenuItem } from './items'

type MenuListProps = AriaComponentProps

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement =>
  MenuItem(props, item, state)

export function MenuList({
  data,
  plugins = [],
  onChange,
  renderItem = defaultRenderItem,
  onActivate,
  'aria-label': ariaLabel,
}: MenuListProps) {
  return (
    <Aria
      pattern={menu}
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
`;export{e as default};