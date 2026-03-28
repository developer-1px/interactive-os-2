import type { Command } from '../engine/types'
import { getEntity } from '../store/createStore'
import type { NormalizedData } from '../store/types'
import { definePlugin } from './definePlugin'
import type { ZodSchema } from './zodSchema'

export const ERRORS_ID = '__errors__'
export const TOUCHED_ID = '__touched__'

export interface FormOptions {
  /** Entity type → Zod schema for validating entity.data */
  entityRules: Record<string, ZodSchema>
}

/** Validate a single entity's data against its type's schema. Returns field→message map. */
function validateEntity(
  entityData: Record<string, unknown> | undefined,
  entityRules: Record<string, ZodSchema>,
): Record<string, string> | null {
  if (!entityData) return null
  const entityType = entityData.type as string | undefined
  if (!entityType) return null
  const schema = entityRules[entityType]
  if (!schema) return null

  const result = schema.safeParse(entityData)
  if (result.success) return null
  if (!result.error?.issues) return null

  const fieldErrors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const path = issue.path.join('.')
    if (path && !fieldErrors[path]) {
      fieldErrors[path] = issue.message
    }
  }
  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null
}

/** Re-validate all user entities in the store, returning the full errors map */
function validateAllEntities(
  store: NormalizedData,
  entityRules: Record<string, ZodSchema>,
): Record<string, Record<string, string>> {
  const allErrors: Record<string, Record<string, string>> = {}
  for (const [id, entity] of Object.entries(store.entities)) {
    if (id.startsWith('__')) continue
    const errors = validateEntity(
      entity.data as Record<string, unknown> | undefined,
      entityRules,
    )
    if (errors) allErrors[id] = errors
  }
  return allErrors
}

/** Get current errors map from store */
export function getFormErrors(
  store: NormalizedData,
): Record<string, Record<string, string>> {
  const errorsEntity = store.entities[ERRORS_ID]
  return (errorsEntity?.errors as Record<string, Record<string, string>>) ?? {}
}

/** Get field errors for a specific node */
export function getFieldErrors(
  store: NormalizedData,
  nodeId: string,
): Record<string, string> | undefined {
  return getFormErrors(store)[nodeId]
}

/** Check if a node's field has been touched */
export function isTouched(
  store: NormalizedData,
  nodeId: string,
  field?: string,
): boolean {
  const touchedEntity = store.entities[TOUCHED_ID]
  const touchedMap = (touchedEntity?.touched as Record<string, string[]>) ?? {}
  const nodeTouched = touchedMap[nodeId]
  if (!nodeTouched) return false
  if (nodeTouched.includes('__all__')) return true
  if (field) return nodeTouched.includes(field)
  return nodeTouched.length > 0
}

/** Check if form has any validation errors */
export function hasFormErrors(store: NormalizedData): boolean {
  const errors = getFormErrors(store)
  return Object.keys(errors).length > 0
}

export const formCommands = {
  /** Mark a node (or specific field) as touched */
  touch(nodeId: string, field?: string): Command {
    return {
      type: 'form:touch',
      payload: { nodeId, field },
      execute(store) {
        const existing = store.entities[TOUCHED_ID]
        const touched = {
          ...((existing?.touched as Record<string, string[]>) ?? {}),
        }
        if (field) {
          const fields = touched[nodeId] ? [...touched[nodeId]] : []
          if (!fields.includes(field)) fields.push(field)
          touched[nodeId] = fields
        } else {
          touched[nodeId] = ['__all__']
        }
        return {
          ...store,
          entities: {
            ...store.entities,
            [TOUCHED_ID]: { id: TOUCHED_ID, touched },
          },
        }
      },
    }
  },

  /** Submit: validate all, mark all as touched, return errors or clean store */
  submit(entityRules: Record<string, ZodSchema>): Command {
    return {
      type: 'form:submit',
      execute(store) {
        // Validate all entities
        const allErrors = validateAllEntities(store, entityRules)

        // Mark all validated entities as touched
        const touched: Record<string, string[]> = {}
        for (const id of Object.keys(store.entities)) {
          if (id.startsWith('__')) continue
          touched[id] = ['__all__']
        }

        return {
          ...store,
          entities: {
            ...store.entities,
            [ERRORS_ID]: { id: ERRORS_ID, errors: allErrors },
            [TOUCHED_ID]: { id: TOUCHED_ID, touched },
          },
        }
      },
    }
  },

  /** Clear all form state (errors + touched) */
  reset(): Command {
    return {
      type: 'form:reset',
      execute(store) {
        const { [ERRORS_ID]: _e, [TOUCHED_ID]: _t, ...rest } = store.entities
        return { ...store, entities: rest }
      },
    }
  },
}

export function form(options: FormOptions) {
  const { entityRules } = options

  return definePlugin({
    name: 'form',
    commands: {
      touch: formCommands.touch,
      submit: () => formCommands.submit(entityRules),
      reset: formCommands.reset,
    },
    middleware: (next: (command: Command) => void) => (command: Command) => {
      // Skip re-entry from our own validation commands
      if (command.type === 'form:validate') {
        next(command)
        return
      }

      // Execute the command first
      next(command)

      // After any rename:confirm or data update, re-validate the affected entity
      if (
        command.type === 'rename:confirm' ||
        command.type === 'updateEntityData'
      ) {
        const payload = command.payload as { nodeId?: string } | undefined
        const nodeId = payload?.nodeId
        if (nodeId) {
          // Dispatch a validation-only command
          next(createValidateCommand(nodeId, entityRules))
        }
      }
    },
  })
}

/** Internal command: validate a single entity and update __errors__ */
function createValidateCommand(
  nodeId: string,
  entityRules: Record<string, ZodSchema>,
): Command {
  return {
    type: 'form:validate',
    payload: { nodeId },
    execute(store) {
      const entity = getEntity(store, nodeId)
      const entityData = entity?.data as Record<string, unknown> | undefined
      const errors = validateEntity(entityData, entityRules)

      const existingErrors = getFormErrors(store)
      const newErrors = { ...existingErrors }

      if (errors) {
        newErrors[nodeId] = errors
      } else {
        delete newErrors[nodeId]
      }

      return {
        ...store,
        entities: {
          ...store.entities,
          [ERRORS_ID]: { id: ERRORS_ID, errors: newErrors },
        },
      }
    },
  }
}
