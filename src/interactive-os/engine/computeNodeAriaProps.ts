// ② 2026-04-05-inspector-aria-xray-prd.md
import type { Entity, NormalizedData } from '../store/types'
import { ROOT_ID } from '../store/types'
import { getChildren, getParent, getEntity } from '../store/createStore'
// Inline types to avoid circular dependency (engine → pattern/axis → engine)
interface InspectNodeState {
  focused: boolean
  selected: boolean
  disabled: boolean
  index: number
  siblingCount: number
  expanded?: boolean
  checked?: boolean | 'mixed'
  level?: number
  valueCurrent?: number
  open?: boolean
  renaming?: boolean
  [key: string]: unknown
}
type AriaGen = (state: Record<string, unknown>, entity: Record<string, unknown>, childRole: string) => Record<string, string>
type StateGen = (id: string, store: NormalizedData, children: string[], patternMeta: Record<string, unknown>) => Partial<InspectNodeState>

const FOCUS_ID = '__focus__'
const SELECTION_ID = '__selection__'
const RENAME_ID = '__rename__'

export interface InspectPatternInfo {
  childRole?: string | ((entity: Entity, state: InspectNodeState) => string)
  ariaGens?: AriaGen[]
  stateGens?: StateGen[]
  ariaAttributes?: (node: Entity, state: InspectNodeState) => Record<string, string>
  expandable?: boolean
  panelVisibility?: 'selected' | 'expanded'
  popupType?: string
  selectionMode?: string
  colCount?: number
  panelRole?: string
}

function computeNodeState(
  id: string,
  store: NormalizedData,
  focusedId: string,
  selectedIdSet: Set<string>,
  pattern: InspectPatternInfo,
): InspectNodeState {
  const parentId = getParent(store, id)
  const siblings = parentId ? getChildren(store, parentId) : []
  const children = getChildren(store, id)

  let level = 0
  let current = id
  let guard = 0
  while (true) {
    guard++
    if (guard > 100) break
    const parent = getParent(store, current)
    if (!parent || parent === ROOT_ID) break
    level++
    current = parent
  }

  const renameEntity = store.entities[RENAME_ID] as Record<string, unknown> | undefined
  const renaming = !!(renameEntity?.active && renameEntity?.nodeId === id)

  const state: InspectNodeState = {
    focused: id === focusedId,
    selected: selectedIdSet.has(id),
    disabled: false,
    index: siblings.indexOf(id),
    siblingCount: siblings.length,
    level: level + 1,
    renaming,
  }

  const patternMeta: Record<string, unknown> = {
    expandable: pattern.expandable,
    panelVisibility: pattern.panelVisibility,
    popupType: pattern.popupType,
    selectionMode: pattern.selectionMode,
    colCount: pattern.colCount,
  }

  for (const gen of pattern.stateGens ?? []) {
    Object.assign(state, gen(id, store, children, patternMeta))
  }

  return state
}

/**
 * Compute ARIA props for a single node — pure function, no React dependency.
 * Mirrors the getNodeProps logic in useAriaView but works from store + pattern only.
 */
export function computeNodeAriaProps(
  id: string,
  store: NormalizedData,
  pattern: InspectPatternInfo,
  focusedId?: string,
  selectedIdSet?: Set<string>,
): Record<string, string> {
  if (focusedId === undefined) {
    const focusEntity = store.entities[FOCUS_ID] as Record<string, unknown> | undefined
    focusedId = (focusEntity?.focusedId as string) ?? ''
  }
  if (!selectedIdSet) {
    const selectionEntity = store.entities[SELECTION_ID] as Record<string, unknown> | undefined
    selectedIdSet = new Set<string>((selectionEntity?.selectedIds as string[]) ?? [])
  }

  const entity = getEntity(store, id)
  if (!entity) return {}

  const state = computeNodeState(id, store, focusedId, selectedIdSet, pattern)

  const resolvedRole = typeof pattern.childRole === 'function'
    ? pattern.childRole(entity, state)
    : (pattern.childRole ?? '')

  // Axis-declared ARIA
  const props: Record<string, string> = {}
  for (const gen of pattern.ariaGens ?? []) {
    try {
      Object.assign(props, gen(state as unknown as Record<string, unknown>, entity as unknown as Record<string, unknown>, resolvedRole))
    } catch {
      // ④ boundary: ariaGen exception → skip this generator
    }
  }

  // Structural ARIA
  if (state.siblingCount > 1) {
    props['aria-posinset'] = String(state.index + 1)
    props['aria-setsize'] = String(state.siblingCount)
  }
  const label = (entity.data as Record<string, unknown>)?.label
  if (typeof label === 'string' && label) props['aria-label'] = label

  // Pattern-declared ARIA
  if (pattern.ariaAttributes) {
    try {
      Object.assign(props, pattern.ariaAttributes(entity, state))
    } catch {
      // ④ boundary: ariaAttributes exception → skip
    }
  }

  props.role = resolvedRole

  return props
}

/** Lightweight ARIA attrs for tree labels — role + key inline states only */
const LABEL_ATTRS = ['aria-selected', 'aria-expanded', 'aria-checked', 'aria-pressed', 'aria-disabled', 'aria-current'] as const

function computeNodeLabel(
  id: string,
  store: NormalizedData,
  pattern: InspectPatternInfo,
  focusedId: string,
  selectedIdSet: Set<string>,
): Record<string, string> {
  const entity = getEntity(store, id)
  if (!entity) return {}

  const state = computeNodeState(id, store, focusedId, selectedIdSet, pattern)
  const resolvedRole = typeof pattern.childRole === 'function'
    ? pattern.childRole(entity, state)
    : (pattern.childRole ?? '')

  const props: Record<string, string> = { role: resolvedRole }

  // Only compute axis-declared ARIA to extract inline states
  for (const gen of pattern.ariaGens ?? []) {
    try {
      const attrs = gen(state as unknown as Record<string, unknown>, entity as unknown as Record<string, unknown>, resolvedRole)
      for (const attr of LABEL_ATTRS) {
        if (attrs[attr] !== undefined) props[attr] = attrs[attr]!
      }
    } catch { /* skip broken generator */ }
  }

  return props
}

/**
 * Compute lightweight ARIA labels for all nodes (role + key states).
 * Full props are computed on-demand via computeNodeAriaProps for selected node only.
 */
export function computeAllNodeLabels(
  store: NormalizedData,
  pattern: InspectPatternInfo,
): Record<string, Record<string, string>> {
  const focusEntity = store.entities[FOCUS_ID] as Record<string, unknown> | undefined
  const focusedId = (focusEntity?.focusedId as string) ?? ''
  const selectionEntity = store.entities[SELECTION_ID] as Record<string, unknown> | undefined
  const selectedIdSet = new Set<string>((selectionEntity?.selectedIds as string[]) ?? [])

  const result: Record<string, Record<string, string>> = {}

  const walk = (parentId: string) => {
    const childIds = getChildren(store, parentId)
    for (const id of childIds) {
      if (id.startsWith('__')) continue
      result[id] = computeNodeLabel(id, store, pattern, focusedId, selectedIdSet)
      walk(id)
    }
  }

  for (const rootId of store.relationships[ROOT_ID] ?? []) {
    if (rootId.startsWith('__')) continue
    result[rootId] = computeNodeLabel(rootId, store, pattern, focusedId, selectedIdSet)
    walk(rootId)
  }

  return result
}
