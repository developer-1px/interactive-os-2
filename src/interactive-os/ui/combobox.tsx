import React from 'react'
import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { useAria } from '../hooks/useAria'
import { combobox as comboboxBehavior } from '../behaviors/combobox'
import { core } from '../plugins/core'
import { combobox as comboboxPlugin, comboboxCommands } from '../plugins/combobox'
import { ROOT_ID } from '../core/types'
import { getChildren } from '../core/createStore'

interface ComboboxProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (item: Record<string, unknown>, state: NodeState) => React.ReactNode
  placeholder?: string
  editable?: boolean
}

export function Combobox({
  data,
  plugins = [core(), comboboxPlugin()],
  onChange,
  renderItem,
  placeholder = 'Select...',
  editable = false,
}: ComboboxProps) {
  const aria = useAria({
    behavior: comboboxBehavior,
    data,
    plugins,
    onChange,
  })

  const store = aria.getStore()
  const isOpen = (store.entities['__combobox__']?.isOpen as boolean) ?? false
  const filterText = (store.entities['__combobox__']?.filterText as string) ?? ''
  const children = getChildren(store, ROOT_ID)

  const selectedId = aria.selected[0]
  const selectedEntity = selectedId ? store.entities[selectedId] : undefined
  const selectedLabel = selectedEntity?.data
    ? ((selectedEntity.data as Record<string, unknown>).label as string ?? selectedEntity.id)
    : ''

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    aria.dispatch(comboboxCommands.setFilter(e.target.value))
    if (!isOpen) {
      aria.dispatch(comboboxCommands.open())
    }
  }

  const defaultRender = (item: Record<string, unknown>, state: NodeState) => (
    <div className={`combo-item${state.focused ? ' combo-item--focused' : ''}${state.selected ? ' combo-item--selected' : ''}`}>
      {(item.data as Record<string, unknown>)?.label as string ?? item.id}
    </div>
  )

  const render = renderItem ?? defaultRender

  const inputValue = editable
    ? (isOpen ? filterText : selectedLabel)
    : selectedLabel

  return (
    <div>
      <input
        className="combo-input"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        value={inputValue}
        placeholder={placeholder}
        readOnly={!editable}
        onChange={editable ? handleInput : undefined}
        {...(aria.containerProps as React.InputHTMLAttributes<HTMLInputElement>)}
      />
      {isOpen && (
        <div className="combo-dropdown" role="listbox">
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
