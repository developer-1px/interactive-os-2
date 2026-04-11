/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { useState } from 'react'
import { ax } from '@styles/ax'
import { ButtonToggle } from './ButtonToggle'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'button-toggle',
  category: 'ui' as const,
  label: 'ButtonToggle',
}

const initial: NormalizedData = createStore({
  entities: {
    mute: { id: 'mute', data: { label: 'Mute' } },
    bold: { id: 'bold', data: { label: 'Bold' } },
    italic: { id: 'italic', data: { label: 'Italic' } },
    underline: { id: 'underline', data: { label: 'Underline' } },
  },
  relationships: {
    [ROOT_ID]: ['mute', 'bold', 'italic', 'underline'],
  },
})

export function Demo() {
  const [data, setData] = useState(initial)

  return (
    <div className={ax({ layout: 'row', gap: 'sm' })}>
      <ButtonToggle data={data} onChange={setData} aria-label="Formatting toggles" />
    </div>
  )
}
