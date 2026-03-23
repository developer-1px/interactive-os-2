import { ApgKeyboardTable } from './ApgKeyboardTable'
import { apgDisclosure } from './apg-data'
import { DisclosureGroup } from '../interactive-os/ui/DisclosureGroup'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'
import { ChevronDown, ChevronRight } from 'lucide-react'

const disclosureData = createStore({
  entities: {
    details: { id: 'details', data: { label: 'View Details', content: 'Interactive-os provides keyboard-first ARIA components with zero styling. Compose behaviors and plugins to build accessible UIs.' } },
    advanced: { id: 'advanced', data: { label: 'Advanced Options', content: 'Configure plugins, behaviors, and key mappings. Override any default behavior by writing a custom plugin.' } },
  },
  relationships: {
    [ROOT_ID]: ['details', 'advanced'],
  },
})

export default function PageDisclosure() {
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Disclosure</h2>
        <p className="page-desc">Toggle panels following W3C APG disclosure pattern</p>
      </div>
      <div className="page-keys">
        <kbd>Enter</kbd> <span className="key-hint">toggle</span>{' '}
        <kbd>Tab</kbd> <span className="key-hint">focus next trigger</span>
      </div>
      <div className="card">
        <DisclosureGroup
          data={disclosureData}
          renderItem={(props, item, state: NodeState) => {
            const d = item.data as Record<string, unknown>
            return (
            <div {...props}>
              <div className={`disclosure-trigger${state.focused ? ' disclosure-trigger--focused' : ''}`}>
                <span className="disclosure-trigger__icon">
                  {state.expanded
                    ? <ChevronDown size={12} />
                    : <ChevronRight size={12} />}
                </span>
                <span className="disclosure-trigger__label">{d?.label as string}</span>
              </div>
              {state.expanded && (
                <div className="disclosure-panel">
                  {d?.content as string}
                </div>
              )}
            </div>
          )}}
        />
      </div>
      <ApgKeyboardTable {...apgDisclosure} />
    </div>
  )
}
