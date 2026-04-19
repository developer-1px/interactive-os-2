import { useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { MillerColumns } from '@os/ui/MillerColumns'
import { NavList } from '@os/ui/NavList'
import { FinderToolbar } from '@os/ui/FinderToolbar'
import { EmptyState } from '@os/ui/EmptyState'
import { ax } from '@styles/ax'
import { FileTreeGrid } from '@entities/file/ui/FileTreeGrid'
import { useFinder } from './finderContext'
import { FilePanel } from './widgets/FilePanel'
import type { SortKey } from './finderSort'
import type { KindGroup } from './finderFilter'

// ── Sidebar ──

export function FinderSidebarWidget() {
  const { sidebarData, onSidebarActivate } = useFinder()
  // 사이드바 전체가 하나의 island — control-group.raised preset이 shape:island + padding + gap 자동 주입
  return (
    <div className={ax({ role: 'control-group', surface: 'raised', layout: 'stack', flex: '1' })}>
      <NavList data={sidebarData} onActivate={onSidebarActivate} aria-label="Sidebar" />
    </div>
  )
}

// ── Toolbar ──

export function FinderToolbarWidget() {
  const { viewMode, setViewMode, onSearchClick, sortKey, sortDir, onSort, onSortDirToggle, kindFilters, setKindFilters } = useFinder()
  const { pathname } = useLocation()
  const handleBack = useCallback(() => window.history.back(), [])
  const handleForward = useCallback(() => window.history.forward(), [])
  const path = pathname.replace(/^\/finder\/?/, '') || '/'
  const handleKindToggle = useCallback((kind: KindGroup) => {
    setKindFilters(prev => prev.includes(kind) ? prev.filter(k => k !== kind) : [...prev, kind])
  }, [setKindFilters])
  return (
    <FinderToolbar
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      onSearchClick={onSearchClick}
      onBack={handleBack}
      onForward={handleForward}
      path={path}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k: SortKey) => onSort(k)}
      onSortDirToggle={onSortDirToggle}
      kindFilters={kindFilters}
      onKindFilterToggle={handleKindToggle}
    />
  )
}

// ── TreeGrid content (list mode) ──

export function FinderTreeGridWidget() {
  const { listStore, onChange, filters, kindFilters, sortKey, sortDir, onSort } = useFinder()

  if (!listStore || Object.keys(listStore.entities).filter(k => !k.startsWith('__')).length === 0) {
    if (filters.length > 0 || kindFilters.length > 0) {
      return <EmptyState title="No files match filter" description="Try removing some filters" />
    }
    return null
  }

  // outer FlatLayout node가 scroll:'y'로 scroll container를 소유 — widget은 overflow 관여 안 함.
  // .ly-fill은 overflow:hidden이어서 외부 scroll 체인을 끊으므로 .ly-stack 사용.
  // FileTreeGrid column: name/type/loc. Finder SortKey 'kind'→'type', 'date'→undefined (grid 컬럼 없음, 외부 sortStore가 처리).
  const gridSortKey = sortKey === 'kind' ? 'type' : sortKey === 'date' ? undefined : sortKey ?? undefined
  return (
    <div className={ax({ layout: 'stack', flex: '1' })}>
      <FileTreeGrid
        data={listStore}
        onChange={onChange}
        sortKey={gridSortKey}
        sortDir={sortDir}
        onSort={(k) => onSort((k === 'type' ? 'kind' : k) as SortKey)}
      />
    </div>
  )
}

// ── Preview panel (list mode) ──

export function FinderPreviewWidget() {
  const { previewPath } = useFinder()
  if (!previewPath) return null
  return <FilePanel path={previewPath} />
}

// ── MillerColumns content (columns mode) ──

export function FinderMillerWidget() {
  const { listStore, onChange } = useFinder()

  // knowledge 가상 폴더에서 nodeId는 `${groupId}::${absPath}` 형태이므로
  // entity.data.path 를 우선 사용. 일반 파일 트리는 id === path.
  const handleRenderPreview = useCallback((nodeId: string) => {
    const entity = listStore?.entities[nodeId]
    const actualPath = ((entity?.data as { path?: string } | undefined)?.path) ?? nodeId
    return <FilePanel path={actualPath} />
  }, [listStore])

  if (!listStore) return null

  return (
    <MillerColumns
      data={listStore}
      onChange={onChange}
      renderPreview={handleRenderPreview}
      aria-label="File browser"
    />
  )
}
