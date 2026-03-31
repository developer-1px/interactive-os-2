import { useState, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { Meter as MeterComponent } from '../../ui/Meter'
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
    <div {...props} className={`${styles.meter} flex-row items-center`}>
      <span className={styles.label}>{label}</span>
      <span className={`${styles.track} flex-1 relative`}>
        <span className={`${styles.fill} h-full`} style={{ width: `${pct}%` }} />
      </span>
      <span className={`${styles.valueLabel} text-right`}>{value}%</span>
    </div>
  )
}

export function Meter() {
  const [store, setStore] = useState<NormalizedData>(data)
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <MeterComponent
      data={store}
      onChange={onChange}
      renderItem={renderMeter}
      aria-label="System Metrics"
    />
  )
}
