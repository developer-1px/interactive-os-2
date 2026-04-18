var e=`// ② engine-validator-clipboard-prd.md
import { z } from 'zod'
import type { Command, CommandResult } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { getEntity, getParent } from '../store/createStore'
import { definePlugin } from './definePlugin'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ZodSchema = z.ZodType<any, any>

export type CanAcceptFn = (
  parentData: Record<string, unknown> | undefined,
  childData: Record<string, unknown> | undefined,
) => 'insert' | 'overwrite' | boolean | false

export type CanDeleteFn = (
  parentData: Record<string, unknown> | undefined,
) => boolean

function deriveCanAccept(
  childRules: Record<string, ZodSchema>,
  rootTypes?: ZodSchema[],
): CanAcceptFn {
  return (parentData, childData) => {
    if (!childData) return false
    if (!parentData?.type) {
      // ROOT level: check if any rootTypes accept it
      if (rootTypes) {
        return rootTypes.some((t) => t.safeParse(childData).success) ? 'insert' : false
      }
      return false
    }
    const rule = childRules[parentData.type as string]
    if (!rule) {
      // No childRule = leaf node. Check if same type → overwrite candidate
      if (parentData.type === (childData as Record<string, unknown>).type) return 'overwrite'
      return false
    }
    if (rule instanceof z.ZodArray) {
      // Collection: validate against element schema
      const elementRule = rule.element as ZodSchema
      return elementRule.safeParse(childData).success ? 'insert' : false
    }
    // Slot container: fixed structure, cannot accept new children → skip
    return false
  }
}

function deriveCanDelete(childRules: Record<string, ZodSchema>): CanDeleteFn {
  return (parentData) => {
    if (!parentData?.type) return true // ROOT-level: always deletable
    const rule = childRules[parentData.type as string]
    if (!rule) return true // No rule = leaf, no children to protect
    return rule instanceof z.ZodArray
  }
}

const MUTATION_TYPES = new Set([
  'crud:create', 'crud:delete',
  'dnd:move-up', 'dnd:move-down', 'dnd:move-out', 'dnd:move-in', 'dnd:move-to',
  'clipboard:paste', 'clipboard:cut', 'clipboard:duplicateAfter',
])

export interface ZodSchemaOptions {
  childRules: Record<string, ZodSchema>
  rootTypes?: ZodSchema[]
}

export function zodSchema(options: ZodSchemaOptions) {
  const canAccept = deriveCanAccept(options.childRules, options.rootTypes)
  const canDelete = deriveCanDelete(options.childRules)

  // ② engine-validator-clipboard-prd.md — validator replaces middleware
  const validator = (store: NormalizedData, command: Command): CommandResult | undefined => {
    if (!MUTATION_TYPES.has(command.type)) return undefined

    const payload = command.payload as Record<string, unknown> | undefined
    if (!payload) return undefined

    // clipboard:cut — check if source nodes can be deleted
    if (command.type === 'clipboard:cut') {
      const nodeIds = payload.nodeIds as string[] | undefined
      if (nodeIds) {
        for (const nodeId of nodeIds) {
          const parentId = getParent(store, nodeId)
          if (!parentId) continue // ROOT-level: always deletable
          const parentData = getEntity(store, parentId)?.data as Record<string, unknown> | undefined
          if (!canDelete(parentData)) {
            return { ok: false, reason: \`Cannot cut from \${parentData?.type ?? 'unknown'}: children are slots\` }
          }
        }
      }
      return undefined
    }

    // clipboard:paste — check if target accepts children
    if (command.type === 'clipboard:paste') {
      // Inject canAcceptFn into payload for findPasteTarget
      ;(payload as Record<string, unknown>).canAcceptFn = canAccept
      return undefined
    }

    // crud:create — check if parent accepts the new entity
    if (command.type === 'crud:create') {
      const parentId = payload.parentId as string | undefined
      if (parentId) {
        const parentData = getEntity(store, parentId)?.data as Record<string, unknown> | undefined
        const entity = payload.entity as { data?: Record<string, unknown> } | undefined
        const childData = entity?.data
        const result = canAccept(parentData, childData)
        if (result === false) {
          return { ok: false, reason: \`\${parentData?.type ?? 'root'} cannot accept \${(childData as Record<string, unknown>)?.type ?? 'unknown'} as child\` }
        }
      }
      return undefined
    }

    // crud:delete — check if node's parent allows deletion
    if (command.type === 'crud:delete') {
      const nodeId = payload.nodeId as string | undefined
      if (nodeId) {
        const parentId = getParent(store, nodeId)
        if (parentId) {
          const parentData = getEntity(store, parentId)?.data as Record<string, unknown> | undefined
          if (!canDelete(parentData)) {
            return { ok: false, reason: \`Cannot delete from \${parentData?.type ?? 'unknown'}: children are slots\` }
          }
        }
      }
      return undefined
    }

    // dnd:move-to — check if target parent accepts the moved node
    if (command.type === 'dnd:move-to') {
      const newParentId = payload.newParentId as string | undefined
      const nodeId = payload.nodeId as string | undefined
      if (newParentId && nodeId) {
        const parentData = getEntity(store, newParentId)?.data as Record<string, unknown> | undefined
        const childData = getEntity(store, nodeId)?.data as Record<string, unknown> | undefined
        const result = canAccept(parentData, childData)
        if (result === false) {
          return { ok: false, reason: \`\${parentData?.type ?? 'root'} cannot accept \${childData?.type ?? 'unknown'} as child\` }
        }
      }
      return undefined
    }

    return undefined
  }

  return definePlugin({
    name: 'zodSchema',
    inspect: () => ({
      schemas: Object.keys(options.childRules),
      childRules: Object.fromEntries(
        Object.entries(options.childRules).map(([k, v]) => [k, v instanceof z.ZodArray ? 'collection' : 'slot']),
      ),
      rootTypes: options.rootTypes?.length ?? 0,
    }),
    // ② engine-validator-clipboard-prd.md — validator instead of middleware
    validator,
  })
}
`;export{e as default};