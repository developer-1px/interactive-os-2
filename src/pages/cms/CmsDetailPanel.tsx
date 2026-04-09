// @useState-hatch — expanded (IconField disclosure): conditional render toggle, needs re-render
import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import type React from 'react'
import type { NormalizedData } from '@os/store/types'
import type { CommandEngine } from '@os/engine/createCommandEngine'
import { renameCommands } from '@os/plugins/rename'
import { historyCommands } from '@os/plugins/history'
import { collectEditableGroups } from './cmsSchema'
import type { EditableGroup, EditableGroupEntry } from './cmsSchema'
import { localized } from './cmsTypes'
import type { Locale, LocaleMap } from './cmsTypes'
import { CMS_ICONS, CMS_ICON_MAP } from './cmsIcons'
import { CmsIcon } from './cmsRenderers'
import { LOCALES } from './cmsTypes'
import { Sheet, ImagePlus, X } from 'lucide-react'
import { ax } from '@styles/ax'
import { ScrollArea } from '@os/ui/ScrollArea'

interface CmsDetailPanelProps {
  engine: CommandEngine
  store: NormalizedData
  focusedNodeId: string
  locale: Locale
  onLocaleChange: (locale: Locale) => void
  i18nSheetOpen: boolean
  onI18nSheetToggle: () => void
  style?: React.CSSProperties
}

export default function CmsDetailPanel({ engine, store, focusedNodeId, locale, onLocaleChange, i18nSheetOpen, onI18nSheetToggle, style }: CmsDetailPanelProps) {
  const groups = useMemo(
    () => focusedNodeId ? collectEditableGroups(store, focusedNodeId, locale) : [],
    [store, focusedNodeId, locale],
  )

  const localeBar = (
    <div className={`cms-detail-panel__locale-bar ${ax({ layout: 'bar', flex: 'none' })}`}>
      <select
        className={`cms-detail-panel__locale ${ax({ surface: 'input', flex: '1' })} cursor-pointer min-w-0`}
        value={locale}
        onChange={e => onLocaleChange(e.target.value as Locale)}
      >
        {LOCALES.map(l => <option key={l} value={l}>{l}</option>)}
      </select>
      <button
        className={`cms-detail-panel__i18n-btn ${ax({ layout: 'center' })} border-none cursor-pointer${i18nSheetOpen ? ' cms-detail-panel__i18n-btn--active' : ''}`}
        onClick={onI18nSheetToggle}
        title="Translation sheet"
        type="button"
      >
        <Sheet size={14} />
      </button>
    </div>
  )

  if (groups.length === 0) {
    return (
      <ScrollArea className={`cms-detail-panel ${ax({ flex: 'none' })}`} style={style}>
        {localeBar}
        <div className="cms-detail-panel__empty text-center">
          {focusedNodeId ? 'No editable fields' : 'Select a node'}
        </div>
      </ScrollArea>
    )
  }

  if (groups.length === 1 && groups[0].groupLabel === '') {
    const entity = store.entities[focusedNodeId]
    const data = (entity?.data ?? {}) as Record<string, unknown>
    return (
      <ScrollArea className={`cms-detail-panel ${ax({ flex: 'none' })}`} style={style}>
        {localeBar}
        <div className="cms-detail-panel__header">
          <span className="cms-detail-panel__type">{data.type as string}</span>
        </div>
        <div className={`cms-detail-panel__fields ${ax({ layout: 'column' })}`}>
          {groups[0].entries.map((entry) => (
            <DetailField
              key={`${entry.nodeId}-${entry.field}`}
              entry={entry}
              store={store}
              locale={locale}
              engine={engine}
              defaultExpanded
            />
          ))}
        </div>
      </ScrollArea>
    )
  }

  return (
    <ScrollArea className={`cms-detail-panel ${ax({ flex: 'none' })}`} style={style}>
      {localeBar}
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
    </ScrollArea>
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

  const handleFieldKeyDown = useCallback((e: React.KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey
    if (mod && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      handleCommit()
      engine.dispatch(historyCommands.undo())
    } else if (mod && e.key === 'z' && e.shiftKey) {
      e.preventDefault()
      engine.dispatch(historyCommands.redo())
    } else if (e.key === 'Enter') {
      e.preventDefault()
      handleCommit()
    }
  }, [handleCommit, engine])

  return { elRef, displayValue, handleFocus, handleCommit, handleFieldKeyDown }
}

// ── Field renderers ──

interface DetailFieldProps {
  entry: EditableGroupEntry
  store: NormalizedData
  locale: Locale
  engine: CommandEngine
  defaultExpanded?: boolean
}

function DetailField(props: DetailFieldProps) {
  switch (props.entry.fieldType) {
    case 'long-text': return <LongTextField {...props} />
    case 'url': return <UrlField {...props} />
    case 'icon': return <IconField {...props} />
    case 'image': return <ImageField {...props} />
    default: return <ShortTextField {...props} />
  }
}

function ShortTextField({ entry, store, locale, engine }: DetailFieldProps) {
  const { elRef, displayValue, handleFocus, handleCommit, handleFieldKeyDown } = useFieldCommit<HTMLInputElement>(entry, store, locale, engine)

  return (
    <div className={`cms-detail-field ${ax({ layout: 'column' })}`}>
      <label className="cms-detail-field__label">{entry.label}</label>
      <input
        ref={elRef}
        className={`cms-detail-field__input ${ax({ surface: 'input' })} w-full outline-none`}
        type="text"
        defaultValue={displayValue}
        onFocus={handleFocus}
        onBlur={handleCommit}
        onKeyDown={handleFieldKeyDown}
      />
    </div>
  )
}

function LongTextField({ entry, store, locale, engine }: DetailFieldProps) {
  const { elRef, displayValue, handleFocus, handleCommit } = useFieldCommit<HTMLTextAreaElement>(entry, store, locale, engine)

  return (
    <div className={`cms-detail-field ${ax({ layout: 'column' })}`}>
      <label className="cms-detail-field__label">{entry.label}</label>
      <textarea
        ref={elRef}
        className={`cms-detail-field__textarea ${ax({ surface: 'input' })} w-full outline-none`}
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

  const syncInvalid = useCallback(() => {
    const val = elRef.current?.value.trim() ?? ''
    const isInvalid = val !== '' && !isValidUrl(val)
    elRef.current?.setAttribute('aria-invalid', String(isInvalid))
  }, [elRef])

  const handleBlur = useCallback(() => {
    handleCommit()
    syncInvalid()
  }, [handleCommit, syncInvalid])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleBlur()
    }
  }, [handleBlur])

  return (
    <div className={`cms-detail-field ${ax({ layout: 'column' })}`}>
      <label className="cms-detail-field__label">{entry.label}</label>
      <input
        ref={elRef}
        className={`cms-detail-field__input ${ax({ surface: 'input' })} w-full outline-none`}
        type="url"
        defaultValue={displayValue}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}

