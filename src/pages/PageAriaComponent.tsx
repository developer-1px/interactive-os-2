import { useState } from 'react'
import '../interactive-os/ui/ListBox.css'
import { Aria } from '../interactive-os/components/aria'
import { listbox } from '../interactive-os/behaviors/listbox'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'
import { core } from '../interactive-os/plugins/core'

const demoData = createStore({
  entities: {
    apple: { id: 'apple', data: { label: 'Apple', emoji: '\uD83C\uDF4E' } },
    banana: { id: 'banana', data: { label: 'Banana', emoji: '\uD83C\uDF4C' } },
    cherry: { id: 'cherry', data: { label: 'Cherry', emoji: '\uD83C\uDF52' } },
    grape: { id: 'grape', data: { label: 'Grape', emoji: '\uD83C\uDF47' } },
  },
  relationships: {
    [ROOT_ID]: ['apple', 'banana', 'cherry', 'grape'],
  },
})

export default function PageAriaComponent() {
  const [data, setData] = useState<NormalizedData>(demoData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">&lt;Aria&gt;</h2>
        <p className="page-desc">
          The compound component that wires behavior, data, and plugins together.
          Drop in a behavior preset and get keyboard interaction automatically.
        </p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">select</span>
      </div>
      <div className="card">
        <Aria
          behavior={listbox}
          data={data}
          plugins={[core()]}
          onChange={setData}
          aria-label="Fruit picker"
        >
          <Aria.Node render={(node, state: NodeState) => {
            const d = node.data as Record<string, unknown>
            const cls = [
              'list-item',
              state.focused && 'list-item--focused',
              state.selected && !state.focused && 'list-item--selected',
            ].filter(Boolean).join(' ')
            return (
              <div className={cls}>
                <span className="list-item__label">{d?.emoji as string} {d?.label as string}</span>
              </div>
            )
          }} />
        </Aria>
      </div>
      <div className="page-section">
        <h3 className="page-section-title">Usage</h3>
        <pre className="code-block"><code>{`<Aria
  behavior={listbox}     // ARIA pattern preset
  data={store}           // NormalizedData
  plugins={[core()]}     // Plugin composition
  onChange={setData}      // State callback
  aria-label="My list"
>
  <Aria.Node render={(node, state) => (
    <div>{node.data.label}</div>
  )} />
</Aria>`}</code></pre>
      </div>
      <div className="page-section">
        <h3 className="page-section-title">NodeState fields</h3>
        <pre className="code-block"><code>{`interface NodeState {
  focused: boolean      // Currently focused node
  selected: boolean     // In selection set
  disabled: boolean     // Interaction disabled
  expanded?: boolean    // For expandable nodes (tree)
  index: number         // Position in siblings
  siblingCount: number  // Total siblings
  level: number         // Nesting depth (1-based)
}`}</code></pre>
      </div>
      <div className="page-section">
        <h3 className="page-section-title">How it works</h3>
        <p className="page-desc">
          <code>&lt;Aria&gt;</code> creates a command engine internally, wires the behavior's keyMap
          to keyboard events, and provides node props (role, tabIndex, aria-*) through{' '}
          <code>&lt;Aria.Node&gt;</code>. The <code>render</code> callback receives the entity and
          its computed state — you control the visual output entirely.
        </p>
      </div>
    </div>
  )
}
