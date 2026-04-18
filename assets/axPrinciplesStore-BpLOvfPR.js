var e=`/**
 * ax Principles store — NormalizedData-based store for the 20 meta-principles,
 * 25 ax axes, and 20 principle ↔ axis mappings. Derives filter/search state via
 * axPrinciplesState selectors.
 *
 * Commands:
 *   - axPrinciples:select(id)      — sets the active principle/axis/mapping id
 *   - axPrinciples:setFilter(...)  — updates the active filter shape (status/tag/priority/query)
 *
 * keyMap is owned by the UI layer; this file exposes only pure commands.
 */
import { createStore, updateEntity, updateEntityData } from '@os/store/createStore'
import { defineCommands } from '@os/engine/defineCommand'
import { ROOT_ID } from '@os/store/types'
import type { Entity, NormalizedData } from '@os/store/types'
import { principles, axes, mappings } from './axPrinciplesFixtures'
import type {
  PrincipleFilter, PrincipleStatus, PrincipleTag, PrinciplePriority,
} from './axPrincipleSchema'

// ── Well-known entity ids for view state ────────────────

/** Singleton entity holding active selection (id of the focused node). */
export const AX_PRINCIPLES_SELECTION_ID = '__ax-principles-selection__'

/** Singleton entity holding the current filter shape. */
export const AX_PRINCIPLES_FILTER_ID = '__ax-principles-filter__'

// ── Initial store ───────────────────────────────────────

function buildEntities(): Record<string, Entity> {
  const entities: Record<string, Entity> = {}
  for (const p of principles) entities[p.id] = { id: p.id, data: p }
  for (const a of axes) entities[a.id] = { id: a.id, data: a }
  for (const m of mappings) entities[m.id] = { id: m.id, data: m }
  entities[AX_PRINCIPLES_SELECTION_ID] = {
    id: AX_PRINCIPLES_SELECTION_ID,
    data: { type: 'selection', nodeId: principles[0]?.id ?? null },
  }
  entities[AX_PRINCIPLES_FILTER_ID] = {
    id: AX_PRINCIPLES_FILTER_ID,
    data: { type: 'filter' },
  }
  return entities
}

function buildRelationships(): Record<string, string[]> {
  return {
    [ROOT_ID]: [
      ...principles.map(p => p.id),
      ...axes.map(a => a.id),
      ...mappings.map(m => m.id),
    ],
  }
}

export const axPrinciplesStore: NormalizedData = createStore({
  entities: buildEntities(),
  relationships: buildRelationships(),
})

// ── Commands ────────────────────────────────────────────

export const axPrinciplesCommands = defineCommands({
  select: {
    type: 'axPrinciples:select' as const,
    meta: true,
    create: (nodeId: string | null) => ({ nodeId }),
    handler: (store, { nodeId }) =>
      updateEntityData(store, AX_PRINCIPLES_SELECTION_ID, { nodeId }),
  },

  setFilter: {
    type: 'axPrinciples:setFilter' as const,
    meta: true,
    create: (patch: Partial<PrincipleFilter>) => ({ patch }),
    handler: (store, { patch }) => {
      const current = (store.entities[AX_PRINCIPLES_FILTER_ID]?.data ?? {}) as PrincipleFilter & {
        type?: 'filter'
      }
      const next: Record<string, unknown> = { type: 'filter' }
      const merged: PrincipleFilter = { ...current, ...patch }
      // Drop explicit \`undefined\` keys so selectors see "unset".
      const keys: (keyof PrincipleFilter)[] = ['status', 'tag', 'priority', 'query']
      for (const k of keys) {
        const v = merged[k]
        if (v !== undefined && v !== '') next[k] = v
      }
      // Full replace — shallow merge would preserve keys the user just unset.
      return updateEntity(store, AX_PRINCIPLES_FILTER_ID, { data: next })
    },
  },

  clearFilter: {
    type: 'axPrinciples:clearFilter' as const,
    meta: true,
    handler: (store) =>
      // Full replace (not merge) — otherwise previous status/tag/priority/query keys
      // survive through the shallow merge in updateEntityData.
      updateEntity(store, AX_PRINCIPLES_FILTER_ID, { data: { type: 'filter' } }),
  },
})

// ── Re-exports for UI layer convenience ─────────────────

export type { PrincipleFilter, PrincipleStatus, PrincipleTag, PrinciplePriority }
`;export{e as default};