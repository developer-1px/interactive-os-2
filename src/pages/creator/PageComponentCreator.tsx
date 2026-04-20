// ② flatlayout-resizable-split-prd.md
import { useMemo, useCallback } from 'react'
import { FlatLayout } from '@os/ui/FlatLayout'
import { defineLayout } from '@os/layout'
import type { NormalizedData } from '@os/store/types'
import { loadPersisted } from '@os/plugins/persist'
import { usePersistedState } from '@os/primitives/usePersistedState'
import { creatorWidgets } from './creatorWidgets'

const creatorLayout = defineLayout({
  entities: {
    root:     { data: { type: 'split', direction: 'horizontal', sizes: [0.15, 'flex', 0.35] }, children: ['sidebar', 'preview', 'source'] },
    sidebar:  { data: { type: 'widget', widget: 'CreatorSidebar' } },
    preview:  { data: { type: 'widget', widget: 'CreatorPreview' } },
    source:   { data: { type: 'widget', widget: 'CreatorSource' } },
  },
})

const STORAGE_KEY = 'creator:layout'

export default function PageComponentCreator() {
  const initialData = useMemo(
    () =>
      loadPersisted<NormalizedData>({
        key: STORAGE_KEY,
        version: 0,
        parse: (raw) => JSON.parse(raw) as NormalizedData,
      }) ?? creatorLayout,
    [],
  )

  const [, setPersistedLayout] = usePersistedState<NormalizedData | null>(
    STORAGE_KEY,
    null,
    { parse: (raw) => JSON.parse(raw) as NormalizedData, serialize: (v) => JSON.stringify(v) },
  )

  const handleChange = useCallback((data: NormalizedData) => {
    setPersistedLayout(data)
  }, [setPersistedLayout])

  return (
    <FlatLayout
      data={initialData}
      registry={creatorWidgets}
      onChange={handleChange}
      aria-label="Component creator"
    />
  )
}
