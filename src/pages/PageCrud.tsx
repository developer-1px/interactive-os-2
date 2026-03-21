import { useState } from 'react'
import { TreeGrid } from '../interactive-os/ui/TreeGrid'
import { createStore, addEntity, getChildren } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'
import { core } from '../interactive-os/plugins/core'
import { history } from '../interactive-os/plugins/history'
import { crud } from '../interactive-os/plugins/crud'
import { focusRecovery } from '../interactive-os/plugins/focusRecovery'

const treeData = createStore({
  entities: {
    projects: { id: 'projects', data: { label: 'Projects', type: 'group' } },
    design: { id: 'design', data: { label: 'Design', type: 'group' } },
    figma: { id: 'figma', data: { label: 'Figma', type: 'item' } },
    sketch: { id: 'sketch', data: { label: 'Sketch', type: 'item' } },
    api: { id: 'api', data: { label: 'API', type: 'group' } },
    rest: { id: 'rest', data: { label: 'REST', type: 'item' } },
    graphql: { id: 'graphql', data: { label: 'GraphQL', type: 'item' } },
    docs: { id: 'docs', data: { label: 'Docs', type: 'group' } },
    readme: { id: 'readme', data: { label: 'README', type: 'item' } },
    changelog: { id: 'changelog', data: { label: 'Changelog', type: 'item' } },
  },
  relationships: {
    [ROOT_ID]: ['projects', 'docs'],
    projects: ['design', 'api'],
    design: ['figma', 'sketch'],
    api: ['rest', 'graphql'],
    docs: ['readme', 'changelog'],
  },
})

const plugins = [core(), crud(), history(), focusRecovery()]

const randomNames = ['Webpack', 'Vite', 'Rollup', 'esbuild', 'Turbopack', 'Parcel', 'SWC', 'Bun', 'Deno', 'Rome']
let counter = 0

export default function PageCrud() {
  const [data, setData] = useState<NormalizedData>(treeData)

  const handleCreate = () => {
    const name = randomNames[counter % randomNames.length]!
    const id = `item-${++counter}`
    // Find first group to insert into
    const groups = getChildren(data, ROOT_ID)
    const parentId = groups[0] ?? ROOT_ID
    setData(addEntity(data, { id, data: { label: name, type: 'item' } }, parentId))
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">CRUD</h2>
        <p className="page-desc">
          Create and delete items with automatic focus recovery.
          New items are inserted after the focused node; deleted subtrees restore on undo.
        </p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>←→</kbd> <span className="key-hint">expand</span>{' '}
        <kbd>Del</kbd> <span className="key-hint">delete</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">select</span>{' '}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>{' '}
        <kbd>⌘⇧Z</kbd> <span className="key-hint">redo</span>{' '}
        <button type="button" onClick={handleCreate} style={{ marginLeft: 8, fontSize: '0.85em' }}>+ Add item</button>
      </div>
      <div className="card">
        <TreeGrid
          data={data}
          onChange={setData}
          enableEditing
          plugins={plugins}
          renderItem={(node, state: NodeState) => {
            const d = node.data as Record<string, unknown>
            const isGroup = d?.type === 'group'
            const indent = ((state.level ?? 1) - 1) * 18

            const cls = [
              'tree-node',
              state.focused && 'tree-node--focused',
              state.selected && !state.focused && 'tree-node--selected',
            ].filter(Boolean).join(' ')

            return (
              <div className={cls} style={{ paddingLeft: 14 + indent }}>
                <span className="tree-node__chevron">
                  {isGroup ? (state.expanded ? '▾' : '▸') : ''}
                </span>
                <span className="tree-node__name" style={{ fontWeight: isGroup ? 600 : 400 }}>
                  {d?.label as string}
                </span>
              </div>
            )
          }}
        />
      </div>
      <div className="page-section">
        <h3 className="page-section-title">Plugin: crud()</h3>
        <p className="page-desc">
          The <code>crud</code> plugin adds <code>create</code>, <code>delete</code>, and <code>deleteMultiple</code> commands.
          New entities are inserted at a specific index in the parent's children list.
          Delete recursively removes the entire subtree and restores it on undo.
        </p>
      </div>
    </div>
  )
}
