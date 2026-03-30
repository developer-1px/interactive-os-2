// ② 2026-03-27-birdseye-view-prd.md
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SplitPane } from '../../interactive-os/ui/SplitPane'
import type { PaneSize } from '../../interactive-os/ui/SplitPane'
import { TreeView } from '../../interactive-os/ui/TreeView'
import { Kanban } from '../../interactive-os/ui/Kanban'
import { Treemap } from '../../interactive-os/ui/Treemap'
import { CodeBlock } from '../../interactive-os/ui/CodeBlock'
import { QuickOpen } from '../../interactive-os/ui/QuickOpen'
import type { NormalizedData } from '../../interactive-os/store/types'
import { getEntityData } from '../../interactive-os/store/createStore'
import { DEFAULT_ROOT } from '../viewer/types'
import { fetchTree, fetchFile, fetchDepCounts, fetchFolderDeps } from '../viewer/fsClient'
import type { DepCounts, FolderDeps } from '../viewer/fsClient'
import { treeToStore } from '../viewer/treeTransform'
import { parse as parseYaml } from 'yaml'
import { buildNavStore, buildKanbanStore } from './birdseyeTransform'
import type { KanbanBuildOptions } from './birdseyeTransform'
import styles from './BirdseyeLayout.module.css'

/** 파일 경로를 레이어(폴더)별로 그룹핑 */
function groupByLayer(paths: string[], root: string): { layer: string; files: { name: string; fullPath: string }[] }[] {
  const groups = new Map<string, { name: string; fullPath: string }[]>()
  for (const p of paths) {
    const rel = p.startsWith(root + '/') ? p.slice(root.length + 1) : p
    const parts = rel.split('/')
    const fileName = parts.pop() ?? rel
    const layer = parts.join('/') || '(root)'
    const list = groups.get(layer)
    const entry = { name: fileName, fullPath: p }
    if (list) list.push(entry)
    else groups.set(layer, [entry])
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([layer, files]) => ({ layer, files: files.sort((a, b) => a.name.localeCompare(b.name)) }))
}

/** Overlay를 anchor 요소의 중앙에 맞추되 viewport 밖으로 안 나가게 */
function calcOverlayPos(anchor: HTMLElement, overlay: HTMLElement, gap = 8): { top: number; left: number } {
  const rect = anchor.getBoundingClientRect()
  const overlayH = overlay.offsetHeight
  const overlayW = overlay.offsetWidth
  const cardCenter = rect.top + rect.height / 2
  const top = Math.min(Math.max(gap, cardCenter - overlayH / 2), window.innerHeight - overlayH - gap)
  const left = Math.min(rect.right + gap, window.innerWidth - overlayW - gap)
  return { top, left }
}

function findFirstNavItem(navStore: NormalizedData): string | null {
  const rootChildren = navStore.relationships['__root__'] ?? []
  return rootChildren[0] ?? null
}

