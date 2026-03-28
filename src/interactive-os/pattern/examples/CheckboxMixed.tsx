import { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { checkboxMixed } from '../../pattern/roles/checkboxMixed'
import { EXPANDED_ID } from '../../axis/expand'
import styles from './checkbox.module.css'

// APG #10: Checkbox (Mixed-State)
// https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/examples/checkbox-mixed/

const data: NormalizedData = createStore({
  entities: {
    condiments: { id: 'condiments', data: { label: 'Sandwich Condiments' } },
    lettuce: { id: 'lettuce', data: { label: 'Lettuce' } },
    tomato: { id: 'tomato', data: { label: 'Tomato' } },
    mustard: { id: 'mustard', data: { label: 'Mustard' } },
    sprouts: { id: 'sprouts', data: { label: 'Sprouts' } },
    [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: ['condiments'] },
  },
  relationships: {
    [ROOT_ID]: ['condiments'],
    condiments: ['lettuce', 'tomato', 'mustard', 'sprouts'],
  },
})

const renderCheckbox = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
  const isParent = (state.level ?? 1) === 1

  if (isParent) {
    const isMixed = state.checked === 'mixed'
    return (
      <div
        {...props}
        className={styles.checkbox}
        data-focused={state.focused || undefined}
      >
        <span
          className={styles.checkIndicator}
          data-checked={state.checked === true || undefined}
          data-mixed={isMixed || undefined}
          aria-hidden="true"
        >
          {isMixed ? '\u2014' : state.checked ? '\u2713' : ''}
        </span>
        {label}
      </div>
    )
  }

  return (
    <div
      {...props}
      className={styles.checkbox}
      data-focused={state.focused || undefined}
      style={{ paddingInlineStart: 'var(--space-xl)' }}
    >
      <span
        className={styles.checkIndicator}
        data-checked={state.checked || undefined}
        aria-hidden="true"
      >
        {state.checked ? '\u2713' : ''}
      </span>
      {label}
    </div>
  )
}

export function CheckboxMixed() {
  const [store, setStore] = useState<NormalizedData>(data)
  const pattern = useMemo(() => checkboxMixed, [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      pattern={pattern}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="Sandwich Condiments"
    >
      <Aria.Item render={renderCheckbox} />
    </Aria>
  )
}
