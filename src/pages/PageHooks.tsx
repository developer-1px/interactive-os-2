import { useState } from 'react'
import { ListBox } from '../interactive-os/ui/ListBox'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'
import { core } from '../interactive-os/plugins/core'

const hookData = createStore({
  entities: {
    useAria: { id: 'useAria', data: { label: 'useAria()', desc: 'Core hook — creates engine, wires keyMap, returns dispatch/getNodeProps/getNodeState' } },
    useControlled: { id: 'useControlled', data: { label: 'useControlledAria()', desc: 'External store variant — you own the state, hook provides the same API' } },
    useKeyboard: { id: 'useKeyboard', data: { label: 'useKeyboard()', desc: 'Utilities: parseKeyCombo, matchKeyEvent, findMatchingKey with Mod support' } },
  },
  relationships: {
    [ROOT_ID]: ['useAria', 'useControlled', 'useKeyboard'],
  },
})

export default function PageHooks() {
  const [data, setData] = useState<NormalizedData>(hookData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Hooks</h2>
        <p className="page-desc">
          Escape hatches for when the compound component isn't enough.
          Build custom wrappers or integrate with external state management.
        </p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">select</span>
      </div>
      <div className="card">
        <ListBox
          data={data}
          onChange={setData}
          plugins={[core()]}
          renderItem={(item, state: NodeState, props) => {
            const d = item.data as Record<string, unknown>
            const cls = [
              'list-item',
              state.focused && 'list-item--focused',
              state.selected && !state.focused && 'list-item--selected',
            ].filter(Boolean).join(' ')
            return (
              <div {...props} className={cls}>
                <span className="list-item__label"><code>{d?.label as string}</code></span>
                <span className="list-item__desc">{d?.desc as string}</span>
              </div>
            )
          }}
        />
      </div>
      <div className="page-section">
        <h3 className="page-section-title">useAria — internal engine</h3>
        <pre className="code-block"><code>{`const aria = useAria({
  behavior: listbox,
  data: store,
  plugins: [core(), history()],
  onChange: setStore,
})

// aria.dispatch(command)
// aria.getNodeProps(id) → { role, tabIndex, aria-*, onKeyDown, ... }
// aria.getNodeState(id) → { focused, selected, expanded, ... }
// aria.focused → current focused ID
// aria.selected → selected IDs array`}</code></pre>
      </div>
      <div className="page-section">
        <h3 className="page-section-title">useControlledAria — external store</h3>
        <pre className="code-block"><code>{`// When you manage state externally (Redux, Zustand, etc.)
const aria = useControlledAria({
  behavior: treegrid,
  store: externalStore,        // you own this
  onDispatch: (command) => {   // you handle commands
    dispatch(executeCommand(command))
  },
})`}</code></pre>
      </div>
      <div className="page-section">
        <h3 className="page-section-title">useKeyboard — key matching</h3>
        <pre className="code-block"><code>{`import { parseKeyCombo, matchKeyEvent } from 'interactive-os/hooks/useKeyboard'

// Mod = Meta on Mac, Ctrl on Windows/Linux
parseKeyCombo('Mod+Shift+z')
// → { key: 'z', ctrl: false, shift: true, alt: false, meta: true } (Mac)

matchKeyEvent(event, 'Mod+c') // true if Cmd+C (Mac) or Ctrl+C (Win)`}</code></pre>
      </div>
    </div>
  )
}
