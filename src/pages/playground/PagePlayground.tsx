// /playground — definePage live preview 샌드박스.
// @useState-hatch — playground: code editor text and split sizes are local view state
import { useState, useMemo } from 'react'
import { FlatLayout } from '@os/ui/FlatLayout'
import { SplitPane } from '@os/ui/SplitPane'
import type { NormalizedData, PaneSize } from '@os/store/types'
import { definePage } from '@os/layout/flatLayout'
import { ax } from '@styles/ax'
import { playgroundWidgets } from './playgroundWidgets'
import { DEFAULT_CODE } from './playgroundDefaults'

interface ParseResult {
  store: NormalizedData | null
  error: string | null
}

function tryParse(code: string): ParseResult {
  try {
    const fn = new Function('return (' + code + ')')
    const config = fn() as Parameters<typeof definePage>[0]
    if (!config?.entities) {
      return { store: null, error: 'config.entities is required' }
    }
    return { store: definePage(config), error: null }
  } catch (e) {
    return { store: null, error: e instanceof Error ? e.message : String(e) }
  }
}

export default function PagePlayground() {
  const [code, setCode] = useState(DEFAULT_CODE)
  const [sizes, setSizes] = useState<PaneSize[]>([0.4, 'flex'])

  const { store, error } = useMemo(() => tryParse(code), [code])

  return (
    <div className={ax({ layout: 'stack', flex: '1' })}>
      {error && (
        <div className={ax({ role: 'badge', surface: 'display', tone: 'danger', textStyle: 'caption' })}>
          Error: {error}
        </div>
      )}
      <div className={ax({ flex: '1', layout: 'fill' })}>
        <SplitPane direction="horizontal" sizes={sizes} onResize={setSizes}>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={ax({ role: 'control', surface: 'input', content: 'text', flex: '1', width: 'full' })}
            spellCheck={false}
            aria-label="definePage config"
          />
          <div className={ax({ flex: '1', layout: 'fill' })}>
            {store && <FlatLayout data={store} registry={playgroundWidgets} aria-label="Preview" />}
          </div>
        </SplitPane>
      </div>
    </div>
  )
}
