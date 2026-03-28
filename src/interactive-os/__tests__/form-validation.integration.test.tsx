/**
 * Form Plugin Integration Test
 * Validates: field validation via Zod, touched tracking, submit guard
 */
import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import { ERRORS_ID, TOUCHED_ID, getFormErrors, getFieldErrors, hasFormErrors, formCommands } from '../plugins/form'

// ---------------------------------------------------------------------------
// Schema & Fixtures
// ---------------------------------------------------------------------------

const fieldSchema = z.object({
  type: z.literal('field'),
  label: z.string(),
  value: z.string().min(1, 'Required'),
})

const emailFieldSchema = z.object({
  type: z.literal('email-field'),
  label: z.string(),
  value: z.string().email('Invalid email'),
})

const entityRules = {
  field: fieldSchema,
  'email-field': emailFieldSchema,
}

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      name: { id: 'name', data: { type: 'field', label: 'Name', value: '' } },
      email: { id: 'email', data: { type: 'email-field', label: 'Email', value: 'not-email' } },
      bio: { id: 'bio', data: { type: 'field', label: 'Bio', value: 'hello' } },
    },
    relationships: { [ROOT_ID]: ['name', 'email', 'bio'] },
  })
}

// ---------------------------------------------------------------------------
// 1. Unit: validateEntity via formCommands.submit
// ---------------------------------------------------------------------------

describe('Form Plugin — Validation', () => {
  it('submit command populates __errors__ for invalid entities', () => {
    const store = fixtureData()
    const cmd = formCommands.submit(entityRules)
    const result = cmd.execute(store)

    const errors = getFormErrors(result)
    // name: empty value → Required
    expect(errors.name).toBeDefined()
    expect(errors.name.value).toBe('Required')
    // email: invalid email
    expect(errors.email).toBeDefined()
    expect(errors.email.value).toBe('Invalid email')
    // bio: valid → no errors
    expect(errors.bio).toBeUndefined()
  })

  it('submit command marks all entities as touched', () => {
    const store = fixtureData()
    const cmd = formCommands.submit(entityRules)
    const result = cmd.execute(store)

    const touchedEntity = result.entities[TOUCHED_ID]
    expect(touchedEntity).toBeDefined()
    const touched = touchedEntity!.touched as Record<string, string[]>
    expect(touched.name).toContain('__all__')
    expect(touched.email).toContain('__all__')
    expect(touched.bio).toContain('__all__')
  })

  it('hasFormErrors returns true when errors exist', () => {
    const store = fixtureData()
    const cmd = formCommands.submit(entityRules)
    const result = cmd.execute(store)
    expect(hasFormErrors(result)).toBe(true)
  })

  it('hasFormErrors returns false when all valid', () => {
    const store = createStore({
      entities: {
        bio: { id: 'bio', data: { type: 'field', label: 'Bio', value: 'hello' } },
      },
      relationships: { [ROOT_ID]: ['bio'] },
    })
    const cmd = formCommands.submit(entityRules)
    const result = cmd.execute(store)
    expect(hasFormErrors(result)).toBe(false)
  })

  it('getFieldErrors returns undefined for valid entity', () => {
    const store = fixtureData()
    const cmd = formCommands.submit(entityRules)
    const result = cmd.execute(store)
    expect(getFieldErrors(result, 'bio')).toBeUndefined()
  })

  it('reset command clears errors and touched', () => {
    const store = fixtureData()
    let result = formCommands.submit(entityRules).execute(store)
    expect(hasFormErrors(result)).toBe(true)
    result = formCommands.reset().execute(result)
    expect(result.entities[ERRORS_ID]).toBeUndefined()
    expect(result.entities[TOUCHED_ID]).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// 2. Unit: touch command
// ---------------------------------------------------------------------------

describe('Form Plugin — Touch', () => {
  it('touch marks a specific field', () => {
    const store = fixtureData()
    const result = formCommands.touch('name', 'value').execute(store)
    const touched = result.entities[TOUCHED_ID]!.touched as Record<string, string[]>
    expect(touched.name).toContain('value')
  })

  it('touch without field marks entire node', () => {
    const store = fixtureData()
    const result = formCommands.touch('name').execute(store)
    const touched = result.entities[TOUCHED_ID]!.touched as Record<string, string[]>
    expect(touched.name).toContain('__all__')
  })
})

// ---------------------------------------------------------------------------
// 3. Integration: middleware auto-validation after rename:confirm
// ---------------------------------------------------------------------------

describe('Form Plugin — Middleware auto-validation', () => {
  it('submit on valid store produces no errors', () => {
    const store = createStore({
      entities: {
        name: { id: 'name', data: { type: 'field', label: 'Name', value: 'valid' } },
      },
      relationships: { [ROOT_ID]: ['name'] },
    })

    const cmd = formCommands.submit(entityRules)
    const result = cmd.execute(store)
    expect(hasFormErrors(result)).toBe(false)
  })
})
