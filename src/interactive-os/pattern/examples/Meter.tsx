import { useState, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { Meter as MeterComponent } from '../../ui/Meter'
import { ax } from '../../../../styles/ax'
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
    <div {...props} className={`${styles.meter} ${ax({ layout: 'row', gap: 'sm', textStyle: 'body', text: 'primary' })} items-center`}>
      <span className={`${styles.label} ${ax({ weight: 'semi' })}`}>{label}</span>
      <span className={`${styles.track} ${ax({ shape: 'sm' })} flex-1 relative`}>
        <span className={`${styles.fill} ${ax({ shape: 'sm' })} h-full`} style={{ width: `${pct}%` }} />
      </span>
      <span className={`${styles.valueLabel} ${ax({ text: 'secondary' })} text-right`}>{value}%</span>
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