function ImageField({ entry, store, engine }: DetailFieldProps) {
  const entity = store.entities[entry.nodeId]
  const data = (entity?.data ?? {}) as Record<string, unknown>
  const currentSrc = (data[entry.field] as string) ?? ''
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      engine.dispatch(renameCommands.confirmRename(entry.nodeId, entry.field, dataUrl))
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [entry.nodeId, entry.field, engine])

  const handleRemove = useCallback(() => {
    engine.dispatch(renameCommands.confirmRename(entry.nodeId, entry.field, ''))
  }, [entry.nodeId, entry.field, engine])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      fileRef.current?.click()
    }
  }, [])

  return (
    <div className={`cms-detail-field ${ax({ layout: 'column' })}`}>
      <label className="cms-detail-field__label">{entry.label}</label>
      {currentSrc ? (
        <div className="relative">
          <img src={currentSrc} alt="" className="cms-image-field__preview w-full object-cover" />
          <div className={`cms-image-field__actions absolute ${ax({ layout: 'row' })}`}>
            <button
              type="button"
              className={`cms-image-field__action ${ax({ layout: 'center' })} border-none cursor-pointer`}
              onClick={() => fileRef.current?.click()}
              title="Replace"
            >
              <ImagePlus size={14} />
            </button>
            <button
              type="button"
              className={`cms-image-field__action ${ax({ layout: 'center' })} border-none cursor-pointer`}
              onClick={handleRemove}
              title="Remove"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={`cms-image-field__placeholder ${ax({ surface: 'placeholder', layout: 'center' })} w-full`}
          onClick={() => fileRef.current?.click()}
          onKeyDown={handleKeyDown}
        >
          <ImagePlus size={20} />
          <span>Select image</span>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}

function IconField({ entry, store, engine, defaultExpanded }: DetailFieldProps) {
  const entity = store.entities[entry.nodeId]
  const data = (entity?.data ?? {}) as Record<string, unknown>
  const currentValue = (data[entry.field] as string) ?? ''
  const [expanded, setExpanded] = useState(defaultExpanded ?? false)

  const handleSelect = useCallback((key: string) => {
    if (key === currentValue) return
    engine.dispatch(renameCommands.confirmRename(entry.nodeId, entry.field, key))
    if (!defaultExpanded) setExpanded(false)
  }, [entry.nodeId, entry.field, currentValue, engine, defaultExpanded])

  const hasIcon = CMS_ICON_MAP.has(currentValue)

  return (
    <div className={`cms-detail-field ${ax({ layout: 'column' })}`}>
      <label className="cms-detail-field__label">{entry.label}</label>
      <button
        type="button"
        className={`cms-icon-field__current ${ax({ surface: 'input', layout: 'bar' })} cursor-pointer${!hasIcon && currentValue ? ' cms-icon-field__current--fallback' : ''}`}
        onClick={() => setExpanded(v => !v)}
      >
        <CmsIcon name={currentValue} size={16} />
        <span>{currentValue || 'none'}</span>
      </button>
      {expanded && (
        <div className="cms-icon-field__grid grid">
          {CMS_ICONS.map(({ key, Icon }) => (
            <button
              key={key}
              type="button"
              className={`cms-icon-field__option ${ax({ surface: 'ghost', layout: 'center' })}${key === currentValue ? ' cms-icon-field__option--selected' : ''}`}
              title={key}
              onClick={() => handleSelect(key)}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
