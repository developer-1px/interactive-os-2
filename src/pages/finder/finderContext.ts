import { createDomainContext } from '@os/layout'
import type { NormalizedData } from '@os/store/types'
import type { SortKey, SortDir } from './finderSort'
import type { KindGroup } from './finderFilter'

export interface FinderContextValue {
  initialStore: NormalizedData
  listStore: NormalizedData | null
  sidebarData: NormalizedData
  viewMode: 'list' | 'columns'
  setViewMode: (mode: 'list' | 'columns') => void
  sortKey: SortKey | null
  sortDir: SortDir
  onSort: (key: SortKey) => void
  onSortDirToggle: () => void
  filters: string[]
  setFilters: (fn: (f: string[]) => string[]) => void
  kindFilters: KindGroup[]
  setKindFilters: (fn: (k: KindGroup[]) => KindGroup[]) => void
  previewPath: string | null
  onSidebarActivate: (nodeId: string) => void
  onSearchClick: () => void
  onChange: (store: NormalizedData) => void
}

export const [FinderProvider, useFinder] = createDomainContext<FinderContextValue>('Finder')
