import { useState } from 'react'
import { ApgKeyboardTable } from './ApgKeyboardTable'
import { apgCombobox } from './apg-data'
import { Combobox } from '../interactive-os/ui/Combobox'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData } from '../interactive-os/core/types'
import { core } from '../interactive-os/plugins/core'
import { combobox as comboboxPlugin } from '../interactive-os/plugins/combobox'
import type { NodeState } from '../interactive-os/behaviors/types'

const fruits = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig', 'Grape', 'Honeydew']

function createFruitStore(): NormalizedData {
  const entities: Record<string, { id: string; data: { label: string } }> = {}
  const ids: string[] = []
  for (const fruit of fruits) {
    const id = fruit.toLowerCase()
    entities[id] = { id, data: { label: fruit } }
    ids.push(id)
  }
  return createStore({ entities, relationships: { [ROOT_ID]: ids } })
}

function createGroupedStore(): NormalizedData {
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

const renderItem = (item: Record<string, unknown>, state: NodeState) => (
  <div className={`combo-item${state.focused ? ' combo-item--focused' : ''}${state.selected ? ' combo-item--selected' : ''}`}>
    {(item.data as Record<string, unknown>)?.label as string}
  </div>
)

export default function PageCombobox() {
  const [data, setData] = useState(createFruitStore)
  const [editableData, setEditableData] = useState(createFruitStore)
  const [multiData, setMultiData] = useState(createFruitStore)
  const [groupedData, setGroupedData] = useState(createGroupedStore)
  const [creatableData, setCreatableData] = useState(createFruitStore)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Combobox</h2>
        <p className="page-desc">Text input with dropdown list — uses aria-activedescendant</p>
      </div>

      <section className="demo-section">
        <h3>Select (read-only, single)</h3>
        <Combobox
          data={data}
          plugins={[core(), comboboxPlugin()]}
          onChange={setData}
          placeholder="Pick a fruit..."
          renderItem={renderItem}
        />
      </section>

      <section className="demo-section">
        <h3>Autocomplete (editable, single)</h3>
        <p className="page-desc" style={{ marginBottom: 8 }}>Type to filter — uses <code>editable</code> prop + <code>setFilter</code> command</p>
        <Combobox
          data={editableData}
          plugins={[core(), comboboxPlugin()]}
          onChange={setEditableData}
          placeholder="Type a fruit name..."
          editable
          renderItem={renderItem}
        />
      </section>

      <section className="demo-section">
        <h3>Multi-Select (editable, multiple)</h3>
        <p className="page-desc" style={{ marginBottom: 8 }}>Select multiple items — uses <code>selectionMode="multiple"</code></p>
        <Combobox
          data={multiData}
          plugins={[core(), comboboxPlugin()]}
          onChange={setMultiData}
          placeholder="Pick fruits..."
          editable
          selectionMode="multiple"
          renderItem={renderItem}
        />
      </section>

      <section className="demo-section">
        <h3>Grouped</h3>
        <p className="page-desc" style={{ marginBottom: 8 }}>Options organized by group — uses nested store with <code>type: 'group'</code></p>
        <Combobox
          data={groupedData}
          plugins={[core(), comboboxPlugin()]}
          onChange={setGroupedData}
          placeholder="Pick a food..."
          renderItem={renderItem}
        />
      </section>

      <section className="demo-section">
        <h3>Creatable</h3>
        <p className="page-desc" style={{ marginBottom: 8 }}>Type a new value to create it — uses <code>creatable</code> prop</p>
        <Combobox
          data={creatableData}
          plugins={[core(), comboboxPlugin()]}
          onChange={setCreatableData}
          placeholder="Pick or create a fruit..."
          editable
          creatable
          renderItem={renderItem}
        />
      </section>

      <section className="demo-section">
        <h3>Keyboard</h3>
        <table className="key-table">
          <thead><tr><th>Key</th><th>Action</th></tr></thead>
          <tbody>
            <tr><td><kbd>ArrowDown</kbd></td><td>Open dropdown / next option</td></tr>
            <tr><td><kbd>ArrowUp</kbd></td><td>Previous option</td></tr>
            <tr><td><kbd>Enter</kbd></td><td>Select option &amp; close / open dropdown</td></tr>
            <tr><td><kbd>Escape</kbd></td><td>Close dropdown</td></tr>
            <tr><td><kbd>Home</kbd></td><td>First option</td></tr>
            <tr><td><kbd>End</kbd></td><td>Last option</td></tr>
          </tbody>
        </table>
      </section>
      <ApgKeyboardTable {...apgCombobox} />
    </div>
  )
}
