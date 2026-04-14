// ② finder-viewer-prd.md
/** @catalog Finder 스타일 floating toolbar — viewmode 토글 + 검색 트리거 */
import React, { useMemo, useCallback } from 'react'
import { List, Columns3, Search } from 'lucide-react'

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
}

const iconFor: Record<string, React.ReactNode> = {
  'view-list': <List size={18} />,
  'view-columns': <Columns3 size={18} />,
  'search': <Search size={18} />,
}

export function FinderToolbar({ viewMode, onViewModeChange, onSearchClick }: FinderToolbarProps) {
  const data = useMemo(() => createStore({
    entities: {
      'view-list': { id: 'view-list', data: { name: 'List', icon: 'list' } },
      'view-columns': { id: 'view-columns', data: { name: 'Columns', icon: 'columns' } },
      'search': { id: 'search', data: { name: 'Search', icon: 'search' } },
    },
    relationships: { [ROOT_ID]: ['view-list', 'view-columns', 'search'] },
  }), [])

  const renderItem = useCallback((props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
    const id = item.id as string
    const isViewButton = id === 'view-list' || id === 'view-columns'
    const isSelected = isViewButton && (
      (id === 'view-list' && viewMode === 'list') ||
      (id === 'view-columns' && viewMode === 'columns')
    )
    const effectiveState: NodeState = isSelected
      ? { ...state, selected: true }
      : state
    return ToolbarItem(props, item, effectiveState, { icon: iconFor[id] })
  }, [viewMode])

  const handleActivate = useCallback((nodeId: string) => {
    if (nodeId === 'view-list') onViewModeChange('list')
    else if (nodeId === 'view-columns') onViewModeChange('columns')
    else if (nodeId === 'search') onSearchClick()
  }, [onViewModeChange, onSearchClick])

  return (
    <div className={`finder-toolbar ${ax({ placement: 'sticky', surface: 'display', padding: 'xs', border: 'bottom' })}`}>
      <Toolbar
        data={data}
        onActivate={handleActivate}
        renderItem={renderItem}
        aria-label="View controls"
      />
    </div>
  )
}
