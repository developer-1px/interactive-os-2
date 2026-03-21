import styles from '../interactive-os/ui/Toolbar.module.css'
import { ApgKeyboardTable } from './ApgKeyboardTable'
import { apgToolbar } from './apg-data'
import { Aria } from '../interactive-os/components/aria'
import { toolbar } from '../interactive-os/behaviors/toolbar'
import { core } from '../interactive-os/plugins/core'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'

const toolbarData = createStore({
  entities: {
    bold: { id: 'bold', data: { label: 'B', title: 'Bold' } },
    italic: { id: 'italic', data: { label: 'I', title: 'Italic' } },
    underline: { id: 'underline', data: { label: 'U', title: 'Underline' } },
    alignL: { id: 'alignL', data: { label: '≡', title: 'Align Left' } },
    alignC: { id: 'alignC', data: { label: '≡', title: 'Align Center' } },
    alignR: { id: 'alignR', data: { label: '≡', title: 'Align Right' } },
  },
  relationships: {
    [ROOT_ID]: ['bold', 'italic', 'underline', 'alignL', 'alignC', 'alignR'],
  },
})

const plugins = [core()]

export default function PageToolbar() {
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
      <div className={`card ${styles.toolbarCard}`}>
        <Aria behavior={toolbar} data={toolbarData} plugins={plugins} aria-label="Text formatting">
          <Aria.Item render={(node, state: NodeState) => {
            const cls = [
              styles.toolbarBtn,
              state.focused && styles.toolbarBtnFocused,
              state.selected && styles.toolbarBtnSelected,
            ].filter(Boolean).join(' ')

            return (
              <div className={cls} title={(node.data as Record<string, unknown>)?.title as string}>
                {(node.data as Record<string, unknown>)?.label as string}
              </div>
            )
          }} />
        </Aria>
      </div>
      <ApgKeyboardTable {...apgToolbar} />
    </div>
  )
}
