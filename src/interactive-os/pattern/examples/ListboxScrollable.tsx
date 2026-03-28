import { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { listbox } from '../../pattern/roles/listbox'
import styles from './listbox.module.css'

// APG #36: Scrollable Listbox — "Choose your favorite transuranic element"
// https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-scrollable/

const elements = [
  'Neptunium', 'Plutonium', 'Americium', 'Curium', 'Berkelium',
  'Californium', 'Einsteinium', 'Fermium', 'Mendelevium', 'Nobelium',
  'Lawrencium', 'Rutherfordium', 'Dubnium', 'Seaborgium', 'Bohrium',
  'Hassium', 'Meitnerium', 'Darmstadtium', 'Roentgenium', 'Copernicium',
  'Nihonium', 'Flerovium', 'Moscovium', 'Livermorium', 'Tennessine',
  'Oganesson',
]

const data: NormalizedData = createStore({
  entities: Object.fromEntries(
    elements.map(el => [el.toLowerCase(), { id: el.toLowerCase(), data: { label: el } }]),
  ),
  relationships: { [ROOT_ID]: elements.map(el => el.toLowerCase()) },
})

const renderOption = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
  return (
    <div
      {...props}
      className={styles.option}
      data-focused={state.focused || undefined}
    >
      {label}
    </div>
  )
}

export function ListboxScrollable() {
  const [store, setStore] = useState<NormalizedData>(data)
  const pattern = useMemo(() => listbox(), [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      pattern={pattern}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="Choose your favorite transuranic element"
    >
      <Aria.Item render={renderOption} />
    </Aria>
  )
}
