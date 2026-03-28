import { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { slider } from '../../pattern/roles/slider'
import styles from './slider.module.css'

// APG #48: Color Viewer Slider
// https://www.w3.org/WAI/ARIA/apg/patterns/slider/examples/slider-color-viewer/

const channels = [
  { id: 'red', label: 'Red', value: 128 },
  { id: 'green', label: 'Green', value: 128 },
  { id: 'blue', label: 'Blue', value: 128 },
]

const data: NormalizedData = createStore({
  entities: Object.fromEntries(
    channels.map(c => [c.id, { id: c.id, data: { label: c.label, value: c.value } }]),
  ),
  relationships: { [ROOT_ID]: channels.map(c => c.id) },
})

const renderSlider = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const nodeData = node.data as Record<string, unknown>
  const label = nodeData?.label as string
  const current = (state.valueCurrent as number) ?? 128
  const pct = (current / 255) * 100

  return (
    <div
      {...props}
      className={styles.slider}
      data-focused={state.focused || undefined}
    >
      <span className={styles.label}>{label}</span>
      <span className={styles.track}>
        <span className={styles.fill} style={{ width: `${pct}%` }} />
      </span>
      <span className={styles.valueLabel}>{current}</span>
    </div>
  )
}

export function SliderColorViewer() {
  const [store, setStore] = useState<NormalizedData>(data)
  const behavior = useMemo(() => slider({ min: 0, max: 255, step: 1 }), [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      behavior={behavior}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="Color Viewer"
    >
      <Aria.Item render={renderSlider} />
    </Aria>
  )
}
