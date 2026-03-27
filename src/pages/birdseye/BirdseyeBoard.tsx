// ② 2026-03-27-birdseye-view-prd.md
import { useMemo, useCallback, useState, useRef, useEffect } from 'react'
import { Folder } from 'lucide-react'
import { getChildren, getEntityData } from '../../interactive-os/store/createStore'
import type { NormalizedData } from '../../interactive-os/store/types'
import { FileIcon } from '../../interactive-os/ui/FileIcon'

import type { FileNodeData } from '../viewer/types'
import styles from './BirdseyeLayout.module.css'

interface BirdseyeBoardProps {
  store: NormalizedData
  selectedFolderId: string | null
  onActivateFile: (filePath: string) => void
  onDrillDown: (folderId: string) => void
}

interface ColumnData {
  id: string
  name: string
  items: { id: string; name: string; type: 'file' | 'directory' }[]
}

export default function BirdseyeBoard({ store, selectedFolderId, onActivateFile, onDrillDown }: BirdseyeBoardProps) {
  const [focusedCard, setFocusedCard] = useState<string | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  const columns = useMemo((): ColumnData[] => {
    if (!selectedFolderId) return []

    const childIds = getChildren(store, selectedFolderId)
    const dirs: ColumnData[] = []
    const rootFiles: { id: string; name: string; type: 'file' | 'directory' }[] = []

    for (const childId of childIds) {
      const data = getEntityData<FileNodeData>(store, childId)
      if (!data) continue

      if (data.type === 'directory') {
        const subChildren = getChildren(store, childId)
        const items = subChildren
          .map(subId => {
            const subData = getEntityData<FileNodeData>(store, subId)
            if (!subData) return null
            return { id: subId, name: subData.name, type: subData.type }
          })
          .filter((x): x is { id: string; name: string; type: 'file' | 'directory' } => x !== null)

        dirs.push({ id: childId, name: data.name, items })
      } else {
        rootFiles.push({ id: childId, name: data.name, type: data.type })
      }
    }

    if (rootFiles.length > 0) {
      dirs.push({ id: '__root_files__', name: '(files)', items: rootFiles })
    }

    if (dirs.length === 0) {
      return [{ id: '__empty__', name: '(empty)', items: [] }]
    }

    return dirs
  }, [store, selectedFolderId])

  const allCards = useMemo(() =>
    columns.flatMap(col => col.items.map(item => ({ ...item, colId: col.id }))),
    [columns],
  )

  const handleCardKeyDown = useCallback((e: React.KeyboardEvent, cardId: string) => {
    const idx = allCards.findIndex(c => c.id === cardId)
    if (idx === -1) return

    const currentColId = allCards[idx]!.colId

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      for (let i = idx + 1; i < allCards.length; i++) {
        if (allCards[i]!.colId === currentColId) {
          setFocusedCard(allCards[i]!.id)
          return
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      for (let i = idx - 1; i >= 0; i--) {
        if (allCards[i]!.colId === currentColId) {
          setFocusedCard(allCards[i]!.id)
          return
        }
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      const colIdx = columns.findIndex(c => c.id === currentColId)
      const nextCol = columns[colIdx + 1]
      if (nextCol && nextCol.items.length > 0) {
        setFocusedCard(nextCol.items[0]!.id)
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const colIdx = columns.findIndex(c => c.id === currentColId)
      const prevCol = columns[colIdx - 1]
      if (prevCol && prevCol.items.length > 0) {
        setFocusedCard(prevCol.items[0]!.id)
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const card = allCards[idx]!
      const data = getEntityData<FileNodeData>(store, card.id)
      if (data?.type === 'directory') {
        onDrillDown(card.id)
      } else {
        onActivateFile(card.id)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setFocusedCard(null)
      const treeEl = boardRef.current?.closest(`.${CSS.escape(styles.be)}`)?.querySelector('[role="tree"]') as HTMLElement
      treeEl?.focus()
    }
  }, [allCards, columns, store, onActivateFile, onDrillDown])

  useEffect(() => {
    if (!focusedCard || !boardRef.current) return
    const el = boardRef.current.querySelector(`[data-card-id="${CSS.escape(focusedCard)}"]`)
    if (el) (el as HTMLElement).scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [focusedCard])

  const handleBoardClick = useCallback(() => {
    if (!focusedCard && allCards.length > 0) {
      setFocusedCard(allCards[0]!.id)
    }
  }, [focusedCard, allCards])

  return (
    <div
      ref={boardRef}
      className={styles['be-board__canvas']}
      tabIndex={0}
      onClick={handleBoardClick}
      onKeyDown={(e) => {
        if (focusedCard) {
          handleCardKeyDown(e, focusedCard)
        } else if (allCards.length > 0 && (e.key === 'ArrowDown' || e.key === 'ArrowRight')) {
          e.preventDefault()
          setFocusedCard(allCards[0]!.id)
        }
      }}
    >
      {columns.map(col => (
        <div key={col.id} className={styles['be-column']}>
          <div className={styles['be-column__header']}>
            <Folder size={12} />
            <span>{col.name}</span>
            <span className={styles['be-column__count']}>{col.items.length}</span>
          </div>
          <div className={styles['be-column__body']}>
            {col.items.map(item => (
              <div
                key={item.id}
                data-card-id={item.id}
                data-focused={focusedCard === item.id ? 'true' : undefined}
                className={`${styles['be-card']}${item.type === 'directory' ? ` ${styles['be-card--dir']}` : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setFocusedCard(item.id)
                }}
                onDoubleClick={() => {
                  if (item.type === 'directory') onDrillDown(item.id)
                  else onActivateFile(item.id)
                }}
              >
                {item.type === 'directory'
                  ? <Folder size={12} style={{ color: 'var(--file-folder)', flexShrink: 0 }} />
                  : <FileIcon name={item.name} type="file" />
                }
                <span className={styles['be-card__name']}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
