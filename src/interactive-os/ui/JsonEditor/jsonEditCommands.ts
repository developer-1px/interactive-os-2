import type { Command, Middleware } from '../../engine/types'
import type { NormalizedData } from '../../store/types'
import type { ZodTypeAny } from 'zod'
import { defineCommand } from '../../engine/defineCommand'
import { updateEntityData, getEntity } from '../../store/createStore'
import { definePlugin } from '../../plugins/definePlugin'
import { cellsFor, type JsonNodeCore, type JsonType, type JsonValue } from './jsonToNormalized'
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
function jsonEditorMiddleware(opts: JsonEditPluginOptions): Middleware {
  const { schema, getRootValue } = opts
  return (next, getStore) => (command: Command) => {
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

    if (command.type === 'clipboard:pasteCellValue' || command.type === 'clipboard:clearCellValue') {
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
