import React, { useState, useRef } from 'react'
import type { NormalizedData } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'
import { Grid } from '../interactive-os/ui/Grid'
import { Aria } from '../interactive-os/components/aria'
import { core, GRID_COL_ID } from '../interactive-os/plugins/core'
import { rename } from '../interactive-os/plugins/rename'
import { history } from '../interactive-os/plugins/history'
import { crud } from '../interactive-os/plugins/crud'
import { clipboard } from '../interactive-os/plugins/clipboard'
import { dnd } from '../interactive-os/plugins/dnd'
import { focusRecovery } from '../interactive-os/plugins/focusRecovery'
import { i18nColumns, i18nInitialData } from './sharedI18nData'

const plugins = [core(), crud(), clipboard(), rename(), dnd(), history(), focusRecovery()]

export default function PageI18nDataTable() {
  const [data, setData] = useState<NormalizedData>(i18nInitialData)
  const dataRef = useRef(data)
  dataRef.current = data

  const renderCell = (_props: React.HTMLAttributes<HTMLElement>, value: unknown, column: { key: string }, state: NodeState) => {
    const text = String(value ?? '')
    const isKey = column.key === 'key'
    const isEmpty = text === '' && !isKey
    const colIdx = i18nColumns.findIndex(c => c.key === column.key)
    const focusedCol = (dataRef.current.entities[GRID_COL_ID]?.colIndex as number) ?? 0
    const isActiveCell = !isKey && state.focused && colIdx === focusedCol

    if (isActiveCell) {
      return (
        <Aria.Editable field={`cells.${colIdx}`} allowEmpty tabContinue>
          <span className={isEmpty ? 'cell-empty' : undefined}>
            {isEmpty ? '—' : text}
          </span>
        </Aria.Editable>
      )
    }

    if (isKey) {
      return <span className="cell-key">{text}</span>
    }

    return (
      <span className={isEmpty ? 'cell-empty' : undefined}>
        {isEmpty ? '—' : text}
      </span>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">i18n DataTable</h2>
        <p className="page-desc">
          Spreadsheet-style translation editor — type to replace, Tab to traverse, ⌘Z to undo
        </p>
      </div>
      <div className="page-keys">
        <kbd>Type</kbd> <span className="key-hint">replace edit</span>{' '}
        <kbd>F2</kbd> <span className="key-hint">preserve edit</span>{' '}
        <kbd>Tab</kbd> <span className="key-hint">next cell</span>{' '}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>{' '}
        <kbd>⌘C/V</kbd> <span className="key-hint">copy/paste</span>
      </div>
      <div className="demo-section">
        <div style={{ border: '1px solid var(--border, #e0e0e0)', borderRadius: 8, overflow: 'hidden' }}>
          <Grid
            data={data}
            columns={i18nColumns}
            plugins={plugins}
            onChange={setData}
            enableEditing
            tabCycle
            renderCell={renderCell}
            aria-label="i18n Translation Table"
            header
          />
        </div>
      </div>
    </div>
  )
}
