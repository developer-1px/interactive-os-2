// ② 2026-03-27-birdseye-view-prd.md
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { SplitPane } from '../../interactive-os/ui/SplitPane'
import type { PaneSize } from '../../interactive-os/ui/SplitPane'
import { TreeView } from '../../interactive-os/ui/TreeView'
import { Kanban } from '../../interactive-os/ui/Kanban'
import { CodeBlock } from '../../interactive-os/ui/CodeBlock'
import { QuickOpen } from '../../interactive-os/ui/QuickOpen'
import type { NormalizedData } from '../../interactive-os/store/types'
import { getEntityData } from '../../interactive-os/store/createStore'
import { DEFAULT_ROOT } from '../viewer/types'
import { fetchTree, fetchFile } from '../viewer/fsClient'
import { treeToStore } from '../viewer/treeTransform'
import { parse as parseYaml } from 'yaml'
import { buildNavStore, buildKanbanStore } from './birdseyeTransform'
import type { KanbanBuildOptions } from './birdseyeTransform'
import styles from './BirdseyeLayout.module.css'

function findFirstNavItem(navStore: NormalizedData): string | null {
  const rootChildren = navStore.relationships['__root__'] ?? []

  // src/ 폴더를 찾고, 그 안에서 interactive-os 또는 pages 우선
  const srcId = rootChildren.find((id) => {
    const data = getEntityData<{ label: string }>(navStore, id)
    return data?.label === 'src'
  })
  if (srcId) {
    const srcChildren = navStore.relationships[srcId] ?? []
    const preferred = srcChildren.find((id) => {
      const data = getEntityData<{ label: string }>(navStore, id)
      return data?.label === 'interactive-os' || data?.label === 'pages'
    })
    if (preferred) return preferred
    if (srcChildren.length > 0) return srcChildren[0]!
    return srcId
  }
  return null
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
  const [fsStore, setFsStore] = useState<NormalizedData | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [sizes, setSizes] = useState<PaneSize[]>([0.15, 'flex', 0.35])

  // Code viewer state
  const [focusedCardId, setFocusedCardId] = useState<string | null>(null)
  const [viewerCode, setViewerCode] = useState<string | null>(null)
  const [viewerFilename, setViewerFilename] = useState<string>('')
  const fetchRef = useRef(0)

  // Column order from _meta.yaml
  const [kanbanOptions, setKanbanOptions] = useState<KanbanBuildOptions>({})

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

  // 1. fs tree 로드
  useEffect(() => {
    fetchTree(DEFAULT_ROOT).then((tree) => {
      const store = treeToStore(tree)
      setFsStore(store)
      const nav = buildNavStore(store)
      const firstId = findFirstNavItem(nav)
      if (firstId) setSelectedFolderId(firstId)
    })
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

  // 3. Kanban store
  const kanbanStore = useMemo(
    () => (fsStore && selectedFolderId ? buildKanbanStore(fsStore, selectedFolderId, kanbanOptions) : null),
    [fsStore, selectedFolderId, kanbanOptions],
  )

  // 4. Debounced focus → fetch file content
  useEffect(() => {
    if (!debouncedCardId || !kanbanStore) {
      setViewerCode(null)
      setViewerFilename('')
      return
    }

    const cardData = getEntityData<{ sourceId: string; sourceType: string; title: string }>(kanbanStore, debouncedCardId)
    if (!cardData || cardData.sourceType !== 'file') {
      setViewerCode(null)
      setViewerFilename('')
      return
    }

    const token = ++fetchRef.current
    setViewerFilename(cardData.title)
    fetchFile(cardData.sourceId).then((content) => {
      if (fetchRef.current === token) setViewerCode(content)
    })
  }, [debouncedCardId, kanbanStore])

  // NavList 항목 선택
  const handleNavActivate = useCallback((nodeId: string) => {
    setSelectedFolderId(nodeId)
    setFocusedCardId(null)
    setViewerCode(null)
    setViewerFilename('')
  }, [])

  // Kanban 카드 활성화 (Enter/더블클릭)
  const handleKanbanActivate = useCallback(
    (cardId: string) => {
      if (!kanbanStore) return
      const cardData = getEntityData<{ sourceId: string; sourceType: string }>(kanbanStore, cardId)
      if (!cardData) return

      if (cardData.sourceType === 'directory') {
        setSelectedFolderId(cardData.sourceId)
      } else {
        const relative = cardData.sourceId.startsWith(DEFAULT_ROOT + '/')
          ? cardData.sourceId.slice(DEFAULT_ROOT.length + 1)
          : cardData.sourceId
        navigate(`/viewer/${relative}`)
      }
    },
    [kanbanStore, navigate],
  )

  // QuickOpen에서 파일 선택 → 코드뷰어에 표시
  const handleQuickOpenSelect = useCallback((filePath: string) => {
    const name = filePath.split('/').pop() ?? ''
    setViewerFilename(name)
    const token = ++fetchRef.current
    fetchFile(filePath).then((content) => {
      if (fetchRef.current === token) setViewerCode(content)
    })
  }, [])

  // Kanban 포커스 변경
  const handleFocusChange = useCallback((nodeId: string | null) => {
    setFocusedCardId(nodeId)
  }, [])

  // 선택된 폴더 이름
  const selectedName = useMemo(() => {
    if (!fsStore || !selectedFolderId) return ''
    const data = getEntityData<{ name: string }>(fsStore, selectedFolderId)
    return data?.name ?? ''
  }, [fsStore, selectedFolderId])

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
            initialFocus={selectedFolderId ?? undefined}
            aria-label="Folder navigation"
          />
        </div>
      </div>

      {/* 중: Kanban */}
      <div className={styles.board}>
        <div className={styles.boardHeader}>{selectedName}</div>
        {kanbanStore && (
          <div className={styles.boardBody}>
            <Kanban
              key={selectedFolderId}
              data={kanbanStore}
              onActivate={handleKanbanActivate}
              onFocusChange={handleFocusChange}
              compact
              aria-label={`${selectedName} contents`}
            />
          </div>
        )}
      </div>

      {/* 우: Code Viewer */}
      <div className={styles.viewer}>
        <div className={styles.viewerHeader}>{viewerFilename}</div>
        <div className={styles.viewerBody}>
          {viewerCode !== null ? (
            <CodeBlock code={viewerCode} filename={viewerFilename} variant="flush" />
          ) : (
            <div className={styles.viewerEmpty}>
              {focusedCardId ? '' : 'Navigate to a file to preview source'}
            </div>
          )}
        </div>
      </div>
    </SplitPane>

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
