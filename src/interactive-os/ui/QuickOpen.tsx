/** @catalog 검색+액션 실행 팔레트 */
import { useState, useEffect, useCallback, useRef, useMemo, type Ref } from 'react'
import Fuse from 'fuse.js'
import { Search } from 'lucide-react'
import { useAria } from '../primitives/useAria'
import { createStore, getChildren } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import { createBatchCommand } from '../engine/types'
import { selectionCommands } from '../axis/select'
import { focusCommands } from '../core'
import { combobox } from '../pattern/roles/combobox'
import { combobox as comboboxPlugin, comboboxCommands } from '../plugins/combobox'
import { getNodeLabel } from './types'
import { ax } from '@styles/ax'
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

function isGroup(entity: Record<string, unknown>): boolean {
  return (entity.data as Record<string, unknown>)?.type === 'group'
}

function getLabel(entity: Record<string, unknown>): string {
  return (entity.data as Record<string, unknown>)?.label as string
    ?? (entity.data as Record<string, unknown>)?.name as string
    ?? entity.id as string
}

// --- Component ---

const MAX_RESULTS = 12

/** File-based mode: searches fileStore with Fuse.js */
interface FileMode {
  fileStore: NormalizedData
  root: string
  onSelect: (filePath: string) => void
  onClose: () => void
  /** localStorage key for persisting the last-typed query across mounts. */
  persistKey?: string
}

/** Managed mode: parent provides data + handles search */
interface ManagedMode {
  data: NormalizedData
  query: string
  onQueryChange: (query: string) => void
  onActivate: (nodeId: string) => void
  onClose: () => void
  placeholder?: string
  'aria-label'?: string
  renderItem?: (label: string, data: Record<string, unknown>) => React.ReactNode
  dialog?: boolean
}

type QuickOpenProps = FileMode | ManagedMode

function isManagedMode(props: QuickOpenProps): props is ManagedMode {
  return 'data' in props && 'onActivate' in props
}

export function QuickOpen(props: QuickOpenProps) {
  if (isManagedMode(props)) return <QuickOpenManaged {...props} />
  return <QuickOpenFile {...props} />
}

// --- Managed mode: parent provides NormalizedData ---

