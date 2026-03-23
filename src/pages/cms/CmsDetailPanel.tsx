import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import type React from 'react'
import type { NormalizedData } from '../../interactive-os/core/types'
import type { CommandEngine } from '../../interactive-os/core/createCommandEngine'
import { renameCommands } from '../../interactive-os/plugins/rename'
import { collectEditableGroups } from './cms-schema'
import type { EditableGroup, EditableGroupEntry } from './cms-schema'
import { localized } from './cms-types'
import type { Locale, LocaleMap } from './cms-types'
import {
  Database, Cog, Keyboard, Shield, Table, List, Grid3X3,
  PanelTop, MessageSquare, Menu, Layers, ChevronDown, ChevronRight,
  MousePointerClick, ToggleLeft, Radio, Star, Heart, Zap, Globe,
  Settings, Search, Bell, Mail, Image, FileText, Lock, Unlock,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ── Icon catalog for picker ──

const CMS_ICONS: { key: string; Icon: LucideIcon }[] = [
  { key: 'database', Icon: Database },
  { key: 'cog', Icon: Cog },
  { key: 'shield', Icon: Shield },
  { key: 'keyboard', Icon: Keyboard },
  { key: 'table', Icon: Table },
  { key: 'list', Icon: List },
  { key: 'grid', Icon: Grid3X3 },
  { key: 'paneltop', Icon: PanelTop },
  { key: 'message', Icon: MessageSquare },
  { key: 'menu', Icon: Menu },
  { key: 'layers', Icon: Layers },
  { key: 'chevrondown', Icon: ChevronDown },
  { key: 'chevronright', Icon: ChevronRight },
  { key: 'click', Icon: MousePointerClick },
  { key: 'toggle', Icon: ToggleLeft },
  { key: 'radio', Icon: Radio },
  { key: 'star', Icon: Star },
  { key: 'heart', Icon: Heart },
  { key: 'zap', Icon: Zap },
  { key: 'globe', Icon: Globe },
  { key: 'settings', Icon: Settings },
  { key: 'search', Icon: Search },
  { key: 'bell', Icon: Bell },
  { key: 'mail', Icon: Mail },
  { key: 'image', Icon: Image },
  { key: 'file', Icon: FileText },
  { key: 'lock', Icon: Lock },
  { key: 'unlock', Icon: Unlock },
]

const CMS_ICON_MAP = new Map(CMS_ICONS.map(i => [i.key, i.Icon]))

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

// ── Shared hook: field value + commit logic ──

function useFieldCommit<T extends HTMLInputElement | HTMLTextAreaElement>(
  entry: EditableGroupEntry, store: NormalizedData, locale: Locale, engine: CommandEngine,
) {
  const elRef = useRef<T>(null)
  const snapshotRef = useRef<string>('')

  const entity = store.entities[entry.nodeId]
  const data = (entity?.data ?? {}) as Record<string, unknown>
  const rawValue = data[entry.field]

  const displayValue = entry.isLocaleMap
    ? localized(rawValue as string | LocaleMap, locale).text
    : (rawValue as string) ?? ''

  useEffect(() => {
    if (elRef.current && document.activeElement !== elRef.current) {
      elRef.current.value = displayValue
      snapshotRef.current = displayValue
    }
  }, [displayValue])

  const handleFocus = useCallback(() => {
    snapshotRef.current = elRef.current?.value ?? ''
  }, [])

  const handleCommit = useCallback(() => {
    const newText = elRef.current?.value.trim() ?? ''
    if (newText === snapshotRef.current || newText === '') return

    const newValue = entry.isLocaleMap
      ? { ...(rawValue as Record<string, string>), [locale]: newText }
      : newText
    engine.dispatch(renameCommands.confirmRename(entry.nodeId, entry.field, newValue))
    snapshotRef.current = newText
  }, [entry.nodeId, entry.field, entry.isLocaleMap, rawValue, locale, engine])

  const commitOnEnter = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCommit()
    }
  }, [handleCommit])

  return { elRef, displayValue, handleFocus, handleCommit, commitOnEnter }
}

