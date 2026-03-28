import { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { toolbar } from '../../pattern/roles/toolbar'
import styles from './toolbar.module.css'

// APG #61: Toolbar
// https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/examples/toolbar/

const items = [
  { id: 'bold', label: 'Bold' },
  { id: 'italic', label: 'Italic' },
  { id: 'underline', label: 'Underline' },
  { id: 'align-left', label: 'Align Left' },
  { id: 'align-center', label: 'Align Center' },
  { id: 'align-right', label: 'Align Right' },
  { id: 'copy', label: 'Copy' },
  { id: 'paste', label: 'Paste' },
  { id: 'cut', label: 'Cut' },
]

const data: NormalizedData = createStore({
  entities: Object.fromEntries(
    items.map(item => [item.id, { id: item.id, data: { label: item.label } }]),
  ),
  relationships: { [ROOT_ID]: items.map(item => item.id) },
})

const renderButton = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
  return (
    <div
      {...props}
      className={styles.button}
      data-focused={state.focused || undefined}
    >
      {label}
    </div>
  )
}

export function Toolbar() {
  const [store, setStore] = useState<NormalizedData>(data)
  const behavior = useMemo(() => toolbar, [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      behavior={behavior}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="Text Formatting"
    >
      <Aria.Item render={renderButton} />
    </Aria>
  )
}
