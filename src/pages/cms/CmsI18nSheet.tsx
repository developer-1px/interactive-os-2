import { useState } from 'react'
import type { NormalizedData } from '../../interactive-os/core/types'
import type { CommandEngine } from '../../interactive-os/core/createCommandEngine'
import { renameCommands } from '../../interactive-os/plugins/rename'
import type { Locale, LocaleMap } from './cms-types'
import { LOCALES } from './cms-types'
import { localeFieldsOf } from './cms-schema'

interface TranslatableEntry {
  entityId: string
  field: string
  label: string
  value: LocaleMap
}

function getTranslatableEntries(data: NormalizedData): TranslatableEntry[] {
  const entries: TranslatableEntry[] = []
  for (const [id, entity] of Object.entries(data.entities)) {
    if (id.startsWith('__')) continue
    const d = entity.data as Record<string, unknown> | undefined
    if (!d) continue
    const type = d.type as string | undefined
    if (!type) continue
    for (const field of localeFieldsOf(type)) {
      const value = d[field]
      if (value && typeof value === 'object' && 'ko' in value) {
        entries.push({ entityId: id, field, label: `${id}.${field}`, value: value as LocaleMap })
      }
    }
  }
  return entries
}

interface EditingCell {
  entityId: string
  field: string
  locale: Locale
}

interface CmsI18nSheetProps {
  engine: CommandEngine
  store: NormalizedData
  open: boolean
}

export default function CmsI18nSheet({ engine, store, open }: CmsI18nSheetProps) {
  const [editing, setEditing] = useState<EditingCell | null>(null)
  const [draft, setDraft] = useState('')

  if (!open) return null

  const entries = getTranslatableEntries(store)

  function startEdit(entityId: string, field: string, locale: Locale, current: string) {
    setEditing({ entityId, field, locale })
    setDraft(current)
  }

  function commitEdit() {
    if (!editing) return
    const { entityId, field, locale } = editing
    const entity = store.entities[entityId]
    if (!entity) { setEditing(null); return }
    const d = entity.data as Record<string, unknown>
    const prev = d[field] as LocaleMap
    const updatedValue: LocaleMap = { ...prev, [locale]: draft }
    engine.dispatch(renameCommands.confirmRename(entityId, field, updatedValue))
    setEditing(null)
  }

  function cancelEdit() {
    setEditing(null)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
    if (e.key === 'Escape') { e.preventDefault(); cancelEdit() }
  }

  return (
    <div className="cms-i18n-sheet">
      <div className="cms-i18n-sheet__header">
        i18n — Translation Sheet
      </div>
      <div className="cms-i18n-sheet__grid">
        <table className="cms-i18n-sheet__table">
          <thead>
            <tr>
              <th>Key</th>
              {LOCALES.map(l => <th key={l}>{l}</th>)}
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => (
              <tr key={entry.label}>
                <td>{entry.label}</td>
                {LOCALES.map(locale => {
                  const cellValue = entry.value[locale] ?? ''
                  const isEditing = editing?.entityId === entry.entityId && editing.field === entry.field && editing.locale === locale
                  const isEmpty = cellValue === ''
                  return (
                    <td
                      key={locale}
                      className={[
                        isEmpty && !isEditing ? 'cms-i18n-cell--empty' : '',
                        isEditing ? 'cms-i18n-cell--editing' : '',
                      ].filter(Boolean).join(' ') || undefined}
                      onClick={() => !isEditing && startEdit(entry.entityId, entry.field, locale, cellValue)}
                    >
                      {isEditing ? (
                        <input
                          autoFocus
                          value={draft}
                          onChange={e => setDraft(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onBlur={commitEdit}
                        />
                      ) : (
                        cellValue || '\u00a0'
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
