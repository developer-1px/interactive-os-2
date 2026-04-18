/**
 * Zod schema introspection → NormalizedData (TreeGrid columns).
 *
 * 각 entity 의 data 는 { cells: [field, type] } shape — TreeGrid columns mode 가 직접 읽음.
 * z.object 는 children 으로 한 단계 더 펼침 (z.array(z.object(...)) 도 element 만 펼침).
 */
import { createStore, ROOT_ID } from '@os/schema'
import type { Entity, NormalizedData } from '@os/store/types'
import {
  chatSessionSchema,
  chatUiStateSchema,
  sessionCardModelSchema,
  turnUsageSchema,
  chatSessionFixtures,
  chatUiStateFixture,
  CHAT_UI_STATE_ID,
} from '@entities/chat'
import type { ChatSession } from './chatStore'

interface CellNode {
  id: string
  data: { cells: [string, string] }
}

function pushNode(
  entities: Record<string, CellNode>,
  id: string,
  field: string,
  type: string,
): void {
  entities[id] = { id, data: { cells: [field, type] } }
}

// ── Zod v4 type introspection ─────────────────────────────────

interface ZodLike {
  _def?: {
    type: string
    innerType?: ZodLike
    defaultValue?: unknown
    element?: ZodLike
    entries?: Record<string, string>
    values?: unknown[]
    shape?: Record<string, ZodLike>
  }
  shape?: Record<string, ZodLike>
}

interface TypeDescription {
  type: string
  isObject: boolean
  shape?: Record<string, ZodLike>
  isArrayOfObject: boolean
  arrayElementShape?: Record<string, ZodLike>
}

function describeType(t: ZodLike): TypeDescription {
  let cur: ZodLike = t
  const mods: string[] = []
  // Unwrap modifier wrappers (optional/nullable/default)
  while (cur?._def) {
    const d = cur._def
    if (d.type === 'optional' && d.innerType) {
      mods.push('?')
      cur = d.innerType
      continue
    }
    if (d.type === 'nullable' && d.innerType) {
      mods.push('| null')
      cur = d.innerType
      continue
    }
    if (d.type === 'default' && d.innerType) {
      const dv = typeof d.defaultValue === 'function'
        ? (d.defaultValue as () => unknown)()
        : d.defaultValue
      mods.push(`= ${JSON.stringify(dv)}`)
      cur = d.innerType
      continue
    }
    break
  }

  const def = cur._def
  if (!def) return { type: '?', isObject: false, isArrayOfObject: false }

  let baseType = '?'
  let isObject = false
  let shape: Record<string, ZodLike> | undefined
  let isArrayOfObject = false
  let arrayElementShape: Record<string, ZodLike> | undefined

  switch (def.type) {
    case 'object':
      baseType = 'object'
      isObject = true
      shape = cur.shape ?? def.shape
      break
    case 'string':
      baseType = 'string'
      break
    case 'number':
      baseType = 'number'
      break
    case 'boolean':
      baseType = 'boolean'
      break
    case 'enum': {
      const vals = Object.values(def.entries ?? {}) as string[]
      baseType = vals.map(v => `'${v}'`).join(' | ')
      break
    }
    case 'literal': {
      const v = def.values?.[0]
      baseType = `'${v}'`
      break
    }
    case 'array': {
      const elt = def.element ? describeType(def.element) : { type: '?', isObject: false }
      baseType = `${elt.type}[]`
      if (elt.isObject) {
        isArrayOfObject = true
        arrayElementShape = (elt as TypeDescription).shape
      }
      break
    }
    default:
      baseType = def.type
  }

  const typeStr = mods.length > 0 ? `${baseType} ${mods.join(' ')}` : baseType
  return { type: typeStr, isObject, shape, isArrayOfObject, arrayElementShape }
}

// ── Build subtree for a Zod object's shape ────────────────────

function buildSchemaSubtree(
  entities: Record<string, CellNode>,
  relationships: Record<string, string[]>,
  parentId: string,
  shape: Record<string, ZodLike>,
): void {
  const childIds: string[] = []
  for (const [fieldName, fieldSchema] of Object.entries(shape)) {
    const childId = `${parentId}.${fieldName}`
    const desc = describeType(fieldSchema)
    pushNode(entities, childId, fieldName, desc.type)
    childIds.push(childId)
    if (desc.isObject && desc.shape) {
      buildSchemaSubtree(entities, relationships, childId, desc.shape)
    } else if (desc.isArrayOfObject && desc.arrayElementShape) {
      buildSchemaSubtree(entities, relationships, childId, desc.arrayElementShape)
    }
  }
  relationships[parentId] = childIds
}

