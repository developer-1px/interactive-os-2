import React, { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { accordion } from '../../pattern/roles/accordion'
import { EXPANDED_ID } from '../../axis/expand'
import { ExpandIndicator } from '../../ui/indicators'
import styles from './accordion.module.css'

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
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <input id={id} type={type} className={styles.input} />
    </div>
  )
}

const panelContent: Record<string, React.ReactNode> = {
  'personal-information': (
    <>
      <Field label="Name" id="cufc1" />
      <Field label="Email" id="cufc2" type="email" />
      <Field label="Phone" id="cufc3" type="tel" />
      <Field label="Extension" id="cufc4" />
      <Field label="Country" id="cufc5" />
      <Field label="City/Province" id="cufc6" />
    </>
  ),
  'billing-address': (
    <>
      <Field label="Address 1" id="b-add1" />
      <Field label="Address 2" id="b-add2" />
      <Field label="City" id="b-city" />
      <Field label="State" id="b-state" />
      <Field label="Zip Code" id="b-zip" />
    </>
  ),
  'shipping-address': (
    <>
      <Field label="Address 1" id="s-add1" />
      <Field label="Address 2" id="s-add2" />
      <Field label="City" id="s-city" />
      <Field label="State" id="s-state" />
      <Field label="Zip Code" id="s-zip" />
    </>
  ),
}

// APG: h3 > button structure
// props contains: role, data-node-id, tabIndex, onKeyDown, onFocus, onClick, aria-expanded, aria-controls
// button gets interactive props, h3 provides heading semantics
const renderHeader = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const { role: _role, ...buttonProps } = props as Record<string, unknown>
  const label = (node.data as Record<string, unknown>)?.label as string
  return (
    <h3 className={styles.heading}>
      <button
        {...(buttonProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        id={node.id as string}
        className={styles.trigger}
        type="button"
        data-focused={state.focused || undefined}
      >
        <span className={styles.title}>{label}</span>
        <ExpandIndicator expanded={state.expanded === true} />
      </button>
    </h3>
  )
}

// APG: div[role="region"][aria-labelledby] — Panel auto-generates these
// render receives node.id → panelContent map provides the form fields
const renderRegion = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  _state: NodeState,
): React.ReactElement => (
  <div {...props} className={styles.panel}>
    <fieldset className={styles.fieldset}>
      {panelContent[node.id as string]}
    </fieldset>
  </div>
)

export function Accordion() {
  const [store, setStore] = useState<NormalizedData>(data)
  const pattern = useMemo(() => accordion, [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      pattern={pattern}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="Accordion Example"
    >
      {sections.map(s => (
        <React.Fragment key={s.id}>
          <Aria.Item ids={[s.id]} render={renderHeader} />
          <Aria.Panel ids={[s.id]} render={renderRegion} />
        </React.Fragment>
      ))}
    </Aria>
  )
}
