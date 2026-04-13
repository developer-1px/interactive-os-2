// ② 2026-03-25-i18n-editor-app-prd.md
// @useState-hatch — missingOnly는 view-only ephemeral toggle (OS 축에 해당 없음)
import { useMemo, useState, useCallback, useRef } from 'react'
import { FlatLayout } from '@os/ui/FlatLayout'
import { definePage } from '@os/layout/flatLayout'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { useStore } from '@os/store/useStore'
import type { NormalizedData } from '@os/store/types'
import { rename, renameCommands } from '@os/plugins/rename'
import { history } from '@os/plugins/history'
import { crud } from '@os/plugins/crud'
import { clipboard, clipboardCommands } from '@os/plugins/clipboard'
import { dnd } from '@os/plugins/dnd'
import { focusRecovery } from '@os/plugins/focusRecovery'
import { key } from '@os/axis/types'
import { translatableEntriesToGrid, diffGridChanges } from '../cms/cmsI18nTransform'
import { LOCALES, type LocaleMap } from '../cms/cmsTypes'
import { cmsStore } from '../cms/cmsStore'
import { I18nProvider, type I18nContextValue } from './i18nContext'
import { I18nTitleWidget, I18nSearchSlotWidget, I18nStatsWidget, I18nMissingWidget, I18nHelpWidget, I18nGridWidget } from './i18nWidgets'

const plugins = [crud(), clipboard(), rename(), dnd(), history(), focusRecovery()]

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

const i18nWidgets = createWidgetRegistry({
  I18nTitle: I18nTitleWidget,
  I18nSearchSlot: I18nSearchSlotWidget,
  I18nStats: I18nStatsWidget,
  I18nMissing: I18nMissingWidget,
  I18nHelp: I18nHelpWidget,
  I18nGrid: I18nGridWidget,
})

const i18nLayout = definePage({
  entities: {
    root:         { data: { type: 'split', direction: 'vertical', sizes: ['auto', 'flex'], resizable: false }, children: ['toolbar', 'grid'] },
    toolbar:      { data: { type: 'bar', justify: 'between', padding: 'sm', surface: 'sunken' }, children: ['toolbarLeft', 'toolbarRight'] },
    toolbarLeft:  { data: { type: 'bar', gap: 'sm' }, children: ['title', 'searchSlot'] },
    toolbarRight: { data: { type: 'bar', gap: 'sm' }, children: ['stats', 'missing', 'help'] },
    title:        { data: { type: 'widget', widget: 'I18nTitle' } },
    searchSlot:   { data: { type: 'widget', widget: 'I18nSearchSlot' } },
    stats:        { data: { type: 'widget', widget: 'I18nStats' } },
    missing:      { data: { type: 'widget', widget: 'I18nMissing' } },
    help:         { data: { type: 'widget', widget: 'I18nHelp' } },
    grid:         { data: { type: 'widget', widget: 'I18nGrid' } },
  },
})

// ── Helpers ──

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

function persistChanges(changes: Array<{ entityId: string; field: string; updatedMap: LocaleMap }>) {
  for (const { entityId, field, updatedMap } of changes) {
    const entity = cmsStore.entities[entityId]
    if (!entity) continue
    const data = entity.data as Record<string, unknown>
    cmsStore.entities[entityId] = { ...entity, data: { ...data, [field]: updatedMap } }
  }
}

// ── Page ──

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

  const i18nCtx = useMemo<I18nContextValue>(() => ({
    data, plugins, keyMap: keyMapOverride, onChange: handleChange,
    missingOnly, setMissingOnly, stats,
  }), [data, handleChange, missingOnly, stats])

  return (
    <I18nProvider value={i18nCtx}>
      <FlatLayout data={i18nLayout} registry={i18nWidgets} aria-label="i18n Editor" />
    </I18nProvider>
  )
}
