import { useRef, useEffect, useCallback, useMemo } from 'react'
import type React from 'react'
import type { NormalizedData } from '../../interactive-os/core/types'
import type { CommandEngine } from '../../interactive-os/core/createCommandEngine'
import { renameCommands } from '../../interactive-os/plugins/rename'
import { collectEditableGroups } from './cms-schema'
import type { EditableGroup, EditableGroupEntry } from './cms-schema'
import { localized } from './cms-types'
import type { Locale, LocaleMap } from './cms-types'

interface CmsDetailPanelProps {
  engine: CommandEngine
  store: NormalizedData
  focusedNodeId: string
  locale: Locale
  style?: React.CSSProperties
}

export default function CmsDetailPanel({ engine, store, focusedNodeId, locale, style }: CmsDetailPanelProps) {
  const groups = useMemo(
    () => focusedNodeId ? collectEditableGroups(store, focusedNodeId, locale) : [],
    [store, focusedNodeId, locale],
  )

  if (groups.length === 0) {
    return (
      <div className="cms-detail-panel" style={style}>
        <div className="cms-detail-panel__empty">
          {focusedNodeId ? 'No editable fields' : 'Select a node'}
        </div>
      </div>
    )
  }

  // Single group with no label → flat layout (backward-compatible with leaf nodes)
  if (groups.length === 1 && groups[0].groupLabel === '') {
    const entity = store.entities[focusedNodeId]
    const data = (entity?.data ?? {}) as Record<string, unknown>
    return (
      <div className="cms-detail-panel" style={style}>
        <div className="cms-detail-panel__header">
          <span className="cms-detail-panel__type">{data.type as string}</span>
        </div>
        <div className="cms-detail-panel__fields">
          {groups[0].entries.map((entry) => (
            <DetailField
              key={`${entry.nodeId}-${entry.field}`}
              entry={entry}
              store={store}
              locale={locale}
              engine={engine}
            />
          ))}
        </div>
      </div>
    )
  }

  // Multiple groups → grouped layout
  return (
    <div className="cms-detail-panel" style={style}>
      <div className="cms-detail-panel__groups">
        {groups.map((group) => (
          <DetailGroup
            key={group.groupLabel}
            group={group}
            store={store}
            locale={locale}
            engine={engine}
          />
        ))}
      </div>
    </div>
  )
}

function DetailGroup({ group, store, locale, engine }: {
  group: EditableGroup
  store: NormalizedData
  locale: Locale
  engine: CommandEngine
}) {
  return (
    <fieldset className="cms-detail-group">
      <legend className="cms-detail-group__label">{group.groupLabel}</legend>
      {group.entries.map((entry) => (
        <DetailField
          key={`${entry.nodeId}-${entry.field}`}
          entry={entry}
          store={store}
          locale={locale}
          engine={engine}
        />
      ))}
    </fieldset>
  )
}

function DetailField({ entry, store, locale, engine }: {
  entry: EditableGroupEntry
  store: NormalizedData
  locale: Locale
  engine: CommandEngine
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const snapshotRef = useRef<string>('')

  const entity = store.entities[entry.nodeId]
  const data = (entity?.data ?? {}) as Record<string, unknown>
  const rawValue = data[entry.field]

  const displayValue = entry.isLocaleMap
    ? localized(rawValue as string | LocaleMap, locale).text
    : (rawValue as string) ?? ''

  // Sync input with store value (undo/redo, external changes)
  useEffect(() => {
    if (inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.value = displayValue
      snapshotRef.current = displayValue
    }
  }, [displayValue])

  const handleFocus = () => {
    snapshotRef.current = inputRef.current?.value ?? ''
  }

  const handleCommit = useCallback(() => {
    const newText = inputRef.current?.value.trim() ?? ''
    if (newText === snapshotRef.current || newText === '') return

    const newValue = entry.isLocaleMap
      ? { ...(rawValue as Record<string, string>), [locale]: newText }
      : newText
    engine.dispatch(renameCommands.confirmRename(entry.nodeId, entry.field, newValue))
    snapshotRef.current = newText
  }, [entry.nodeId, entry.field, entry.isLocaleMap, rawValue, locale, engine])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCommit()
    }
  }, [handleCommit])

  return (
    <div className="cms-detail-field">
      <label className="cms-detail-field__label">{entry.label}</label>
      <input
        ref={inputRef}
        className="cms-detail-field__input"
        type="text"
        defaultValue={displayValue}
        onFocus={handleFocus}
        onBlur={handleCommit}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}
