import { useState } from 'react'
import { z } from 'zod'
import { createStore, updateEntityData } from '../interactive-os/store/createStore'
import { ROOT_ID } from '../interactive-os/store/types'
import type { NormalizedData } from '../interactive-os/store/types'
import {
  formCommands,
  getFormErrors,
  getFieldErrors,
  isTouched,
  hasFormErrors,
  ERRORS_ID,
} from '../interactive-os/plugins/form'

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
    next = formCommands.touch(nodeId, 'value').execute(next)
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
    const next = formCommands.submit(entityRules).execute(store)
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {fieldIds.map((id) => {
        const entity = store.entities[id]
        const data = entity?.data as Record<string, unknown> | undefined
        const label = (data?.label as string) ?? id
        const value = (data?.value as string) ?? ''
        const fieldErrors = getFieldErrors(store, id)
        const touched = isTouched(store, id, 'value')
        const showError = touched && fieldErrors?.value

        return (
          <div key={id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            <label
              htmlFor={`field-${id}`}
              style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}
            >
              {label}
            </label>
            <input
              id={`field-${id}`}
              type="text"
              value={value}
              onChange={(e) => handleChange(id, e.target.value)}
              placeholder={`Enter ${label.toLowerCase()}...`}
              style={{
                padding: 'var(--space-sm) var(--space-md)',
                fontSize: 'var(--font-size-md)',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${showError ? 'var(--tone-destructive-base)' : 'var(--border-default)'}`,
                background: 'var(--surface-bg)',
                color: 'var(--text-default)',
                outline: 'none',
              }}
            />
            {showError && (
              <span
                role="alert"
                style={{ fontSize: 'var(--font-size-xs)', color: 'var(--tone-destructive-base)' }}
              >
                {fieldErrors.value}
              </span>
            )}
          </div>
        )
      })}

      <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
        <button
          onClick={handleSubmit}
          style={{
            padding: 'var(--space-sm) var(--space-lg)',
            fontSize: 'var(--font-size-sm)',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: 'var(--tone-primary-base)',
            color: 'var(--tone-primary-contrast)',
            cursor: 'pointer',
          }}
        >
          Submit
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: 'var(--space-sm) var(--space-lg)',
            fontSize: 'var(--font-size-sm)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-default)',
            background: 'transparent',
            color: 'var(--text-default)',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
        {submitted && (
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--tone-success-base, green)' }}>
            Submitted successfully
          </span>
        )}
        {errorCount > 0 && !submitted && (
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--tone-destructive-base)' }}>
            {errorCount} field(s) invalid
          </span>
        )}
      </div>
    </div>
  )
}