// ── Public: build tree of all chat schemas ───────────────────

interface SchemaEntry {
  id: string
  schema: ZodLike
}

export function buildSchemaTree(): NormalizedData {
  const schemas: SchemaEntry[] = [
    { id: 'ChatSession', schema: chatSessionSchema as unknown as ZodLike },
    { id: 'ChatUiState', schema: chatUiStateSchema as unknown as ZodLike },
    { id: 'SessionCardModel', schema: sessionCardModelSchema as unknown as ZodLike },
    { id: 'TurnUsage', schema: turnUsageSchema as unknown as ZodLike },
  ]
  const entities: Record<string, CellNode> = {}
  const relationships: Record<string, string[]> = {}
  const rootChildren: string[] = []
  for (const { id, schema } of schemas) {
    pushNode(entities, id, id, 'object')
    const desc = describeType(schema)
    if (desc.isObject && desc.shape) {
      buildSchemaSubtree(entities, relationships, id, desc.shape)
    }
    rootChildren.push(id)
  }
  relationships[ROOT_ID] = rootChildren
  return createStore({ entities: entities as unknown as Record<string, Entity>, relationships })
}

// ── Value tree (실제 인스턴스 데이터) ─────────────────────────

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function formatScalar(v: unknown): string {
  if (v === null) return 'null'
  if (v === undefined) return 'undefined'
  if (typeof v === 'string') return v.length > 100 ? `"${v.slice(0, 100)}..."` : `"${v}"`
  return String(v)
}

function appendValueFields(
  entities: Record<string, CellNode>,
  relationships: Record<string, string[]>,
  parentId: string,
  data: Record<string, unknown>,
): void {
  const childIds: string[] = []
  for (const [key, value] of Object.entries(data)) {
    const childId = `${parentId}.${key}`
    if (isPlainObject(value)) {
      pushNode(entities, childId, key, `{${Object.keys(value).length}}`)
      appendValueFields(entities, relationships, childId, value)
    } else if (Array.isArray(value)) {
      pushNode(entities, childId, key, `[${value.length}]`)
      const arrIds: string[] = []
      value.forEach((item, i) => {
        const aid = `${childId}.${i}`
        if (isPlainObject(item)) {
          pushNode(entities, aid, `[${i}]`, `{${Object.keys(item).length}}`)
          appendValueFields(entities, relationships, aid, item)
        } else {
          pushNode(entities, aid, `[${i}]`, formatScalar(item))
        }
        arrIds.push(aid)
      })
      relationships[childId] = arrIds
    } else {
      pushNode(entities, childId, key, formatScalar(value))
    }
    childIds.push(childId)
  }
  relationships[parentId] = childIds
}

function buildValueTree(
  groups: Array<{ id: string; label: string; data: Record<string, unknown> }>,
): NormalizedData {
  const entities: Record<string, CellNode> = {}
  const relationships: Record<string, string[]> = {}
  const rootChildren: string[] = []
  for (const g of groups) {
    pushNode(entities, g.id, g.label, '')
    appendValueFields(entities, relationships, g.id, g.data)
    rootChildren.push(g.id)
  }
  relationships[ROOT_ID] = rootChildren
  return createStore({ entities: entities as unknown as Record<string, Entity>, relationships })
}

export interface BuildSource {
  liveSessions: ChatSession[]
  liveActiveId: string | null
  liveUi: { sidebarMode: string; bottomVisible: boolean }
}

export function buildLiveStateTree(src: BuildSource): NormalizedData {
  if (src.liveSessions.length === 0) return buildValueTree([])
  const groups = src.liveSessions.map(s => ({
    id: s.id,
    label: s.id,
    data: s as unknown as Record<string, unknown>,
  }))
  groups.push({
    id: '__ui__',
    label: '__ui__',
    data: { activeSessionId: src.liveActiveId, ...src.liveUi } as Record<string, unknown>,
  })
  return buildValueTree(groups)
}

export function buildFixtureTree(): NormalizedData {
  const groups = Object.entries(chatSessionFixtures).map(([id, s]) => ({
    id,
    label: id,
    data: s as unknown as Record<string, unknown>,
  }))
  groups.push({
    id: CHAT_UI_STATE_ID,
    label: CHAT_UI_STATE_ID,
    data: chatUiStateFixture as unknown as Record<string, unknown>,
  })
  return buildValueTree(groups)
}
