import { useState } from 'react'
import { TreeGrid } from '../interactive-os/ui/TreeGrid'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'
import { core } from '../interactive-os/plugins/core'
import { history } from '../interactive-os/plugins/history'
import { crud } from '../interactive-os/plugins/crud'
import { focusRecovery } from '../interactive-os/plugins/focus-recovery'

// Sample store data — the store visualizes itself
const sampleStore = createStore({
  entities: {
    entities: { id: 'entities', data: { label: 'entities', type: 'group', count: 6 } },
    e_focus: { id: 'e_focus', data: { label: '__focus__', type: 'meta', value: '{ focusedId: "item-1" }' } },
    e_selection: { id: 'e_selection', data: { label: '__selection__', type: 'meta', value: '{ selectedIds: [] }' } },
    e_expanded: { id: 'e_expanded', data: { label: '__expanded__', type: 'meta', value: '{ expandedIds: ["folder-1"] }' } },
    e_item1: { id: 'e_item1', data: { label: 'item-1', type: 'entity', value: '{ data: { name: "Hello" } }' } },
    e_item2: { id: 'e_item2', data: { label: 'item-2', type: 'entity', value: '{ data: { name: "World" } }' } },
    e_folder1: { id: 'e_folder1', data: { label: 'folder-1', type: 'entity', value: '{ data: { name: "Docs" } }' } },
    relationships: { id: 'relationships', data: { label: 'relationships', type: 'group', count: 2 } },
    r_root: { id: 'r_root', data: { label: 'ROOT → [item-1, item-2, folder-1]', type: 'rel', value: '' } },
    r_folder1: { id: 'r_folder1', data: { label: 'folder-1 → [item-3, item-4]', type: 'rel', value: '' } },
  },
  relationships: {
    [ROOT_ID]: ['entities', 'relationships'],
    entities: ['e_focus', 'e_selection', 'e_expanded', 'e_item1', 'e_item2', 'e_folder1'],
    relationships: ['r_root', 'r_folder1'],
  },
})

const plugins = [core(), crud(), history(), focusRecovery()]

export default function PageStoreExplorer() {
  const [data, setData] = useState<NormalizedData>(sampleStore)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Store Explorer</h2>
        <p className="page-desc">
          NormalizedData structure visualized as a tree — using the library's own TreeGrid.
          Entities (including meta entities like __focus__) and relationships are shown as a hierarchy.
        </p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>→←</kbd> <span className="key-hint">expand</span>{' '}
        <kbd>Enter</kbd> <span className="key-hint">create</span>{' '}
        <kbd>Del</kbd> <span className="key-hint">delete</span>{' '}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>
      </div>
      <div className="card">
        <TreeGrid
          data={data}
          onChange={setData}
          enableEditing
          plugins={plugins}
          renderItem={(node, state: NodeState) => {
            const d = node.data as Record<string, unknown>
            const indent = ((state.level ?? 1) - 1) * 18
            const type = d?.type as string
            const isGroup = type === 'group'

            const cls = [
              'tree-node',
              state.focused && 'tree-node--focused',
              state.selected && !state.focused && 'tree-node--selected',
            ].filter(Boolean).join(' ')

            const tagStyle: React.CSSProperties = {
              fontSize: '10px',
              padding: '1px 4px',
              borderRadius: '3px',
              marginLeft: '6px',
              opacity: 0.7,
            }

            const tagColors: Record<string, string> = {
              meta: '#f59e0b',
              entity: '#3b82f6',
              rel: '#8b5cf6',
              group: '#6b7280',
            }

            return (
              <div className={cls} style={{ paddingLeft: 14 + indent }}>
                <span className="tree-node__chevron">
                  {isGroup ? (state.expanded ? '▾' : '▸') : ''}
                </span>
                <span className="tree-node__name" style={{ fontWeight: isGroup ? 600 : 400, fontFamily: isGroup ? 'inherit' : 'var(--font-mono, monospace)' }}>
                  {d?.label as string}
                </span>
                {type && type !== 'group' && (
                  <span style={{ ...tagStyle, color: tagColors[type] ?? '#6b7280' }}>
                    {type}
                  </span>
                )}
                {isGroup && d?.count != null && (
                  <span style={{ ...tagStyle, color: '#6b7280' }}>
                    {d.count as number}
                  </span>
                )}
                {d?.value && (
                  <span style={{ marginLeft: '8px', opacity: 0.5, fontSize: '11px', fontFamily: 'var(--font-mono, monospace)' }}>
                    {d.value as string}
                  </span>
                )}
              </div>
            )
          }}
        />
      </div>
      <div className="page-section">
        <h3 className="page-section-title">NormalizedData shape</h3>
        <pre className="code-block"><code>{`interface NormalizedData {
  entities: Record<string, Entity>       // flat map of all entities
  relationships: Record<string, string[]> // parent → children IDs
}

// Meta entities (prefixed with __) store framework state:
// __focus__     → { focusedId: string }
// __selection__ → { selectedIds: string[] }
// __expanded__  → { expandedIds: string[] }
// __grid_col__  → { colIndex: number }`}</code></pre>
      </div>
    </div>
  )
}
