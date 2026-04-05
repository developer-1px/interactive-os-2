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
import { ax } from '@styles/ax'
import '@styles/ax.css'
import { FileIcon } from './FileIcon'
import './QuickOpen.css'

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
    <div className={`quick-open-backdrop ${ax({ surface: 'overlay', layout: 'row', placement: 'viewport', motion: 'fade-in' })}`} onClick={handleBackdropClick}>
      <div className={`quick-open-dialog overflow-hidden ${ax({ layout: 'column', shape: 'xl', border: 'default', motion: 'slide-in' })}`} aria-label="Quick Open">
        <div className={ax({ layout: 'bar', gap: 'md', padding: 'lg', border: 'bottom' })}>
          <Search size={16} className={`${ax({ text: 'muted', flex: 'none' })}`} />
          <input
            ref={inputRef}
            className={`quick-open-input border-none outline-none ${ax({ controlSize: 'md', padding: 'sm', content: 'text', flex: '1' })}`}
            type="text"
            placeholder="파일 검색..."
            value={query}
            onChange={(e) => { setQuery(e.target.value) }}
            aria-label="파일 검색"
            {...(aria.containerProps as React.InputHTMLAttributes<HTMLInputElement>)}
          />
          <kbd className={ax({ surface: 'base', textStyle: 'code', text: 'muted', flex: 'none', shape: 'sm', border: 'subtle', padding: 'xs', content: 'text' })}>ESC</kbd>
        </div>
        {isOpen && children.length > 0 ? (
          <div className={ax({ layout: 'scroll', flex: '1', padding: 'xs', content: 'text' })} onMouseDown={e => e.preventDefault()}>
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
                  className={`cursor-default ${ax({ surface: 'ghost', controlSize: 'md', padding: 'sm', content: 'text', layout: 'bar', gap: 'md', text: state.focused ? 'bright' : 'primary', shape: 'sm', state: state.focused ? 'focused' : undefined })}`}
                  onClick={() => {
                    aria.dispatch(createBatchCommand([
                      selectionCommands.select(childId),
                      comboboxCommands.close(),
                    ]))
                  }}
                >
                  <span className={ax({ flex: 'none' })}>
                    <FileIcon name={fileData.name} type="file" />
                  </span>
                  <span className={`quick-open-item-text ${ax({ layout: 'column', flex: '1' })}`}>
                    <span className={ax({ textStyle: 'body', clamp: '1', weight: 'medium' })}>{fileData.name}</span>
                    <span className={ax({ textStyle: 'caption', text: 'muted', clamp: '1' })}>{fileData.relativePath}</span>
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className={ax({ layout: 'center', text: 'muted', textStyle: 'body', padding: 'xl' })}>일치하는 파일이 없습니다</div>
        )}
      </div>
    </div>
  )
}
