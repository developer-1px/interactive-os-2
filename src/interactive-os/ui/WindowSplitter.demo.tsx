/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { useState } from 'react'
import { WindowSplitter } from './WindowSplitter'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'window-splitter',
  category: 'ui',
  label: 'WindowSplitter',
}

const initialData: NormalizedData = createStore({
  entities: {
    splitter: { id: 'splitter', data: { label: 'Panel divider' }, state: { valueCurrent: 50 } },
  },
  relationships: { [ROOT_ID]: ['splitter'] },
})

export function Demo() {
  const [data, setData] = useState<NormalizedData>(initialData)

  return <WindowSplitter data={data} onChange={setData} min={10} max={90} step={5} aria-label="Panel splitter" />
}
