// ② 2026-04-04-a2ui-surface-showcase-prd.md
import type { NormalizedData } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'
import { resolveDynamic, resolveDataPath } from './a2uiFunctions'
import type { A2UIComponent } from './a2uiProtocol'

export type { A2UIComponent }

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
  const dataModel = payload.dataModel ?? {}

  // Resolve data bindings: {path}, {call}, or literal → resolved values
  const resolveBindings = (value: unknown): unknown => {
    if (value == null || typeof value !== 'object') return value
    if (Array.isArray(value)) return value.map(resolveBindings)
    const obj = value as Record<string, unknown>
    // Try resolveDynamic for {path: "..."} and {call: "...", args: {...}}
    if ('path' in obj || 'call' in obj) {
      return resolveDynamic(obj, dataModel)
    }
    const resolved: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
      resolved[k] = resolveBindings(v)
    }
    return resolved
  }

  // Expand ChildList templates: {path, componentId} → generated component instances
  const expandedComponents = expandChildListTemplates(payload.components, dataModel)

  // Track which IDs are referenced as children (not roots)
  const childIds = new Set<string>()

  for (const comp of expandedComponents) {
    const children = extractChildIds(comp)
    for (const cid of children) childIds.add(cid)
  }

  for (const comp of expandedComponents) {
    const { id, component, children: _c, child: _ch, ...rest } = comp
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

/**
 * Expand ChildList templates ({path, componentId}) into concrete component instances.
 * For each item in the data array at `path`, clone the template component with a scoped ID.
 */
function expandChildListTemplates(
  components: A2UIComponent[],
  dataModel: Record<string, unknown>,
): A2UIComponent[] {
  const compMap = new Map(components.map(c => [c.id, c]))
  const expanded: A2UIComponent[] = []

  for (const comp of components) {
    const children = comp.children
    // Check if children is a ChildList template: {path, componentId}
    if (
      children != null &&
      typeof children === 'object' &&
      !Array.isArray(children) &&
      'path' in (children as Record<string, unknown>) &&
      'componentId' in (children as Record<string, unknown>)
    ) {
      const template = children as { path: string; componentId: string }
      const arrayData = resolveDataPath(dataModel, template.path)
      if (!Array.isArray(arrayData)) {
        expanded.push({ ...comp, children: [] })
        continue
      }

      const templateComp = compMap.get(template.componentId)
      const generatedIds: string[] = []

      for (let i = 0; i < arrayData.length; i++) {
        const itemId = `${comp.id}__${template.componentId}__${i}`
        generatedIds.push(itemId)

        if (templateComp) {
          // Clone template, resolving relative paths against the item scope
          const { id: _tid, ...templateProps } = templateComp
          const scopedProps = resolveRelativePaths(templateProps, template.path, i, dataModel)
          expanded.push({ ...scopedProps, id: itemId } as A2UIComponent)
        } else {
          // No template found, create a text placeholder
          expanded.push({ id: itemId, component: 'Text', text: String(arrayData[i]) })
        }
      }

      // Replace template children with generated IDs
      expanded.push({ ...comp, children: generatedIds })
    } else {
      expanded.push(comp)
    }
  }

  return expanded
}

/** Resolve relative paths in props against collection scope */
function resolveRelativePaths(
  props: Record<string, unknown>,
  collectionPath: string,
  index: number,
  dataModel: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(props)) {
    if (v != null && typeof v === 'object' && !Array.isArray(v)) {
      const obj = v as Record<string, unknown>
      if ('path' in obj && typeof obj.path === 'string' && Object.keys(obj).length === 1) {
        const path = obj.path as string
        // Relative path (no leading /) → resolve against collection scope
        if (!path.startsWith('/')) {
          const absolutePath = `${collectionPath}/${index}/${path}`
          const resolved = resolveDataPath(dataModel, absolutePath)
          result[k] = resolved ?? v
          continue
        }
      }
    }
    result[k] = v
  }
  return result
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

/** Check for circular references during render traversal */
export function isSafeDepth(depth: number): boolean {
  return depth < MAX_DEPTH
}
