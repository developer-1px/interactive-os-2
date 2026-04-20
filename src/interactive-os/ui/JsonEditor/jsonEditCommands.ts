import type { Command, Middleware } from '../../engine/types'
import type { NormalizedData } from '../../store/types'
import type { ZodTypeAny } from 'zod'
import { defineCommand } from '../../engine/defineCommand'
import { updateEntityData, getEntity, getChildren, addEntity, getParent } from '../../store/createStore'
import { definePlugin } from '../../plugins/definePlugin'
import { cellsFor, type JsonNodeCore, type JsonPathSegment, type JsonType, type JsonValue } from './jsonToNormalized'
import { resolveSchemaAt } from './zodToAxis'

/**
 * Write partial core fields to entity.data and re-derive cells[] from the next core.
 * Keeps cells (strings) in sync with data.key / data.type / data.value.
 */
function patchNode(
  store: NormalizedData,
  nodeId: string,
  corePatch: Partial<JsonNodeCore>,
): NormalizedData {
  const entity = getEntity(store, nodeId)
  if (!entity) return store
  const existing = (entity.data ?? {}) as unknown as JsonNodeCore
  const nextCore: JsonNodeCore = { ...existing, ...corePatch }
  return updateEntityData(store, nodeId, { ...corePatch, cells: cellsFor(nextCore) })
}

export const setJsonValue = defineCommand('jsonEditor:setValue', {
  create: (nodeId: string, value: string | number | boolean | null) => ({ nodeId, value }),
  handler: (store, { nodeId, value }) => patchNode(store, nodeId, { value }),
})

export const setJsonKey = defineCommand('jsonEditor:setKey', {
  create: (nodeId: string, key: string) => ({ nodeId, key }),
  handler: (store, { nodeId, key }) => patchNode(store, nodeId, { key }),
})

export const setJsonType = defineCommand('jsonEditor:setType', {
  create: (nodeId: string, type: JsonType, value?: string | number | boolean | null) => ({
    nodeId,
    type,
    value,
  }),
  handler: (store, { nodeId, type, value }) => {
    const isStructure = type === 'object' || type === 'array'
    const nextValue = isStructure ? undefined : (value ?? coerceDefault(type))
    return patchNode(store, nodeId, { type, value: nextValue })
  },
})

/**
 * Add a new string child to a container. For objects, generates a fresh key
 * (newKey, newKey_2, ...). For arrays, appends at the end. Returns new id so
 * the UI can focus + start rename.
 *
 * When `targetId` refers to a leaf, we add a sibling under its parent instead.
 */
function uniqueKey(existing: string[], base = 'newKey'): string {
  if (!existing.includes(base)) return base
  let i = 2
  while (existing.includes(`${base}_${i}`)) i += 1
  return `${base}_${i}`
}

function makeChildId(parentId: string, key: string | number): string {
  return typeof key === 'number'
    ? `${parentId}[${key}]`
    : parentId === '$' || parentId.endsWith('$')
      ? `$.${key}`
      : `${parentId}.${key}`
}

export const addJsonChild = defineCommand('jsonEditor:addChild', {
  create: (targetId: string) => ({ targetId }),
  handler: (store, { targetId }) => {
    const target = getEntity(store, targetId)?.data as JsonNodeCore | undefined
    if (!target) return store

    // Resolve parent: container → self; leaf → parent.
    let parentId = targetId
    let parent = target
    if (target.type !== 'object' && target.type !== 'array') {
      const pid = getParent(store, targetId)
      if (!pid) return store
      const pdata = getEntity(store, pid)?.data as JsonNodeCore | undefined
      if (!pdata || (pdata.type !== 'object' && pdata.type !== 'array')) return store
      parentId = pid
      parent = pdata
    }

    const children = getChildren(store, parentId)
    if (parent.type === 'array') {
      const index = children.length
      const id = makeChildId(parentId, index)
      const core: JsonNodeCore = {
        type: 'string', value: '', path: [...parent.path, index],
      }
      return addEntity(store, { id, data: { ...core, cells: cellsFor(core) } }, parentId)
    }

    // object
    const existingKeys = children
      .map((cid) => (getEntity(store, cid)?.data as JsonNodeCore | undefined)?.key ?? '')
      .filter((k) => k.length > 0)
    const key = uniqueKey(existingKeys)
    const id = makeChildId(parentId, key)
    const core: JsonNodeCore = {
      type: 'string', key, value: '', path: [...parent.path, key],
    }
    return addEntity(store, { id, data: { ...core, cells: cellsFor(core) } }, parentId)
  },
})

