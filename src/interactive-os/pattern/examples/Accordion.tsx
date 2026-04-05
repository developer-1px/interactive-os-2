import React, { useState, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { EXPANDED_ID } from '../../axis/expand'
import { Accordion as AccordionUI } from '../../ui/Accordion'
import { ExpandIndicator } from '../../ui/indicators'
import { ax } from '@styles/ax'
import './accordion.css'

// APG #1: Accordion Example
// https://www.w3.org/WAI/ARIA/apg/patterns/accordion/examples/accordion/

const sections = [
  { id: 'personal-information', label: 'Personal Information' },
  { id: 'billing-address', label: 'Billing Address' },
  { id: 'shipping-address', label: 'Shipping Address' },
]

const data: NormalizedData = createStore({
  entities: {
    ...Object.fromEntries(
      sections.map(s => [s.id, { id: s.id, data: { label: s.label } }]),
    ),
    [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: ['personal-information'] },
  },
  relationships: {
    [ROOT_ID]: sections.map(s => s.id),
  },
})

function Field({ label, id, type = 'text' }: { label: string; id: string; type?: string }) {
  return (
    <div className={`accordion-field flex-col`}>
      <label htmlFor={id} className={`${ax({ textStyle: 'caption', weight: 'semi', text: 'primary' })}`}>{label}</label>
      <input id={id} type={type} className={`accordion-input ${ax({ text: 'primary', textStyle: 'body', surface: 'display', shape: 'sm', padding: 'xs', content: 'text' })}`} />
    </div>
  )
}

const panels: Record<string, React.ReactNode> = {
  'personal-information': (
    <fieldset className={`accordion-fieldset ${ax({ gap: 'sm' })} flex-col border-none`}>
      <Field label="Name" id="cufc1" />
      <Field label="Email" id="cufc2" type="email" />
      <Field label="Phone" id="cufc3" type="tel" />
      <Field label="Extension" id="cufc4" />
      <Field label="Country" id="cufc5" />
      <Field label="City/Province" id="cufc6" />
    </fieldset>
  ),
  'billing-address': (
    <fieldset className={`accordion-fieldset ${ax({ gap: 'sm' })} flex-col border-none`}>
      <Field label="Address 1" id="b-add1" />
      <Field label="Address 2" id="b-add2" />
      <Field label="City" id="b-city" />
      <Field label="State" id="b-state" />
      <Field label="Zip Code" id="b-zip" />
    </fieldset>
  ),
  'shipping-address': (
    <fieldset className={`accordion-fieldset ${ax({ gap: 'sm' })} flex-col border-none`}>
      <Field label="Address 1" id="s-add1" />
      <Field label="Address 2" id="s-add2" />
      <Field label="City" id="s-city" />
      <Field label="State" id="s-state" />
      <Field label="Zip Code" id="s-zip" />
    </fieldset>
  ),
}

// APG: h3 > button structure
// props contains: role, data-node-id, tabIndex, onKeyDown, onFocus, onClick, aria-expanded, aria-controls
// button gets interactive props, h3 provides heading semantics
// state.slotProps provides role="region", aria-labelledby, hidden for panel
const renderItem = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const { role: _role, ...buttonProps } = props as Record<string, unknown>
  const label = (node.data as Record<string, unknown>)?.label as string
  return (
    <div>
      <h3 className="accordion-heading">
        <button
          {...(buttonProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}
          id={node.id as string}
          className={`accordion-trigger ${ax({ weight: 'semi', text: 'primary', surface: 'sunken', textStyle: 'body', padding: 'sm', content: 'text' })} flex-row items-center justify-between w-full`}
          type="button"
          data-focused={state.focused || undefined}
        >
          <span className="accordion-title">{label}</span>
          <ExpandIndicator expanded={state.expanded === true} />
        </button>
      </h3>
      <div {...state.slotProps} className={`accordion-panel ${ax({ textStyle: 'body', text: 'secondary', padding: 'sm', content: 'text' })}`}>
        {panels[node.id as string]}
      </div>
    </div>
  )
}

export function Accordion() {
  const [store, setStore] = useState<NormalizedData>(data)
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <AccordionUI
      data={store}
      onChange={onChange}
      renderItem={renderItem}
      aria-label="Accordion Example"
    />
  )
}
