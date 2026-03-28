// ② 2026-03-27-birdseye-view-prd.md
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { SplitPane } from '../../interactive-os/ui/SplitPane'
import { NavList } from '../../interactive-os/ui/NavList'
import { Kanban } from '../../interactive-os/ui/Kanban'
import type { NormalizedData } from '../../interactive-os/store/types'
import { getEntityData } from '../../interactive-os/store/createStore'
import { DEFAULT_ROOT } from '../viewer/types'
import { fetchTree } from '../viewer/fsClient'
import { treeToStore } from '../viewer/treeTransform'
import { buildNavStore, buildKanbanStore } from './birdseyeTransform'
import styles from './BirdseyeLayout.module.css'

function findFirstNavItem(navStore: NormalizedData): string | null {
  const rootChildren = navStore.relationships['__root__'] ?? []

  // src/ 그룹을 우선 선택 (개발 조감도의 주 대상)
  const srcGroup = rootChildren.find((id) => {
    const data = getEntityData<{ label: string }>(navStore, id)
    return data?.label === 'src'
  })
  if (srcGroup) {
    const srcChildren = navStore.relationships[srcGroup] ?? []
    if (srcChildren.length > 0) return srcChildren[0]!
  }

  // fallback: 첫 번째 비어있지 않은 그룹
  for (const groupId of rootChildren) {
    const groupChildren = navStore.relationships[groupId] ?? []
    if (groupChildren.length > 0) return groupChildren[0]!
  }
  return null
}

export default function BirdseyeLayout() {
  const navigate = useNavigate()
  const [fsStore, setFsStore] = useState<NormalizedData | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [sizes, setSizes] = useState([0.18, 0.82])

  // 1. fs tree 로드
  useEffect(() => {
    fetchTree(DEFAULT_ROOT).then((tree) => {
      const store = treeToStore(tree)
      setFsStore(store)
      // 초기 선택: 첫 번째 NavList 항목
      const nav = buildNavStore(store)
      const firstId = findFirstNavItem(nav)
      if (firstId) setSelectedFolderId(firstId)
    })
  }, [])

  // 2. NavList store (memo)
  const navStore = useMemo(() => (fsStore ? buildNavStore(fsStore) : null), [fsStore])

  // 3. Kanban store (선택 폴더 기준, memo)
  const kanbanStore = useMemo(
    () => (fsStore && selectedFolderId ? buildKanbanStore(fsStore, selectedFolderId) : null),
    [fsStore, selectedFolderId],
  )

  // NavList 항목 선택 → 폴더 변경
  const handleNavActivate = useCallback((nodeId: string) => {
    setSelectedFolderId(nodeId)
  }, [])

  // Kanban 카드 활성화
  const handleKanbanActivate = useCallback(
    (cardId: string) => {
      if (!kanbanStore) return
      const cardData = getEntityData<{ sourceId: string; sourceType: string }>(kanbanStore, cardId)
      if (!cardData) return

      if (cardData.sourceType === 'directory') {
        setSelectedFolderId(cardData.sourceId) // drill-down
      } else {
        const relative = cardData.sourceId.startsWith(DEFAULT_ROOT + '/')
          ? cardData.sourceId.slice(DEFAULT_ROOT.length + 1)
          : cardData.sourceId
        navigate(`/viewer/${relative}`) // 파일 → Viewer로
      }
    },
    [kanbanStore, navigate],
  )

  // 선택된 폴더 이름 (헤더용)
  const selectedName = useMemo(() => {
    if (!fsStore || !selectedFolderId) return ''
    const data = getEntityData<{ name: string }>(fsStore, selectedFolderId)
    return data?.name ?? ''
  }, [fsStore, selectedFolderId])

  if (!fsStore || !navStore) {
    return <div className={styles.loading}>Loading project...</div>
  }

  return (
    <SplitPane direction="horizontal" sizes={sizes} onResize={setSizes} minRatio={0.12}>
      {/* 좌: NavList */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>Birdseye</div>
        <div className={styles.sidebarBody}>
          <NavList
            data={navStore}
            onActivate={handleNavActivate}
            initialFocus={selectedFolderId ?? undefined}
            aria-label="Folder navigation"
          />
        </div>
      </div>

      {/* 우: Kanban */}
      <div className={styles.board}>
        <div className={styles.boardHeader}>{selectedName}</div>
        {kanbanStore && (
          <div className={styles.boardBody}>
            <Kanban
              key={selectedFolderId}
              data={kanbanStore}
              onActivate={handleKanbanActivate}
              aria-label={`${selectedName} contents`}
            />
          </div>
        )}
      </div>
    </SplitPane>
  )
}
