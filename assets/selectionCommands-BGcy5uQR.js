var e=`import type { Command } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { defineCommands } from '../engine/defineCommand'

export const SELECTION_ID = '__selection__'
export const SELECTION_ANCHOR_ID = '__selection_anchor__'

function getSelectedIds(store: NormalizedData): string[] {
  return (store.entities[SELECTION_ID]?.selectedIds as string[]) ?? []
}

const _selectionCommands = defineCommands({
  toggleSelect: {
    type: 'core:toggle-select' as const,
    meta: true,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store, { nodeId }) => {
      const current = getSelectedIds(store)
      const selectedIds = current.includes(nodeId)
        ? current.filter((id) => id !== nodeId)
        : [...current, nodeId]
      return {
        ...store,
        entities: {
          ...store.entities,
          [SELECTION_ID]: { id: SELECTION_ID, selectedIds },
        },
      }
    },
  },

  setAnchor: {
    type: 'core:set-anchor' as const,
    meta: true,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store, { nodeId }) => ({
      ...store,
      entities: {
        ...store.entities,
        [SELECTION_ANCHOR_ID]: { id: SELECTION_ANCHOR_ID, anchorId: nodeId },
      },
    }),
  },

  selectRange: {
    type: 'core:select-range' as const,
    meta: true,
    create: (nodeIds: string[]) => ({ nodeIds }),
    handler: (store, { nodeIds }) => ({
      ...store,
      entities: {
        ...store.entities,
        [SELECTION_ID]: { id: SELECTION_ID, selectedIds: nodeIds },
      },
    }),
  },

  clearAnchor: {
    type: 'core:clear-anchor' as const,
    meta: true,
    handler: (store) => {
      const prev = store.entities[SELECTION_ANCHOR_ID]?.anchorId as string | undefined
      if (!prev) return store
      const { [SELECTION_ANCHOR_ID]: _removed, ...rest } = store.entities
      void _removed
      return { ...store, entities: rest }
    },
  },

  clearSelection: {
    type: 'core:clear-selection' as const,
    meta: true,
    handler: (store) => ({
      ...store,
      entities: {
        ...store.entities,
        [SELECTION_ID]: { id: SELECTION_ID, selectedIds: [] },
      },
    }),
  },
})

/** Composed: defineCommands + sugar delegators */
export const selectionCommands = {
  ..._selectionCommands,
  /** Sugar: select = selectRange([nodeId]) */
  select: (nodeId: string): Command => _selectionCommands.selectRange([nodeId]),
}
`;export{e as default};