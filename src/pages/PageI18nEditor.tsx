// ② 2026-03-25-i18n-editor-app-prd.md
import React, { useState, useRef, useEffect } from 'react'
import type { NormalizedData } from '../interactive-os/store/types'
import { Grid } from '../interactive-os/ui/Grid'
import { Aria } from '../interactive-os/primitives/aria'
import { core, GRID_COL_ID } from '../interactive-os/plugins/core'
import { rename } from '../interactive-os/plugins/rename'
import { history } from '../interactive-os/plugins/history'
import { crud } from '../interactive-os/plugins/crud'
import { clipboard } from '../interactive-os/plugins/clipboard'
import { dnd } from '../interactive-os/plugins/dnd'
import { focusRecovery } from '../interactive-os/plugins/focusRecovery'
import { translatableEntriesToGrid, I18N_COLUMNS } from './cms/cmsI18nAdapter'
import { cmsStore } from './cms/cms-store'

const plugins = [core(), crud(), clipboard(), rename(), dnd(), history(), focusRecovery()]

export default function PageI18nEditor() {
  const gridData = React.useMemo(() => translatableEntriesToGrid(cmsStore), [])
  const [data, setData] = useState<NormalizedData>(gridData)
  const dataRef = useRef(data)
  useEffect(() => { dataRef.current = data })

  const renderCell = (_props: React.HTMLAttributes<HTMLElement>, value: unknown, column: { key: string }) => {
    const text = String(value ?? '')
    const isKey = column.key === 'key'
    const isEmpty = text === '' && !isKey
    const colIdx = I18N_COLUMNS.findIndex(c => c.key === column.key)
    const focusedCol = (dataRef.current.entities[GRID_COL_ID]?.colIndex as number) ?? 0
    const isActiveCell = !isKey && colIdx === focusedCol

    if (isActiveCell) {
      return (
        <Aria.Editable field={`cells.${colIdx}`} allowEmpty enterContinue tabContinue>
          <span className={isEmpty ? 'cell-empty' : undefined}>
            {isEmpty ? '—' : text}
          </span>
        </Aria.Editable>
      )
    }

    if (isKey) {
      return (
        <Aria.SearchHighlight>
          <span className="cell-key">{text}</span>
        </Aria.SearchHighlight>
      )
    }

    return (
      <Aria.SearchHighlight>
        <span className={isEmpty ? 'cell-empty' : undefined}>
          {isEmpty ? '—' : text}
        </span>
      </Aria.SearchHighlight>
    )
  }

  return (
    <div style={{ padding: 'var(--space-lg)', overflow: 'auto' }}>
      <div className="page-header">
        <h2 className="page-title">i18n Editor</h2>
        <p className="page-desc">
          Spreadsheet-style translation editor — Google Sheets 키보드 조작
        </p>
      </div>
      <div className="page-keys">
        <kbd>Enter</kbd> <span className="key-hint">아래 이동</span>{' '}
        <kbd>Shift+Enter</kbd> <span className="key-hint">위 이동</span>{' '}
        <kbd>F2</kbd> <span className="key-hint">편집</span>{' '}
        <kbd>Tab</kbd> <span className="key-hint">다음 셀 편집</span>{' '}
        <kbd>Del</kbd> <span className="key-hint">셀 클리어</span>{' '}
        <kbd>⌘X/C/V</kbd> <span className="key-hint">셀 클립보드</span>{' '}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>{' '}
        <kbd>⌘F</kbd> <span className="key-hint">검색</span>
      </div>
      <div>
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--shape-md-radius)', overflow: 'hidden' }}>
          <Grid
            data={data}
            columns={I18N_COLUMNS}
            plugins={plugins}
            onChange={setData}
            enableEditing
            searchable
            tabCycle
            renderCell={renderCell}
            aria-label="i18n Translation Editor"
            header
          />
        </div>
      </div>
    </div>
  )
}
