import { useState } from 'react'
import { ApgKeyboardTable } from './ApgKeyboardTable'
import { apgTreeView } from './apg-data'
import { TreeView } from '../interactive-os/ui/TreeView'
import type { NormalizedData } from '../interactive-os/store/types'
import { core } from '../interactive-os/plugins/core'
import { treeData } from './shared-tree-data'
import { RenderTreeItem } from './SharedTreeComponents'

const plugins = [core()]

export default function PageTreeNav() {
  const [tree, setTree] = useState<NormalizedData>(treeData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Tree</h2>
        <p className="page-desc">Read-only file explorer with keyboard navigation — expand, collapse, focus</p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>→←</kbd> <span className="key-hint">expand / collapse</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">select</span>{' '}
        <kbd>Home</kbd> <span className="key-hint">first</span>{' '}
        <kbd>End</kbd> <span className="key-hint">last</span>
      </div>
      <div className="card">
        <TreeView
          data={tree}
          onChange={setTree}
          plugins={plugins}
          renderItem={(props, node, state) => <RenderTreeItem toggleProps={props.toggleProps} node={node} state={state} />}
        />
      </div>
      <ApgKeyboardTable {...apgTreeView} />
    </div>
  )
}
