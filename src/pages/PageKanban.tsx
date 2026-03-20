import { useState } from 'react'
import { Kanban } from '../interactive-os/ui/Kanban'
import type { NormalizedData } from '../interactive-os/core/types'
import { core } from '../interactive-os/plugins/core'
import { history } from '../interactive-os/plugins/history'
import { crud } from '../interactive-os/plugins/crud'
import { clipboard } from '../interactive-os/plugins/clipboard'
import { rename } from '../interactive-os/plugins/rename'
import { dnd } from '../interactive-os/plugins/dnd'
import { focusRecovery } from '../interactive-os/plugins/focusRecovery'
import { kanbanInitialData } from './shared-kanban-data'

const plugins = [core(), crud(), clipboard(), rename(), dnd(), history(), focusRecovery()]

export default function PageKanban() {
  const [data, setData] = useState<NormalizedData>(kanbanInitialData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Kanban</h2>
        <p className="page-desc">
          Keyboard-first kanban board — cross-column card movement with Alt+Arrow, full CRUD, undo/redo
        </p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">card</span>{' '}
        <kbd>←→</kbd> <span className="key-hint">column</span>{' '}
        <kbd>Alt←→</kbd> <span className="key-hint">move column</span>{' '}
        <kbd>Alt↑↓</kbd> <span className="key-hint">reorder</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">select</span>{' '}
        <kbd>F2</kbd> <span className="key-hint">rename</span>{' '}
        <kbd>Del</kbd> <span className="key-hint">delete</span>{' '}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>
      </div>
      <div className="demo-section">
        <h3 className="demo-title">Project Board</h3>
        <Kanban
          data={data}
          plugins={plugins}
          onChange={setData}
          aria-label="Project kanban board"
        />
      </div>
      <div className="demo-section">
        <h3 className="demo-title">Keyboard Interactions</h3>
        <table className="apg-table">
          <thead>
            <tr><th>Key</th><th>Function</th></tr>
          </thead>
          <tbody>
            <tr><td><kbd>↑</kbd> <kbd>↓</kbd></td><td>Move focus to previous/next card in same column</td></tr>
            <tr><td><kbd>←</kbd> <kbd>→</kbd></td><td>Move focus to same-index card in adjacent column</td></tr>
            <tr><td><kbd>Alt+←</kbd> <kbd>Alt+→</kbd></td><td>Move card to adjacent column (preserving index)</td></tr>
            <tr><td><kbd>Alt+↑</kbd> <kbd>Alt+↓</kbd></td><td>Reorder card within column</td></tr>
            <tr><td><kbd>Home</kbd> / <kbd>End</kbd></td><td>First/last card in current column</td></tr>
            <tr><td><kbd>⌘Home</kbd> / <kbd>⌘End</kbd></td><td>First card in first column / last card in last column</td></tr>
            <tr><td><kbd>Space</kbd></td><td>Toggle card selection</td></tr>
            <tr><td><kbd>Enter</kbd> / <kbd>F2</kbd></td><td>Rename card title</td></tr>
            <tr><td><kbd>Escape</kbd></td><td>Cancel rename / clear selection</td></tr>
            <tr><td><kbd>N</kbd></td><td>Create new card after focused card</td></tr>
            <tr><td><kbd>Delete</kbd></td><td>Delete selected cards</td></tr>
            <tr><td><kbd>⌘C</kbd> / <kbd>⌘X</kbd> / <kbd>⌘V</kbd></td><td>Copy / cut / paste</td></tr>
            <tr><td><kbd>⌘Z</kbd> / <kbd>⌘⇧Z</kbd></td><td>Undo / redo</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
