import { useState, useMemo } from 'react'
import { Up, Down } from '../shared/kbdIcons'
import { Aria } from '@os/primitives/aria'
import { listbox } from '@os/pattern/roles/listbox'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import type { NodeState } from '@os/pattern/types'

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
  const pattern = useMemo(() => listbox(), [])

  return (
    <>
      <div className="page-keys inline-flex flex-wrap items-center">
        <kbd><Up /><Down /></kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">select</span>
      </div>
      <div className="card overflow-hidden">
        <Aria
          pattern={pattern}
          data={data}
          plugins={[]}
          onChange={setData}
          aria-label="Fruit picker"
        >
          <Aria.Item render={(props, node, state: NodeState) => {
            const d = node.data as Record<string, unknown>
            const cls = [
              'list-item flex-row items-center justify-between',
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
