// ② 2026-04-03-command-unification-prd.md
import type { NormalizedData } from './types'
import { ROOT_ID } from './types'

/**
 * Create a minimal NormalizedData with a single node.
 * Useful for disclosure/toggle components that need engine participation
 * without a complex entity tree.
 */
export function createSingleNodeStore(nodeId: string): NormalizedData {
  return {
    entities: {
      [ROOT_ID]: { id: ROOT_ID },
      [nodeId]: { id: nodeId },
    },
    relationships: { [ROOT_ID]: [nodeId] },
  }
}

/**
 * Create a NormalizedData with N sequential nodes under root.
 * Useful for pagination/spread components where each page is a node.
 */
export function createSequentialStore(prefix: string, count: number): NormalizedData {
  const ids = Array.from({ length: count }, (_, i) => `${prefix}-${i}`)
  const entities: Record<string, { id: string }> = { [ROOT_ID]: { id: ROOT_ID } }
  for (const id of ids) entities[id] = { id }
  return {
    entities,
    relationships: { [ROOT_ID]: ids },
  }
}
