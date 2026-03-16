/**
 * TransformAdapter example: Convert nested file tree ↔ NormalizedData
 *
 * This shows how to bridge any external data shape into the
 * normalized format that interactive-os understands.
 *
 * Usage:
 *   const data = fileTreeAdapter.normalize(myNestedFiles)
 *   // ... pass to <Aria data={data} /> or useAria({ data })
 *   // ... on change, convert back:
 *   const files = fileTreeAdapter.denormalize(updatedData)
 */

import type { Entity, NormalizedData } from '../core/types'
import type { TransformAdapter } from '../core/types'
import { ROOT_ID } from '../core/types'

// --- Your external data shape ---

export interface FileNode {
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
  size?: number
  modified?: string
}

// --- The adapter ---

let idCounter = 0

export const fileTreeAdapter: TransformAdapter<FileNode[]> = {
  normalize(files: FileNode[]): NormalizedData {
    const entities: Record<string, Entity> = {}
    const relationships: Record<string, string[]> = { [ROOT_ID]: [] }
    idCounter = 0

    const walk = (nodes: FileNode[], parentId: string) => {
      for (const node of nodes) {
        const id = `node-${idCounter++}`
        entities[id] = {
          id,
          data: {
            name: node.name,
            type: node.type,
            ...(node.size !== undefined ? { size: node.size } : {}),
            ...(node.modified !== undefined ? { modified: node.modified } : {}),
          },
        }

        if (!relationships[parentId]) relationships[parentId] = []
        relationships[parentId]!.push(id)

        if (node.children) {
          walk(node.children, id)
        }
      }
    }

    walk(files, ROOT_ID)
    return { entities, relationships }
  },

  denormalize(data: NormalizedData): FileNode[] {
    const build = (parentId: string): FileNode[] => {
      const childIds = data.relationships[parentId] ?? []

      return childIds.map((id) => {
        const entity = data.entities[id]!
        const d = entity.data as Record<string, unknown>
        const children = build(id)
        const node: FileNode = {
          name: d.name as string,
          type: d.type as 'file' | 'folder',
        }

        if (d.size !== undefined) node.size = d.size as number
        if (d.modified !== undefined) node.modified = d.modified as string
        if (children.length > 0) node.children = children

        return node
      })
    }

    return build(ROOT_ID)
  },
}

// --- Example usage ---

export const exampleFiles: FileNode[] = [
  {
    name: 'src',
    type: 'folder',
    children: [
      { name: 'App.tsx', type: 'file', size: 2048 },
      { name: 'main.tsx', type: 'file', size: 512 },
      {
        name: 'components',
        type: 'folder',
        children: [
          { name: 'Button.tsx', type: 'file', size: 1024 },
        ],
      },
    ],
  },
  { name: 'README.md', type: 'file', size: 4096 },
]

// Convert to interactive-os format:
// const normalizedData = fileTreeAdapter.normalize(exampleFiles)
//
// Use in component:
// <TreeGrid data={normalizedData} enableEditing onChange={(newData) => {
//   const files = fileTreeAdapter.denormalize(newData)
//   saveToServer(files)
// }} />
