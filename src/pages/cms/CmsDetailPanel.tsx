// @useState-hatch — field renderers use uncontrolled refs for commit-on-blur pattern
import { useRef, useEffect, useCallback, useMemo } from 'react'
import type React from 'react'
import type { NormalizedData } from '@os/store/types'
import type { CommandEngine } from '@os/engine/createCommandEngine'
import { renameCommands } from '@os/plugins/rename'
import { historyCommands } from '@os/plugins/history'
import { collectEditableGroups } from './cmsSchema'
import type { EditableGroupEntry } from './cmsSchema'
import { localized } from './cmsTypes'
import type { Locale, LocaleMap } from './cmsTypes'
import { CMS_ICONS, CMS_ICON_MAP } from './cmsIcons'
import { CmsIcon } from './cmsRenderers'
import { LOCALES } from './cmsTypes'
import { Sheet, ImagePlus, X } from 'lucide-react'
import { ax } from '@styles/ax'
import { getParent } from '@os/store/createStore'
import { ScrollArea } from '@os/ui/ScrollArea'
import { Form } from '@os/ui/Form'
import type { NodeState } from '@os/pattern/types'

const fieldId = (entry: EditableGroupEntry) => `cms-${entry.nodeId}-${entry.field}`

function buildBreadcrumb(store: NormalizedData, nodeId: string, locale: Locale): string {
  const path: string[] = []
  let current: string | null = nodeId
  let depth = 0
  while (current && current !== 'root' && depth++ < 20) {
    const entity = store.entities[current]
    if (entity) {
      const data = entity.data as Record<string, unknown>
      const type = data.type as string
      const nameField = data.title ?? data.label ?? data.value ?? data.variant ?? data.name
      const name = nameField
        ? (typeof nameField === 'object' ? localized(nameField as LocaleMap, locale).text : String(nameField))
        : ''
      path.unshift(name ? `${type}: ${name}` : type)
    }
    current = getParent(store, current) ?? null
  }
  return path.join(' \u203A ')
}

interface CmsDetailPanelProps {
  engine: CommandEngine
  store: NormalizedData
  focusedNodeId: string
  locale: Locale
  onLocaleChange: (locale: Locale) => void
  i18nSheetOpen: boolean
  onI18nSheetToggle: () => void
  onEscape?: () => void
  autoFocus?: boolean
  style?: React.CSSProperties
}

