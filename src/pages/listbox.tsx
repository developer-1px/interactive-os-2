import { ListBox } from '../interactive-os/ui/list-box'
import { createStore } from '../interactive-os/core/normalized-store'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'

const listData = createStore({
  entities: {
    ts: { id: 'ts', data: { label: 'TypeScript', desc: 'Typed superset of JavaScript' } },
    react: { id: 'react', data: { label: 'React 19', desc: 'UI component library' } },
    vite: { id: 'vite', data: { label: 'Vite 8', desc: 'Next-gen build tool' } },
    vitest: { id: 'vitest', data: { label: 'Vitest', desc: 'Unit test framework' } },
    pnpm: { id: 'pnpm', data: { label: 'pnpm', desc: 'Fast package manager' } },
    axe: { id: 'axe', data: { label: 'axe-core', desc: 'Accessibility engine' } },
  },
  relationships: {
    [ROOT_ID]: ['ts', 'react', 'vite', 'vitest', 'pnpm', 'axe'],
  },
})

export default function ListboxPage() {
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Listbox</h2>
        <p className="page-desc">Tech stack selection with single and multi-select support</p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">select</span>{' '}
        <kbd>Enter</kbd> <span className="key-hint">activate</span>
      </div>
      <div className="card">
        <ListBox
          data={listData}
          renderItem={(item, state: NodeState) => {
            const d = item.data as Record<string, unknown>
            const cls = [
              'list-item',
              state.focused && 'list-item--focused',
              state.selected && !state.focused && 'list-item--selected',
            ].filter(Boolean).join(' ')

            return (
              <div className={cls}>
                <span className="list-item__label">{d?.label as string}</span>
                <span className="list-item__desc">{d?.desc as string}</span>
              </div>
            )
          }}
        />
      </div>
    </div>
  )
}
