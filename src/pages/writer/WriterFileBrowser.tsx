// ② 2026-04-04-md-writer-prd.md
import { useCallback, useEffect, useState } from 'react'
import { TreeView } from '@os/ui/TreeView'
import { ExpandIndicator } from '@os/ui/indicators'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData, Entity } from '@os/store/types'
import type { NodeState } from '@os/pattern/types'
import { ax } from '@styles/ax'

interface FileEntry { name: string; path: string }
interface DirListing { files: FileEntry[]; dirs: FileEntry[] }

function buildFileTree(listing: DirListing): NormalizedData {
  const entities: Record<string, Entity> = {}
  const relationships: Record<string, string[]> = { [ROOT_ID]: [] }

  for (const dir of listing.dirs) {
    const id = `dir:${dir.path}`
    entities[id] = { id, data: { type: 'dir', name: dir.name, path: dir.path } }
    relationships[ROOT_ID].push(id)
    relationships[id] = [] // placeholder for lazy load
  }

  for (const file of listing.files) {
    const id = `file:${file.path}`
    entities[id] = { id, data: { type: 'file', name: file.name, path: file.path } }
    relationships[ROOT_ID].push(id)
  }

  return createStore({ entities, relationships })
}

const fileRenderItem = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const data = node.data as Record<string, unknown> | undefined
  const name = (data?.name as string) ?? ''
  const type = data?.type as string
  const isDir = type === 'dir'
  const hasChildren = state.expanded !== undefined
  const depth = (state.level ?? 1) - 1

  return (
    <div {...props} className={ax({ surface: 'ghost', padding: 'xs', layout: 'row', gap: 'xs' })} style={{ paddingLeft: `calc(${depth} * var(--space-md) + var(--space-xs))` }}>
      <ExpandIndicator expanded={state.expanded} hasChildren={hasChildren} />
      <span className={ax({ text: state.focused ? 'primary' : 'secondary', clamp: '1' })}>
        {isDir ? `${name}/` : name}
      </span>
    </div>
  )
}

interface WriterFileBrowserProps {
  onFileSelect: (filePath: string) => void
}

export default function WriterFileBrowser({ onFileSelect }: WriterFileBrowserProps) {
  const [fileData, setFileData] = useState<NormalizedData>(createStore())
  const [loadedDirs, setLoadedDirs] = useState<Set<string>>(new Set())

  const loadDir = useCallback(async (dirPath: string) => {
    if (loadedDirs.has(dirPath)) return
    try {
      const res = await fetch(`/api/writer/list?dir=${encodeURIComponent(dirPath)}`)
      if (!res.ok) return
      const listing: DirListing = await res.json()

      if (dirPath === '') {
        setFileData(buildFileTree(listing))
      } else {
        // Merge into existing tree under the dir node
        setFileData(prev => {
          const next = { ...prev, entities: { ...prev.entities }, relationships: { ...prev.relationships } }
          const parentId = `dir:${dirPath}`
          const children: string[] = []

          for (const dir of listing.dirs) {
            const id = `dir:${dir.path}`
            next.entities[id] = { id, data: { type: 'dir', name: dir.name, path: dir.path } }
            children.push(id)
            if (!next.relationships[id]) next.relationships[id] = []
          }

          for (const file of listing.files) {
            const id = `file:${file.path}`
            next.entities[id] = { id, data: { type: 'file', name: file.name, path: file.path } }
            children.push(id)
          }

          next.relationships[parentId] = children
          return next
        })
      }

      setLoadedDirs(prev => new Set(prev).add(dirPath))
    } catch {
      // ignore
    }
  }, [loadedDirs])

  useEffect(() => { loadDir('') }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = useCallback((next: NormalizedData) => {
    setFileData(next)

    // Check if any dir was just expanded — lazy load its contents
    for (const [id, entity] of Object.entries(next.entities)) {
      if (id.startsWith('dir:')) {
        const data = entity.data as Record<string, unknown>
        const dirPath = data.path as string
        const children = next.relationships[id] ?? []
        // If dir is visible (expanded) and has no children yet, load it
        if (children.length === 0 && !loadedDirs.has(dirPath)) {
          loadDir(dirPath)
        }
      }
    }
  }, [loadDir, loadedDirs])

  const handleActivate = useCallback((nodeId: string) => {
    if (nodeId.startsWith('file:')) {
      const entity = fileData.entities[nodeId]
      const path = (entity?.data as Record<string, unknown>)?.path as string
      if (path) onFileSelect(path)
    } else if (nodeId.startsWith('dir:')) {
      const entity = fileData.entities[nodeId]
      const dirPath = (entity?.data as Record<string, unknown>)?.path as string
      if (dirPath) loadDir(dirPath)
    }
  }, [fileData, onFileSelect, loadDir])

  return (
    <div className={ax({ layout: 'scroll' })}>
      <TreeView
        data={fileData}
        onChange={handleChange}
        onActivate={handleActivate}
        renderItem={fileRenderItem}
        selectionFollowsFocus
        aria-label="File browser"
      />
    </div>
  )
}
