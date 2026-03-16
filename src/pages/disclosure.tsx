import { DisclosureGroup } from '../interactive-os/ui/disclosure-group'
import { createStore } from '../interactive-os/core/normalized-store'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'
import { ChevronDown, ChevronRight } from 'lucide-react'

const disclosureData = createStore({
  entities: {
    details: { id: 'details', label: 'View Details', content: 'Interactive-os provides keyboard-first ARIA components with zero styling. Compose behaviors and plugins to build accessible UIs.' },
    advanced: { id: 'advanced', label: 'Advanced Options', content: 'Configure plugins, behaviors, and key mappings. Override any default behavior by writing a custom plugin.' },
  },
  relationships: {
    [ROOT_ID]: ['details', 'advanced'],
  },
})

export default function DisclosurePage() {
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
          renderTrigger={(item, state: NodeState) => (
            <div>
              <div className={`disclosure-trigger${state.focused ? ' disclosure-trigger--focused' : ''}`}>
                <span className="disclosure-trigger__icon">
                  {state.expanded
                    ? <ChevronDown size={13} strokeWidth={2} />
                    : <ChevronRight size={13} strokeWidth={2} />}
                </span>
                <span className="disclosure-trigger__label">{item.label as string}</span>
              </div>
              {state.expanded && (
                <div className="disclosure-panel">
                  {item.content as string}
                </div>
              )}
            </div>
          )}
        />
      </div>
    </div>
  )
}
