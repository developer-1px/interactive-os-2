import { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { switchPattern } from '../../pattern/roles/switch'
import styles from './switch.module.css'

// APG #54: Switch
// https://www.w3.org/WAI/ARIA/apg/patterns/switch/examples/switch/

const settings = [
  { id: 'email-notifications', label: 'Email Notifications' },
  { id: 'sms-notifications', label: 'SMS Notifications' },
]

const data: NormalizedData = createStore({
  entities: Object.fromEntries(
    settings.map(s => [s.id, { id: s.id, data: { label: s.label } }]),
  ),
  relationships: { [ROOT_ID]: settings.map(s => s.id) },
})

const renderSwitch = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
  return (
    <div
      {...props}
      className={styles.switchItem}
      data-focused={state.focused || undefined}
    >
      <span className={styles.label}>{label}</span>
      <span
        className={styles.track}
        data-checked={state.checked || undefined}
        aria-hidden="true"
      >
        <span className={styles.thumb} />
      </span>
    </div>
  )
}

export function SwitchGroup() {
  const [store, setStore] = useState<NormalizedData>(data)
  const behavior = useMemo(() => switchPattern, [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      behavior={behavior}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="Notification Settings"
    >
      <Aria.Item render={renderSwitch} />
    </Aria>
  )
}
