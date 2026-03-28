import { useState, useMemo } from 'react'
import { Up, Down } from './kbdIcons'
import { Aria } from '../interactive-os/primitives/aria'
import { listbox } from '../interactive-os/pattern/roles/listbox'
import { createStore } from '../interactive-os/store/createStore'
import { ROOT_ID } from '../interactive-os/store/types'
import type { NormalizedData } from '../interactive-os/store/types'
import type { NodeState } from '../interactive-os/pattern/types'

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

export default function AriaListboxDemo() {
  const [data, setData] = useState<NormalizedData>(demoData)
  const behavior = useMemo(() => listbox(), [])

  return (
    <>
      <div className="page-keys">
        <kbd><Up /><Down /></kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">select</span>
      </div>
      <div className="card">
        <Aria
          behavior={behavior}
          data={data}
          plugins={[]}
          onChange={setData}
          aria-label="Fruit picker"
        >
          <Aria.Item render={(props, node, state: NodeState) => {
            const d = node.data as Record<string, unknown>
            const cls = [
              'list-item',
              state.focused && 'list-item--focused',
              state.selected && !state.focused && 'list-item--selected',
            ].filter(Boolean).join(' ')
            return (
              <div {...props} className={cls}>
                <span className="list-item__label">{d?.emoji as string} {d?.label as string}</span>
              </div>
            )
          }} />
        </Aria>
      </div>
    </>
  )
}