export default function CmsDetailPanel({ engine, store, focusedNodeId, locale, onLocaleChange, i18nSheetOpen, onI18nSheetToggle, onEscape, autoFocus, style }: CmsDetailPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Form's initialFocus sets ARIA state only; DOM focus needs explicit move.
  // Only fire when autoFocus transitions to true — otherwise canvas clicks would
  // steal DOM focus into the detail panel via focusedNodeId changes.
  useEffect(() => {
    if (!autoFocus) return
    const raf = requestAnimationFrame(() => {
      const root = containerRef.current
      if (!root) return
      const el =
        root.querySelector<HTMLElement>('.cms-detail-field input, .cms-detail-field textarea') ??
        root.querySelector<HTMLElement>('[tabindex]:not([tabindex="-1"])')
      el?.focus()
    })
    return () => cancelAnimationFrame(raf)
  }, [autoFocus])

  const breadcrumb = useMemo(
    () => focusedNodeId ? buildBreadcrumb(store, focusedNodeId, locale) : '',
    [store, focusedNodeId, locale],
  )

  const groups = useMemo(
    () => focusedNodeId ? collectEditableGroups(store, focusedNodeId, locale) : [],
    [store, focusedNodeId, locale],
  )

  const localeBar = (
    <div className={`cms-detail-panel__locale-bar ${ax({ layout: 'bar', flex: 'none', gap: 'xs', padding: 'xs', border: 'bottom' })}`}>
      <select
        className={`cms-detail-panel__locale ${ax({ role: 'control', surface: 'input', flex: '1', text: 'primary', content: 'text' })} cursor-pointer min-w-0`}
        value={locale}
        onChange={e => onLocaleChange(e.target.value as Locale)}
      >
        {LOCALES.map(l => <option key={l} value={l}>{l}</option>)}
      </select>
      <button
        className={`cms-detail-panel__i18n-btn ${ax({ layout: 'center', square: 'lg', shape: 'md', text: 'muted' })} border-none cursor-pointer${i18nSheetOpen ? ' cms-detail-panel__i18n-btn--active' : ''}`}
        onClick={onI18nSheetToggle}
        title="Translation sheet"
        type="button"
      >
        <Sheet size={14} />
      </button>
    </div>
  )

  const renderField = useCallback((
    _props: React.HTMLAttributes<HTMLElement>,
    entry: EditableGroupEntry,
    state: NodeState,
  ): React.ReactElement => {
    const fieldProps = { entry, store, locale, engine, expanded: state.expanded }
    switch (entry.fieldType) {
      case 'long-text': return <LongTextField {...fieldProps} />
      case 'url': return <UrlField {...fieldProps} />
      case 'icon': return <IconField {...fieldProps} />
      case 'image': return <ImageField {...fieldProps} />
      default: return <ShortTextField {...fieldProps} />
    }
  }, [store, locale, engine])

  if (groups.length === 0) {
    return (
      <ScrollArea className={`cms-detail-panel ${ax({ flex: 'none', surface: 'sunken', border: 'start' })}`} style={style}>
        {localeBar}
        <div className={`cms-detail-panel__empty text-center ${ax({ padding: 'lg', textStyle: 'body', text: 'muted' })}`}>
          {focusedNodeId ? 'No editable fields' : 'Select a node'}
        </div>
      </ScrollArea>
    )
  }

  return (
    <ScrollArea ref={containerRef} className={`cms-detail-panel ${ax({ flex: 'none', surface: 'sunken', border: 'start' })}`} style={style}>
      {localeBar}
      {breadcrumb && (
        <div className={`cms-detail-panel__breadcrumb ${ax({ padding: 'xs', textStyle: 'caption', text: 'muted', border: 'bottom' })}`}
             aria-label="Edit path">
          {breadcrumb}
        </div>
      )}
      <Form
        engine={engine}
        store={store}
        groups={groups}
        scope="detail"
        renderField={renderField}
        onEscape={onEscape}
        initialFocus={groups[0]?.entries[0]?.nodeId}
        aria-label="Detail panel"
      />
    </ScrollArea>
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
    if (!elRef.current) return
    // Sync from store unless the user has actively edited (value differs from snapshot)
    const userHasEdited = document.activeElement === elRef.current && elRef.current.value !== snapshotRef.current
    if (!userHasEdited) {
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

  const commitRef = useRef(handleCommit)
  useEffect(() => { commitRef.current = handleCommit }, [handleCommit])

  useEffect(() => {
    return () => { commitRef.current() }
  }, [])

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
  expanded?: boolean
}

function ShortTextField({ entry, store, locale, engine }: DetailFieldProps) {
  const { elRef, displayValue, handleFocus, handleCommit, handleFieldKeyDown } = useFieldCommit<HTMLTextAreaElement>(entry, store, locale, engine)

  return (
    <div className={`cms-detail-field ${ax({ layout: 'stack', gap: 'xs' })}`}>
      <label className={`cms-detail-field__label ${ax({ textStyle: 'caption', weight: 'semi', text: 'muted' })}`} htmlFor={fieldId(entry)}>{entry.label}</label>
      <textarea
        ref={elRef}
        id={fieldId(entry)}
        className={`cms-detail-field__textarea ${ax({ surface: 'input', padding: 'xs', textStyle: 'body', text: 'primary', shape: 'md' })} w-full outline-none resize-none`}
        name={`${entry.nodeId}.${entry.field}`}
        data-field={`${entry.nodeId}.${entry.field}`}
        defaultValue={displayValue}
        rows={2}
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
    <div className={`cms-detail-field ${ax({ layout: 'stack', gap: 'xs' })}`}>
      <label className={`cms-detail-field__label ${ax({ textStyle: 'caption', weight: 'semi', text: 'muted' })}`} htmlFor={fieldId(entry)}>{entry.label}</label>
      <textarea
        ref={elRef}
        id={fieldId(entry)}
        className={`cms-detail-field__textarea ${ax({ surface: 'input', padding: 'xs', textStyle: 'body', text: 'primary', shape: 'md' })} w-full outline-none`}
        name={`${entry.nodeId}.${entry.field}`}
        data-field={`${entry.nodeId}.${entry.field}`}
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
    <div className={`cms-detail-field ${ax({ layout: 'stack', gap: 'xs' })}`}>
      <label className={`cms-detail-field__label ${ax({ textStyle: 'caption', weight: 'semi', text: 'muted' })}`} htmlFor={fieldId(entry)}>{entry.label}</label>
      <input
        ref={elRef}
        id={fieldId(entry)}
        className={`cms-detail-field__input ${ax({ role: 'control', surface: 'input', text: 'primary', content: 'text' })} w-full outline-none`}
        type="url"
        name={`${entry.nodeId}.${entry.field}`}
        data-field={`${entry.nodeId}.${entry.field}`}
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
    <div className={`cms-detail-field ${ax({ layout: 'stack', gap: 'xs' })}`} data-field={`${entry.nodeId}.${entry.field}`}>
      <label className={`cms-detail-field__label ${ax({ textStyle: 'caption', weight: 'semi', text: 'muted' })}`}>{entry.label}</label>
      {currentSrc ? (
        <div className={ax({ placement: 'relative' })}>
          <img src={currentSrc} alt="" className={`cms-image-field__preview w-full object-cover ${ax({ shape: 'md' })}`} />
          <div className={`cms-image-field__actions absolute ${ax({ layout: 'row', gap: 'xs' })}`}>
            <button
              type="button"
              className={`cms-image-field__action ${ax({ layout: 'center', square: 'md', shape: 'sm', surface: 'ghost', text: 'primary', opacity: 'hidden' })} border-none cursor-pointer`}
              onClick={() => fileRef.current?.click()}
              title="Replace"
            >
              <ImagePlus size={14} />
            </button>
            <button
              type="button"
              className={`cms-image-field__action ${ax({ layout: 'center', square: 'md', shape: 'sm', surface: 'ghost', text: 'primary', opacity: 'hidden' })} border-none cursor-pointer`}
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
          className={`cms-image-field__placeholder ${ax({ surface: 'placeholder', layout: 'center', gap: 'xs', shape: 'md', textStyle: 'caption' })} w-full`}
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

function IconField({ entry, store, engine, expanded }: DetailFieldProps) {
  const entity = store.entities[entry.nodeId]
  const data = (entity?.data ?? {}) as Record<string, unknown>
  const currentValue = (data[entry.field] as string) ?? ''
  const isExpanded = expanded ?? false

  const handleSelect = useCallback((iconKey: string) => {
    if (iconKey === currentValue) return
    engine.dispatch(renameCommands.confirmRename(entry.nodeId, entry.field, iconKey))
  }, [entry.nodeId, entry.field, currentValue, engine])

  const hasIcon = CMS_ICON_MAP.has(currentValue)

  return (
    <div className={`cms-detail-field ${ax({ layout: 'stack', gap: 'xs' })}`} data-field={`${entry.nodeId}.${entry.field}`}>
      <label className={`cms-detail-field__label ${ax({ textStyle: 'caption', weight: 'semi', text: 'muted' })}`}>{entry.label}</label>
      <button
        type="button"
        className={`cms-icon-field__current ${ax({ role: 'control', surface: 'input', text: 'secondary', content: 'text' })} cursor-pointer${!hasIcon && currentValue ? ' cms-icon-field__current--fallback' : ''}`}
      >
        <CmsIcon name={currentValue} size={16} />
        <span>{currentValue || 'none'}</span>
      </button>
      {isExpanded && (
        <div className="cms-icon-field__grid grid">
          {CMS_ICONS.map(({ key: iconKey, Icon }) => (
            <button
              key={iconKey}
              type="button"
              className={`cms-icon-field__option ${ax({ surface: 'ghost', layout: 'center', square: 'lg', shape: 'md', text: 'secondary' })}${iconKey === currentValue ? ' cms-icon-field__option--selected' : ''}`}
              title={iconKey}
              onClick={() => handleSelect(iconKey)}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
