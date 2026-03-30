import { useState, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { ListBox } from '../../ui/ListBox'
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

export function ListboxScrollable() {
  const [store, setStore] = useState<NormalizedData>(data)
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <ListBox
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="Choose your favorite transuranic element"
      className={styles.listbox}
    />
  )
}
