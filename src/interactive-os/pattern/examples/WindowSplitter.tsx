import { useState, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { WindowSplitter as WindowSplitterComponent } from '../../ui/WindowSplitter'
import { ax } from '@styles/ax'

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
    <div className={`${ax({ shape: 'sm', border: 'default' })} flex-row`}>
      <div className={`flex-row items-center justify-center overflow-hidden`} style={{ flexBasis: `${current}%` }}>
        <p className={ax({ textStyle: 'body', text: 'secondary' })}>Panel 1</p>
      </div>
      <div
        {...props}
        className={`${ax({ surface: 'sunken', interactive: 'button' })} shrink-0 outline-none`}
        data-focused={state.focused || undefined}
      />
      <div className={`flex-row items-center justify-center overflow-hidden`} style={{ flexBasis: `${100 - current}%` }}>
        <p className={ax({ textStyle: 'body', text: 'secondary' })}>Panel 2</p>
      </div>
    </div>
  )
}

export function WindowSplitter() {
  const [store, setStore] = useState<NormalizedData>(data)
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <WindowSplitterComponent
      data={store}
      onChange={onChange}
      renderItem={renderSplitter}
      min={0}
      max={100}
      step={1}
      aria-label="Window Splitter"
    />
  )
}
