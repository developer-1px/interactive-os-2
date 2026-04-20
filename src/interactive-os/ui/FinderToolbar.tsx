/** @catalog Finder 스타일 toolbar — nav/view/sort/filter/search 클러스터 */
import React, { useMemo, useCallback } from 'react'
import { List, Columns3, Search, ChevronLeft, ChevronRight } from 'lucide-react'

import type { NodeState } from '../pattern/types'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import { Toolbar } from './Toolbar'
import { ToolbarItem } from './items'
import { SortIndicator } from './indicators/SortIndicator'
import { ax } from '@styles/ax'
import './FinderToolbar.css'

type SortKey = 'name' | 'kind' | 'date' | 'loc'
type SortDir = 'asc' | 'desc'
type KindGroup = 'code' | 'doc' | 'media' | 'config'

interface FinderToolbarProps {
  viewMode: 'list' | 'columns'
  onViewModeChange: (mode: 'list' | 'columns') => void
  onSearchClick: () => void
  onBack?: () => void
  onForward?: () => void
  path?: string
  sortKey?: SortKey | null
  sortDir?: SortDir
  onSortChange?: (key: SortKey) => void
  onSortDirToggle?: () => void
  kindFilters?: KindGroup[]
  onKindFilterToggle?: (kind: KindGroup) => void
}

const iconFor: Record<string, React.ReactNode> = {
  'nav-back': <ChevronLeft size={18} />,
  'nav-forward': <ChevronRight size={18} />,
  'view-list': <List size={18} />,
  'view-columns': <Columns3 size={18} />,
  'search': <Search size={18} />,
}

const SORT_LABELS: Record<SortKey, string> = {
  name: '이름',
  kind: '종류',
  date: '날짜',
  loc: 'LOC',
}

const KIND_LABELS: Record<KindGroup, string> = {
  code: 'Code',
  doc: 'Doc',
  media: 'Media',
  config: 'Config',
}

const SORT_KEYS: SortKey[] = ['name', 'kind', 'date', 'loc']
const KIND_KEYS: KindGroup[] = ['code', 'doc', 'media', 'config']

function buildCluster(ids: string[]) {
  return createStore({
    entities: Object.fromEntries(ids.map((id) => [id, { id, data: { name: id } }])),
    relationships: { [ROOT_ID]: ids },
  })
}

export function FinderToolbar({
  viewMode,
  onViewModeChange,
  onSearchClick,
  onBack,
  onForward,
  path,
  sortKey,
  sortDir,
  onSortChange,
  onSortDirToggle,
  kindFilters,
  onKindFilterToggle,
}: FinderToolbarProps) {
  const navData = useMemo(() => buildCluster(['nav-back', 'nav-forward']), [])
  const viewData = useMemo(() => buildCluster(['view-list', 'view-columns']), [])
  const searchData = useMemo(() => buildCluster(['search']), [])

  const renderItem = useCallback((props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
    const id = item.id as string
    const isSelected = (id === 'view-list' && viewMode === 'list') || (id === 'view-columns' && viewMode === 'columns')
    const effectiveState: NodeState = isSelected ? { ...state, selected: true } : state
    return ToolbarItem(props, item, effectiveState, { icon: iconFor[id] })
  }, [viewMode])

  const handleNav = useCallback((nodeId: string) => {
    if (nodeId === 'nav-back') onBack?.()
    else if (nodeId === 'nav-forward') onForward?.()
  }, [onBack, onForward])

  const handleView = useCallback((nodeId: string) => {
    if (nodeId === 'view-list') onViewModeChange('list')
    else if (nodeId === 'view-columns') onViewModeChange('columns')
  }, [onViewModeChange])

  const handleSearch = useCallback(() => onSearchClick(), [onSearchClick])

  const showSort = onSortChange != null
  const showKindFilter = onKindFilterToggle != null && kindFilters != null

  return (
    <div className={`finder-toolbar ${ax({ role: 'control-group', surface: 'base', layout: 'bar' })}`}>
      {(onBack || onForward) && (
        <div className={ax({ role: 'control-group', surface: 'overlay', layout: 'bar', pd: 'sm' })}>
          <Toolbar data={navData} onActivate={handleNav} renderItem={renderItem} aria-label="Navigation" />
        </div>
      )}
      <div className={ax({ role: 'control-group', surface: 'overlay', layout: 'bar', pd: 'sm' })}>
        <Toolbar data={viewData} onActivate={handleView} renderItem={renderItem} aria-label="View mode" />
      </div>
      {showSort && (
        <div className={ax({ role: 'control-group', surface: 'overlay', layout: 'bar', pd: 'sm' })} role="group" aria-label="Sort">
          {SORT_KEYS.map((key) => {
            const isActive = sortKey === key
            return (
              <button
                key={key}
                type="button"
                aria-pressed={isActive}
                onClick={() => onSortChange?.(key)}
                className={ax({ role: 'control', surface: isActive ? 'action' : 'ghost', interactive: 'button', content: 'text' })}
              >
                {SORT_LABELS[key]}
                {isActive && <SortIndicator direction={sortDir === 'desc' ? 'descending' : 'ascending'} />}
              </button>
            )
          })}
          {sortKey && onSortDirToggle && (
            <button
              type="button"
              onClick={onSortDirToggle}
              aria-label={`Toggle sort direction (current: ${sortDir})`}
              className={ax({ role: 'control', surface: 'ghost', interactive: 'button', content: 'icon' })}
            >
              <SortIndicator direction={sortDir === 'desc' ? 'descending' : 'ascending'} />
            </button>
          )}
        </div>
      )}
      {showKindFilter && (
        <div className={ax({ role: 'control-group', surface: 'overlay', layout: 'bar', pd: 'sm' })} role="group" aria-label="Filter by kind">
          {KIND_KEYS.map((kind) => {
            const isActive = kindFilters!.includes(kind)
            return (
              <button
                key={kind}
                type="button"
                aria-pressed={isActive}
                onClick={() => onKindFilterToggle(kind)}
                className={ax({ role: 'control', surface: isActive ? 'action' : 'ghost', interactive: 'button', content: 'text' })}
              >
                {KIND_LABELS[kind]}
              </button>
            )
          })}
        </div>
      )}
      {path && (
        <div className={ax({ textStyle: 'label', clamp: '1', flex: '1' })} title={path}>
          {path}
        </div>
      )}
      <div className={ax({ role: 'control-group', surface: 'overlay', layout: 'bar', pd: 'sm' })}>
        <Toolbar data={searchData} onActivate={handleSearch} renderItem={renderItem} aria-label="Search" />
      </div>
    </div>
  )
}
