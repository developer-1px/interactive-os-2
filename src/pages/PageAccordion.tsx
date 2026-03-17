import { ApgKeyboardTable } from './ApgKeyboardTable'
import { apgAccordion } from './apg-data'
import { Accordion } from '../interactive-os/ui/Accordion'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'
import { ChevronDown, ChevronRight } from 'lucide-react'

const accordionData = createStore({
  entities: {
    getting: { id: 'getting', data: { label: 'Getting Started', content: 'Install via pnpm add interactive-os. Import behaviors, wrap with Aria, done.' } },
    api: { id: 'api', data: { label: 'API Reference', content: 'Core APIs: useAria, Aria, createStore. Behaviors: treegrid, listbox, tabs, menu, accordion, disclosure.' } },
    faq: { id: 'faq', data: { label: 'FAQ', content: 'Q: Is it headless? A: Yes, zero styles included. Q: Works with React 18? A: Requires React 18+.' } },
  },
  relationships: {
    [ROOT_ID]: ['getting', 'api', 'faq'],
  },
})

export default function PageAccordion() {
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Accordion</h2>
        <p className="page-desc">Expandable sections following W3C APG accordion pattern</p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>Enter</kbd> <span className="key-hint">toggle</span>{' '}
        <kbd>Home</kbd> <span className="key-hint">first</span>{' '}
        <kbd>End</kbd> <span className="key-hint">last</span>
      </div>
      <div className="card">
        <Accordion
          data={accordionData}
          renderItem={(item, state: NodeState) => {
            const d = item.data as Record<string, unknown>
            return (
            <div>
              <div className={`accordion-header${state.focused ? ' accordion-header--focused' : ''}`}>
                <span className="accordion-header__label">{d?.label as string}</span>
                <span className="accordion-header__icon">
                  {state.expanded
                    ? <ChevronDown size={13} strokeWidth={2} />
                    : <ChevronRight size={13} strokeWidth={2} />}
                </span>
              </div>
              {state.expanded && (
                <div className="accordion-panel">
                  {d?.content as string}
                </div>
              )}
            </div>
          )}}
        />
      </div>
      <ApgKeyboardTable {...apgAccordion} />
    </div>
  )
}
