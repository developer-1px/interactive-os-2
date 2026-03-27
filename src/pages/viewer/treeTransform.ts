import type { TreeNode } from './fsClient'
import type { NormalizedData, Entity } from '../../interactive-os/store/types'
import { ROOT_ID } from '../../interactive-os/store/types'
import { createStore } from '../../interactive-os/store/createStore'
import { FOCUS_ID } from '../../interactive-os/axis/navigate'
import { EXPANDED_ID } from '../../interactive-os/axis/expand'

export function treeToStore(nodes: TreeNode[]): NormalizedData {
  const entities: Record<string, Entity> = {}
  const relationships: Record<string, string[]> = { [ROOT_ID]: [] }

  function walk(items: TreeNode[], parentId: string) {
    for (const node of items) {
      entities[node.id] = { id: node.id, data: { name: node.name, type: node.type, path: node.id } }
      if (!relationships[parentId]) relationships[parentId] = []
      relationships[parentId].push(node.id)
      if (node.children && node.children.length > 0) {
        walk(node.children, node.id)
      }
    }
  }

  walk(nodes, ROOT_ID)
  return createStore({ entities, relationships })
}

export function urlPathToFilePath(pathname: string, prefix: string, root: string): string | null {
  const re = new RegExp(`^\\/${prefix}\\/?`)
  const relative = pathname.replace(re, '')
  if (!relative) return null
  return `${root}/${relative}`
}

export function filePathToUrlPath(filePath: string, prefix: string, root: string): string {
  const relative = filePath.startsWith(root + '/')
    ? filePath.slice(root.length + 1)
    : filePath
  return `/${prefix}/${relative}`
}

export function getAncestorIds(filePath: string, store: NormalizedData): string[] {
  const ancestors: string[] = []
  const parts = filePath.split('/')
  for (let i = 1; i < parts.length; i++) {
    const ancestorPath = parts.slice(0, i).join('/')
    if (store.entities[ancestorPath]) {
      ancestors.push(ancestorPath)
    }
  }
  return ancestors
}

export function withInitialFileSelected(store: NormalizedData, filePath: string): NormalizedData {
  const ancestors = getAncestorIds(filePath, store)
  const existing = (store.entities[EXPANDED_ID]?.expandedIds as string[]) ?? []
  const merged = [...new Set([...existing, ...ancestors])]
  return {
    ...store,
    entities: {
      ...store.entities,
      [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: merged },
      [FOCUS_ID]: { id: FOCUS_ID, focusedId: filePath },
    },
  }
}
