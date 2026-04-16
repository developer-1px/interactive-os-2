import type { NormalizedData } from '../store/types'
import { defineCommands } from '../engine/defineCommand'

export const FOCUS_ID = '__focus__'
export const GRID_COL_ID = '__grid_col__'
export const CELL_RANGE_ID = '__cell_range__'

export const focusCommands = defineCommands({
  setFocus: {
    type: 'core:focus' as const,
    meta: true,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store, { nodeId }) => {
      if ((store.entities[FOCUS_ID] as { focusedId?: string } | undefined)?.focusedId === nodeId) return store
      return {
        ...store,
        entities: {
          ...store.entities,
          [FOCUS_ID]: { id: FOCUS_ID, focusedId: nodeId },
        },
      }
    },
  },
})

interface CellRangeEntityValue {
  anchorRowId: string
  anchorCol: number
  focusRowId: string
  focusCol: number
}

function getCellRange(store: NormalizedData): CellRangeEntityValue | null {
  const ent = store.entities[CELL_RANGE_ID] as { value?: CellRangeEntityValue | null } | undefined
  return ent?.value ?? null
}

export const gridCellRangeCommands = defineCommands({
  setRange: {
    type: 'core:cell-range-set' as const,
    meta: true,
    create: (range: CellRangeEntityValue) => range,
    handler: (store, range) => ({
      ...store,
      entities: {
        ...store.entities,
        [CELL_RANGE_ID]: { id: CELL_RANGE_ID, value: range },
      },
    }),
  },

  extendRange: {
    type: 'core:cell-range-extend' as const,
    meta: true,
    create: (focus: { focusRowId: string; focusCol: number }) => focus,
    handler: (store, { focusRowId, focusCol }) => {
      const current = getCellRange(store)
      const next: CellRangeEntityValue = current
        ? { ...current, focusRowId, focusCol }
        : { anchorRowId: focusRowId, anchorCol: focusCol, focusRowId, focusCol }
      return {
        ...store,
        entities: {
          ...store.entities,
          [CELL_RANGE_ID]: { id: CELL_RANGE_ID, value: next },
        },
      }
    },
  },

  clearRange: {
    type: 'core:cell-range-clear' as const,
    meta: true,
    handler: (store) => {
      if (getCellRange(store) === null) return store
      return {
        ...store,
        entities: {
          ...store.entities,
          [CELL_RANGE_ID]: { id: CELL_RANGE_ID, value: null },
        },
      }
    },
  },
})

export const gridColCommands = defineCommands({
  setColIndex: {
    type: 'core:set-col-index' as const,
    meta: true,
    create: (colIndex: number) => ({ colIndex }),
    handler: (store, { colIndex }) => ({
      ...store,
      entities: {
        ...store.entities,
        [GRID_COL_ID]: { id: GRID_COL_ID, colIndex },
      },
    }),
  },
})
