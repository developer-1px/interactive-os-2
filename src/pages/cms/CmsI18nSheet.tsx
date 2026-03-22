import { useMemo, useRef, useCallback } from 'react'
import type { NormalizedData } from '../../interactive-os/core/types'
import type { CommandEngine } from '../../interactive-os/core/createCommandEngine'
import { Grid } from '../../interactive-os/ui/Grid'
import { core } from '../../interactive-os/plugins/core'
import { rename } from '../../interactive-os/plugins/rename'
import { renameCommands } from '../../interactive-os/plugins/rename'
import { history } from '../../interactive-os/plugins/history'
import { focusRecovery } from '../../interactive-os/plugins/focusRecovery'
import { translatableEntriesToGrid, I18N_COLUMNS, getRowMetadata } from './cmsI18nAdapter'
import { LOCALES } from './cms-types'
import type { LocaleMap } from './cms-types'

const plugins = [core(), rename(), history(), focusRecovery()]

interface CmsI18nSheetProps {
  engine: CommandEngine
  store: NormalizedData
  open: boolean
}

export default function CmsI18nSheet({ engine, store, open }: CmsI18nSheetProps) {
  const gridData = useMemo(() => translatableEntriesToGrid(store), [store])
  const prevGridDataRef = useRef(gridData)
  prevGridDataRef.current = gridData

  const handleChange = useCallback((newGridData: NormalizedData) => {
    const prev = prevGridDataRef.current

    for (const [rowId, entity] of Object.entries(newGridData.entities)) {
      if (rowId.startsWith('__')) continue
      const prevEntity = prev.entities[rowId]
      if (!prevEntity) continue
      const newCells = (entity.data as Record<string, unknown>)?.cells as string[] | undefined
      const prevCells = (prevEntity.data as Record<string, unknown>)?.cells as string[] | undefined
      if (!newCells || !prevCells) continue

      for (let i = 1; i < newCells.length; i++) {
        if (newCells[i] !== prevCells[i]) {
          const meta = getRowMetadata(newGridData, rowId)
          if (!meta) continue
          const locale = LOCALES[i - 1]
          if (!locale) continue
          const currentMap = (store.entities[meta.sourceEntityId]?.data as Record<string, unknown>)?.[meta.sourceField] as LocaleMap
          if (!currentMap) continue
          const updatedMap: LocaleMap = { ...currentMap, [locale]: newCells[i]! }
          engine.dispatch(renameCommands.confirmRename(meta.sourceEntityId, meta.sourceField, updatedMap))
        }
      }
    }
  }, [store, engine])

  if (!open) return null

  return (
    <div className="cms-i18n-sheet">
      <div className="cms-i18n-sheet__header">
        i18n — Translation Sheet
      </div>
      <div className="cms-i18n-sheet__grid">
        <div className="cms-i18n-sheet__col-headers">
          {I18N_COLUMNS.map(col => (
            <div key={col.key} className="cms-i18n-sheet__col-header">{col.header}</div>
          ))}
        </div>
        <Grid
          data={gridData}
          columns={I18N_COLUMNS}
          plugins={plugins}
          enableEditing
          onChange={handleChange}
          aria-label="i18n Translation Sheet"
        />
      </div>
    </div>
  )
}
