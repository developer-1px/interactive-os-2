import { useState } from 'react'
import { ApgKeyboardTable } from './ApgKeyboardTable'
import { apgTreeView } from './apg-data'
import { TreeView } from '../interactive-os/ui/TreeView'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData } from '../interactive-os/core/types'
import { core } from '../interactive-os/plugins/core'
import { RenderTreeItem } from './SharedTreeComponents'

const treeData = createStore({
  entities: {
    docs: { id: 'docs', data: { name: 'docs', type: 'folder' } },
    guide: { id: 'guide', data: { name: 'guide', type: 'folder' } },
    intro: { id: 'intro', data: { name: 'intro.md', type: 'file' } },
    setup: { id: 'setup', data: { name: 'setup.md', type: 'file' } },
    api: { id: 'api', data: { name: 'api', type: 'folder' } },
    ref: { id: 'ref', data: { name: 'reference.md', type: 'file' } },
    changelog: { id: 'changelog', data: { name: 'CHANGELOG.md', type: 'file' } },
    license: { id: 'license', data: { name: 'LICENSE', type: 'file' } },
  },
  relationships: {
    [ROOT_ID]: ['docs', 'changelog', 'license'],
    docs: ['guide', 'api'],
    guide: ['intro', 'setup'],
    api: ['ref'],
  },
})

const plugins = [core()]

export default function PageTreeView() {
  const [data, setData] = useState<NormalizedData>(treeData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Tree View</h2>
        <p className="page-desc">Read-only hierarchical navigation — no CRUD, pure focus + expand</p>
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
          data={data}
          onChange={setData}
          plugins={plugins}
          renderItem={(node, state) => <RenderTreeItem node={node} state={state} />}
        />
      </div>
      <ApgKeyboardTable {...apgTreeView} />
    </div>
  )
}
