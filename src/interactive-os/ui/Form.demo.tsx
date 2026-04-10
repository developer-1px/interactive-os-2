/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { Form } from './Form'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import { z } from 'zod'

export const meta = {
  slug: 'form',
  category: 'ui',
  label: 'Form',
}

const data: NormalizedData = createStore({
  entities: {
    name: { id: 'name', data: { type: 'field', label: 'Name', value: '' } },
    email: { id: 'email', data: { type: 'field', label: 'Email', value: '' } },
    age: { id: 'age', data: { type: 'field', label: 'Age', value: '' } },
  },
  relationships: { [ROOT_ID]: ['name', 'email', 'age'] },
})

const entityRules: Record<string, z.ZodSchema> = {
  field: z.object({
    label: z.string(),
    value: z.string().min(1, 'Required'),
  }),
}

export function Demo() {
  return <Form data={data} onChange={() => {}} entityRules={entityRules} aria-label="Contact form" />
}
