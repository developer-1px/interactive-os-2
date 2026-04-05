import { useState } from 'react'
import { ax } from '@styles/ax'
import { z } from 'zod'
import { createStore, updateEntityData } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import {
  formCommands,
  getFormErrors,
  getFieldErrors,
  isTouched,
  hasFormErrors,
  ERRORS_ID,
} from '@os/plugins/form'

const fieldSchema = z.object({
  type: z.literal('field'),
  label: z.string(),
  value: z.string().min(1, 'Required'),
})

const emailSchema = z.object({
  type: z.literal('email'),
  label: z.string(),
  value: z.string().min(1, 'Required').email('Invalid email'),
})

const entityRules = {
  field: fieldSchema,
  email: emailSchema,
}

const initialData = createStore({
  entities: {
    name: { id: 'name', data: { type: 'field', label: 'Name', value: '' } },
    email: { id: 'email', data: { type: 'email', label: 'Email', value: '' } },
    team: { id: 'team', data: { type: 'field', label: 'Team', value: '' } },
  },
  relationships: { [ROOT_ID]: ['name', 'email', 'team'] },
})

const fieldIds = ['name', 'email', 'team']

export default function FormDemo() {
  const [store, setStore] = useState<NormalizedData>(initialData)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (nodeId: string, value: string) => {
    let next = updateEntityData(store, nodeId, { value })
    // Touch the field on change
    next = formCommands.touch.reduce(next, nodeId, 'value')
    // Validate this field (simulate middleware: run validate after data change)
    const entity = next.entities[nodeId]
    const entityData = entity?.data as Record<string, unknown> | undefined
    const entityType = entityData?.type as string | undefined
    const schema = entityType ? entityRules[entityType as keyof typeof entityRules] : undefined
    if (schema) {
      const result = schema.safeParse(entityData)
      const existingErrors = { ...getFormErrors(next) }
      if (result.success) {
        delete existingErrors[nodeId]
      } else {
        const fieldErrors: Record<string, string> = {}
        for (const issue of result.error?.issues ?? []) {
          const path = issue.path.join('.')
          if (path && !fieldErrors[path]) fieldErrors[path] = issue.message
        }
        if (Object.keys(fieldErrors).length > 0) existingErrors[nodeId] = fieldErrors
      }
      next = {
        ...next,
        entities: {
          ...next.entities,
          [ERRORS_ID]: { id: ERRORS_ID, errors: existingErrors },
        },
      }
    }
    setStore(next)
    setSubmitted(false)
  }

  const handleSubmit = () => {
    const next = formCommands.submit.reduce(store, entityRules)
    setStore(next)
    if (!hasFormErrors(next)) {
      setSubmitted(true)
    }
  }

  const handleReset = () => {
    setStore(initialData)
    setSubmitted(false)
  }

  const errors = getFormErrors(store)
  const errorCount = Object.keys(errors).length

  return (
    <div className={ax({ layout: 'column', gap: 'md' })}>
      {fieldIds.map((id) => {
        const entity = store.entities[id]
        const data = entity?.data as Record<string, unknown> | undefined
        const label = (data?.label as string) ?? id
        const value = (data?.value as string) ?? ''
        const fieldErrors = getFieldErrors(store, id)
        const touched = isTouched(store, id, 'value')
        const showError = touched && fieldErrors?.value

        return (
          <div key={id} className={ax({ layout: 'column', gap: 'xs' })}>
            <label
              htmlFor={`field-${id}`}
              className={ax({ textStyle: 'caption', text: 'muted' })}
            >
              {label}
            </label>
            <input
              id={`field-${id}`}
              type="text"
              value={value}
              onChange={(e) => handleChange(id, e.target.value)}
              placeholder={`Enter ${label.toLowerCase()}...`}
              className={ax({ surface: 'input', controlSize: 'md', shape: 'sm', tone: showError ? 'danger' : undefined })}
            />
            {showError && (
              <span
                role="alert"
                className={ax({ textStyle: 'caption', text: 'danger' })}
              >
                {fieldErrors.value}
              </span>
            )}
          </div>
        )
      })}

      <div className={ax({ layout: 'bar', gap: 'sm' })}>
        <button
          onClick={handleSubmit}
          className={ax({ surface: 'action', controlSize: 'md', shape: 'sm', tone: 'accent', content: 'text' })}
        >
          Submit
        </button>
        <button
          onClick={handleReset}
          className={ax({ surface: 'ghost', controlSize: 'md', shape: 'sm', content: 'text' })}
        >
          Reset
        </button>
        {submitted && (
          <span className={ax({ textStyle: 'caption', text: 'success' })}>
            Submitted successfully
          </span>
        )}
        {errorCount > 0 && !submitted && (
          <span className={ax({ textStyle: 'caption', text: 'danger' })}>
            {errorCount} field(s) invalid
          </span>
        )}
      </div>
    </div>
  )
}
