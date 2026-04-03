// ② 2026-04-04-a2ui-surface-showcase-prd.md
import type { NormalizedData } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'

/** A2UI v0.9 component entry in a flat list */
export interface A2UIComponent {
  id: string
  component: string
  [key: string]: unknown
}

/** A2UI v0.9 data model (JSON Pointer path → value) */
export type A2UIDataModel = Record<string, unknown>

/** A2UI v0.9 updateComponents message payload */
export interface A2UIPayload {
  components: A2UIComponent[]
  dataModel?: A2UIDataModel
}

const MAX_DEPTH = 20

/**
 * A2UI flat component list → NormalizedData.
 *
 * Children are resolved from:
 * - `children` (array of IDs — Row, Column, List)
 * - `child` (single ID — Card, Button)
 * - `tabItems` (array of {title, child} — Tabs)
 */
export function a2uiToNormalized(payload: A2UIPayload): NormalizedData {
  const entities: NormalizedData['entities'] = {}
  const relationships: NormalizedData['relationships'] = { [ROOT_ID]: [] }

  // Resolve data bindings: replace { path: "/foo/bar" } with actual values
  const resolveBindings = (value: unknown): unknown => {
    if (value == null || typeof value !== 'object') return value
    if (Array.isArray(value)) return value.map(resolveBindings)
    const obj = value as Record<string, unknown>
    if ('path' in obj && typeof obj.path === 'string' && Object.keys(obj).length === 1) {
      return resolveDataPath(payload.dataModel ?? {}, obj.path as string)
    }
    const resolved: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
      resolved[k] = resolveBindings(v)
    }
    return resolved
  }

  // Track which IDs are referenced as children (not roots)
  const childIds = new Set<string>()

  for (const comp of payload.components) {
    const children = extractChildIds(comp)
    for (const cid of children) childIds.add(cid)
  }

  for (const comp of payload.components) {
    const { id, component, children: _c, child: _ch, tabItems: _t, ...rest } = comp
    const resolvedProps = resolveBindings(rest) as Record<string, unknown>

    entities[id] = { id, data: { component, ...resolvedProps } }

    const childList = extractChildIds(comp)
    if (childList.length > 0) {
      relationships[id] = childList
    }

    // Root = not referenced as anyone's child
    if (!childIds.has(id)) {
      relationships[ROOT_ID].push(id)
    }
  }

  return { entities, relationships }
}

function extractChildIds(comp: A2UIComponent): string[] {
  const ids: string[] = []

  // children: string[] (Row, Column, List)
  if (Array.isArray(comp.children)) {
    for (const c of comp.children) {
      if (typeof c === 'string') ids.push(c)
    }
  }

  // child: string (Card, Button)
  if (typeof comp.child === 'string') {
    ids.push(comp.child)
  }

  // tabItems: Array<{ title: string, child: string }>
  if (Array.isArray(comp.tabItems)) {
    for (const item of comp.tabItems as Array<{ title?: string; child?: string }>) {
      if (typeof item.child === 'string') ids.push(item.child)
    }
  }

  // entryPointChild / contentChild (Modal)
  if (typeof comp.entryPointChild === 'string') ids.push(comp.entryPointChild)
  if (typeof comp.contentChild === 'string') ids.push(comp.contentChild)

  return ids
}

/** Resolve a JSON Pointer path like "/booking/date" against a data model */
function resolveDataPath(model: A2UIDataModel, path: string): unknown {
  if (!path.startsWith('/')) return undefined
  const segments = path.slice(1).split('/')
  let current: unknown = model
  for (const seg of segments) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[seg]
  }
  return current
}

/** Check for circular references during render traversal */
export function isSafeDepth(depth: number): boolean {
  return depth < MAX_DEPTH
}
