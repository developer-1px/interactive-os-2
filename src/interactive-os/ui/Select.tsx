/** @catalog 드롭다운 단일 선택 */
import React, { useId } from 'react'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import { useAria } from '../primitives/useAria'
import { select } from '../pattern/roles/select'
import { POPUP_ID } from '../axis/popup'
import { ROOT_ID } from '../store/types'
import { getChildren } from '../store/createStore'
import { SelectItem } from './items'
import { ax } from '@styles/ax'
import { DirectionIndicator } from './indicators'

interface SelectProps extends AriaComponentProps {
  placeholder?: string
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement =>
  SelectItem(props, item, state)

export function Select({
  data,
  plugins = [],
  onChange,
  renderItem,
  onActivate,
  onFocusChange,
  placeholder = 'Select...',
  'aria-label': ariaLabel,
}: SelectProps) {
  const render = renderItem ?? defaultRenderItem
  const rawId = useId()
  const anchorName = `--select-${rawId.replace(/[^a-zA-Z0-9-]/g, '')}`

  const aria = useAria({ data, pattern: select, plugins, onChange, onActivate, onFocusChange, 'aria-label': ariaLabel })
  const store = aria.getStore()

  const popupEntity = store.entities[POPUP_ID] as Record<string, unknown> | undefined
  const isOpen = (popupEntity?.isOpen as boolean) ?? false
  const triggerId = (popupEntity?.triggerId as string) ?? ''

  const rootChildren = getChildren(store, ROOT_ID)
  const triggerNodeId = rootChildren[0]
  if (!triggerNodeId) return null

  const triggerEntity = store.entities[triggerNodeId]
  if (!triggerEntity) return null

  const optionIds = getChildren(store, triggerNodeId)
  const showDropdown = isOpen && triggerId === triggerNodeId

  const triggerProps = aria.getNodeProps(triggerNodeId) as React.HTMLAttributes<HTMLElement>

  // Find selected option label
  const selectedOptionId = aria.selected[0]
  const selectedEntity = selectedOptionId ? store.entities[selectedOptionId] : undefined
  const selectedLabel = selectedEntity ? getNodeLabel(selectedEntity) : null

  return (
    <div {...(aria.containerProps as React.HTMLAttributes<HTMLDivElement>)} aria-label={ariaLabel}>
      <button
        type="button"
        {...triggerProps}
        className={ax({ surface: 'input', role: 'control', width: 'full', content: 'text', layout: 'row' })}
        style={{ anchorName } as React.CSSProperties}
      >
        <span className={ax({ text: selectedLabel ? 'primary' : 'muted', clamp: '1', flex: '1' })}>
          {selectedLabel ?? placeholder}
        </span>
        <DirectionIndicator direction={isOpen ? 'prev' : 'next'} orientation="vertical" />
      </button>
      {showDropdown && (
        <div
          role="listbox"
          className={ax({ scroll: 'hidden', surface: 'overlay', shape: 'xl', placement: 'anchor-below' })}
          style={{ positionAnchor: anchorName } as React.CSSProperties}
          onMouseDown={(e) => e.preventDefault()}
        >
          {optionIds.map((id) => {
            const entity = store.entities[id]
            if (!entity) return null
            const state = aria.getNodeState(id)
            const props = aria.getNodeProps(id) as React.HTMLAttributes<HTMLElement>
            return <React.Fragment key={id}>{render(props, entity, state)}</React.Fragment>
          })}
        </div>
      )}
    </div>
  )
}
