import { useState, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { SwitchGroup as SwitchGroupUI } from '../../ui/SwitchGroup'
import { ax } from '@styles/ax'
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
      className={`${styles.switchItem} ${ax({ gap: 'md', text: 'primary', padding: 'xs', content: 'text' })} flex-row items-center justify-between`}
      data-focused={state.focused || undefined}
    >
      <span className={`${styles.label} flex-1`}>{label}</span>
      <span
        className={`${styles.track} ${ax({ shape: 'pill' })} inline-flex items-center`}
        data-checked={state.checked || undefined}
        aria-hidden="true"
      >
        <span className={`${styles.thumb} ${ax({ shape: 'pill', size: 'sm' })} block`} />
      </span>
    </div>
  )
}

export function SwitchGroup() {
  const [store, setStore] = useState<NormalizedData>(data)
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <SwitchGroupUI
      data={store}
      onChange={onChange}
      renderItem={renderSwitch}
      aria-label="Notification Settings"
    />
  )
}