/** Resolve the future child id that addJsonChild would create — so the UI can
 *  focus + start rename on the new row right after dispatch. Uses PatternContext
 *  accessors so callers don't need a raw store reference. */
export interface NodeAccessors {
  getEntity: (id: string) => { id: string; data?: unknown } | undefined
  getChildren: (id: string) => string[]
  getParent: (id: string) => string | undefined
}

export function predictNewChildId(ctx: NodeAccessors, targetId: string): string | null {
  const target = ctx.getEntity(targetId)?.data as JsonNodeCore | undefined
  if (!target) return null
  let parentId = targetId
  let parent = target
  if (target.type !== 'object' && target.type !== 'array') {
    const pid = ctx.getParent(targetId)
    if (!pid) return null
    const pdata = ctx.getEntity(pid)?.data as JsonNodeCore | undefined
    if (!pdata || (pdata.type !== 'object' && pdata.type !== 'array')) return null
    parentId = pid
    parent = pdata
  }
  const children = ctx.getChildren(parentId)
  if (parent.type === 'array') return makeChildId(parentId, children.length)
  const existingKeys = children
    .map((cid) => (ctx.getEntity(cid)?.data as JsonNodeCore | undefined)?.key ?? '')
    .filter((k) => k.length > 0)
  return makeChildId(parentId, uniqueKey(existingKeys))
}

export const reindexArrayChild = defineCommand('jsonEditor:reindexArrayChild', {
  create: (nodeId: string, path: JsonPathSegment[]) => ({ nodeId, path }),
  handler: (store, { nodeId, path }) => {
    const entity = getEntity(store, nodeId)
    if (!entity) return store
    const existing = entity.data as unknown as JsonNodeCore
    const nextCore: JsonNodeCore = { ...existing, path }
    return updateEntityData(store, nodeId, { path, cells: cellsFor(nextCore) })
  },
})

export const toggleJsonBoolean = defineCommand('jsonEditor:toggleBoolean', {
  create: (nodeId: string) => ({ nodeId }),
  handler: (store, { nodeId }) => {
    const data = getEntity(store, nodeId)?.data as JsonNodeCore | undefined
    if (!data || data.type !== 'boolean') return store
    return patchNode(store, nodeId, { value: !data.value })
  },
})

function coerceDefault(type: JsonType): string | number | boolean | null {
  switch (type) {
    case 'number': return 0
    case 'boolean': return false
    case 'null': return null
    case 'string':
    default:
      return ''
  }
}

/** Coerce a user-entered string into the typed JSON value that matches `type`. */
export function coerceString(raw: string, type: JsonType): string | number | boolean | null {
  if (type === 'number') {
    const n = Number(raw)
    return Number.isFinite(n) ? n : 0
  }
  if (type === 'boolean') return raw === 'true'
  if (type === 'null') return null
  return raw
}

function validateValueAt(
  schema: ZodTypeAny | undefined,
  getRootValue: (() => JsonValue) | undefined,
  path: readonly (string | number)[],
  value: unknown,
): boolean {
  if (!schema || !getRootValue) return true
  const sub = resolveSchemaAt(schema, path, getRootValue())
  if (!sub) return true
  return sub.safeParse(value).success
}

interface RenamePayload { nodeId: string; field: string; newValue: unknown }
interface ClipboardCellPayload { nodeId: string; colIndex: number }

export interface JsonEditPluginOptions {
  schema?: ZodTypeAny
  getRootValue?: () => JsonValue
}

/**
 * Middleware translates generic edit commands (rename:confirm, clipboard:pasteCellValue,
 * clipboard:clearCellValue) into typed JSON commands. data.* is SSOT; cells[] re-derived.
 * Paste/rename honor zod schema when provided.
 */
