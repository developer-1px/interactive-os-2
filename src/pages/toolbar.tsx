import { Aria } from '../interactive-os/components/aria'
import { toolbar } from '../interactive-os/behaviors/toolbar'
import { core } from '../interactive-os/plugins/core'
import { createStore } from '../interactive-os/core/normalized-store'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'

const toolbarData = createStore({
  entities: {
    bold: { id: 'bold', label: 'B', title: 'Bold' },
    italic: { id: 'italic', label: 'I', title: 'Italic' },
    underline: { id: 'underline', label: 'U', title: 'Underline' },
    alignL: { id: 'alignL', label: '≡', title: 'Align Left' },
    alignC: { id: 'alignC', label: '≡', title: 'Align Center' },
    alignR: { id: 'alignR', label: '≡', title: 'Align Right' },
  },
  relationships: {
    [ROOT_ID]: ['bold', 'italic', 'underline', 'alignL', 'alignC', 'alignR'],
  },
})

const plugins = [core()]

export default function ToolbarPage() {
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Toolbar</h2>
        <p className="page-desc">Horizontal toolbar with keyboard navigation between buttons</p>
      </div>
      <div className="page-keys">
        <kbd>←→</kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>Home</kbd> <span className="key-hint">first</span>{' '}
        <kbd>End</kbd> <span className="key-hint">last</span>{' '}
        <kbd>Enter</kbd> <span className="key-hint">activate</span>
      </div>
      <div className="card toolbar-card">
        <Aria behavior={toolbar} data={toolbarData} plugins={plugins} aria-label="Text formatting">
          <Aria.Node render={(node, state: NodeState) => {
            const cls = [
              'toolbar-btn',
              state.focused && 'toolbar-btn--focused',
              state.selected && 'toolbar-btn--selected',
            ].filter(Boolean).join(' ')

            return (
              <div className={cls} title={node.title as string}>
                {node.label as string}
              </div>
            )
          }} />
        </Aria>
      </div>
    </div>
  )
}
