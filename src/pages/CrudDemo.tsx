import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Up, Down, Left, Right } from './kbdIcons'
import { TreeGrid } from '../interactive-os/ui/TreeGrid'
import { createStore, getChildren } from '../interactive-os/store/createStore'
import { ROOT_ID } from '../interactive-os/store/types'
import type { NormalizedData } from '../interactive-os/store/types'
import type { Plugin } from '../interactive-os/plugins/types'
import type { PatternContext, NodeState } from '../interactive-os/pattern/types'
import { FOCUS_ID } from '../interactive-os/axis/navigate'
import { history } from '../interactive-os/plugins/history'
import { crud, crudCommands } from '../interactive-os/plugins/crud'
import { focusRecovery } from '../interactive-os/plugins/focusRecovery'
import { getAriaActions } from '../interactive-os/primitives/ariaRegistry'

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

const randomNames = ['Webpack', 'Vite', 'Rollup', 'esbuild', 'Turbopack', 'Parcel', 'SWC', 'Bun', 'Deno', 'Rome']
let counter = 0

/** Find parent of focusedId using getChildren traversal (PatternContext has no getParent) */
function findParent(focusedId: string, getChildrenFn: (id: string) => string[]): string {
  const roots = getChildrenFn(ROOT_ID)
  for (const rootId of roots) {
    if (rootId === focusedId) return ROOT_ID
    const children = getChildrenFn(rootId)
    if (children.includes(focusedId)) return rootId
    for (const childId of children) {
      const grandchildren = getChildrenFn(childId)
      if (grandchildren.includes(focusedId)) return childId
    }
  }
  return roots[0] ?? ROOT_ID
}

function makeCreateCommand(focusedId: string, getChildrenFn: (id: string) => string[]) {
  const name = randomNames[counter % randomNames.length]!
  const id = `item-${++counter}`
  const parentId = focusedId ? findParent(focusedId, getChildrenFn) : (getChildrenFn(ROOT_ID)[0] ?? ROOT_ID)
  const siblings = getChildrenFn(parentId)
  const index = focusedId ? siblings.indexOf(focusedId) + 1 : siblings.length
  return crudCommands.create({ id, data: { label: name, type: 'item' } }, parentId, index)
}

// Inline plugin: N key → create after focused (engine pipeline: focusRecovery + history)
const createPlugin: Plugin = {
  keyMap: {
    'N': (ctx: PatternContext) => makeCreateCommand(ctx.focused, ctx.getChildren),
  },
}

const plugins = [crud(), createPlugin, history(), focusRecovery()]

export default function CrudDemo() {
  const [data, setData] = useState<NormalizedData>(treeData)

  const handleCreate = () => {
    const aria = getAriaActions('crud')
    if (!aria) return
    const store = aria.getStore()
    const focusedId = (store.entities[FOCUS_ID] as { focusedId?: string } | undefined)?.focusedId ?? ''
    aria.dispatch(makeCreateCommand(focusedId, (id) => getChildren(store, id)))
  }

  return (
    <>
      <div className="page-keys">
        <kbd><Up /><Down /></kbd> <span className="key-hint">navigate</span>{' '}
        <kbd><Left /><Right /></kbd> <span className="key-hint">expand</span>{' '}
        <kbd>N</kbd> <span className="key-hint">create</span>{' '}
        <kbd>Del</kbd> <span className="key-hint">delete</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">select</span>{' '}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>{' '}
        <kbd>⌘⇧Z</kbd> <span className="key-hint">redo</span>{' '}
        <button type="button" onClick={handleCreate} style={{ marginLeft: 'var(--space-sm)', fontSize: '0.85em' }}>+ Add item</button>
      </div>
      <div className="card">
        <TreeGrid
          id="crud"
          data={data}
          onChange={setData}
          enableEditing
          plugins={plugins}
          renderItem={(props, node, state: NodeState) => {
            const d = node.data as Record<string, unknown>
            const isGroup = d?.type === 'group'
            const indent = ((state.level ?? 1) - 1) * 18

            const cls = [
              'tree-node',
              state.focused && 'tree-node--focused',
              state.selected && !state.focused && 'tree-node--selected',
            ].filter(Boolean).join(' ')

            return (
              <div {...props} className={cls} style={{ paddingLeft: 14 + indent }}>
                <span className="tree-node__chevron">
                  {isGroup ? (state.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : ''}
                </span>
                <span className="tree-node__name" style={{ fontWeight: isGroup ? 600 : 400 }}>
                  {d?.label as string}
                </span>
              </div>
            )
          }}
        />
      </div>
    </>
  )
}
