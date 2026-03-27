// ② 2026-03-27-birdseye-view-prd.md
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Circle } from 'lucide-react'
import { useResizer } from '../../hooks/useResizer'
import '../../styles/resizer.css'
import { DEFAULT_ROOT, type FileNodeData } from '../viewer/types'
import { fetchTree } from '../viewer/fsClient'
import { treeToStore } from '../viewer/treeTransform'
import type { NormalizedData } from '../../interactive-os/store/types'
import { ROOT_ID } from '../../interactive-os/store/types'
import { getChildren, getEntityData } from '../../interactive-os/store/createStore'
import BirdseyeSidebar from './BirdseyeSidebar'
import BirdseyeBoard from './BirdseyeBoard'
import styles from './BirdseyeLayout.module.css'

import type { NavGroup } from './BirdseyeSidebar'

function buildNavGroups(store: NormalizedData): NavGroup[] {
  const rootChildren = getChildren(store, ROOT_ID)
  const groups: NavGroup[] = []

  for (const dirId of rootChildren) {
    const data = getEntityData<FileNodeData>(store, dirId)
    if (!data || data.type !== 'directory') continue

    const subDirs = getChildren(store, dirId)
      .filter(childId => {
        const cd = getEntityData<FileNodeData>(store, childId)
        return cd?.type === 'directory'
      })
      .map(childId => {
        const cd = getEntityData<FileNodeData>(store, childId)!
        return { id: childId, name: cd.name }
      })

    if (subDirs.length > 0) {
      groups.push({ groupId: dirId, groupName: data.name, items: subDirs })
    }
  }

  return groups
}

export default function BirdseyeLayout() {
  const navigate = useNavigate()
  const [store, setStore] = useState<NormalizedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)

  const sidebarResizer = useResizer({
    defaultSize: 200, minSize: 140, maxSize: 360, step: 10,
    storageKey: 'birdseye-sidebar-width',
  })

  useEffect(() => {
    fetchTree(DEFAULT_ROOT).then((tree) => {
      const s = treeToStore(tree)
      setStore(s)
      setLoading(false)
      const groups = buildNavGroups(s)
      const first = groups[0]?.items[0]
      if (first) setSelectedFolderId(first.id)
    })
  }, [])

  const navGroups = useMemo(() => store ? buildNavGroups(store) : [], [store])

  const handleSelectFolder = useCallback((folderId: string) => {
    setSelectedFolderId(folderId)
  }, [])

  const handleActivateFile = useCallback((filePath: string) => {
    const relative = filePath.startsWith(DEFAULT_ROOT + '/')
      ? filePath.slice(DEFAULT_ROOT.length + 1)
      : filePath
    navigate(`/viewer/${relative}`)
  }, [navigate])

  if (loading || !store) {
    return (
      <div className={styles['be-loading']}>
        <Circle size={12} className={styles['be-loading__spinner']} />
        <span>Loading project...</span>
      </div>
    )
  }

  const selectedName = selectedFolderId
    ? getEntityData<FileNodeData>(store, selectedFolderId)?.name ?? ''
    : ''

  return (
    <div className={styles.be}>
      <div className={styles['be-sidebar']} style={{ width: sidebarResizer.size }}>
        <div className={styles['be-sidebar__header']}>
          <span className={styles['be-sidebar__header-title']}>Birdseye</span>
        </div>
        <div className={styles['be-sidebar__body']}>
          <BirdseyeSidebar
            groups={navGroups}
            selectedId={selectedFolderId}
            onSelect={handleSelectFolder}
          />
        </div>
      </div>
      <div className="resizer-handle" aria-label="Resize sidebar" {...sidebarResizer.separatorProps} />
      <div className={styles['be-board']}>
        <div className={styles['be-board__header']}>
          <span className={styles['be-board__header-title']}>{selectedName}</span>
        </div>
        <BirdseyeBoard
          key={selectedFolderId}
          store={store}
          selectedFolderId={selectedFolderId}
          onActivateFile={handleActivateFile}
          onDrillDown={handleSelectFolder}
        />
      </div>
    </div>
  )
}
