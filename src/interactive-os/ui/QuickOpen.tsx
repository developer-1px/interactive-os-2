import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Fuse from 'fuse.js'
import { Search } from 'lucide-react'
import { useAria } from '../primitives/useAria'
import { createStore, getChildren } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import { createBatchCommand } from '../engine/types'
import { selectionCommands } from '../axis/select'
import { combobox } from '../pattern/roles/combobox'
import { combobox as comboboxPlugin, comboboxCommands } from '../plugins/combobox'
import { FileIcon } from './FileIcon'
import styles from './QuickOpen.module.css'

// --- Flatten file entities for search ---

interface FileEntry {
  id: string
  name: string
  path: string
  relativePath: string
}

function flattenFiles(store: NormalizedData, root: string): FileEntry[] {
  const files: FileEntry[] = []
  for (const entity of Object.values(store.entities)) {
    if (!entity.data) continue
    const data = entity.data as unknown as { name: string; type: string; path: string }
    if (data.type === 'file') {
      files.push({
        id: entity.id,
        name: data.name,
        path: data.path,
        relativePath: data.path.startsWith(root) ? data.path.slice(root.length + 1) : data.path,
      })
    }
  }
  return files
}

// --- Component ---

const MAX_RESULTS = 12

export function QuickOpen({
  fileStore,
  root,
  onSelect,
  onClose,
}: {
  fileStore: NormalizedData
  root: string
  onSelect: (filePath: string) => void
  onClose: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')

  const files = useMemo(() => flattenFiles(fileStore, root), [fileStore, root])
  const fuse = useMemo(() => new Fuse(files, {
    keys: ['name', 'relativePath'],
    threshold: 0.4,
  }), [files])

  const results = useMemo(() => {
    if (!query.trim()) return files.slice(0, MAX_RESULTS)
    return fuse.search(query).slice(0, MAX_RESULTS).map(r => r.item)
  }, [query, fuse, files])

  // Convert Fuse.js results to NormalizedData for the combobox pattern
  const comboboxData = useMemo(() => createStore({
    entities: Object.fromEntries(results.map(f => [f.id, { id: f.id, data: f as unknown as Record<string, unknown> }])),
    relationships: { [ROOT_ID]: results.map(f => f.id) },
  }), [results])

  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  const handleChange = useCallback((newStore: NormalizedData) => {
    // Detect close: __combobox__ isOpen went to false
    const isOpen = (newStore.entities['__combobox__']?.isOpen as boolean) ?? false
    if (!isOpen) {
      // Check if a selection was made
      const selectedIds = (newStore.entities['__selection__']?.selectedIds as string[]) ?? []
      if (selectedIds.length > 0) {
        const selectedEntity = newStore.entities[selectedIds[0]]
        if (selectedEntity?.data) {
          const fileData = selectedEntity.data as unknown as FileEntry
          onSelectRef.current(fileData.path)
        }
      }
      onCloseRef.current()
    }
  }, [])

  const aria = useAria({
    pattern: combobox(),
    data: comboboxData,
    plugins: [comboboxPlugin()],
    onChange: handleChange,
  })

  const store = aria.getStore()
  const isOpen = (store.entities['__combobox__']?.isOpen as boolean) ?? false
  const children = getChildren(store, ROOT_ID)

  // Auto-focus input and open combobox on mount
  useEffect(() => {
    inputRef.current?.focus()
    aria.dispatch(comboboxCommands.open())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }, [onClose])

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.dialog} aria-label="Quick Open">
        <div className={styles.inputRow}>
          <Search size={16} className={styles.inputIcon} />
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            placeholder="파일 검색..."
            value={query}
            onChange={(e) => { setQuery(e.target.value) }}
            aria-label="파일 검색"
            {...(aria.containerProps as React.InputHTMLAttributes<HTMLInputElement>)}
          />
          <kbd className={styles.shortcut}>ESC</kbd>
        </div>
        {isOpen && children.length > 0 ? (
          <div className={styles.results} onMouseDown={e => e.preventDefault()}>
            {children.map(childId => {
              const entity = store.entities[childId]
              if (!entity) return null
              const state = aria.getNodeState(childId)
              const props = aria.getNodeProps(childId)
              const fileData = entity.data as unknown as FileEntry
              return (
                <div
                  key={childId}
                  {...(props as React.HTMLAttributes<HTMLDivElement>)}
                  className={`${styles.item}${state.focused ? ` ${styles.itemFocused}` : ''}`}
                  onClick={() => {
                    aria.dispatch(createBatchCommand([
                      selectionCommands.select(childId),
                      comboboxCommands.close(),
                    ]))
                  }}
                >
                  <span className={styles.itemIcon}>
                    <FileIcon name={fileData.name} type="file" />
                  </span>
                  <span className={styles.itemText}>
                    <span className={styles.itemName}>{fileData.name}</span>
                    <span className={styles.itemPath}>{fileData.relativePath}</span>
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className={styles.empty}>일치하는 파일이 없습니다</div>
        )}
      </div>
    </div>
  )
}
