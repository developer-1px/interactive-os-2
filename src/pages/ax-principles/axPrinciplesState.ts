/**
 * Derived selectors over axPrinciplesStore.
 *
 * All selectors are pure functions of NormalizedData — no hooks, no useState.
 * UI layer calls these with the current store to produce filtered/joined views.
 */
import type { NormalizedData } from '@os/store/types'
import type {
  Principle, Axis, Mapping, PrincipleFilter,
} from './axPrincipleSchema'
import {
  AX_PRINCIPLES_SELECTION_ID,
  AX_PRINCIPLES_FILTER_ID,
} from './axPrinciplesStore'

// ── Node-type accessors ─────────────────────────────────

function isPrinciple(data: unknown): data is Principle {
  return !!data && typeof data === 'object' && (data as { type?: string }).type === 'principle'
}

function isAxis(data: unknown): data is Axis {
  return !!data && typeof data === 'object' && (data as { type?: string }).type === 'axis'
}

function isMapping(data: unknown): data is Mapping {
  return !!data && typeof data === 'object' && (data as { type?: string }).type === 'mapping'
}

export function getAllPrinciples(store: NormalizedData): Principle[] {
  const out: Principle[] = []
  for (const entity of Object.values(store.entities)) {
    if (isPrinciple(entity.data)) out.push(entity.data)
  }
  return out
}

export function getAllAxes(store: NormalizedData): Axis[] {
  const out: Axis[] = []
  for (const entity of Object.values(store.entities)) {
    if (isAxis(entity.data)) out.push(entity.data)
  }
  return out
}

export function getAllMappings(store: NormalizedData): Mapping[] {
  const out: Mapping[] = []
  for (const entity of Object.values(store.entities)) {
    if (isMapping(entity.data)) out.push(entity.data)
  }
  return out
}

// ── Single-entity lookups ───────────────────────────────

export function selectPrincipleById(store: NormalizedData, id: string): Principle | undefined {
  const data = store.entities[id]?.data
  return isPrinciple(data) ? data : undefined
}

export function selectAxisById(store: NormalizedData, axisId: string): Axis | undefined {
  const data = store.entities[axisId]?.data
  return isAxis(data) ? data : undefined
}

export function selectMappingById(store: NormalizedData, mappingId: string): Mapping | undefined {
  const data = store.entities[mappingId]?.data
  return isMapping(data) ? data : undefined
}

// ── Relational selectors ────────────────────────────────

/** All mappings that reference the given principle. */
export function selectMappingsByPrinciple(
  store: NormalizedData,
  principleId: string,
): Mapping[] {
  return getAllMappings(store).filter(m => m.principleId === principleId)
}

/** All axes linked to the given principle (via mappings). Deduplicated. */
export function selectAxesForPrinciple(
  store: NormalizedData,
  principleId: string,
): Axis[] {
  const mappingAxisIds = new Set<string>()
  for (const m of selectMappingsByPrinciple(store, principleId)) {
    for (const axisId of m.axisIds) mappingAxisIds.add(axisId)
  }
  const out: Axis[] = []
  for (const axisId of mappingAxisIds) {
    const axis = selectAxisById(store, axisId)
    if (axis) out.push(axis)
  }
  return out
}

/** All principles linked to the given axis (via mappings). */
export function selectPrinciplesForAxis(
  store: NormalizedData,
  axisId: string,
): Principle[] {
  const out: Principle[] = []
  for (const m of getAllMappings(store)) {
    if (!m.axisIds.includes(axisId)) continue
    const p = selectPrincipleById(store, m.principleId)
    if (p) out.push(p)
  }
  return out
}

// ── Filter / search ─────────────────────────────────────

export function selectFilter(store: NormalizedData): PrincipleFilter {
  const data = (store.entities[AX_PRINCIPLES_FILTER_ID]?.data ?? {}) as PrincipleFilter & {
    type?: 'filter'
  }
  const { type: _type, ...rest } = data
  void _type
  return rest
}

function matchesQuery(p: Principle, query: string): boolean {
  const q = query.toLowerCase().trim()
  if (!q) return true
  return (
    p.name.toLowerCase().includes(q)
    || p.summary.toLowerCase().includes(q)
    || p.definition.toLowerCase().includes(q)
    || p.id.toLowerCase().includes(q)
  )
}

export function selectFilteredPrinciples(
  store: NormalizedData,
  filterOverride?: PrincipleFilter,
): Principle[] {
  const filter = filterOverride ?? selectFilter(store)
  const all = getAllPrinciples(store)
  return all.filter((p) => {
    if (filter.status && p.status !== filter.status) return false
    if (filter.tag && !p.tags.includes(filter.tag)) return false
    if (filter.priority && p.priority !== filter.priority) return false
    if (filter.query && !matchesQuery(p, filter.query)) return false
    return true
  })
}

// ── Selection ───────────────────────────────────────────

export function selectSelectedId(store: NormalizedData): string | null {
  const raw = (store.entities[AX_PRINCIPLES_SELECTION_ID]?.data ?? {}) as { nodeId?: string | null }
  return raw.nodeId ?? null
}

export function selectSelectedPrinciple(store: NormalizedData): Principle | undefined {
  const id = selectSelectedId(store)
  return id ? selectPrincipleById(store, id) : undefined
}
