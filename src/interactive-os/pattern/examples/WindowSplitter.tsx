import { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { windowSplitter } from '../../pattern/roles/windowSplitter'
import styles from './windowSplitter.module.css'

// APG #67: Window Splitter
// https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/

const data: NormalizedData = createStore({
  entities: {
    splitter: { id: 'splitter', data: { label: 'Panel Size', value: 50 } },
  },
  relationships: { [ROOT_ID]: ['splitter'] },
})

const renderSplitter = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const current = (state.valueCurrent as number) ?? 50
  void node

  return (
    <div className={styles.container}>
      <div className={styles.panel} style={{ flexBasis: `${current}%` }}>
        <p className={styles.panelLabel}>Panel 1</p>
      </div>
      <div
        {...props}
        className={styles.splitter}
        data-focused={state.focused || undefined}
      />
      <div className={styles.panel} style={{ flexBasis: `${100 - current}%` }}>
        <p className={styles.panelLabel}>Panel 2</p>
      </div>
    </div>
  )
}

export function WindowSplitter() {
  const [store, setStore] = useState<NormalizedData>(data)
  const pattern = useMemo(() => windowSplitter({ min: 0, max: 100, step: 1 }), [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      pattern={pattern}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="Window Splitter"
    >
      <Aria.Item render={renderSplitter} />
    </Aria>
  )
}
