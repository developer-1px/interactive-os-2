import { useState } from 'react'
import { ApgKeyboardTable } from './ApgKeyboardTable'
import { apgGrid } from './apg-data'
import { Grid } from '../interactive-os/ui/Grid'
import { core } from '../interactive-os/plugins/core'
import { gridColumns, gridInitialData } from './shared-grid-data'

const plugins = [core()]

export default function PageGrid() {
  const [data, setData] = useState(gridInitialData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Grid</h2>
        <p className="page-desc">
          2D data grid with row/column keyboard navigation.
          Arrow Up/Down moves between rows. Arrow Left/Right moves between columns.
          Home/End moves to first/last column. Ctrl+Home/End moves to first/last row.
        </p>
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
            aria-label="Employee directory"
          />
        </div>
      </div>
      <div className="demo-section">
        <h3 className="demo-title">Keyboard Shortcuts</h3>
        <table className="shortcut-table">
          <tbody>
            <tr><td><kbd>Arrow Down</kbd></td><td>Move to next row</td></tr>
            <tr><td><kbd>Arrow Up</kbd></td><td>Move to previous row</td></tr>
            <tr><td><kbd>Arrow Right</kbd></td><td>Move to next column</td></tr>
            <tr><td><kbd>Arrow Left</kbd></td><td>Move to previous column</td></tr>
            <tr><td><kbd>Home</kbd></td><td>Move to first column</td></tr>
            <tr><td><kbd>End</kbd></td><td>Move to last column</td></tr>
            <tr><td><kbd>Ctrl + Home</kbd></td><td>Move to first row</td></tr>
            <tr><td><kbd>Ctrl + End</kbd></td><td>Move to last row</td></tr>
            <tr><td><kbd>Space</kbd></td><td>Toggle row selection</td></tr>
          </tbody>
        </table>
      </div>
      <ApgKeyboardTable {...apgGrid} />
    </div>
  )
}
