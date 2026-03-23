import { ApgKeyboardTable } from './ApgKeyboardTable'
import { apgRadioGroup } from './apg-data'
import { RadioGroup } from '../interactive-os/ui/RadioGroup'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'

const radioData = createStore({
  entities: {
    small: { id: 'small', data: { label: 'Small' } },
    medium: { id: 'medium', data: { label: 'Medium' } },
    large: { id: 'large', data: { label: 'Large' } },
    xl: { id: 'xl', data: { label: 'XL' } },
  },
  relationships: {
    [ROOT_ID]: ['small', 'medium', 'large', 'xl'],
  },
})

export default function PageRadioGroup() {
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Radiogroup</h2>
        <p className="page-desc">Single-selection radiogroup following W3C APG radiogroup pattern</p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>←→</kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">select</span>
      </div>
      <div className="card">
        <RadioGroup
          data={radioData}
          renderItem={(item, state: NodeState, props) => {
            const d = item.data as Record<string, unknown>
            const cls = [
              'list-item',
              state.focused && 'list-item--focused',
              state.selected && !state.focused && 'list-item--selected',
            ].filter(Boolean).join(' ')

            return (
              <div {...props} className={cls} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{state.selected ? '◉' : '○'}</span>
                <span className="list-item__label">{d?.label as string}</span>
              </div>
            )
          }}
        />
      </div>
      <ApgKeyboardTable {...apgRadioGroup} />
    </div>
  )
}
