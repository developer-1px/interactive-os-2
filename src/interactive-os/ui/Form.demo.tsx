/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
// ② form-pattern-detail-panel-prd.md
import React from 'react'
import { Form } from './Form'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import type { NodeState } from '../pattern/types'
import type { EditableGroupEntry, EditableGroup } from '../../pages/cms/cmsSchema'
import { useEngine } from '@os/engine/useEngine'
import { ax } from '@styles/ax'

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

const groups: EditableGroup[] = [
  {
    groupLabel: 'Contact',
    entries: [
      { nodeId: 'name', field: 'value', label: 'Name', isLocaleMap: false, fieldType: 'short-text' },
      { nodeId: 'email', field: 'value', label: 'Email', isLocaleMap: false, fieldType: 'short-text' },
      { nodeId: 'age', field: 'value', label: 'Age', isLocaleMap: false, fieldType: 'short-text' },
    ],
  },
]

function renderField(
  _props: React.HTMLAttributes<HTMLElement>,
  entry: EditableGroupEntry,
  _state: NodeState,
): React.ReactElement {
  return (
    <div className={ax({ layout: 'stack' })}>
      <span className={ax({ textStyle: 'caption' })}>{entry.label}</span>
      <span className={ax({ textStyle: 'body' })}>{entry.field}</span>
    </div>
  )
}

export function Demo() {
  const { engine, store } = useEngine({ data })
  return (
    <Form
      engine={engine}
      store={store}
      groups={groups}
      scope="form-demo"
      renderField={renderField}
      aria-label="Contact form"
    />
  )
}
