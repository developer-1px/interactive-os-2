import { useState } from 'react'
import { ApgKeyboardTable } from './ApgKeyboardTable'
import { apgListbox } from './apg-data'
import { ListBox } from '../interactive-os/ui/ListBox'
import type { NormalizedData } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'
import { core } from '../interactive-os/plugins/core'
import { listData } from './shared-list-data'

const plugins = [core()]

export default function PageListboxNav() {
  const [data, setData] = useState<NormalizedData>(listData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Listbox</h2>
        <p className="page-desc">Read-only list with keyboard navigation — focus, select, multi-select</p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">select</span>{' '}
        <kbd>Home</kbd> <span className="key-hint">first</span>{' '}
        <kbd>End</kbd> <span className="key-hint">last</span>
      </div>
      <div className="card">
        <ListBox
          data={data}
          onChange={setData}
          plugins={plugins}
          renderItem={(item, state: NodeState, props) => {
            const d = item.data as Record<string, unknown>
            const cls = [
              'list-item',
              state.focused && 'list-item--focused',
              state.selected && !state.focused && 'list-item--selected',
            ].filter(Boolean).join(' ')

            return (
              <div {...props} className={cls}>
                <span className="list-item__label">{d?.label as string}</span>
                <span className="list-item__desc">{d?.desc as string}</span>
              </div>
            )
          }}
        />
      </div>
      <ApgKeyboardTable {...apgListbox} />
    </div>
  )
}
