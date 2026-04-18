import { useCallback } from 'react'
import { TreeGrid } from '@os/ui/TreeGrid'
import { MillerColumns } from '@os/ui/MillerColumns'
import { Button } from '@os/ui/Button'
import { SortIndicator } from '@os/ui/indicators'
import { NavList } from '@os/ui/NavList'
import { FinderToolbar } from '@os/ui/FinderToolbar'
import { FileIcon } from '@os/ui/FileIcon'
import { EmptyState } from '@os/ui/EmptyState'
import { ax } from '@styles/ax'
import { useViewer } from './viewerContext'
import { FilePanel } from './widgets/FilePanel'
import type { SortKey } from './viewerSort'

// ── Sidebar ──

export function ViewerSidebarWidget() {
  const { sidebarData, onSidebarActivate } = useViewer()
  return (
    <div className={ax({ padding: 'xs' })}>
      <NavList data={sidebarData} onActivate={onSidebarActivate} aria-label="Sidebar" />
    </div>
  )
}

// ── Toolbar ──

export function ViewerToolbarWidget() {
  const { viewMode, setViewMode, onSearchClick } = useViewer()
  return (
    <FinderToolbar
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      onSearchClick={onSearchClick}
    />
  )
}

// ── Sort bar (list mode only) ──

export function ViewerSortBarWidget() {
  const { sortKey, sortDir, onSort, filters, setFilters } = useViewer()

  const sortDirection = (key: SortKey) =>
    sortKey === key ? (sortDir === 'asc' ? 'ascending' as const : 'descending' as const) : undefined

  // Action clusters as floating glass pills (lifted theme: frost + tint + rim).
  // Container row stays solid; the clusters are the "things you press" → glass.
  return (
    <div className={ax({ layout: 'bar' })}>
      <div className={ax({ role: 'control-group', surface: 'overlay', layout: 'bar' })}>
        <Button onClick={() => onSort('name')}>
          Name <SortIndicator direction={sortDirection('name')} />
        </Button>
        <Button onClick={() => onSort('type')}>
          Type <SortIndicator direction={sortDirection('type')} />
        </Button>
        <Button onClick={() => onSort('loc')}>
          LOC <SortIndicator direction={sortDirection('loc')} />
        </Button>
      </div>
      <div className={ax({ role: 'control-group', surface: 'overlay', layout: 'bar' })}>
        {['.tsx', '.ts', '.css', '.md'].map(ext => (
          <Button
            key={ext}
            variant={filters.includes(ext) ? 'dialog' : 'ghost'}
            onClick={() => setFilters(f => f.includes(ext) ? f.filter(e => e !== ext) : [...f, ext])}
          >
            {ext}
          </Button>
        ))}
      </div>
    </div>
  )
}

// ── TreeGrid content (list mode) ──

export function ViewerTreeGridWidget() {
  const { listStore, onChange, filters } = useViewer()

  if (!listStore || Object.keys(listStore.entities).filter(k => !k.startsWith('__')).length === 0) {
    if (filters.length > 0) {
      return <EmptyState title="No files match filter" description="Try removing some filters" />
    }
    return null
  }

  return (
    <div className={ax({ layout: 'fill', flex: '1' })}>
      <TreeGrid
        data={listStore}
        onChange={onChange}
        itemSlots={{
          icon: (node, state) => {
            const d = node.data as Record<string, unknown>
            return <FileIcon name={d.name as string} type={d.type as string} expanded={state.expanded} />
          },
          rightContent: (node) => {
            const d = node.data as Record<string, unknown>
            if (d.type === 'directory') return null
            const name = (d.name as string) ?? ''
            const ext = name.includes('.') ? name.split('.').pop() ?? '' : ''
            const loc = d.loc as number | undefined
            return (
              <span className={ax({ layout: 'bar', gap: 'sm', text: 'muted', textStyle: 'caption' })}>
                <span>{ext}</span>
                {loc != null && <span>{loc}</span>}
              </span>
            )
          },
        }}
        aria-label="File browser"
      />
    </div>
  )
}

// ── Preview panel (list mode) ──

export function ViewerPreviewWidget() {
  const { previewPath } = useViewer()
  if (!previewPath) return null
  return <FilePanel path={previewPath} />
}

// ── MillerColumns content (columns mode) ──

export function ViewerMillerWidget() {
  const { initialStore, onChange } = useViewer()

  const handleRenderPreview = useCallback((nodeId: string) => <FilePanel path={nodeId} />, [])

  return (
    <MillerColumns
      data={initialStore}
      onChange={onChange}
      renderPreview={handleRenderPreview}
      aria-label="File browser"
    />
  )
}
