import { useMemo, useRef, useCallback, useEffect } from 'react'
import type { NormalizedData } from '../../interactive-os/store/types'
import type { CommandEngine } from '../../interactive-os/engine/createCommandEngine'
import { Grid } from '../../interactive-os/ui/Grid'
import { rename } from '../../interactive-os/plugins/rename'
import { renameCommands } from '../../interactive-os/plugins/rename'
import { history } from '../../interactive-os/plugins/history'
import { focusRecovery } from '../../interactive-os/plugins/focusRecovery'
import { translatableEntriesToGrid, I18N_COLUMNS, diffGridChanges } from './cmsI18nAdapter'

const plugins = [rename(), history(), focusRecovery()]

interface CmsI18nSheetProps {
  engine: CommandEngine
  store: NormalizedData
  open: boolean
}

export default function CmsI18nSheet({ engine, store, open }: CmsI18nSheetProps) {
  const gridData = useMemo(() => translatableEntriesToGrid(store), [store])
  const prevGridDataRef = useRef(gridData)
  useEffect(() => { prevGridDataRef.current = gridData })

  const handleChange = useCallback((newGridData: NormalizedData) => {
    const changes = diffGridChanges(prevGridDataRef.current, newGridData, store)
    for (const { entityId, field, updatedMap } of changes) {
      engine.dispatch(renameCommands.confirmRename(entityId, field, updatedMap))
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
