import { useState } from 'react'
import { Up, Down } from './kbdIcons'
import { ListBox } from '../interactive-os/ui/ListBox'
import { createStore } from '../interactive-os/store/createStore'
import { ROOT_ID } from '../interactive-os/store/types'
import type { NormalizedData } from '../interactive-os/store/types'
import type { NodeState } from '../interactive-os/pattern/types'
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

export default function HooksListDemo() {
  const [data, setData] = useState<NormalizedData>(hookData)

  return (
    <>
      <div className="page-keys">
        <kbd><Up /><Down /></kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">select</span>
      </div>
      <div className="card">
        <ListBox
          data={data}
          onChange={setData}
          plugins={[core()]}
          renderItem={(props, item, state: NodeState) => {
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
    </>
  )
}
