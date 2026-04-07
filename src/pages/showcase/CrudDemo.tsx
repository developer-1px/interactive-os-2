import { ax } from '@styles/ax'
import { Up, Down, Left, Right } from '../shared/kbdIcons'
import { TreeGrid } from '@os/ui/TreeGrid'
import { createStore, getChildren } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import { useStore } from '@os/store/useStore'
import type { Plugin } from '@os/plugins/types'
import { key } from '@os/axis/types'
import { FOCUS_ID } from '@os/axis/navigate'
import { history } from '@os/plugins/history'
import { crud, crudCommands } from '@os/plugins/crud'
import { focusRecovery } from '@os/plugins/focusRecovery'
import { getAriaActions } from '@os/primitives/ariaRegistry'

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
    'N': key(['crud:create'], (ctx) => makeCreateCommand(ctx.focused, ctx.getChildren)),
  },
}

const plugins = [crud(), createPlugin, history(), focusRecovery()]

export default function CrudDemo() {
  const [data, setData] = useStore(treeData)

  const handleCreate = () => {
    const aria = getAriaActions('crud')
    if (!aria) return
    const store = aria.getStore()
    const focusedId = (store.entities[FOCUS_ID] as { focusedId?: string } | undefined)?.focusedId ?? ''
    aria.dispatch(makeCreateCommand(focusedId, (id) => getChildren(store, id)))
  }

  return (
    <>
      <div className="page-keys inline-flex flex-wrap items-center">
        <kbd><Up /><Down /></kbd> <span className="key-hint">navigate</span>{' '}
        <kbd><Left /><Right /></kbd> <span className="key-hint">expand</span>{' '}
        <kbd>N</kbd> <span className="key-hint">create</span>{' '}
        <kbd>Del</kbd> <span className="key-hint">delete</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">select</span>{' '}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>{' '}
        <kbd>⌘⇧Z</kbd> <span className="key-hint">redo</span>{' '}
        <button type="button" onClick={handleCreate} className={ax({ surface: 'ghost', controlSize: 'sm', textStyle: 'caption' })}>+ Add item</button>
      </div>
      <div className="card overflow-hidden">
        <TreeGrid
          id="crud"
          data={data}
          onChange={setData}
          enableEditing
          plugins={plugins}
        />
      </div>
    </>
  )
}
