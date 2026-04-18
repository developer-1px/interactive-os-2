// ② finder-viewer-prd.md
/** @catalog Finder 스타일 toolbar — nav/view/search 3 floating glass cluster */
import React, { useMemo, useCallback } from 'react'
import { List, Columns3, Search, ChevronLeft, ChevronRight } from 'lucide-react'

import type { NodeState } from '../pattern/types'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import { Toolbar } from './Toolbar'
import { ToolbarItem } from './items'
import { ax } from '@styles/ax'
import './FinderToolbar.css'

interface FinderToolbarProps {
  viewMode: 'list' | 'columns'
  onViewModeChange: (mode: 'list' | 'columns') => void
  onSearchClick: () => void
  onBack?: () => void
  onForward?: () => void
  path?: string
}

const iconFor: Record<string, React.ReactNode> = {
  'nav-back': <ChevronLeft size={18} />,
  'nav-forward': <ChevronRight size={18} />,
  'view-list': <List size={18} />,
  'view-columns': <Columns3 size={18} />,
  'search': <Search size={18} />,
}

function buildCluster(ids: string[]) {
  return createStore({
    entities: Object.fromEntries(ids.map((id) => [id, { id, data: { name: id } }])),
    relationships: { [ROOT_ID]: ids },
  })
}

export function FinderToolbar({ viewMode, onViewModeChange, onSearchClick, onBack, onForward, path }: FinderToolbarProps) {
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

  const cluster = ax({ role: 'control-group', surface: 'ghost', layout: 'bar' })

  return (
    <div className={`finder-toolbar ${ax({ role: 'control-group', surface: 'ghost', layout: 'bar', cs: 'sm' })}`}>
      {(onBack || onForward) && (
        <div className={cluster}>
          <Toolbar data={navData} onActivate={handleNav} renderItem={renderItem} aria-label="Navigation" />
        </div>
      )}
      <div className={cluster}>
        <Toolbar data={viewData} onActivate={handleView} renderItem={renderItem} aria-label="View mode" />
      </div>
      {path && (
        <div className={ax({ textStyle: 'label', clamp: '1', flex: '1' })} title={path}>
          {path}
        </div>
      )}
      <div className={cluster}>
        <Toolbar data={searchData} onActivate={handleSearch} renderItem={renderItem} aria-label="Search" />
      </div>
    </div>
  )
}
