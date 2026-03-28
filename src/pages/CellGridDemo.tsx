import { useState } from 'react'
import { Up, Down, Left, Right } from './kbdIcons'
import { Aria } from '../interactive-os/primitives/aria'
import { grid } from '../interactive-os/pattern/roles/grid'
import { createStore } from '../interactive-os/store/createStore'
import { ROOT_ID } from '../interactive-os/store/types'
import type { NormalizedData } from '../interactive-os/store/types'
import type { NodeState } from '../interactive-os/pattern/types'

const gridData = createStore({
  entities: {
    r1: { id: 'r1', data: { name: 'Button', role: 'button', focusable: 'Yes' } },
    r2: { id: 'r2', data: { name: 'Link', role: 'link', focusable: 'Yes' } },
    r3: { id: 'r3', data: { name: 'Heading', role: 'heading', focusable: 'No' } },
    r4: { id: 'r4', data: { name: 'List', role: 'list', focusable: 'No' } },
    r5: { id: 'r5', data: { name: 'Dialog', role: 'dialog', focusable: 'Yes' } },
  },
  relationships: {
    [ROOT_ID]: ['r1', 'r2', 'r3', 'r4', 'r5'],
  },
})

export default function CellGridDemo() {
  const [data, setData] = useState<NormalizedData>(gridData)

  return (
    <>
      <div className="page-keys">
        <kbd><Up /><Down /></kbd> <span className="key-hint">row</span>{' '}
        <kbd><Left /><Right /></kbd> <span className="key-hint">cell</span>{' '}
        <kbd>Home</kbd> <span className="key-hint">first cell</span>{' '}
        <kbd>End</kbd> <span className="key-hint">last cell</span>
      </div>
      <div className="card">
        <div className="grid-header" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, borderBottom: '1px solid var(--border-default)', padding: 'var(--space-xs) var(--space-md)', fontSize: 'var(--type-caption-size)', opacity: 0.6 }}>
          <span>Element</span>
          <span>Role</span>
          <span>Focusable</span>
        </div>
        <Aria pattern={grid({ columns: 3 })} data={data} plugins={[]} onChange={setData} aria-label="ARIA elements">
          <Aria.Item render={(props, node: Record<string, unknown>, state: NodeState) => {
            const d = node.data as Record<string, unknown>
            const cls = [
              'grid-row',
              state.focused && 'grid-row--focused',
            ].filter(Boolean).join(' ')
            return (
              <div {...props} className={cls} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
                <Aria.Cell index={0}><span>{d?.name as string}</span></Aria.Cell>
                <Aria.Cell index={1}><span><code>{d?.role as string}</code></span></Aria.Cell>
                <Aria.Cell index={2}><span>{d?.focusable as string}</span></Aria.Cell>
              </div>
            )
          }} />
        </Aria>
      </div>
    </>
  )
}
