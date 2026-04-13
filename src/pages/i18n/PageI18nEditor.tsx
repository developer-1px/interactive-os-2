// ② 2026-03-25-i18n-editor-app-prd.md
// @useState-hatch — missingOnly는 view-only ephemeral toggle (OS 축에 해당 없음)
import { useMemo, useState, useCallback, useRef } from 'react'
import { ax } from '@styles/ax'
import { ScrollArea } from '@os/ui/ScrollArea'
import { useStore } from '@os/store/useStore'
import { Button } from '@os/ui/Button'
import { CheckIndicator } from '@os/ui/indicators/CheckIndicator'
import { ROOT_ID, type NormalizedData } from '@os/store/types'
import { rename, renameCommands } from '@os/plugins/rename'
import { history } from '@os/plugins/history'
import { crud } from '@os/plugins/crud'
import { clipboard, clipboardCommands } from '@os/plugins/clipboard'
import { dnd } from '@os/plugins/dnd'
import { focusRecovery } from '@os/plugins/focusRecovery'
import { key } from '@os/axis/types'
import { I18nGrid } from '../../entities/i18n/ui/I18nGrid'
import { translatableEntriesToGrid, I18N_COLUMNS, diffGridChanges } from '../cms/cmsI18nTransform'
import { LOCALES, type LocaleMap } from '../cms/cmsTypes'
import { cmsStore } from '../cms/cmsStore'

const plugins = [crud(), clipboard(), rename(), dnd(), history(), focusRecovery()]

// 첫 컬럼(key)은 read-only이므로 초기 포커스 컬럼은 1.
// Enter는 셀 편집 진입(rename) — cellEdit 기본값(focusNext) override.
// Delete는 key 컬럼(col 0)에서는 무시.
const keyMapOverride = {
  'Enter': key(['rename:start'], (ctx) => renameCommands.startRename(ctx.focused)),
  'Delete': key(['clipboard:clearCellRange', 'clipboard:clearCellValue'], (ctx) => {
    const cells = ctx.grid?.cellRange?.cells
    if (cells && cells.length > 0) {
      return clipboardCommands.clearCellRange(cells)
    }
    const col = ctx.grid?.colIndex ?? 0
    if (col <= 0) return
    return clipboardCommands.clearCellValue(ctx.focused, col)
  }),
}

interface LocaleStat { total: number; filled: number }

function computeStats(data: NormalizedData): { perLocale: LocaleStat[]; total: number; filled: number } {
  const perLocale: LocaleStat[] = LOCALES.map(() => ({ total: 0, filled: 0 }))
  for (const [id, entity] of Object.entries(data.entities)) {
    if (id.startsWith('__')) continue
    const cells = (entity.data as Record<string, unknown>)?.cells as string[] | undefined
    if (!cells) continue
    for (let i = 1; i < cells.length; i++) {
      const stat = perLocale[i - 1]
      if (!stat) continue
      stat.total += 1
      if ((cells[i] ?? '') !== '') stat.filled += 1
    }
  }
  const total = perLocale.reduce((s, x) => s + x.total, 0)
  const filled = perLocale.reduce((s, x) => s + x.filled, 0)
  return { perLocale, total, filled }
}

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

/** Mutate cmsStore in place — demo store has no engine. */
function persistChanges(changes: Array<{ entityId: string; field: string; updatedMap: LocaleMap }>) {
  for (const { entityId, field, updatedMap } of changes) {
    const entity = cmsStore.entities[entityId]
    if (!entity) continue
    const data = entity.data as Record<string, unknown>
    cmsStore.entities[entityId] = { ...entity, data: { ...data, [field]: updatedMap } }
  }
}

export default function PageI18nEditor() {
  const initialGridData = useMemo(() => translatableEntriesToGrid(cmsStore), [])
  const [data, setData] = useStore(initialGridData)
  const [missingOnly, setMissingOnly] = useState(false)
  const prevDataRef = useRef(data)

  const handleChange = useCallback((next: NormalizedData) => {
    const changes = diffGridChanges(prevDataRef.current, next, cmsStore)
    if (changes.length > 0) persistChanges(changes)
    prevDataRef.current = next
    setData(next)
  }, [setData])

  const stats = useMemo(() => computeStats(data), [data])
  const visibleData = useMemo(() => missingOnly ? filterMissingOnly(data) : data, [data, missingOnly])
  const overallPct = stats.total === 0 ? 0 : Math.round((stats.filled / stats.total) * 100)

  return (
    <ScrollArea className={ax({ padding: 'lg' })}>
      <div className="page-header">
        <h2 className="page-title">i18n Editor</h2>
        <p className="page-desc">
          Spreadsheet-style translation editor — Google Sheets 키보드 조작
        </p>
      </div>

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
          누락만 보기
        </Button>
      </div>

      <ul className={`page-keys ${ax({ layout: 'wrap', gap: 'sm' })}`}>
        <li><kbd>Enter</kbd> <span className="key-hint">셀 편집</span></li>
        <li><kbd>F2</kbd> <span className="key-hint">셀 편집</span></li>
        <li><kbd>Tab</kbd> <span className="key-hint">다음 셀 편집</span></li>
        <li><kbd>↑↓←→</kbd> <span className="key-hint">셀 이동</span></li>
        <li><kbd>Shift+↑↓←→</kbd> <span className="key-hint">범위 선택</span></li>
        <li><kbd>Shift+Click</kbd> <span className="key-hint">범위 확장</span></li>
        <li><kbd>Drag</kbd> <span className="key-hint">범위 선택</span></li>
        <li><kbd>Del</kbd> <span className="key-hint">셀/범위 클리어</span></li>
        <li><kbd>⌘X/C/V</kbd> <span className="key-hint">셀 클립보드</span></li>
        <li><kbd>⌘Z</kbd> <span className="key-hint">undo</span></li>
        <li><kbd>⌘F</kbd> <span className="key-hint">검색</span></li>
      </ul>

      <div className={ax({ surface: 'display', shape: 'md' })}>
        <I18nGrid
          data={visibleData}
          columns={I18N_COLUMNS}
          plugins={plugins}
          initialColIndex={1}
          keyMap={keyMapOverride}
          onChange={handleChange}
          aria-label="i18n Translation Editor"
        />
      </div>
    </ScrollArea>
  )
}
