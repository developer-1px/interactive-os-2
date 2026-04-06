import type { VisibilityFilter } from '../engine/types'
import type { Plugin } from './types'
import { definePlugin } from './definePlugin'
import { defineCommands } from '../engine/defineCommand'
import { key } from '../axis/types'
import { getParent } from '../store/createStore'
import { ROOT_ID } from '../store/types'

export const SCOPE_ID = '__scope__'

export const scopeCommands = defineCommands({
  set: {
    type: 'scope:set' as const,
    create: (scopeRootId: string) => ({ scopeRootId }),
    handler: (store, { scopeRootId }) => ({
      ...store,
      entities: {
        ...store.entities,
        [SCOPE_ID]: { id: SCOPE_ID, scopeRootId },
      },
    }),
  },

  clear: {
    type: 'scope:clear' as const,
    handler: (store) => ({
      ...store,
      entities: {
        ...store.entities,
        [SCOPE_ID]: { id: SCOPE_ID, scopeRootId: null },
      },
    }),
  },
})

const scopeVisibilityFilter: VisibilityFilter = {
  shouldShow(nodeId, store) {
    const scopeEntity = store.entities[SCOPE_ID] as Record<string, unknown> | undefined
    const scopeRootId = scopeEntity?.scopeRootId as string | null | undefined
    if (!scopeRootId) return true
    if (nodeId === scopeRootId) return true

    // Walk up ancestors to check if nodeId is a descendant of scopeRootId
    let current = nodeId
    while (true) {
      const parent = getParent(store, current)
      if (!parent || parent === ROOT_ID) return false
      if (parent === scopeRootId) return true
      current = parent
    }
  },
}

export function scope(): Plugin {
  return definePlugin({
    name: 'scope',
    commands: {
      'scope:set': scopeCommands.set,
      'scope:clear': scopeCommands.clear,
    },
    keyMap: {
      'Mod+Shift+f': key(['scope:set'], (ctx) => scopeCommands.set(ctx.focused)),
      'Escape': key(['scope:clear'], (ctx) => {
        const scopeEntity = ctx.getEntity(SCOPE_ID) as Record<string, unknown> | undefined
        const scopeRootId = scopeEntity?.scopeRootId as string | null | undefined
        if (!scopeRootId) return undefined
        return scopeCommands.clear()
      }),
    },
    visibilityFilter: scopeVisibilityFilter,
  })
}
