// ② flatlayout-resizable-split-prd.md
import { useMemo, useCallback } from 'react'
import { FlatLayout } from '@os/ui/FlatLayout'
import { definePage } from '@os/layout'
import type { NormalizedData } from '@os/store/types'
import { creatorWidgets } from './creatorWidgets'

const creatorLayout = definePage({
  entities: {
    root:     { data: { type: 'split', direction: 'horizontal', sizes: [0.15, 'flex', 0.35] }, children: ['sidebar', 'preview', 'source'] },
    sidebar:  { data: { type: 'widget', widget: 'CreatorSidebar' } },
    preview:  { data: { type: 'widget', widget: 'CreatorPreview' } },
    source:   { data: { type: 'widget', widget: 'CreatorSource' } },
  },
})

const STORAGE_KEY = 'creator:layout'

function loadLayout(): NormalizedData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved) as NormalizedData
  } catch { /* fallback */ }
  return creatorLayout
}

export default function PageComponentCreator() {
  const initialData = useMemo(() => loadLayout(), [])

  const handleChange = useCallback((data: NormalizedData) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /* quota */ }
  }, [])

  return (
    <FlatLayout
      data={initialData}
      registry={creatorWidgets}
      onChange={handleChange}
      aria-label="Component creator"
    />
  )
}
