import { useState } from 'react'
import { ListBox } from '../interactive-os/ui/ListBox'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'
import { core } from '../interactive-os/plugins/core'

const pipelineData = createStore({
  entities: {
    s1: { id: 's1', data: { step: '1', label: 'Keyboard Event', desc: 'User presses a key on a focused node' } },
    s2: { id: 's2', data: { step: '2', label: 'keyMap Lookup', desc: 'Behavior.keyMap matches the key combo to a handler function' } },
    s3: { id: 's3', data: { step: '3', label: 'BehaviorContext', desc: 'Handler receives context with focusNext(), activate(), select(), etc.' } },
    s4: { id: 's4', data: { step: '4', label: 'Command Created', desc: 'Handler returns a Command object with execute() and undo()' } },
    s5: { id: 's5', data: { step: '5', label: 'engine.dispatch()', desc: 'Command enters the middleware pipeline' } },
    s6: { id: 's6', data: { step: '6', label: 'Middleware (outside-in)', desc: 'Each plugin middleware wraps the next — like Express/Koa' } },
    s7: { id: 's7', data: { step: '7', label: 'command.execute(store)', desc: 'Core executor runs the command against the store' } },
    s8: { id: 's8', data: { step: '8', label: 'Store Updated', desc: 'New NormalizedData is produced (immutable)' } },
    s9: { id: 's9', data: { step: '9', label: 'onChange(newStore)', desc: 'React re-renders with the new store state' } },
  },
  relationships: {
    [ROOT_ID]: ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9'],
  },
})

export default function PageEnginePipeline() {
  const [data, setData] = useState<NormalizedData>(pipelineData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Pipeline</h2>
        <p className="page-desc">
          The command dispatch flow from keypress to re-render.
          Navigate the list below — each step is itself driven by the same pipeline.
        </p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">navigate steps</span>{' '}
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
                <span style={{ opacity: 0.4, fontSize: '10px', marginRight: '8px', fontFamily: 'var(--font-mono, monospace)' }}>
                  {d?.step as string}
                </span>
                <span className="list-item__label">{d?.label as string}</span>
                <span className="list-item__desc">{d?.desc as string}</span>
              </div>
            )
          }}
        />
      </div>
      <div className="page-section">
        <h3 className="page-section-title">Command interface</h3>
        <pre className="code-block"><code>{`interface Command {
  type: string
  execute(store: NormalizedData): NormalizedData
  undo(store: NormalizedData): NormalizedData
}

// Every user action = a Command.
// Every Command is undoable.
// Middleware can intercept, modify, or block any Command.`}</code></pre>
      </div>
      <div className="page-section">
        <h3 className="page-section-title">Middleware pattern</h3>
        <pre className="code-block"><code>{`type Middleware = (command: Command, next: () => void) => void

// Plugins register middleware:
// focusRecovery() → validates focus after every command
// history()       → captures snapshots for undo/redo
// Execution order: outermost middleware runs first (outside-in)`}</code></pre>
      </div>
    </div>
  )
}
