import { useState } from 'react'
import { ApgKeyboardTable } from './ApgKeyboardTable'
import { apgCombobox } from './apg-data'
import { Combobox } from '../interactive-os/ui/Combobox'
import { core } from '../interactive-os/plugins/core'
import { combobox as comboboxPlugin } from '../interactive-os/plugins/combobox'
import { createFruitStore, comboboxRenderItem } from './shared-combobox-data'

const plugins = [core(), comboboxPlugin()]

export default function PageComboboxNav() {
  const [data, setData] = useState(createFruitStore)
  const [editableData, setEditableData] = useState(createFruitStore)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Combobox</h2>
        <p className="page-desc">Read-only combobox — select from dropdown, autocomplete filter</p>
      </div>

      <section className="demo-section">
        <h3>Select (read-only, single)</h3>
        <Combobox
          data={data}
          plugins={plugins}
          onChange={setData}
          placeholder="Pick a fruit..."
          renderItem={comboboxRenderItem}
        />
      </section>

      <section className="demo-section">
        <h3>Autocomplete (editable, single)</h3>
        <p className="page-desc" style={{ marginBottom: 8 }}>Type to filter — uses <code>editable</code> prop + <code>setFilter</code> command</p>
        <Combobox
          data={editableData}
          plugins={plugins}
          onChange={setEditableData}
          placeholder="Type a fruit name..."
          editable
          renderItem={comboboxRenderItem}
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
