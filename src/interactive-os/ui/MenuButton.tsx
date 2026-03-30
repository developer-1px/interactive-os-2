import React from 'react'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import { useAria } from '../primitives/useAria'
import { menuButton } from '../pattern/roles/menuButton'
import { POPUP_ID } from '../axis/popup'
import { ROOT_ID } from '../store/types'
import { getChildren } from '../store/createStore'

interface MenuButtonProps extends AriaComponentProps {
  renderTrigger?: (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState & { isOpen: boolean }) => React.ReactElement
}

const defaultRenderTrigger = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, _state: NodeState & { isOpen: boolean }): React.ReactElement => {
  const label = getNodeLabel(item)
  return (
    <div {...props}>
      {label}
    </div>
  )
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  return (
    <div {...props} data-focused={state.focused || undefined}>
      {label}
    </div>
  )
}

export function MenuButton({
  data,
  plugins = [],
  onChange,
  onActivate,
  renderTrigger = defaultRenderTrigger,
  renderItem = defaultRenderItem,
  'aria-label': ariaLabel,
}: MenuButtonProps) {
  const aria = useAria({ data, pattern: menuButton, plugins, onChange, onActivate })
  const store = aria.getStore()

  const popupEntity = store.entities[POPUP_ID] as Record<string, unknown> | undefined
  const isOpen = (popupEntity?.isOpen as boolean) ?? false
  const triggerId = (popupEntity?.triggerId as string) ?? ''

  const rootChildren = getChildren(store, ROOT_ID)
  const triggerNodeId = rootChildren[0]
  if (!triggerNodeId) return null

  const triggerEntity = store.entities[triggerNodeId]
  if (!triggerEntity) return null

  const menuItemIds = getChildren(store, triggerNodeId)
  const showMenu = isOpen && triggerId === triggerNodeId

  const triggerState = aria.getNodeState(triggerNodeId)
  const triggerProps = aria.getNodeProps(triggerNodeId) as React.HTMLAttributes<HTMLElement>

  return (
    <div {...(aria.containerProps as React.HTMLAttributes<HTMLDivElement>)} aria-label={ariaLabel}>
      {renderTrigger(triggerProps, triggerEntity, { ...triggerState, isOpen })}
      {showMenu && menuItemIds.map((id) => {
        const entity = store.entities[id]
        if (!entity) return null
        const state = aria.getNodeState(id)
        const props = aria.getNodeProps(id) as React.HTMLAttributes<HTMLElement>
        return <React.Fragment key={id}>{renderItem(props, entity, state)}</React.Fragment>
      })}
    </div>
  )
}