/** Debounce hook — returns the value after it settles for `delay` ms */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export default function BirdseyeLayout() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [fsStore, setFsStore] = useState<NormalizedData | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [sizes, setSizes] = useState<PaneSize[]>([0.15, 'flex'])

  // Code viewer state
  const [focusedCardId, setFocusedCardId] = useState<string | null>(null)
  const [viewerCode, setViewerCode] = useState<string | null>(null)
  const [viewerFilename, setViewerFilename] = useState<string>('')
  const fetchRef = useRef(0)
  const [overlayPos, setOverlayPos] = useState<{ top: number; left: number } | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Dependency highlight — files that import/are imported by focused file
  const [depHighlight, setDepHighlight] = useState<{ importedBy: Set<string>; imports: Set<string> } | null>(null)

  // Raw dependency paths for viewer panel
  const [depList, setDepList] = useState<{ importedBy: string[]; imports: string[] } | null>(null)

  // Column order from _meta.yaml
  const [kanbanOptions, setKanbanOptions] = useState<KanbanBuildOptions>({})

  // Dependency counts (import/importedBy per file)
  const [depCounts, setDepCounts] = useState<DepCounts | null>(null)

  // Folder-level dependency edges (for topological column ordering)
  const [folderDeps, setFolderDeps] = useState<FolderDeps | null>(null)

  // Extension filter (null = show all)
  const [extFilter, setExtFilter] = useState<string | null>(null)

  // View mode toggle (kanban vs treemap)
  const [viewMode, setViewMode] = useState<'kanban' | 'treemap'>('kanban')
  const treemapContainerRef = useRef<HTMLDivElement>(null)
  const [treemapSize, setTreemapSize] = useState({ width: 800, height: 600 })

  // QuickOpen (Cmd+P)
  const [quickOpenVisible, setQuickOpenVisible] = useState(false)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault()
        setQuickOpenVisible(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Debounced focus — 250ms
  const debouncedCardId = useDebounce(focusedCardId, 250)

  // 1. fs tree + dep counts 로드
  useEffect(() => {
    Promise.all([fetchTree(DEFAULT_ROOT), fetchDepCounts(DEFAULT_ROOT)]).then(([tree, deps]) => {
      const store = treeToStore(tree)
      setFsStore(store)
      setDepCounts(deps)
      const folderFromUrl = searchParams.get('folder')
      const resolvedFolder = folderFromUrl && store.entities[`${DEFAULT_ROOT}/${folderFromUrl}`]
        ? `${DEFAULT_ROOT}/${folderFromUrl}`
        : null
      if (resolvedFolder) {
        setSelectedFolderId(resolvedFolder)
      } else {
        const nav = buildNavStore(store)
        const firstId = findFirstNavItem(nav)
        if (firstId) setSelectedFolderId(firstId)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 2. NavList store
  const navStore = useMemo(() => (fsStore ? buildNavStore(fsStore) : null), [fsStore])

  // 2.5. 폴더 안에 _meta.yaml이 있으면 order 사용, 없으면 알파벳순
  useEffect(() => {
    if (!selectedFolderId) return
    fetchFile(`${selectedFolderId}/_meta.yaml`)
      .then((raw) => {
        const meta = parseYaml(raw) as { order?: string[] }
        setKanbanOptions(Array.isArray(meta?.order) ? { columnOrder: meta.order } : {})
      })
      .catch(() => setKanbanOptions({}))
  }, [selectedFolderId])

  // 2.6. 폴더 간 의존 edge fetch (위상 정렬용)
  useEffect(() => {
    if (!selectedFolderId) return
    fetchFolderDeps(DEFAULT_ROOT, selectedFolderId)
      .then(setFolderDeps)
      .catch(() => setFolderDeps(null))
  }, [selectedFolderId])

  // 2.7. Treemap container size measurement
  useEffect(() => {
    const el = treemapContainerRef.current
    if (!el || viewMode !== 'treemap') return
    const ro = new ResizeObserver(([entry]) => {
      setTreemapSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [viewMode])

  // 3. Kanban store
  const kanbanStore = useMemo(
    () => (fsStore && selectedFolderId ? buildKanbanStore(fsStore, selectedFolderId, {
      ...kanbanOptions,
      depCounts: depCounts ?? undefined,
      extFilter: extFilter ?? undefined,
      folderEdges: kanbanOptions.columnOrder ? undefined : folderDeps?.edges,
    }) : null),
    [fsStore, selectedFolderId, kanbanOptions, depCounts, extFilter, folderDeps],
  )

  // 4. Debounced focus → fetch file content
  useEffect(() => {
    if (!debouncedCardId || !kanbanStore) {
      setViewerCode(null)
      setViewerFilename('')
      setDepHighlight(null)
      setDepList(null)
      setOverlayPos(null)
      return
    }

    const cardData = getEntityData<{ sourceId: string; sourceType: string; title: string }>(kanbanStore, debouncedCardId)

    // 포커스 카드의 DOM 위치 → overlay 위치 (카드 우측에 붙임)
    if (cardData) {
      const sourceId = cardData.sourceId
      requestAnimationFrame(() => {
        const cardEl = document.querySelector(`[data-source="${CSS.escape(sourceId)}"]`) as HTMLElement | null
        if (cardEl && overlayRef.current) {
          setOverlayPos(calcOverlayPos(cardEl, overlayRef.current))
        }
      })
    }
    if (!cardData || cardData.sourceType !== 'file') {
      setViewerCode(null)
      setViewerFilename('')
      return
    }

    // 카드가 속한 컬럼의 제목을 찾기
    const parentCol = Object.entries(kanbanStore.relationships).find(
      ([, children]) => children.includes(debouncedCardId),
    )
    const colTitle = parentCol
      ? (getEntityData<{ title: string }>(kanbanStore, parentCol[0])?.title ?? '')
      : ''
    const token = ++fetchRef.current
    setViewerFilename(colTitle ? `${colTitle} > ${cardData.title}` : cardData.title)
    fetchFile(cardData.sourceId).then((content) => {
      if (fetchRef.current === token) setViewerCode(content)
    })
    // Fetch dependency graph for highlight + list
    fetch(`/api/fs/imports?path=${encodeURIComponent(cardData.sourceId)}&root=${encodeURIComponent(DEFAULT_ROOT)}`)
      .then((r) => r.json())
      .then((data: { imports: { path: string }[]; importedBy: { path: string }[] }) => {
        if (fetchRef.current === token) {
          setDepHighlight({
            importedBy: new Set(data.importedBy.map((d) => `card:${d.path}`)),
            imports: new Set(data.imports.map((d) => `card:${d.path}`)),
          })
          setDepList({
            importedBy: data.importedBy.map((d) => d.path),
            imports: data.imports.map((d) => d.path),
          })
        }
      })
      .catch(() => { setDepHighlight(null); setDepList(null) })
  }, [debouncedCardId, kanbanStore])

  // 폴더 선택 + URL 동기화
  const selectFolder = useCallback((nodeId: string) => {
    setSelectedFolderId(nodeId)
    setExtFilter(null)
    const relative = nodeId.startsWith(DEFAULT_ROOT + '/') ? nodeId.slice(DEFAULT_ROOT.length + 1) : nodeId
    setSearchParams({ folder: relative })
  }, [setSearchParams])

  // TreeView 항목 선택
  const handleNavActivate = useCallback((nodeId: string) => {
    selectFolder(nodeId)
    setFocusedCardId(null)
    setViewerCode(null)
    setViewerFilename('')
  }, [selectFolder])

  // Kanban 카드 활성화 (Enter/더블클릭)
  const handleKanbanActivate = useCallback(
    (cardId: string) => {
      if (!kanbanStore) return
      const cardData = getEntityData<{ sourceId: string; sourceType: string }>(kanbanStore, cardId)
      if (!cardData) return

      if (cardData.sourceType === 'directory') {
        selectFolder(cardData.sourceId)
      } else {
        const relative = cardData.sourceId.startsWith(DEFAULT_ROOT + '/')
          ? cardData.sourceId.slice(DEFAULT_ROOT.length + 1)
          : cardData.sourceId
        navigate(`/viewer/${relative}`)
      }
    },
    [kanbanStore, navigate, selectFolder],
  )

  // QuickOpen에서 파일 선택 → 해당 폴더 칸반으로 이동 + 카드 포커스
  const handleQuickOpenSelect = useCallback((filePath: string) => {
    // 파일의 부모 폴더를 찾아서 칸반 이동
    const parts = filePath.split('/')
    parts.pop() // 파일명 제거
    while (parts.length > 0) {
      const dirPath = parts.join('/')
      if (fsStore?.entities[dirPath]) {
        selectFolder(dirPath)
        // 폴더 전환 후 해당 카드에 포커스 (다음 렌더 사이클에서)
        requestAnimationFrame(() => {
          const cardEl = document.querySelector(`[data-source="${CSS.escape(filePath)}"]`) as HTMLElement | null
          if (cardEl) {
            cardEl.focus()
            cardEl.scrollIntoView({ block: 'nearest', inline: 'nearest' })
          }
        })
        return
      }
      parts.pop()
    }
    // fallback: 폴더를 못 찾으면 기존 동작 (코드만 표시)
    const name = filePath.split('/').pop() ?? ''
    setViewerFilename(name)
    const token = ++fetchRef.current
    fetchFile(filePath).then((content) => {
      if (fetchRef.current === token) setViewerCode(content)
    })
  }, [fsStore, selectFolder])

  // Kanban 포커스 변경 — col: 접두사면 컬럼 헤더이므로 카드 id 유지
  const handleFocusChange = useCallback((nodeId: string | null) => {
    if (nodeId?.startsWith('col:')) return
    setFocusedCardId(nodeId)
  }, [])

  // Dep walking — dep 항목 클릭 시 해당 파일로 kanban 점프
  const handleDepJump = useCallback((filePath: string) => {
    // 현재 kanban에 카드가 있으면 DOM에서 찾아 포커스
    const el = document.querySelector(`[data-source="${CSS.escape(filePath)}"]`) as HTMLElement | null
    if (el) {
      el.focus()
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      return
    }
    // 다른 폴더에 있으면 → 상위 폴더로 이동
    const parts = filePath.split('/')
    parts.pop()
    while (parts.length > 0) {
      const dirPath = parts.join('/')
      if (fsStore?.entities[dirPath]) {
        selectFolder(dirPath)
        return
      }
      parts.pop()
    }
  }, [fsStore, selectFolder])

  // 선택된 폴더 이름
  const selectedName = useMemo(() => {
    if (!fsStore || !selectedFolderId) return ''
    const data = getEntityData<{ name: string }>(fsStore, selectedFolderId)
    return data?.name ?? ''
  }, [fsStore, selectedFolderId])

  // Breadcrumb segments (path from DEFAULT_ROOT)
  const breadcrumbs = useMemo(() => {
    if (!selectedFolderId || !fsStore) return []
    const rel = selectedFolderId.startsWith(DEFAULT_ROOT + '/')
      ? selectedFolderId.slice(DEFAULT_ROOT.length + 1)
      : selectedFolderId
    const parts = rel.split('/')
    const segments: { label: string; id: string }[] = []
    let accumulated = DEFAULT_ROOT
    for (const part of parts) {
      accumulated = `${accumulated}/${part}`
      if (fsStore.entities[accumulated]) {
        segments.push({ label: part, id: accumulated })
      }
    }
    return segments
  }, [selectedFolderId, fsStore])

  if (!fsStore || !navStore) {
    return <div className={styles.loading}>Loading project...</div>
  }

  return (<>
    <SplitPane direction="horizontal" sizes={sizes} onResize={setSizes} minRatio={0.08}>
      {/* 좌: TreeView (폴더 전용) */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>Birdseye</div>
        <div className={styles.sidebarBody}>
          <TreeView
            data={navStore}
            onActivate={handleNavActivate}
            activateOnClick
            initialFocus={selectedFolderId ?? undefined}
            aria-label="Folder navigation"
          />
        </div>
      </div>

      {/* 중: Kanban */}
      <div className={styles.board}>
        <div className={styles.boardHeader}>
          <span className={styles.breadcrumb}>
            {breadcrumbs.map((seg, i) => (
              <span key={seg.id}>
                {i > 0 && <span className={styles.breadcrumbSep}>/</span>}
                {i < breadcrumbs.length - 1
                  ? <button className={styles.breadcrumbLink} onClick={() => selectFolder(seg.id)}>{seg.label}</button>
                  : <span>{seg.label}</span>
                }
              </span>
            ))}
          </span>
          <span className={styles.legend}>
            {['ts', 'tsx', 'css', 'md', 'yaml'].map((ext) => (
              <span
                key={ext}
                data-ext={ext}
                data-active={extFilter === ext || undefined}
                onClick={() => setExtFilter(extFilter === ext ? null : ext)}
              >.{ext}</span>
            ))}
            <span className={styles.legendHint} title="↑ = imported by N files, ↓ = imports N files">↑imported ↓imports</span>
            <span className={styles.legendHint} data-weight-legend="" title="300+ lines — complexity signal">300L+</span>
            <button
              className={styles.viewToggle}
              onClick={() => setViewMode(v => v === 'kanban' ? 'treemap' : 'kanban')}
              title={viewMode === 'kanban' ? 'Treemap view' : 'Kanban view'}
            >
              {viewMode === 'kanban' ? '\u25A6' : '\u2630'}
            </button>
          </span>
        </div>
        {kanbanStore && Object.keys(kanbanStore.relationships).length > 1 ? (
          viewMode === 'kanban' ? (
            <div className={styles.boardBody}>
              <Kanban
                key={selectedFolderId}
                data={kanbanStore}
                onActivate={handleKanbanActivate}
                onFocusChange={handleFocusChange}
                highlightUp={depHighlight?.importedBy}
                highlightDown={depHighlight?.imports}
                compact
                aria-label={`${selectedName} contents`}
              />
            </div>
          ) : (
            <div className={styles.boardBody} ref={treemapContainerRef}>
              <Treemap
                data={kanbanStore}
                width={treemapSize.width}
                height={treemapSize.height}
                onActivate={(cardId) => {
                  setViewMode('kanban')
                  setFocusedCardId(cardId)
                }}
                aria-label={`${selectedName} treemap`}
              />
            </div>
          )
        ) : (
          <div className={styles.viewerEmpty}>{extFilter ? `No .${extFilter} files in this folder` : 'No source files in this folder'}</div>
        )}
      </div>

    </SplitPane>

    {/* Floating overlay viewer */}
    {viewerCode !== null && (
      <div ref={overlayRef} className={styles.overlay} style={overlayPos ? { top: overlayPos.top, left: overlayPos.left, right: 'auto' } : undefined}>
        <div className={styles.overlayHeader}>{viewerFilename}</div>
        <div className={styles.overlayBody}>
          {depList && (depList.importedBy.length > 0 || depList.imports.length > 0) && (
            <div className={styles.depList}>
              {depList.importedBy.length > 0 && (
                <details>
                  <summary className={styles.depSummary}>
                    <span className={styles.depDot} data-dir="up" />
                    → Used by {depList.importedBy.length} files
                  </summary>
                  <div className={styles.depGroups}>
                    {groupByLayer(depList.importedBy, DEFAULT_ROOT).map(({ layer, files }) => (
                      <details key={layer} open={files.length <= 5} className={styles.depGroup}>
                        <summary className={styles.depGroupSummary}>{layer} <span className={styles.depGroupCount}>({files.length})</span></summary>
                        <ul className={styles.depFiles}>
                          {files.map((f) => <li key={f.fullPath}><button className={styles.depJump} onClick={() => handleDepJump(f.fullPath)}>{f.name}</button></li>)}
                        </ul>
                      </details>
                    ))}
                  </div>
                </details>
              )}
              {depList.imports.length > 0 && (
                <details>
                  <summary className={styles.depSummary}>
                    <span className={styles.depDot} data-dir="down" />
                    ← Depends on {depList.imports.length} files
                  </summary>
                  <div className={styles.depGroups}>
                    {groupByLayer(depList.imports, DEFAULT_ROOT).map(({ layer, files }) => (
                      <details key={layer} open={files.length <= 5} className={styles.depGroup}>
                        <summary className={styles.depGroupSummary}>{layer} <span className={styles.depGroupCount}>({files.length})</span></summary>
                        <ul className={styles.depFiles}>
                          {files.map((f) => <li key={f.fullPath}><button className={styles.depJump} onClick={() => handleDepJump(f.fullPath)}>{f.name}</button></li>)}
                        </ul>
                      </details>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
          <CodeBlock code={viewerCode} filename={viewerFilename} variant="flush" />
        </div>
      </div>
    )}

    {quickOpenVisible && fsStore && (
      <QuickOpen
        fileStore={fsStore}
        root={DEFAULT_ROOT}
        onSelect={handleQuickOpenSelect}
        onClose={() => setQuickOpenVisible(false)}
      />
    )}
  </>
  )
}
