import { useState } from 'react'
import { Grid } from '../interactive-os/ui/grid'
import { createStore } from '../interactive-os/core/normalized-store'
import { ROOT_ID } from '../interactive-os/core/types'
import { core } from '../interactive-os/plugins/core'

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'age', header: 'Age' },
  { key: 'email', header: 'Email' },
  { key: 'department', header: 'Department' },
]

const initialData = createStore({
  entities: {
    'row-1': { id: 'row-1', data: { cells: ['Alice Johnson', '30', 'alice@example.com', 'Engineering'] } },
    'row-2': { id: 'row-2', data: { cells: ['Bob Smith', '25', 'bob@example.com', 'Design'] } },
    'row-3': { id: 'row-3', data: { cells: ['Carol Williams', '35', 'carol@example.com', 'Engineering'] } },
    'row-4': { id: 'row-4', data: { cells: ['Dave Brown', '28', 'dave@example.com', 'Marketing'] } },
    'row-5': { id: 'row-5', data: { cells: ['Eve Davis', '32', 'eve@example.com', 'Engineering'] } },
  },
  relationships: {
    [ROOT_ID]: ['row-1', 'row-2', 'row-3', 'row-4', 'row-5'],
  },
})

const plugins = [core()]

export default function GridPage() {
  const [data, setData] = useState(initialData)

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
          <div style={{ display: 'flex', borderBottom: '2px solid var(--border, #e0e0e0)', background: 'var(--header-bg, #fafafa)' }}>
            {columns.map((col) => (
              <div key={col.key} style={{ padding: '8px 12px', minWidth: 120, fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary, #666)' }}>
                {col.header}
              </div>
            ))}
          </div>
          <Grid
            data={data}
            columns={columns}
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
    </div>
  )
}
