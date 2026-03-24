import { z } from 'zod'
import { definePlugin } from './definePlugin'
import { PASTE, CUT, clipboardCommands } from './clipboard'
import type { CanAcceptFn, CanDeleteFn } from './clipboard'

function deriveCanAccept(
  childRules: Record<string, z.ZodType>,
  rootTypes?: z.ZodType[],
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
      const elementRule = rule.element
      return elementRule.safeParse(childData).success ? 'insert' : false
    }
    // Slot container: fixed structure, cannot accept new children → skip
    return false
  }
}

function deriveCanDelete(childRules: Record<string, z.ZodType>): CanDeleteFn {
  return (parentData) => {
    if (!parentData?.type) return true // ROOT-level: always deletable
    const rule = childRules[parentData.type as string]
    if (!rule) return true // No rule = leaf, no children to protect
    return rule instanceof z.ZodArray
  }
}

export interface ZodSchemaOptions {
  childRules: Record<string, z.ZodType>
  rootTypes?: z.ZodType[]
}

export function zodSchema(options: ZodSchemaOptions) {
  const canAccept = deriveCanAccept(options.childRules, options.rootTypes)
  const canDelete = deriveCanDelete(options.childRules)

  return definePlugin({
    name: 'zodSchema',
    intercepts: [PASTE, CUT],
    middleware: (next) => (command) => {
      if (command.type === PASTE) {
        const payload = command.payload as { targetId: string }
        next(clipboardCommands.paste(payload.targetId, canAccept))
        return
      }
      if (command.type === CUT) {
        const payload = command.payload as { nodeIds: string[] }
        next(clipboardCommands.cut(payload.nodeIds, canDelete))
        return
      }
      next(command)
    },
  })
}
