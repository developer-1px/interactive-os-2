/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { useState } from 'react'
import { ax } from '@styles/ax'
import { Meter } from './Meter'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'meter',
  category: 'ui' as const,
  label: 'Meter',
}

function makeData(cpu: number, mem: number, disk: number): NormalizedData {
  return createStore({
    entities: {
      'm-1': { id: 'm-1', data: { label: 'CPU Usage', value: cpu, max: 100 } },
      'm-2': { id: 'm-2', data: { label: 'Memory', value: mem, max: 16 } },
      'm-3': { id: 'm-3', data: { label: 'Disk', value: disk, max: 500 } },
    },
    relationships: { [ROOT_ID]: ['m-1', 'm-2', 'm-3'] },
  })
}

export function Demo() {
  const [data, setData] = useState(() => makeData(65, 8, 120))

  return (
    <div className={ax({ layout: 'column', gap: 'md', width: 'md' })}>
      <Meter data={data} onChange={setData} aria-label="System meters" />
    </div>
  )
}
