var e=`/** @catalog 메뉴바 (다중 메뉴 그룹) */
// ② 2026-04-06-menubar-refactor-prd.md
import React from 'react'
import type { ReactNode } from 'react'
import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { menubar } from '../pattern/roles/menubar'
import { MenubarItem } from './items/MenubarItem'
import { MenuItem } from './items/MenuItem'
import { DirectionIndicator } from './indicators'
import { SubmenuPanel } from './panels/SubmenuPanel'

type MenubarRenderItem = (
  props: React.HTMLAttributes<HTMLElement>,
  item: Record<string, unknown>,
  state: NodeState,
  children?: ReactNode,
) => React.ReactElement

interface MenubarProps extends Omit<AriaComponentProps, 'renderItem'> {
  renderItem?: MenubarRenderItem
}

const directionIndicator = <DirectionIndicator direction="next" />

const defaultRenderItem: MenubarRenderItem = (props, item, state, children) => {
  const label = getNodeLabel(item)
  const isRoot = state.level === 1
  const anchorName = \`--menubar-\${(item as { id?: string }).id ?? String(state.index)}\`

  if (isRoot) {
    if (children) {
      return (
        <div role="none" style={{ anchorName } as React.CSSProperties}>
          {MenubarItem(props, item, state)}
          <SubmenuPanel label={label} expanded={state.expanded} placement="root" anchorName={anchorName}>
            {children}
          </SubmenuPanel>
        </div>
      )
    }
    return (
      <div role="none">
        {MenubarItem(props, item, state)}
      </div>
    )
  }

  // Submenu level (2+): reuse MenuItem with DirectionIndicator
  if (children) {
    return (
      <div role="none" style={{ anchorName } as React.CSSProperties}>
        {MenuItem(props, item, state, { indicator: directionIndicator })}
        <SubmenuPanel label={label} expanded={state.expanded} placement="nested" anchorName={anchorName}>
          {children}
        </SubmenuPanel>
      </div>
    )
  }

  return (
    <div role="none">
      {MenuItem(props, item, state)}
    </div>
  )
}

export function Menubar({
  data,
  plugins = [],
  onChange,
  renderItem = defaultRenderItem,
  onActivate,
  'aria-label': ariaLabel,
}: MenubarProps) {
  return (
    <Aria
      pattern={menubar}
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