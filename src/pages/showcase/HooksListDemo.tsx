import { useState } from 'react'
import { ax } from '@styles/ax'
import { Up, Down } from '../shared/kbdIcons'
import { ListBox } from '@os/ui/ListBox'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import type { ItemSlots } from '@os/ui/types'

const hookData = createStore({
  entities: {
    hook1: { id: 'hook1', data: { label: 'Core Hook', desc: 'Creates engine, wires keyMap, returns dispatch/getNodeProps/getNodeState' } },
    hook2: { id: 'hook2', data: { label: 'Controlled Hook', desc: 'External store variant — you own the state, hook provides the same API' } },
    hook3: { id: 'hook3', data: { label: 'Keyboard Utilities', desc: 'parseKeyCombo, matchKeyEvent, findMatchingKey with Mod support' } },
  },
  relationships: {
    [ROOT_ID]: ['hook1', 'hook2', 'hook3'],
  },
})

const itemSlots: ItemSlots = {
  rightContent: (node) => {
    const d = node.data as Record<string, unknown>
    return <span className={ax({ text: 'muted', textStyle: 'caption' })}>{d?.desc as string}</span>
  },
}

export default function HooksListDemo() {
  const [data, setData] = useState<NormalizedData>(hookData)

  return (
    <>
      <div className="page-keys inline-flex flex-wrap items-center">
        <kbd><Up /><Down /></kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">select</span>
      </div>
      <div className="card overflow-hidden">
        <ListBox
          data={data}
          onChange={setData}
          plugins={[]}
          itemSlots={itemSlots}
        />
      </div>
    </>
  )
}
