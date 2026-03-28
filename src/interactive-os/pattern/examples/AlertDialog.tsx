import { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { alertdialog } from '../../pattern/roles/alertdialog'
import { EXPANDED_ID } from '../../axis/expand'
import styles from './alertDialog.module.css'

// APG #3: Alert Dialog
// https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/examples/alertdialog/

const data: NormalizedData = createStore({
  entities: {
    'discard-dialog': {
      id: 'discard-dialog',
      data: { label: 'Discard Changes' },
    },
    'discard-message': {
      id: 'discard-message',
      data: {
        label:
          'Are you sure you want to discard all of your notes? This action cannot be undone.',
      },
    },
    [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: ['discard-dialog'] },
  },
  relationships: {
    [ROOT_ID]: ['discard-dialog'],
    'discard-dialog': ['discard-message'],
  },
})

const renderItem = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
  const isDialog = (state.level ?? 1) === 1

  if (isDialog) {
    return (
      <div
        {...props}
        className={styles.dialog}
        data-focused={state.focused || undefined}
      >
        <h2 className={styles.title}>{label}</h2>
      </div>
    )
  }

  return (
    <div {...props} className={styles.message}>
      {label}
    </div>
  )
}

export function AlertDialog() {
  const [store, setStore] = useState<NormalizedData>(data)
  const pattern = useMemo(() => alertdialog, [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      pattern={pattern}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="Discard Changes"
    >
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