// ── Field renderers ──

interface DetailFieldProps {
  entry: EditableGroupEntry
  store: NormalizedData
  locale: Locale
  engine: CommandEngine
}

function DetailField(props: DetailFieldProps) {
  switch (props.entry.fieldType) {
    case 'long-text': return <LongTextField {...props} />
    case 'url': return <UrlField {...props} />
    case 'icon': return <IconField {...props} />
    default: return <ShortTextField {...props} />
  }
}

function ShortTextField({ entry, store, locale, engine }: DetailFieldProps) {
  const { elRef, displayValue, handleFocus, handleCommit, commitOnEnter } = useFieldCommit<HTMLInputElement>(entry, store, locale, engine)

  return (
    <div className="cms-detail-field">
      <label className="cms-detail-field__label">{entry.label}</label>
      <input
        ref={elRef}
        className="cms-detail-field__input"
        type="text"
        defaultValue={displayValue}
        onFocus={handleFocus}
        onBlur={handleCommit}
        onKeyDown={commitOnEnter}
      />
    </div>
  )
}

function LongTextField({ entry, store, locale, engine }: DetailFieldProps) {
  const { elRef, displayValue, handleFocus, handleCommit } = useFieldCommit<HTMLTextAreaElement>(entry, store, locale, engine)

  return (
    <div className="cms-detail-field">
      <label className="cms-detail-field__label">{entry.label}</label>
      <textarea
        ref={elRef}
        className="cms-detail-field__textarea"
        defaultValue={displayValue}
        rows={4}
        onFocus={handleFocus}
        onBlur={handleCommit}
      />
    </div>
  )
}

function isValidUrl(value: string): boolean {
  try { new URL(value); return true } catch { return false }
}

function UrlField({ entry, store, locale, engine }: DetailFieldProps) {
  const { elRef, displayValue, handleFocus, handleCommit } = useFieldCommit<HTMLInputElement>(entry, store, locale, engine)
  const [invalid, setInvalid] = useState(false)

  const handleBlur = useCallback(() => {
    handleCommit()
    const val = elRef.current?.value.trim() ?? ''
    setInvalid(val !== '' && !isValidUrl(val))
  }, [handleCommit, elRef])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleBlur()
    }
  }, [handleBlur])

  return (
    <div className="cms-detail-field">
      <label className="cms-detail-field__label">{entry.label}</label>
      <input
        ref={elRef}
        className={`cms-detail-field__input${invalid ? ' cms-detail-field__input--invalid' : ''}`}
        type="url"
        defaultValue={displayValue}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}

function IconField({ entry, store, locale, engine }: DetailFieldProps) {
  const entity = store.entities[entry.nodeId]
  const data = (entity?.data ?? {}) as Record<string, unknown>
  const currentValue = (data[entry.field] as string) ?? ''

  const handleSelect = useCallback((key: string) => {
    if (key === currentValue) return
    engine.dispatch(renameCommands.confirmRename(entry.nodeId, entry.field, key))
  }, [entry.nodeId, entry.field, currentValue, engine])

  const CurrentIcon = CMS_ICON_MAP.get(currentValue)

  return (
    <div className="cms-detail-field">
      <label className="cms-detail-field__label">{entry.label}</label>
      {CurrentIcon && (
        <div className="cms-icon-field__current">
          <CurrentIcon size={16} /> <span>{currentValue}</span>
        </div>
      )}
      {!CurrentIcon && currentValue && (
        <div className="cms-icon-field__current cms-icon-field__current--fallback">
          <span>{currentValue}</span>
        </div>
      )}
      <div className="cms-icon-field__grid">
        {CMS_ICONS.map(({ key, Icon }) => (
          <button
            key={key}
            type="button"
            className={`cms-icon-field__option${key === currentValue ? ' cms-icon-field__option--selected' : ''}`}
            title={key}
            onClick={() => handleSelect(key)}
          >
            <Icon size={14} />
          </button>
        ))}
      </div>
    </div>
  )
}
