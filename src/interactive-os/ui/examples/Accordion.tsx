import { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { accordion } from '../../pattern/roles/accordion'
import { EXPANDED_ID } from '../../axis/expand'
import styles from './accordion.module.css'

// APG #1: Accordion Example
// https://www.w3.org/WAI/ARIA/apg/patterns/accordion/examples/accordion/

const sections = [
  {
    id: 'personal-information',
    label: 'Personal Information',
    contentId: 'personal-information-content',
    content:
      'Provide your name, email, phone number, and any other personal details required for identification.',
  },
  {
    id: 'billing-address',
    label: 'Billing Address',
    contentId: 'billing-address-content',
    content:
      'Enter the address associated with your payment method including street address, city, state, and zip code.',
  },
  {
    id: 'shipping-address',
    label: 'Shipping Address',
    contentId: 'shipping-address-content',
    content:
      'Provide the address where you would like your order delivered. This may differ from your billing address.',
  },
]

const data: NormalizedData = createStore({
  entities: {
    ...Object.fromEntries(
      sections.map(s => [s.id, { id: s.id, data: { label: s.label } }]),
    ),
    ...Object.fromEntries(
      sections.map(s => [
        s.contentId,
        { id: s.contentId, data: { label: s.content } },
      ]),
    ),
    [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: ['personal-information'] },
  },
  relationships: {
    [ROOT_ID]: sections.map(s => s.id),
    ...Object.fromEntries(
      sections.map(s => [s.id, [s.contentId]]),
    ),
  },
})

const renderItem = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
  const isHeader = (state.level ?? 1) === 1

  if (isHeader) {
    return (
      <div
        {...props}
        className={styles.header}
        data-focused={state.focused || undefined}
      >
        <span>{label}</span>
        <span className={styles.indicator} aria-hidden="true">
          {state.expanded ? '\u25B2' : '\u25BC'}
        </span>
      </div>
    )
  }

  return (
    <div {...props} className={styles.panel}>
      {label}
    </div>
  )
}

export function Accordion() {
  const [store, setStore] = useState<NormalizedData>(data)
  const behavior = useMemo(() => accordion, [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      behavior={behavior}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="Accordion Example"
    >
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
