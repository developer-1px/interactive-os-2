import { useMemo, useState, useCallback } from 'react'
import { ax } from '@styles/ax'
import { FlatLayout } from '@os/ui/FlatLayout'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { FOCUS_ID } from '@os/axis/navigate'
import type { NormalizedData } from '@os/store/types'
import { loadStories, storiesToNavStore } from './storiesStore'
import { storiesLayout } from './storiesLayout'
import { StoriesProvider, type StoriesContextValue } from './storiesContext'
import { StoriesSidebarWidget, StoriesPreviewWidget } from './storiesWidgets'

const entries = loadStories()
const initialListStore = storiesToNavStore(entries)
const initialSelected = entries[0]?.path ?? null

const storiesWidgets = createWidgetRegistry({
  StoriesSidebar: StoriesSidebarWidget,
  StoriesPreview: StoriesPreviewWidget,
})

export default function PageStories() {
  const [listStore, setListStore] = useState<NormalizedData>(initialListStore)
  const [selectedPath, setSelectedPath] = useState<string | null>(initialSelected)

  const onChange = useCallback((next: NormalizedData) => {
    const focusedId = (next.entities[FOCUS_ID]?.focusedId as string | undefined) ?? null
    setListStore(next)
    if (focusedId && next.entities[focusedId]) setSelectedPath(focusedId)
  }, [])

  const ctx = useMemo<StoriesContextValue>(() => ({
    entries,
    listStore,
    selectedPath,
    onChange,
  }), [listStore, selectedPath, onChange])

  return (
    <StoriesProvider value={ctx}>
      <div className={ax({ layout: 'row', flex: '1' })}>
        <FlatLayout data={storiesLayout} registry={storiesWidgets} aria-label="Stories viewer" />
      </div>
    </StoriesProvider>
  )
}
