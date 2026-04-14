// @useState-hatch — help popover open/close는 view-only ephemeral toggle (OS 축에 해당 없음)
import { useMemo, useState } from 'react'
import { ax } from '@styles/ax'
import { Button } from '@os/ui/Button'
import { RemoteSearch } from '@os/ui/RemoteSearch'
import { ProgressIndicator } from '@os/ui/indicators/ProgressIndicator'
import { HelpCircle } from 'lucide-react'
import { I18nGrid } from '../../entities/i18n/ui/I18nGrid'
import { I18N_COLUMNS } from '../cms/cmsI18nTransform'
import { LOCALES } from '../cms/cmsTypes'
import { useI18n } from './i18nContext'
import type { NormalizedData } from '@os/schema'
import { ROOT_ID } from '@os/schema'

// ── Title (compact, single line) ──

export function I18nTitleWidget() {
  return (
    <span className={ax({ textStyle: 'label', text: 'primary' })}>i18n Editor</span>
  )
}

// ── Search slot (portal target for Grid's AriaSearch) ──

const I18N_ENGINE_ID = 'i18n Translation Editor'

export function I18nSearchSlotWidget() {
  return <RemoteSearch engineId={I18N_ENGINE_ID} />
}

// ── Stats (numbers only) ──

export function I18nStatsWidget() {
  const { stats } = useI18n()
  const overallPct = stats.total === 0 ? 0 : Math.round((stats.filled / stats.total) * 100)

  return (
    <div className={ax({ layout: 'bar', gap: 'md' })}>
      <div className={ax({ layout: 'bar', gap: 'sm' })}>
        <span className={ax({ textStyle: 'label', text: 'primary', weight: 'semi' })}>
          {overallPct}%
        </span>
        <span className={ax({ textStyle: 'caption', text: 'muted' })}>
          {stats.filled}/{stats.total}
        </span>
        <div className={ax({ width: 'md' })}>
          <ProgressIndicator value={overallPct} />
        </div>
      </div>
      <div className={ax({ layout: 'bar', gap: 'sm' })}>
        {stats.perLocale.map((s, i) => {
          const pct = s.total === 0 ? 0 : Math.round((s.filled / s.total) * 100)
          const locale = LOCALES[i]
          return (
            <span key={locale} className={ax({ textStyle: 'caption', text: pct === 100 ? 'muted' : 'primary' })}>
              {locale?.toUpperCase()} {pct}%
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ── Missing only toggle ──

export function I18nMissingWidget() {
  const { missingOnly, setMissingOnly } = useI18n()
  return (
    <Button
      variant={missingOnly ? 'accent' : 'ghost'}
      onClick={() => setMissingOnly(v => !v)}
    >
      Missing only
    </Button>
  )
}

// ── Help button (toggles keyboard hints) ──

const PRIMARY_HINTS: Array<[string, string]> = [
  ['Enter', 'edit'],
  ['↑↓←→', 'move'],
  ['⇧+Arrow', 'range'],
  ['Del', 'clear'],
  ['⌘Z', 'undo'],
  ['⌘F', 'search'],
]

export function I18nHelpWidget() {
  // @useState-hatch — help popover visibility
  const [open, setOpen] = useState(false)
  return (
    <div className={ax({ layout: 'bar', gap: 'md' })}>
      {PRIMARY_HINTS.map(([keys, label]) => (
        <span key={keys} className={ax({ layout: 'bar', gap: 'xs', textStyle: 'caption', text: 'muted' })}>
          <kbd className={ax({ textStyle: 'code', text: 'secondary' })}>{keys}</kbd>
          <span>{label}</span>
        </span>
      ))}
      <Button variant="ghost" onClick={() => setOpen(v => !v)} aria-label="All keyboard shortcuts">
        <HelpCircle size={14} />
      </Button>
      {open && (
        <div className={ax({ surface: 'overlay', padding: 'md', shape: 'md', width: 'xl' })}>
          <ul className={ax({ layout: 'stack', gap: 'xs', textStyle: 'caption' })}>
            <li><kbd>Enter</kbd> edit cell</li>
            <li><kbd>F2</kbd> edit cell</li>
            <li><kbd>Tab</kbd> next cell edit</li>
            <li><kbd>Arrow keys</kbd> move</li>
            <li><kbd>Shift+Arrow</kbd> range select</li>
            <li><kbd>Shift+Click</kbd> extend range</li>
            <li><kbd>Del</kbd> clear cell/range</li>
            <li><kbd>Cmd+X/C/V</kbd> clipboard</li>
            <li><kbd>Cmd+Z</kbd> undo</li>
            <li><kbd>Cmd+F</kbd> search</li>
          </ul>
        </div>
      )}
    </div>
  )
}

// ── Grid ──

export function I18nGridWidget() {
  const { data, plugins, keyMap, onChange, missingOnly } = useI18n()

  const visibleData = useMemo(() => {
    if (!missingOnly) return data
    return filterMissingOnly(data)
  }, [data, missingOnly])

  return (
    <I18nGrid
      data={visibleData}
      columns={I18N_COLUMNS}
      plugins={plugins}
      initialColIndex={1}
      keyMap={keyMap}
      onChange={onChange}
      aria-label="i18n Translation Editor"
    />
  )
}

// ── Helpers ──

function filterMissingOnly(data: NormalizedData): NormalizedData {
  const rows = (data.relationships[ROOT_ID] ?? []).filter(rowId => {
    const cells = (data.entities[rowId]?.data as Record<string, unknown>)?.cells as string[] | undefined
    if (!cells) return false
    for (let i = 1; i < cells.length; i++) {
      if ((cells[i] ?? '') === '') return true
    }
    return false
  })
  const entities: NormalizedData['entities'] = {}
  for (const id of rows) {
    const e = data.entities[id]
    if (e) entities[id] = e
  }
  for (const [id, e] of Object.entries(data.entities)) {
    if (id.startsWith('__')) entities[id] = e
  }
  return { entities, relationships: { ...data.relationships, [ROOT_ID]: rows } }
}
