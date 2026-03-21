import { useState } from 'react'
import { ApgKeyboardTable } from './ApgKeyboardTable'
import { apgSlider } from './apg-data'
import { Slider } from '../interactive-os/ui/Slider'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData } from '../interactive-os/core/types'

const MIN = 0
const MAX = 100
const STEP = 1

const initialData = createStore({
  entities: {
    thumb: { id: 'thumb', data: { label: 'Volume' } },
  },
  relationships: {
    [ROOT_ID]: ['thumb'],
  },
})

export default function PageSlider() {
  const [data, setData] = useState<NormalizedData>(initialData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Slider</h2>
        <p className="page-desc">Continuous-value slider following W3C APG slider pattern (value axis)</p>
      </div>
      <div className="page-keys">
        <kbd>←</kbd><kbd>→</kbd> <span className="key-hint">±{STEP}</span>{' '}
        <kbd>↑</kbd><kbd>↓</kbd> <span className="key-hint">±{STEP}</span>{' '}
        <kbd>PgUp</kbd><kbd>PgDn</kbd> <span className="key-hint">±{STEP * 10}</span>{' '}
        <kbd>Home</kbd><kbd>End</kbd> <span className="key-hint">min / max</span>{' '}
        <span className="key-hint">track click</span>{' '}
        <kbd>Ctrl+Z</kbd> <span className="key-hint">undo</span>{' '}
        <kbd>Ctrl+Shift+Z</kbd> <span className="key-hint">redo</span>
      </div>
      <div className="card">
        <Slider
          data={data}
          min={MIN}
          max={MAX}
          step={STEP}
          onChange={setData}
        />
      </div>
      <ApgKeyboardTable {...apgSlider} />
    </div>
  )
}
