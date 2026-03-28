import { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { meter } from '../../pattern/roles/meter'
import styles from './meter.module.css'

// APG #44: Meter
// https://www.w3.org/WAI/ARIA/apg/patterns/meter/

const data: NormalizedData = createStore({
  entities: {
    cpu: { id: 'cpu', data: { label: 'CPU Usage', value: 70, min: 0, max: 100 } },
  },
  relationships: { [ROOT_ID]: ['cpu'] },
})

const renderMeter = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const nodeData = node.data as Record<string, unknown>
  const label = nodeData?.label as string
  const value = nodeData?.value as number
  const min = nodeData?.min as number
  const max = nodeData?.max as number
  const pct = ((value - min) / (max - min)) * 100
  void state

  return (
    <div {...props} className={styles.meter}>
      <span className={styles.label}>{label}</span>
      <span className={styles.track}>
        <span className={styles.fill} style={{ width: `${pct}%` }} />
      </span>
      <span className={styles.valueLabel}>{value}%</span>
    </div>
  )
}

export function Meter() {
  const [store, setStore] = useState<NormalizedData>(data)
  const pattern = useMemo(() => meter, [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      pattern={pattern}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="System Metrics"
    >
      <Aria.Item render={renderMeter} />
    </Aria>
  )
}
