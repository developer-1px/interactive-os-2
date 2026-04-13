import { createContext, useContext } from 'react'
import type { NormalizedData } from '@os/store/types'
import type { SortKey, SortDir } from './viewerSort'

export interface ViewerContextValue {
  // data
  initialStore: NormalizedData
  listStore: NormalizedData | null
  sidebarData: NormalizedData
  // view mode
  viewMode: 'list' | 'columns'
  setViewMode: (mode: 'list' | 'columns') => void
  // sort & filter
  sortKey: SortKey | null
  sortDir: SortDir
  onSort: (key: SortKey) => void
  filters: string[]
  setFilters: (fn: (f: string[]) => string[]) => void
  // preview
  previewPath: string | null
  // sidebar
  onSidebarActivate: (nodeId: string) => void
  // toolbar
  onSearchClick: () => void
  // tree/miller onChange
  onChange: (store: NormalizedData) => void
}

const ViewerContext = createContext<ViewerContextValue | null>(null)

export const ViewerProvider = ViewerContext.Provider

export function useViewer(): ViewerContextValue {
  const ctx = useContext(ViewerContext)
  if (!ctx) throw new Error('useViewer must be used inside ViewerProvider')
  return ctx
}
