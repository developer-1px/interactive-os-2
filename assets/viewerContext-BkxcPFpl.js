var e=`import { createDomainContext } from '@os/layout'
import type { NormalizedData } from '@os/store/types'
import type { SortKey, SortDir } from './viewerSort'

export interface ViewerContextValue {
  initialStore: NormalizedData
  listStore: NormalizedData | null
  sidebarData: NormalizedData
  viewMode: 'list' | 'columns'
  setViewMode: (mode: 'list' | 'columns') => void
  sortKey: SortKey | null
  sortDir: SortDir
  onSort: (key: SortKey) => void
  filters: string[]
  setFilters: (fn: (f: string[]) => string[]) => void
  previewPath: string | null
  onSidebarActivate: (nodeId: string) => void
  onSearchClick: () => void
  onChange: (store: NormalizedData) => void
}

export const [ViewerProvider, useViewer] = createDomainContext<ViewerContextValue>('Viewer')
`;export{e as default};