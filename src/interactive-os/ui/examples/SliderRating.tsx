import { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { slider } from '../../pattern/roles/slider'
import styles from './slider.module.css'

// APG #49: Rating Slider
// https://www.w3.org/WAI/ARIA/apg/patterns/slider/examples/slider-rating/

const data: NormalizedData = createStore({
  entities: {
    rating: { id: 'rating', data: { label: 'Rating', value: 5 } },
  },
  relationships: { [ROOT_ID]: ['rating'] },
})

const renderSlider = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const nodeData = node.data as Record<string, unknown>
  const label = nodeData?.label as string
  const current = (state.valueCurrent as number) ?? 5
  const pct = (current / 10) * 100

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

export function SliderRating() {
  const [store, setStore] = useState<NormalizedData>(data)
  const behavior = useMemo(() => slider({ min: 0, max: 10, step: 1 }), [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      behavior={behavior}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="Rating"
    >
      <Aria.Item render={renderSlider} />
    </Aria>
  )
}
