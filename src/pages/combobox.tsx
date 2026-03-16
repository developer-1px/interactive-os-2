import { useState } from 'react'
import { Combobox } from '../interactive-os/ui/combobox'
import { createStore } from '../interactive-os/core/normalized-store'
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

export default function ComboboxPage() {
  const [data, setData] = useState(createFruitStore)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Combobox</h2>
        <p className="page-desc">Text input with dropdown list — uses aria-activedescendant</p>
      </div>

      <section className="demo-section">
        <h3>Fruit picker</h3>
        <Combobox
          data={data}
          plugins={[core(), comboboxPlugin()]}
          onChange={setData}
          placeholder="Pick a fruit..."
          renderItem={(item, state: NodeState) => (
            <div style={{
              padding: '6px 12px',
              background: state.focused ? '#e3f2fd' : state.selected ? '#e8f5e9' : 'transparent',
              cursor: 'default',
              userSelect: 'none',
            }}>
              {(item.data as Record<string, unknown>)?.label as string}
            </div>
          )}
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
    </div>
  )
}
