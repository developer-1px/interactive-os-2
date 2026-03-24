import { createStore } from '../interactive-os/store/createStore'
import { ROOT_ID } from '../interactive-os/store/types'
import type { NormalizedData } from '../interactive-os/store/types'
import type { NodeState } from '../interactive-os/pattern/types'

const fruits = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig', 'Grape', 'Honeydew']

export function createFruitStore(): NormalizedData {
  const entities: Record<string, { id: string; data: { label: string } }> = {}
  const ids: string[] = []
  for (const fruit of fruits) {
    const id = fruit.toLowerCase()
    entities[id] = { id, data: { label: fruit } }
    ids.push(id)
  }
  return createStore({ entities, relationships: { [ROOT_ID]: ids } })
}

export function createGroupedStore(): NormalizedData {
  return createStore({
    entities: {
      fruits: { id: 'fruits', data: { type: 'group', label: 'Fruits' } },
      apple:  { id: 'apple',  data: { label: 'Apple' } },
      banana: { id: 'banana', data: { label: 'Banana' } },
      cherry: { id: 'cherry', data: { label: 'Cherry' } },
      vegs:   { id: 'vegs',   data: { type: 'group', label: 'Vegetables' } },
      carrot: { id: 'carrot', data: { label: 'Carrot' } },
      potato: { id: 'potato', data: { label: 'Potato' } },
    },
    relationships: {
      [ROOT_ID]: ['fruits', 'vegs'],
      fruits: ['apple', 'banana', 'cherry'],
      vegs: ['carrot', 'potato'],
    },
  })
}

export const comboboxRenderItem = (item: Record<string, unknown>, state: NodeState) => (
  <div className={`combo-item${state.focused ? ' combo-item--focused' : ''}${state.selected ? ' combo-item--selected' : ''}`}>
    {(item.data as Record<string, unknown>)?.label as string}
  </div>
)
