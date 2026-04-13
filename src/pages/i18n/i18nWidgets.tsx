// @useState-hatch — missingOnly toggle lives in page, pulled via context
import { useMemo } from 'react'
import { ax } from '@styles/ax'
import { Button } from '@os/ui/Button'
import { CheckIndicator } from '@os/ui/indicators/CheckIndicator'
import { I18nGrid } from '../../entities/i18n/ui/I18nGrid'
import { I18N_COLUMNS } from '../cms/cmsI18nTransform'
import { LOCALES } from '../cms/cmsTypes'
import { useI18n } from './i18nContext'

export function I18nHeaderWidget() {
  return (
    <div className="page-header">
      <h2 className="page-title">i18n Editor</h2>
      <p className="page-desc">
        Spreadsheet-style translation editor — Google Sheets keyboard navigation
      </p>
    </div>
  )
}

export function I18nStatsBarWidget() {
  const { stats, missingOnly, setMissingOnly } = useI18n()
  const overallPct = stats.total === 0 ? 0 : Math.round((stats.filled / stats.total) * 100)

  return (
    <div className={ax({ layout: 'bar', gap: 'md', padding: 'sm', surface: 'sunken', shape: 'md' })}>
      <div className={ax({ layout: 'bar', gap: 'sm', flex: '1' })}>
        <strong>{stats.filled} / {stats.total}</strong>
        <span className={ax({ text: 'muted' })}>({overallPct}%)</span>
        {stats.perLocale.map((s, i) => {
          const pct = s.total === 0 ? 0 : Math.round((s.filled / s.total) * 100)
          const locale = LOCALES[i]
          return (
            <span key={locale} className={ax({ text: pct === 100 ? 'muted' : 'primary' })}>
              {locale?.toUpperCase()} {s.filled}/{s.total} ({pct}%)
            </span>
          )
        })}
      </div>
      <Button
        variant={missingOnly ? 'accent' : 'ghost'}
        size="sm"
        onClick={() => setMissingOnly(v => !v)}
      >
        <CheckIndicator checked={missingOnly} />
        Missing only
      </Button>
    </div>
  )
}

export function I18nKeyHintsWidget() {
  return (
    <ul className={`page-keys ${ax({ layout: 'wrap', gap: 'sm' })}`}>
      <li><kbd>Enter</kbd> <span className="key-hint">edit cell</span></li>
      <li><kbd>F2</kbd> <span className="key-hint">edit cell</span></li>
      <li><kbd>Tab</kbd> <span className="key-hint">next cell edit</span></li>
      <li><kbd>Arrow keys</kbd> <span className="key-hint">move</span></li>
      <li><kbd>Shift+Arrow</kbd> <span className="key-hint">range select</span></li>
      <li><kbd>Shift+Click</kbd> <span className="key-hint">extend range</span></li>
      <li><kbd>Drag</kbd> <span className="key-hint">range select</span></li>
      <li><kbd>Del</kbd> <span className="key-hint">clear cell/range</span></li>
      <li><kbd>Cmd+X/C/V</kbd> <span className="key-hint">clipboard</span></li>
      <li><kbd>Cmd+Z</kbd> <span className="key-hint">undo</span></li>
      <li><kbd>Cmd+F</kbd> <span className="key-hint">search</span></li>
    </ul>
  )
}

export function I18nGridWidget() {
  const { data, plugins, keyMap, onChange, missingOnly } = useI18n()

  const visibleData = useMemo(() => {
    if (!missingOnly) return data
    return filterMissingOnly(data)
  }, [data, missingOnly])

  return (
    <div className={ax({ surface: 'display', shape: 'md' })}>
      <I18nGrid
        data={visibleData}
        columns={I18N_COLUMNS}
        plugins={plugins}
        initialColIndex={1}
        keyMap={keyMap}
        onChange={onChange}
        aria-label="i18n Translation Editor"
      />
    </div>
  )
}

// ── Helpers ──

import { ROOT_ID, type NormalizedData } from '@os/store/types'

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
