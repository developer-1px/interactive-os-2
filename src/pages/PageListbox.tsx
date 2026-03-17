import { useState } from 'react'
import { ListBox } from '../interactive-os/ui/ListBox'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'
import { core } from '../interactive-os/plugins/core'
import { history } from '../interactive-os/plugins/history'
import { crud } from '../interactive-os/plugins/crud'
import { clipboard } from '../interactive-os/plugins/clipboard'
import { rename } from '../interactive-os/plugins/rename'
import { dnd } from '../interactive-os/plugins/dnd'
import { focusRecovery } from '../interactive-os/plugins/focus-recovery'

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

const plugins = [core(), crud(), clipboard(), rename(), dnd(), history(), focusRecovery()]

export default function PageListbox() {
  const [data, setData] = useState<NormalizedData>(listData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Listbox</h2>
        <p className="page-desc">Tech stack list with full CRUD — add, delete, rename, copy/paste, reorder, undo</p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">select</span>{' '}
        <kbd>Del</kbd> <span className="key-hint">delete</span>{' '}
        <kbd>⌘C</kbd> <span className="key-hint">copy</span>{' '}
        <kbd>⌘V</kbd> <span className="key-hint">paste</span>{' '}
        <kbd>F2</kbd> <span className="key-hint">rename</span>{' '}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>{' '}
        <kbd>Alt↑↓</kbd> <span className="key-hint">reorder</span>
      </div>
      <div className="card">
        <ListBox
          data={data}
          onChange={setData}
          enableEditing
          plugins={plugins}
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
