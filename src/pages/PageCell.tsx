import { useState } from 'react'
import { Aria } from '../interactive-os/components/aria'
import { grid } from '../interactive-os/behaviors/grid'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'
import { core } from '../interactive-os/plugins/core'

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

export default function PageCell() {
  const [data, setData] = useState<NormalizedData>(gridData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">&lt;Aria.Cell&gt;</h2>
        <p className="page-desc">
          Multi-column grid support. Each row can contain multiple cells
          with independent focus via Arrow Left/Right.
        </p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">row</span>{' '}
        <kbd>←→</kbd> <span className="key-hint">cell</span>{' '}
        <kbd>Home</kbd> <span className="key-hint">first cell</span>{' '}
        <kbd>End</kbd> <span className="key-hint">last cell</span>
      </div>
      <div className="card">
        <div className="grid-header" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, borderBottom: '1px solid var(--border-mid)', padding: '6px 12px', fontSize: '11px', opacity: 0.6 }}>
          <span>Element</span>
          <span>Role</span>
          <span>Focusable</span>
        </div>
        <Aria behavior={grid({ columns: 3 })} data={data} plugins={[core()]} onChange={setData} aria-label="ARIA elements">
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
      <div className="page-section">
        <h3 className="page-section-title">Usage</h3>
        <pre className="code-block"><code>{`import { Aria } from 'interactive-os/components/aria'
import { grid } from 'interactive-os/behaviors/grid'

// grid({ columns: 3 }) creates a behavior with colCount=3
<Aria behavior={grid({ columns: 3 })} ...>
  <Aria.Item render={(node, state) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
      <Aria.Cell index={0}><span>{node.data.name}</span></Aria.Cell>
      <Aria.Cell index={1}><span>{node.data.role}</span></Aria.Cell>
      <Aria.Cell index={2}><span>{node.data.ok}</span></Aria.Cell>
    </div>
  )} />
</Aria>`}</code></pre>
      </div>
      <div className="page-section">
        <h3 className="page-section-title">How it works</h3>
        <p className="page-desc">
          <code>&lt;Aria.Cell index=&#123;n&#125;&gt;</code> reads the grid column focus state
          from the store (<code>__grid_col__</code> meta entity). The focused cell gets{' '}
          <code>tabIndex=0</code>, others get <code>tabIndex=-1</code>.
          Arrow Left/Right move between cells; Up/Down move between rows.
        </p>
      </div>
    </div>
  )
}
