import React from 'react'
import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { useAria } from '../hooks/use-aria'
import { combobox as comboboxBehavior } from '../behaviors/combobox'
import { core } from '../plugins/core'
import { combobox as comboboxPlugin } from '../plugins/combobox'
import { ROOT_ID } from '../core/types'
import { getChildren } from '../core/normalized-store'

interface ComboboxProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (item: Record<string, unknown>, state: NodeState) => React.ReactNode
  placeholder?: string
}

export function Combobox({
  data,
  plugins = [core(), comboboxPlugin()],
  onChange,
  renderItem,
  placeholder = 'Select...',
}: ComboboxProps) {
  const aria = useAria({
    behavior: comboboxBehavior,
    data,
    plugins,
    onChange,
  })

  const store = aria.getStore()
  const isOpen = (store.entities['__combobox__']?.isOpen as boolean) ?? false
  const children = getChildren(store, ROOT_ID)

  const selectedId = aria.selected[0]
  const selectedEntity = selectedId ? store.entities[selectedId] : undefined
  const selectedLabel = selectedEntity?.data
    ? ((selectedEntity.data as Record<string, unknown>).label as string ?? selectedEntity.id)
    : ''

  const defaultRender = (item: Record<string, unknown>, state: NodeState) => (
    <div style={{
      padding: '6px 12px',
      background: state.focused ? 'var(--combo-focus-bg, #e3f2fd)' : state.selected ? 'var(--combo-select-bg, #e8f5e9)' : 'transparent',
      cursor: 'default',
      userSelect: 'none',
      fontSize: 14,
    }}>
      {(item.data as Record<string, unknown>)?.label as string ?? item.id}
    </div>
  )

  const render = renderItem ?? defaultRender

  return (
    <div>
      <input
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        value={selectedLabel}
        placeholder={placeholder}
        readOnly
        {...(aria.containerProps as React.InputHTMLAttributes<HTMLInputElement>)}
      />
      {isOpen && (
        <div role="listbox">
          {children.map(childId => {
            const entity = store.entities[childId]
            if (!entity) return null
            const state = aria.getNodeState(childId)
            const props = aria.getNodeProps(childId)
            return (
              <div key={childId} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
                {render(entity, state)}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
