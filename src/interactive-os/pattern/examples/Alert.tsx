import { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { alert } from '../../pattern/roles/alert'
import styles from './alert.module.css'

// APG #2: Alert
// https://www.w3.org/WAI/ARIA/apg/patterns/alert/examples/alert/

const messages = [
  {
    id: 'session-expiry',
    label: 'Your session will expire in 5 minutes.',
  },
  {
    id: 'save-success',
    label: 'Your changes have been saved successfully.',
  },
  {
    id: 'connection-lost',
    label: 'Network connection has been lost. Attempting to reconnect.',
  },
]

const data: NormalizedData = createStore({
  entities: Object.fromEntries(
    messages.map(m => [m.id, { id: m.id, data: { label: m.label } }]),
  ),
  relationships: { [ROOT_ID]: messages.map(m => m.id) },
})

const renderAlert = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  _state: NodeState,
): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
  return (
    <div {...props} className={styles.alert}>
      <span className={styles.icon} aria-hidden="true">
        &#9432;
      </span>
      <span>{label}</span>
    </div>
  )
}

export function Alert() {
  const [store, setStore] = useState<NormalizedData>(data)
  const pattern = useMemo(() => alert, [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      pattern={pattern}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="Alerts"
    >
      <Aria.Item render={renderAlert} />
    </Aria>
  )
}
