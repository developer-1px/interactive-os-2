import React, { useState, useMemo } from 'react'
import { X } from 'lucide-react'
import styles from './Combobox.module.css'
import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { NodeState } from '../pattern/types'
import { useAria } from '../primitives/useAria'
import { combobox as comboboxBehavior } from '../pattern/roles/combobox'
import { selectionCommands } from '../axis/select'
import { focusCommands } from '../axis/navigate'
import { combobox as comboboxPlugin, comboboxCommands } from '../plugins/combobox'
import { ROOT_ID } from '../store/types'
import { createBatchCommand } from '../engine/types'
import { getChildren } from '../store/createStore'
import { mergeProps } from '../engine/mergeProps'

const CREATE_SENTINEL = '__create_option__'

interface ComboboxProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState) => React.ReactElement
  placeholder?: string
  editable?: boolean
  selectionMode?: 'single' | 'multiple'
  creatable?: boolean
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
  plugins,
  onChange,
  renderItem,
  placeholder = 'Select...',
  editable = false,
  selectionMode,
  creatable = false,
}: ComboboxProps) {
  const effectivePlugins = plugins ?? [comboboxPlugin({ selectionMode })]
  const [createOptionFocused, setCreateOptionFocused] = useState(false)
  const originalStore = data
  const rootChildren = getChildren(originalStore, ROOT_ID)

  const isGrouped = rootChildren.some(id => {
    const d = originalStore.entities[id]?.data as Record<string, string> | undefined
    return d?.type === 'group'
  })

  const behaviorData = useMemo(() => {
    const grouped = getChildren(data, ROOT_ID).some(id => {
      const d = data.entities[id]?.data as Record<string, string> | undefined
      return d?.type === 'group'
    })
    return grouped ? flattenGroups(data) : data
  }, [data])

  // When grouped, intercept onChange to restore group structure before propagating up.
  // The pattern engine operates on a flat store; callers expect the grouped structure.
  const handleChange = isGrouped && onChange
    ? (flatStore: NormalizedData) => onChange(restoreGroups(flatStore, originalStore))
    : onChange

  const aria = useAria({
    pattern: comboboxBehavior({ selectionMode }),
    data: behaviorData,
    plugins: effectivePlugins,
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

  // Filter children by filterText when editable (case-insensitive substring match)
  const visibleChildren = (editable || creatable) && filterText
    ? children.filter(id => {
        const entity = store.entities[id]
        if (!entity) return false
        const label = (entity.data as Record<string, unknown>)?.label as string ?? ''
        return label.toLowerCase().includes(filterText.toLowerCase())
      })
    : children

  // Determine if the create option should be shown:
  // creatable=true, dropdown open, filter text non-empty, and no items match the filter
  const showCreateOption = creatable && isOpen && filterText.length > 0 && visibleChildren.length === 0

  // Derive: create option can't be focused when not shown
  const effectiveCreateFocused = showCreateOption && createOptionFocused

  const handleCreate = (label: string) => {
    // Reduce locally to discover the new ID deterministically
    const newStore = comboboxCommands.create.reduce(store, label)
    const newChildren = getChildren(newStore, ROOT_ID)
    const newId = newChildren[newChildren.length - 1]!

    if (mode === 'multiple') {
      aria.dispatch(createBatchCommand([
        comboboxCommands.create(label),
        selectionCommands.toggleSelect(newId),
        comboboxCommands.setFilter(''),
      ]))
    } else {
      aria.dispatch(createBatchCommand([
        comboboxCommands.create(label),
        selectionCommands.select(newId),
        comboboxCommands.close(),
        comboboxCommands.setFilter(''),
      ]))
    }
    setCreateOptionFocused(false)
  }

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    aria.dispatch(comboboxCommands.setFilter(e.target.value))
    setCreateOptionFocused(false)
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

  const defaultRender = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState) => (
    <div {...props} className={`${styles.comboItem}${state.focused ? ` ${styles.comboItemFocused}` : ''}${state.selected ? ` ${styles.comboItemSelected}` : ''}`}>
      {(item.data as Record<string, unknown>)?.label as string ?? item.id}
    </div>
  )

  const render = renderItem ?? defaultRender

  const handleInputClick = () => {
    if (!isOpen) {
      aria.dispatch(comboboxCommands.open())
    }
  }

  const renderOption = (childId: string) => {
    const entity = store.entities[childId]
    if (!entity) return null
    const state = aria.getNodeState(childId)
    const props = aria.getNodeProps(childId)
    const handleOptionClick = () => {
      if (mode === 'multiple') {
        aria.dispatch(selectionCommands.toggleSelect(childId))
      } else {
        aria.dispatch(createBatchCommand([
          selectionCommands.select(childId),
          comboboxCommands.close(),
        ]))
      }
    }
    const optionProps = mergeProps(props as unknown as Record<string, unknown>, { key: childId, onClick: handleOptionClick }) as React.HTMLAttributes<HTMLElement>
    return render(optionProps, entity, state)
  }

  const inputValue = editable
    ? (isOpen ? filterText : selectedLabel)
    : selectedLabel

  // Wrap the pattern's onKeyDown to intercept create option navigation
  const behaviorOnKeyDown = (aria.containerProps as React.InputHTMLAttributes<HTMLInputElement>).onKeyDown
  const wrappedOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showCreateOption) {
      if (effectiveCreateFocused) {
        if (e.key === 'Enter') {
          e.preventDefault()
          handleCreate(filterText)
          return
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setCreateOptionFocused(false)
          // Focus last visible item in list
          const lastVisibleId = visibleChildren[visibleChildren.length - 1]
          if (lastVisibleId) aria.dispatch(focusCommands.setFocus(lastVisibleId))
          return
        }
        if (e.key === 'Escape') {
          // Fall through to pattern's Escape handler
        } else {
          // For all other keys when create option is focused, let the browser handle
          return
        }
      } else {
        // Not on create option yet — check if ArrowDown from last visible item
        if (e.key === 'ArrowDown') {
          const lastVisibleId = visibleChildren[visibleChildren.length - 1]
          if (aria.focused === lastVisibleId || visibleChildren.length === 0) {
            e.preventDefault()
            setCreateOptionFocused(true)
            return
          }
        }
      }
    }
    if (effectiveCreateFocused && e.key !== 'Escape') return
    behaviorOnKeyDown?.(e)
  }

  const handleBlur = () => {
    setCreateOptionFocused(false)
    if (isOpen) {
      aria.dispatch(comboboxCommands.close())
    }
  }

  const containerPropsWithWrappedKeyDown = {
    ...aria.containerProps,
    onKeyDown: wrappedOnKeyDown,
    onBlur: handleBlur,
  }

  return (
    <div>
      {mode === 'multiple' && (
        <div className="flex-row flex-wrap gap-xs items-center">
          <div role="list">
            {aria.selected.map((id) => (
              <span key={id} data-combobox-token role="listitem">
                {getLabel(id)}
                {' '}
                <button
                  type="button"
                  onClick={() => removeToken(id)}
                  aria-label={`Remove ${getLabel(id)}`}
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
          <input
            data-surface="input"
            className={styles.comboInput}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            value={filterText}
            placeholder={aria.selected.length === 0 ? placeholder : ''}
            onChange={handleInput}
            onClick={handleInputClick}
            {...(containerPropsWithWrappedKeyDown as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        </div>
      )}
      {mode !== 'multiple' && (
      <input
        data-surface="input"
        className={styles.comboInput}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        value={inputValue}
        placeholder={placeholder}
        readOnly={!editable}
        onChange={editable ? handleInput : undefined}
        onClick={handleInputClick}
        {...(containerPropsWithWrappedKeyDown as React.InputHTMLAttributes<HTMLInputElement>)}
      />
      )}
      {isOpen && (
        <div data-surface="overlay" className={`${styles.comboDropdown} overflow-hidden`} role="listbox" onMouseDown={(e) => e.preventDefault()}>
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
                  <div role="presentation">{groupData.label}</div>
                  {groupItems.map(itemId => renderOption(itemId))}
                </div>
              )
            })
          ) : (
            visibleChildren.map(childId => renderOption(childId))
          )}
          {showCreateOption && (
            <div
              data-combobox-create
              className={effectiveCreateFocused ? styles.comboItemFocused : undefined}
              onClick={() => handleCreate(filterText)}
              role="option"
              aria-selected="false"
              data-node-id={CREATE_SENTINEL}
            >
              Create &ldquo;{filterText}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  )
}
