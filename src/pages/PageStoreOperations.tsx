import { useState } from 'react'
import { ListBox } from '../interactive-os/ui/ListBox'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'
import { core } from '../interactive-os/plugins/core'
import { history } from '../interactive-os/plugins/history'
import { crud } from '../interactive-os/plugins/crud'
import { dnd } from '../interactive-os/plugins/dnd'
import { focusRecovery } from '../interactive-os/plugins/focus-recovery'

const opsData = createStore({
  entities: {
    op1: { id: 'op1', data: { label: 'addEntity(store, entity, parentId, index?)', desc: 'Insert entity at position' } },
    op2: { id: 'op2', data: { label: 'removeEntity(store, nodeId)', desc: 'Remove entity + subtree recursively' } },
    op3: { id: 'op3', data: { label: 'updateEntity(store, nodeId, updates)', desc: 'Merge partial updates into entity' } },
    op4: { id: 'op4', data: { label: 'moveNode(store, nodeId, newParent, index?)', desc: 'Reparent or reorder a node' } },
    op5: { id: 'op5', data: { label: 'getEntity(store, id)', desc: 'Lookup entity by ID' } },
    op6: { id: 'op6', data: { label: 'getChildren(store, parentId)', desc: 'Get child ID array for parent' } },
    op7: { id: 'op7', data: { label: 'getParent(store, nodeId)', desc: 'Find parent of a node (O(n))' } },
    op8: { id: 'op8', data: { label: 'getEntityData<T>(store, id)', desc: 'Type-safe accessor for entity.data' } },
    op9: { id: 'op9', data: { label: 'updateEntityData(store, id, updates)', desc: 'Merge into entity.data specifically' } },
  },
  relationships: {
    [ROOT_ID]: ['op1', 'op2', 'op3', 'op4', 'op5', 'op6', 'op7', 'op8', 'op9'],
  },
})

const plugins = [core(), crud(), dnd(), history(), focusRecovery()]

export default function PageStoreOperations() {
  const [data, setData] = useState<NormalizedData>(opsData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Operations</h2>
        <p className="page-desc">
          Pure functions that transform NormalizedData immutably.
          Every function returns a new store — no mutation, perfect for undo.
        </p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>Enter</kbd> <span className="key-hint">create</span>{' '}
        <kbd>Del</kbd> <span className="key-hint">delete</span>{' '}
        <kbd>Alt↑↓</kbd> <span className="key-hint">reorder</span>{' '}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>
      </div>
      <div className="card">
        <ListBox
          data={data}
          onChange={setData}
          enableEditing
          plugins={plugins}
          renderItem={(item, state: NodeState) => {
            const d = item.data as Record<string, unknown>
            const cls = [
              'list-item',
              state.focused && 'list-item--focused',
              state.selected && !state.focused && 'list-item--selected',
            ].filter(Boolean).join(' ')
            return (
              <div className={cls}>
                <span className="list-item__label" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '12px' }}>
                  {d?.label as string}
                </span>
                <span className="list-item__desc">{d?.desc as string}</span>
              </div>
            )
          }}
        />
      </div>
      <div className="page-section">
        <h3 className="page-section-title">Immutable transforms</h3>
        <pre className="code-block"><code>{`import { createStore, addEntity, removeEntity } from 'interactive-os/core/createStore'

// All operations return new NormalizedData — never mutate
const store = createStore()
const next = addEntity(store, { id: 'a', data: { name: 'Alice' } }, ROOT_ID)
const after = removeEntity(next, 'a')

// Plugins use these same operations internally.
// crud().create → calls addEntity
// crud().delete → calls removeEntity recursively
// dnd().moveTo  → calls moveNode`}</code></pre>
      </div>
    </div>
  )
}
