import { useState } from 'react'
import { ApgKeyboardTable } from './ApgKeyboardTable'
import { apgGrid } from './apg-data'
import { Grid } from '../interactive-os/ui/Grid'
import type { NormalizedData } from '../interactive-os/core/types'
import { core } from '../interactive-os/plugins/core'
import { history } from '../interactive-os/plugins/history'
import { crud } from '../interactive-os/plugins/crud'
import { clipboard } from '../interactive-os/plugins/clipboard'
import { rename } from '../interactive-os/plugins/rename'
import { dnd } from '../interactive-os/plugins/dnd'
import { focusRecovery } from '../interactive-os/plugins/focusRecovery'
import { gridColumns, gridInitialData } from './sharedGridData'

const plugins = [core(), crud(), clipboard(), rename(), dnd(), history(), focusRecovery()]

export default function PageGridCollection() {
  const [data, setData] = useState<NormalizedData>(gridInitialData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Grid</h2>
        <p className="page-desc">
          2D data grid with full collection capabilities — CRUD, copy/paste, reorder, undo/redo
        </p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">row</span>{' '}
        <kbd>←→</kbd> <span className="key-hint">column</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">select</span>{' '}
        <kbd>Del</kbd> <span className="key-hint">delete</span>{' '}
        <kbd>⌘C</kbd> <span className="key-hint">copy</span>{' '}
        <kbd>⌘V</kbd> <span className="key-hint">paste</span>{' '}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>{' '}
        <kbd>Alt↑↓</kbd> <span className="key-hint">reorder</span>
      </div>
      <div className="demo-section">
        <h3 className="demo-title">Employee Directory</h3>
        <div style={{ border: '1px solid var(--border, #e0e0e0)', borderRadius: 8, overflow: 'hidden' }}>
          <div className="grid-header">
            {gridColumns.map((col) => (
              <div key={col.key} className="grid-header-cell">
                {col.header}
              </div>
            ))}
          </div>
          <Grid
            data={data}
            columns={gridColumns}
            plugins={plugins}
            onChange={setData}
            enableEditing
            aria-label="Employee directory"
          />
        </div>
      </div>
      <ApgKeyboardTable {...apgGrid} />
    </div>
  )
}
