import { useState } from 'react'
import { ApgKeyboardTable } from './ApgKeyboardTable'
import { apgTreeGrid } from './apg-data'
import { TreeGrid } from '../interactive-os/ui/TreeGrid'
import type { NormalizedData } from '../interactive-os/core/types'
import { core } from '../interactive-os/plugins/core'
import { history } from '../interactive-os/plugins/history'
import { crud } from '../interactive-os/plugins/crud'
import { clipboard } from '../interactive-os/plugins/clipboard'
import { rename } from '../interactive-os/plugins/rename'
import { dnd } from '../interactive-os/plugins/dnd'
import { focusRecovery } from '../interactive-os/plugins/focusRecovery'
import { treeData } from './shared-tree-data'
import { RenderTreeItem } from './SharedTreeComponents'

const plugins = [core(), crud(), clipboard(), rename(), dnd(), history(), focusRecovery()]

export default function PageTreeGrid() {
  const [tree, setTree] = useState<NormalizedData>(treeData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">TreeGrid</h2>
        <p className="page-desc">File explorer with keyboard navigation, copy/paste, undo/redo</p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>→←</kbd> <span className="key-hint">expand</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">select</span>{' '}
        <kbd>⌘C</kbd> <span className="key-hint">copy</span>{' '}
        <kbd>⌘V</kbd> <span className="key-hint">paste</span>{' '}
        <kbd>Del</kbd> <span className="key-hint">delete</span>{' '}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>{' '}
        <kbd>Alt↑↓</kbd> <span className="key-hint">reorder</span>
      </div>
      <div className="card">
        <TreeGrid
          data={tree}
          onChange={setTree}
          enableEditing
          plugins={plugins}
          renderItem={(node, state, props) => <RenderTreeItem {...props} node={node} state={state} />}
        />
      </div>
      <ApgKeyboardTable {...apgTreeGrid} />
    </div>
  )
}
