/** @catalog 필터+값 선택 드롭다운 */
import React, { useState, useMemo, useRef, useEffect, useId } from 'react'
import { ax } from '@styles/ax'
import './Combobox.css'
import { CloseIndicator } from './indicators'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import { useAria } from '../primitives/useAria'
import { combobox as comboboxBehavior } from '../pattern/roles/combobox'
import { selectionCommands } from '../axis/select'
import { focusCommands } from '../core'
import { combobox as comboboxPlugin, comboboxCommands } from '../plugins/combobox'
import { ROOT_ID } from '../store/types'
import { createBatchCommand } from '../engine/types'
import { getChildren } from '../store/createStore'
import { mergeProps } from '../primitives/mergeProps'

const CREATE_SENTINEL = '__create_option__'

interface ComboboxProps extends AriaComponentProps {
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
  const rawId = useId()
  const anchorName = `--combo-${rawId.replace(/[^a-zA-Z0-9-]/g, '')}`
  const dropdownRef = useRef<HTMLDivElement>(null)
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
    const newStore = comboboxCommands.create.reduce(store, label)
    const newChildren = getChildren(newStore, ROOT_ID)
    const newId = newChildren[newChildren.length - 1]!

    const selectCmd = mode === 'multiple'
      ? selectionCommands.toggleSelect(newId)
      : selectionCommands.select(newId)
    const cmds = [comboboxCommands.create(label), selectCmd, comboboxCommands.setFilter('')]
    if (mode !== 'multiple') cmds.push(comboboxCommands.close())
    aria.dispatch(createBatchCommand(cmds))
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
    <div {...props} className={[
      ax({ interactive: 'item', role: 'item', content: 'text', layout: 'row', width: 'full' }),
    ].filter(Boolean).join(' ')} data-focused={state.focused || undefined} data-selected={state.selected || undefined}>
      {getNodeLabel(item)}
    </div>
  )

  const render = renderItem ?? defaultRender

  const handleInputClick = () => {
    if (!isOpen) {
      aria.dispatch(comboboxCommands.open())
    }
  }

  const selectOption = (childId: string) => {
    if (mode === 'multiple') {
      aria.dispatch(selectionCommands.toggleSelect(childId))
    } else {
      aria.dispatch(createBatchCommand([selectionCommands.select(childId), comboboxCommands.close()]))
    }
  }

  const renderOption = (childId: string) => {
    const entity = store.entities[childId]
    if (!entity) return null
    const state = aria.getNodeState(childId)
    const props = aria.getNodeProps(childId)
    const optionProps = mergeProps(props as unknown as Record<string, unknown>, { key: childId, onClick: () => selectOption(childId) }) as React.HTMLAttributes<HTMLElement>
    return render(optionProps, entity, state)
  }

  const inputValue = editable
    ? (isOpen ? filterText : selectedLabel)
    : selectedLabel

  const behaviorOnKeyDown = (aria.containerProps as React.InputHTMLAttributes<HTMLInputElement>).onKeyDown

  function handleCreateFocusedKey(e: React.KeyboardEvent<HTMLInputElement>): boolean {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCreate(filterText)
      return true
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCreateOptionFocused(false)
      const lastVisibleId = visibleChildren[visibleChildren.length - 1]
      if (lastVisibleId) aria.dispatch(focusCommands.setFocus(lastVisibleId))
      return true
    }
    if (e.key === 'Escape') return false
    return true
  }

  function handleCreateNavKey(e: React.KeyboardEvent<HTMLInputElement>): boolean {
    if (e.key === 'ArrowDown') {
      const lastVisibleId = visibleChildren[visibleChildren.length - 1]
      if (aria.focused === lastVisibleId || visibleChildren.length === 0) {
        e.preventDefault()
        setCreateOptionFocused(true)
        return true
      }
    }
    return false
  }

  const wrappedOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showCreateOption) {
      if (effectiveCreateFocused && handleCreateFocusedKey(e)) return
      if (!effectiveCreateFocused && handleCreateNavKey(e)) return
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

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      dropdownRef.current.showPopover?.()

    }
  }, [isOpen])

  const containerPropsWithWrappedKeyDown = {
    ...aria.containerProps,
    onKeyDown: wrappedOnKeyDown,
    onBlur: handleBlur,
  }

  const inputClass = ax({ surface: 'input', role: 'control', width: 'full', content: 'text', clamp: '1' })
  const anchorStyle = { anchorName } as React.CSSProperties
  const inputProps = containerPropsWithWrappedKeyDown as React.InputHTMLAttributes<HTMLInputElement>

  const renderGroupedOptions = () =>
    rootChildren.map(groupId => {
      const group = originalStore.entities[groupId]
      const groupData = (group?.data ?? {}) as Record<string, string>
      if (groupData.type !== 'group') return renderOption(groupId)
      const groupItems = getChildren(originalStore, groupId)
      return (
        <div key={groupId} role="group" aria-label={groupData.label}>
          <div role="presentation">{groupData.label}</div>
          {groupItems.map(itemId => renderOption(itemId))}
        </div>
      )
    })

  return (
    <div>
      {mode === 'multiple' ? (
        <div className={ax({ layout: 'bar' })} style={anchorStyle}>
          <div role="list">
            {aria.selected.map((id) => (
              <span key={id} data-combobox-token role="listitem">
                {getLabel(id)}
                {' '}
                <button type="button" className={ax({ role: 'control', surface: 'ghost', layout: 'center', content: 'icon' })} onClick={() => removeToken(id)} aria-label={`Remove ${getLabel(id)}`}>
                  <CloseIndicator />
                </button>
              </span>
            ))}
          </div>
          <input
            className={inputClass}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            value={filterText}
            placeholder={aria.selected.length === 0 ? placeholder : ''}
            onChange={handleInput}
            onClick={handleInputClick}
            {...inputProps}
          />
        </div>
      ) : (
        <input
          className={inputClass}
          style={anchorStyle}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          value={inputValue}
          placeholder={placeholder}
          readOnly={!editable}
          onChange={editable ? handleInput : undefined}
          onClick={handleInputClick}
          {...inputProps}
        />
      )}
      {isOpen && (
        <div ref={dropdownRef} popover="manual" className={`${ax({ role: 'tip', surface: 'overlay', placement: 'anchor-below' })} combo-dropdown`} style={{ positionAnchor: anchorName } as React.CSSProperties} role="listbox" onMouseDown={(e) => e.preventDefault()}>
          {isGrouped ? renderGroupedOptions() : visibleChildren.map(childId => renderOption(childId))}
          {showCreateOption && (
            <div
              data-combobox-create
              className={ax({ interactive: 'item', role: 'item', content: 'text', layout: 'row', width: 'full' })}
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
