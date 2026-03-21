import { useRef, useEffect, useCallback } from 'react'
import type { NormalizedData } from '../../interactive-os/core/types'
import type { CommandEngine } from '../../interactive-os/core/createCommandEngine'
import { renameCommands } from '../../interactive-os/plugins/rename'
import { getEditableFields } from './cms-renderers'
import { localized } from './cms-types'
import type { Locale, LocaleMap } from './cms-types'

interface CmsDetailPanelProps {
  engine: CommandEngine
  store: NormalizedData
  focusedNodeId: string
  locale: Locale
}

export default function CmsDetailPanel({ engine, store, focusedNodeId, locale }: CmsDetailPanelProps) {
  const entity = focusedNodeId ? store.entities[focusedNodeId] : null
  const data = (entity?.data ?? {}) as Record<string, unknown>
  const fields = entity ? getEditableFields(data) : []

  if (!entity || fields.length === 0) {
    return (
      <div className="cms-detail-panel">
        <div className="cms-detail-panel__empty">
          {focusedNodeId ? 'No editable fields' : 'Select a node'}
        </div>
      </div>
    )
  }

  return (
    <div className="cms-detail-panel">
      <div className="cms-detail-panel__header">
        <span className="cms-detail-panel__type">{data.type as string}</span>
      </div>
      <div className="cms-detail-panel__fields">
        {fields.map((f) => (
          <DetailField
            key={`${focusedNodeId}-${f.field}`}
            nodeId={focusedNodeId}
            field={f.field}
            label={f.label}
            isLocaleMap={f.isLocaleMap}
            rawValue={data[f.field]}
            locale={locale}
            engine={engine}
          />
        ))}
      </div>
    </div>
  )
}

function DetailField({ nodeId, field, label, isLocaleMap, rawValue, locale, engine }: {
  nodeId: string
  field: string
  label: string
  isLocaleMap: boolean
  rawValue: unknown
  locale: Locale
  engine: CommandEngine
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const snapshotRef = useRef<string>('')

  const displayValue = isLocaleMap
    ? localized(rawValue as string | LocaleMap, locale).text
    : (rawValue as string) ?? ''

  // Sync input with store value (undo/redo, external changes)
  useEffect(() => {
    if (inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.value = displayValue
      snapshotRef.current = displayValue
    }
  }, [displayValue])

  // Set initial snapshot on focus
  const handleFocus = useCallback(() => {
    snapshotRef.current = inputRef.current?.value ?? ''
  }, [])

  const handleCommit = useCallback(() => {
    const newText = inputRef.current?.value.trim() ?? ''
    if (newText === snapshotRef.current || newText === '') return

    const newValue = isLocaleMap
      ? { ...(rawValue as Record<string, string>), [locale]: newText }
      : newText
    engine.dispatch(renameCommands.confirmRename(nodeId, field, newValue))
    snapshotRef.current = newText
  }, [nodeId, field, isLocaleMap, rawValue, locale, engine])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCommit()
    }
  }, [handleCommit])

  return (
    <div className="cms-detail-field">
      <label className="cms-detail-field__label">{label}</label>
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
