import { useState } from 'react'
import { ApgKeyboardTable } from './ApgKeyboardTable'
import { apgSpinbutton } from './apg-data'
import { Spinbutton } from '../interactive-os/ui/Spinbutton'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData } from '../interactive-os/core/types'

const MIN = 0
const MAX = 100
const STEP = 1

const initialData = createStore({
  entities: {
    count: { id: 'count', data: { label: 'Count' } },
  },
  relationships: {
    [ROOT_ID]: ['count'],
  },
})

export default function PageSpinbutton() {
  const [data, setData] = useState<NormalizedData>(initialData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Spinbutton</h2>
        <p className="page-desc">Continuous-value spinbutton following W3C APG spinbutton pattern (value axis)</p>
      </div>
      <div className="page-keys">
        <kbd>↑</kbd><kbd>↓</kbd> <span className="key-hint">±{STEP}</span>{' '}
        <kbd>PgUp</kbd><kbd>PgDn</kbd> <span className="key-hint">±{STEP * 10}</span>{' '}
        <kbd>Home</kbd><kbd>End</kbd> <span className="key-hint">min / max</span>
      </div>
      <div className="card">
        <Spinbutton
          data={data}
          min={MIN}
          max={MAX}
          step={STEP}
          onChange={setData}
        />
      </div>
      <ApgKeyboardTable {...apgSpinbutton} />
    </div>
  )
}