/**
 * After any structural change (paste/cut/duplicate/delete/rearrange) that can
 * affect array ordering, re-derive cells[0] and path[last] for all children of
 * every array in the store so index labels stay consistent with position.
 *
 * Cheap compared to a full re-normalize, and safe: only touches array children
 * whose position-derived index no longer matches their stored path/cells.
 */
function reindexArrays(next: (c: Command) => void, getStore: () => NormalizedData): void {
  const store = getStore()
  for (const id of Object.keys(store.entities)) {
    const data = store.entities[id]?.data as JsonNodeCore | undefined
    if (data?.type !== 'array') continue
    const children = getChildren(store, id)
    children.forEach((childId, i) => {
      const child = getEntity(store, childId)?.data as JsonNodeCore | undefined
      if (!child) return
      const last = child.path[child.path.length - 1]
      if (last === i) return
      const nextPath: JsonPathSegment[] = [...child.path.slice(0, -1), i]
      next(reindexArrayChild(childId, nextPath))
    })
  }
}

function jsonEditorMiddleware(opts: JsonEditPluginOptions): Middleware {
  const { schema, getRootValue } = opts
  return (next, getStore) => (command: Command) => {
    // Intercept structural mutations to realign array child indices afterwards.
    const isStructural =
      command.type === 'clipboard:paste'
      || command.type === 'clipboard:cut'
      || command.type === 'clipboard:duplicateAfter'
      || command.type === 'crud:delete'
      || command.type === 'crud:remove'
      || command.type === 'core:remove'
    if (isStructural) {
      next(command)
      reindexArrays(next, getStore)
      return
    }

    if (command.type === 'rename:confirm') {
      const { nodeId, field, newValue } = command.payload as RenamePayload
      const data = getEntity(getStore(), nodeId)?.data as JsonNodeCore | undefined
      if (data && field === 'cells.0') {
        // Key rename; still dispatch original so rename mode exits, then sync via setJsonKey.
        next(command)
        next(setJsonKey(nodeId, String(newValue ?? '')))
        return
      }
      if (data && (field === 'cells.2' || field === 'value')) {
        const typed = coerceString(String(newValue ?? ''), data.type)
        const valid = validateValueAt(schema, getRootValue, data.path, typed)
        next(command) // exits rename mode
        next(valid ? setJsonValue(nodeId, typed) : setJsonValue(nodeId, data.value ?? null))
        return
      }
    }

    if (
      command.type === 'clipboard:pasteCellValue'
      || command.type === 'clipboard:clearCellValue'
      || command.type === 'clipboard:cutCellValue'
    ) {
      next(command) // writes cells[colIndex] first
      const { nodeId, colIndex } = command.payload as ClipboardCellPayload
      const data = getEntity(getStore(), nodeId)?.data as (JsonNodeCore & { cells?: string[] }) | undefined
      if (!data?.cells) return
      const raw = data.cells[colIndex] ?? ''
      if (colIndex === 0) {
        next(setJsonKey(nodeId, raw))
        return
      }
      if (colIndex === 2) {
        const typed = coerceString(raw, data.type)
        const valid = validateValueAt(schema, getRootValue, data.path, typed)
        next(valid ? setJsonValue(nodeId, typed) : setJsonValue(nodeId, data.value ?? null))
      }
      return
    }

    next(command)
  }
}

export function jsonEditPlugin(options: JsonEditPluginOptions = {}) {
  return definePlugin({
    name: 'jsonEditor',
    commands: {
      setValue: setJsonValue,
      setType: setJsonType,
      setKey: setJsonKey,
      toggleBoolean: toggleJsonBoolean,
      addChild: addJsonChild,
      reindexArrayChild,
    },
    middleware: jsonEditorMiddleware(options),
  })
}

/** Cycle through JSON types for the type column. Keeps value coerced to default of new type. */
export function nextJsonType(current: JsonType): JsonType {
  const order: JsonType[] = ['string', 'number', 'boolean', 'null', 'object', 'array']
  const idx = order.indexOf(current)
  return order[(idx + 1) % order.length]!
}
