// ② 2026-04-04-md-writer-prd.md
import { useCallback, useEffect, useRef } from 'react'
import { TreeView } from '@os/ui/TreeView'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData, Entity } from '@os/store/types'
import { useStore } from '@os/store/useStore'
import { ScrollArea } from '@os/ui/ScrollArea'

interface FileEntry { name: string; path: string }
interface DirListing { files: FileEntry[]; dirs: FileEntry[] }

function buildFileTree(listing: DirListing): NormalizedData {
  const entities: Record<string, Entity> = {}
  const relationships: Record<string, string[]> = { [ROOT_ID]: [] }

  for (const dir of listing.dirs) {
    const id = `dir:${dir.path}`
    entities[id] = { id, data: { type: 'dir', name: `${dir.name}/`, path: dir.path } }
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

interface WriterFileBrowserProps {
  onFileSelect: (filePath: string) => void
}

export default function WriterFileBrowser({ onFileSelect }: WriterFileBrowserProps) {
  const [fileData, setFileData] = useStore(createStore())
  const loadedDirsRef = useRef(new Set<string>())

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const loadDir = useCallback(async (dirPath: string) => {
    if (loadedDirsRef.current.has(dirPath)) return
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
            next.entities[id] = { id, data: { type: 'dir', name: `${dir.name}/`, path: dir.path } }
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

      loadedDirsRef.current.add(dirPath)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => { loadDir('') }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const handleChange = useCallback((next: NormalizedData) => {
    setFileData(next)

    // Check if any dir was just expanded — lazy load its contents
    for (const [id, entity] of Object.entries(next.entities)) {
      if (id.startsWith('dir:')) {
        const data = entity.data as Record<string, unknown>
        const dirPath = data.path as string
        const children = next.relationships[id] ?? []
        // If dir is visible (expanded) and has no children yet, load it
        if (children.length === 0 && !loadedDirsRef.current.has(dirPath)) {
          loadDir(dirPath)
        }
      }
    }
  }, [loadDir])

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
    <ScrollArea>
      <TreeView
        data={fileData}
        onChange={handleChange}
        onActivate={handleActivate}
        selectionFollowsFocus
        aria-label="File browser"
      />
    </ScrollArea>
  )
}
