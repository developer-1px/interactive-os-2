import React from 'react'
import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { useAria } from '../hooks/useAria'
import { combobox as comboboxBehavior } from '../behaviors/combobox'
import { core, selectionCommands } from '../plugins/core'
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
  selectionMode?: 'single' | 'multiple'
}

function flattenGroups(store: NormalizedData): NormalizedData {
  const flatChildren: string[] = []
  const newEntities = { ...store.entities }
  for (const childId of getChildren(store, ROOT_ID)) {
    const d = (store.entities[childId]?.data as Record<string, string>) ?? {}
    if (d.type === 'group') {
      flatChildren.push(...getChildren(store, childId))
      delete newEntities[childId]
    } else {
      flatChildren.push(childId)
    }
  }
  return {
    entities: newEntities,
    relationships: { ...store.relationships, [ROOT_ID]: flatChildren },
  }
}

/**
 * Restores group structure into a flat store that was produced by flattenGroups.
 * The originalStore provides the group entities and relationships to graft back in.
 */
function restoreGroups(flatStore: NormalizedData, originalStore: NormalizedData): NormalizedData {
  // Collect group entities and rebuild the root relationships from the original
  const restoredEntities = { ...flatStore.entities }
  const restoredRelationships = { ...flatStore.relationships }

  const origRootChildren = getChildren(originalStore, ROOT_ID)
  for (const childId of origRootChildren) {
    const d = (originalStore.entities[childId]?.data as Record<string, string>) ?? {}
    if (d.type === 'group') {
      // Add the group entity back
      restoredEntities[childId] = originalStore.entities[childId]!
      // Restore original group → children relationship
      restoredRelationships[childId] = getChildren(originalStore, childId)
    }
  }
  // Restore root → groups relationship
  restoredRelationships[ROOT_ID] = origRootChildren

  return { entities: restoredEntities, relationships: restoredRelationships }
}

export function Combobox({
  data,
  plugins = [core(), comboboxPlugin()],
  onChange,
  renderItem,
  placeholder = 'Select...',
  editable = false,
  selectionMode,
}: ComboboxProps) {
  const originalStore = data
  const rootChildren = getChildren(originalStore, ROOT_ID)

  const isGrouped = rootChildren.some(id => {
    const d = originalStore.entities[id]?.data as Record<string, string> | undefined
    return d?.type === 'group'
  })

  const behaviorData = isGrouped ? flattenGroups(originalStore) : data

  // When grouped, intercept onChange to restore group structure before propagating up.
  // The behavior engine operates on a flat store; callers expect the grouped structure.
  const handleChange = isGrouped && onChange
    ? (flatStore: NormalizedData) => onChange(restoreGroups(flatStore, originalStore))
    : onChange

  const aria = useAria({
    behavior: comboboxBehavior({ selectionMode }),
    data: behaviorData,
    plugins,
    onChange: handleChange,
  })

  const store = aria.getStore()
  const isOpen = (store.entities['__combobox__']?.isOpen as boolean) ?? false
  const filterText = (store.entities['__combobox__']?.filterText as string) ?? ''
  const children = getChildren(store, ROOT_ID)

  const mode = selectionMode ?? 'single'

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

  const getLabel = (id: string): string => {
    const entity = store.entities[id]
    return entity?.data
      ? ((entity.data as Record<string, unknown>).label as string ?? id)
      : id
  }

  const removeToken = (id: string) => {
    aria.dispatch(selectionCommands.toggleSelect(id))
  }

  const defaultRender = (item: Record<string, unknown>, state: NodeState) => (
    <div className={`combo-item${state.focused ? ' combo-item--focused' : ''}${state.selected ? ' combo-item--selected' : ''}`}>
      {(item.data as Record<string, unknown>)?.label as string ?? item.id}
    </div>
  )

  const render = renderItem ?? defaultRender

  const renderOption = (childId: string) => {
    const entity = store.entities[childId]
    if (!entity) return null
    const state = aria.getNodeState(childId)
    const props = aria.getNodeProps(childId)
    return (
      <div key={childId} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
        {render(entity, state)}
      </div>
    )
  }

  const inputValue = editable
    ? (isOpen ? filterText : selectedLabel)
    : selectedLabel

  return (
    <div>
      {mode === 'multiple' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
          <div role="list" className="combo-tokens">
            {aria.selected.map((id) => (
              <span key={id} data-combobox-token role="listitem" className="combo-token">
                {getLabel(id)}
                {' '}
                <button
                  type="button"
                  onClick={() => removeToken(id)}
                  aria-label={`Remove ${getLabel(id)}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            className="combo-input"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            value={filterText}
            placeholder={aria.selected.length === 0 ? placeholder : ''}
            onChange={handleInput}
            {...(aria.containerProps as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        </div>
      )}
      {mode !== 'multiple' && (
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
      )}
      {isOpen && (
        <div className="combo-dropdown" role="listbox">
          {isGrouped ? (
            rootChildren.map(groupId => {
              const group = originalStore.entities[groupId]
              const groupData = (group?.data ?? {}) as Record<string, string>
              if (groupData.type !== 'group') {
                return renderOption(groupId)
              }
              const groupItems = getChildren(originalStore, groupId)
              return (
                <div key={groupId} role="group" aria-label={groupData.label}>
                  <div role="presentation" className="combo-group-label">{groupData.label}</div>
                  {groupItems.map(itemId => renderOption(itemId))}
                </div>
              )
            })
          ) : (
            children.map(childId => renderOption(childId))
          )}
        </div>
      )}
    </div>
  )
}
