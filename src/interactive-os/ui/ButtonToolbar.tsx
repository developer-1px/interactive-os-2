import React from 'react'
import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { Aria } from '../primitives/aria'
import { toolbar } from '../pattern/roles/toolbar'
import { ButtonToolbarItem } from './items'

const toolbarPattern = toolbar()

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement =>
  ButtonToolbarItem(props, item, state)

interface ButtonToolbarProps extends AriaComponentProps {
  keyMap?: Record<string, import('../axis/types').KeyHandler>
}

/**
 * Toolbar variant that renders items as <button> elements.
 * Supports disabled and separator via node.data: { label, disabled?, separator? }
 */
export function ButtonToolbar({
  data,
  plugins = [],
  onChange,
  onActivate,
  onFocusChange,
  keyMap,
  'aria-label': ariaLabel,
}: ButtonToolbarProps) {
  return (
    <Aria
      pattern={toolbarPattern}
      data={data}
      plugins={plugins}
      onChange={onChange}
      onActivate={onActivate}
      onFocusChange={onFocusChange}
      keyMap={keyMap}
      aria-label={ariaLabel}
    >
      <Aria.Item render={defaultRenderItem} />
    </Aria>
  )
}