function QuickOpenManaged({
  data,
  query,
  onQueryChange,
  onActivate,
  onClose,
  placeholder = 'Search...',
  'aria-label': ariaLabel = 'Quick Open',
  renderItem,
  dialog = true,
}: ManagedMode) {
  const inputRef = useRef<HTMLInputElement>(null)

  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const onActivateRef = useRef(onActivate)
  onActivateRef.current = onActivate

  const handleChange = useCallback((newStore: NormalizedData) => {
    const isOpen = (newStore.entities['__combobox__']?.isOpen as boolean) ?? false
    if (!isOpen) {
      const selectedIds = (newStore.entities['__selection__']?.selectedIds as string[]) ?? []
      if (selectedIds.length > 0) {
        onActivateRef.current(selectedIds[0])
      }
      onCloseRef.current()
    }
  }, [])

  const aria = useAria({
    pattern: combobox(),
    data,
    plugins: [comboboxPlugin()],
    onChange: handleChange,
  })

  const store = aria.getStore()
  const isOpen = (store.entities['__combobox__']?.isOpen as boolean) ?? false
  const focusedId = (store.entities['__focus__']?.focusedId as string) ?? ''
  const rootChildren = getChildren(store, ROOT_ID)
  const listboxId = useMemo(() => `quickopen-listbox-${Math.random().toString(36).slice(2, 8)}`, [])

  useEffect(() => {
    inputRef.current?.focus()
    aria.dispatch(comboboxCommands.open())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Scroll focused option into view — activedescendant pattern needs manual scroll.
  // Compute scroll directly against the listbox scroll container so wrapping
  // group <div>s (offsetParent chains) don't defeat scrollIntoView.
  useEffect(() => {
    if (!focusedId) return
    const listbox = document.getElementById(listboxId)
    if (!listbox) return
    const el = listbox.querySelector<HTMLElement>(`[data-node-id="${CSS.escape(focusedId)}"]`)
    if (!el) return
    const lr = listbox.getBoundingClientRect()
    const er = el.getBoundingClientRect()
    if (er.top < lr.top) {
      listbox.scrollTop += er.top - lr.top
    } else if (er.bottom > lr.bottom) {
      listbox.scrollTop += er.bottom - lr.bottom
    }
  }, [focusedId, listboxId])

  // Keep focus on the first option whenever results change and nothing is focused
  // (or the current focus fell out of the result set). Without this, ArrowUp from
  // an empty focus is a noop because focusPrev(empty) === empty.
  useEffect(() => {
    if (!isOpen) return
    const firstId = rootChildren.find(id => {
      const entity = store.entities[id]
      return entity && !isGroup(entity)
    }) ?? rootChildren[0]
    if (!firstId) return
    if (!focusedId || !store.entities[focusedId]) {
      aria.dispatch(focusCommands.setFocus(firstId))
    }
  }, [isOpen, focusedId, rootChildren, store, aria])

  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (dialog) dialogRef.current?.showModal?.()
  }, [dialog])

  useEffect(() => {
    if (!dialog) return
    const el = dialogRef.current
    if (!el) return
    const handleClose = () => onClose()
    el.addEventListener('close', handleClose)
    return () => el.removeEventListener('close', handleClose)
  }, [onClose, dialog])

  const hasGroups = rootChildren.some(id => {
    const entity = store.entities[id]
    return entity && isGroup(entity)
  })

  const renderItems = (ids: string[]) =>
    ids.map(childId => {
      const entity = store.entities[childId]
      if (!entity) return null
      const state = aria.getNodeState(childId)
      const nodeProps = aria.getNodeProps(childId)
      const label = getNodeLabel(entity)
      return (
        <div
          key={childId}
          id={childId}
          {...(nodeProps as React.HTMLAttributes<HTMLDivElement>)}
          className={`cursor-default ${ax({ interactive: 'item', role: 'item', content: 'text', layout: 'row', width: 'full' })}`}
          data-focused={state.focused || undefined}
          data-selected={state.selected || undefined}
          onClick={() => {
            aria.dispatch(createBatchCommand([
              selectionCommands.select(childId),
              comboboxCommands.close(),
            ]))
          }}
        >
          {renderItem ? renderItem(label, entity.data as Record<string, unknown>) : label}
        </div>
      )
    })

  const content = (
    <div className={`quick-open-dialog ${ax({ layout: 'stack', surface: 'overlay' })}`} aria-label={ariaLabel}>
      <div className={ax({ layout: 'bar' })}>
        <Search size={16} className={ax({ flex: 'none' })} />
        <input
          className={`quick-open-input border-none outline-none ${ax({ role: 'control', flex: '1', content: 'text', clamp: '1' })}`}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          aria-label={ariaLabel}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          {...(aria.containerProps as React.InputHTMLAttributes<HTMLInputElement>)}
          ref={(el: HTMLInputElement | null) => {
            inputRef.current = el
            const ariaRef = (aria.containerProps as { ref?: Ref<HTMLElement> }).ref
            if (typeof ariaRef === 'function') ariaRef(el)
            else if (ariaRef && typeof ariaRef === 'object') (ariaRef as React.MutableRefObject<HTMLElement | null>).current = el
          }}
        />
        <kbd className={ax({
            role: 'control-group',
            surface: 'base', textStyle: 'code', flex: 'none', content: 'text' })}>ESC</kbd>
      </div>
      {isOpen && rootChildren.length > 0 ? (
        <div id={listboxId} role="listbox" className={ax({ layout: 'scroll', flex: '1', content: 'text' })} onMouseDown={e => e.preventDefault()}>
          {hasGroups ? rootChildren.map(id => {
            const entity = store.entities[id]
            if (!entity) return null
            if (isGroup(entity)) {
              const groupChildren = getChildren(store, id)
              return (
                <div key={id} role="group" aria-label={getLabel(entity)}>
                  <div className={ax({ role: 'item', textStyle: 'overline', content: 'text' })}>{getLabel(entity)}</div>
                  {renderItems(groupChildren)}
                </div>
              )
            }
            return renderItems([id])
          }) : renderItems(rootChildren)}
        </div>
      ) : (
        <div className={ax({ layout: 'center', textStyle: 'body' })}>No results</div>
      )}
    </div>
  )

  if (!dialog) return content

  return (
    <dialog ref={dialogRef} className="quick-open-dialog-el" onClick={(e) => { if (e.target === dialogRef.current) onClose() }}>
      {content}
    </dialog>
  )
}

// --- File mode: original Fuse.js-based search ---

function QuickOpenFile({ fileStore, root, onSelect, onClose, persistKey }: FileMode) {
  // @useState-hatch — view preference mirrored to localStorage (matches VIEWMODE_KEY pattern)
  const [query, setQuery] = useState(() => (persistKey && localStorage.getItem(persistKey)) || '')
  useEffect(() => {
    if (persistKey) localStorage.setItem(persistKey, query)
  }, [persistKey, query])

  const files = useMemo(() => flattenFiles(fileStore, root), [fileStore, root])
  const fuse = useMemo(() => new Fuse(files, {
    keys: ['name', 'relativePath'],
    threshold: 0.4,
  }), [files])

  const results = useMemo(() => {
    if (!query.trim()) return files.slice(0, MAX_RESULTS)
    return fuse.search(query).slice(0, MAX_RESULTS).map(r => r.item)
  }, [query, fuse, files])

  const comboboxData = useMemo(() => createStore({
    entities: Object.fromEntries(results.map(f => [f.id, { id: f.id, data: f as unknown as Record<string, unknown> }])),
    relationships: { [ROOT_ID]: results.map(f => f.id) },
  }), [results])

  const handleActivate = useCallback((nodeId: string) => {
    const file = results.find(f => f.id === nodeId)
    if (file) onSelect(file.path)
  }, [results, onSelect])

  return (
    <QuickOpenManaged
      data={comboboxData}
      query={query}
      onQueryChange={setQuery}
      onActivate={handleActivate}
      onClose={onClose}
      placeholder="파일 검색..."
      aria-label="Quick Open"
      renderItem={(_, data) => {
        const fileData = data as unknown as FileEntry
        return (
          <>
            <span className={ax({ flex: 'none' })}>
              <FileIcon name={fileData.name} type="file" />
            </span>
            <span className={`quick-open-item-text ${ax({ layout: 'stack', flex: '1' })}`}>
              <span className={ax({ clamp: '1' })}>{fileData.name}</span>
              <span className={ax({ clamp: '1' })}>{fileData.relativePath}</span>
            </span>
          </>
        )
      }}
    />
  )
}
