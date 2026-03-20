import { describe, it, expect } from 'vitest'
import { fileTreeAdapter, exampleFiles } from '../examples/fileTreeAdapter'
import type { FileNode } from '../examples/fileTreeAdapter'
import { ROOT_ID } from '../core/types'

describe('fileTreeAdapter', () => {
  it('normalizes nested file tree to entities + relationships', () => {
    const data = fileTreeAdapter.normalize(exampleFiles)

    // Should have 5 entities: src, App.tsx, main.tsx, components, Button.tsx, README.md
    expect(Object.keys(data.entities)).toHaveLength(6)

    // Root should have 2 children
    expect(data.relationships[ROOT_ID]).toHaveLength(2)

    // All entities should have id, data.name, data.type
    for (const entity of Object.values(data.entities)) {
      const d = entity.data as Record<string, unknown>
      expect(entity.id).toBeDefined()
      expect(d.name).toBeDefined()
      expect(d.type).toBeDefined()
    }
  })

  it('preserves extra fields (size, modified)', () => {
    const data = fileTreeAdapter.normalize(exampleFiles)

    const appEntity = Object.values(data.entities).find((e) => (e.data as Record<string, unknown>)?.name === 'App.tsx')
    expect((appEntity?.data as Record<string, unknown>)?.size).toBe(2048)
  })

  it('denormalizes back to original structure', () => {
    const data = fileTreeAdapter.normalize(exampleFiles)
    const restored = fileTreeAdapter.denormalize(data)

    expect(restored).toEqual(exampleFiles)
  })

  it('round-trips preserve data integrity', () => {
    const files: FileNode[] = [
      {
        name: 'root',
        type: 'folder',
        children: [
          { name: 'a.ts', type: 'file', size: 100 },
          {
            name: 'sub',
            type: 'folder',
            children: [
              { name: 'b.ts', type: 'file', size: 200 },
            ],
          },
        ],
      },
    ]

    const normalized = fileTreeAdapter.normalize(files)
    const denormalized = fileTreeAdapter.denormalize(normalized)
    expect(denormalized).toEqual(files)
  })

  it('handles empty input', () => {
    const data = fileTreeAdapter.normalize([])
    expect(Object.keys(data.entities)).toHaveLength(0)
    expect(data.relationships[ROOT_ID]).toEqual([])

    const restored = fileTreeAdapter.denormalize(data)
    expect(restored).toEqual([])
  })
})
