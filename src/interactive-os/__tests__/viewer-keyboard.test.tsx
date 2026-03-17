/**
 * Reproduction: Viewer file tree ArrowUp/ArrowDown not working.
 * Reproduces the exact structure from viewer.tsx — store loaded async,
 * onChange callback with useCallback, etc.
 */
import { describe, it, expect } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState, useEffect, useCallback } from 'react'
import { Aria } from '../components/aria'
import { treegrid } from '../behaviors/treegrid'
import { core } from '../plugins/core'
import { createStore } from '../core/normalized-store'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'

// Simulates the viewer's treeToStore conversion — paths as IDs
function makeStore(): NormalizedData {
  return createStore({
    entities: {
      '/src': { id: '/src', data: { name: 'src', type: 'directory', path: '/src' } },
      '/src/core': { id: '/src/core', data: { name: 'core', type: 'directory', path: '/src/core' } },
      '/src/core/types.ts': { id: '/src/core/types.ts', data: { name: 'types.ts', type: 'file', path: '/src/core/types.ts' } },
      '/src/app.tsx': { id: '/src/app.tsx', data: { name: 'app.tsx', type: 'file', path: '/src/app.tsx' } },
      '/README.md': { id: '/README.md', data: { name: 'README.md', type: 'file', path: '/README.md' } },
    },
    relationships: {
      [ROOT_ID]: ['/src', '/README.md'],
      '/src': ['/src/core', '/src/app.tsx'],
      '/src/core': ['/src/core/types.ts'],
    },
  })
}

// Exact same pattern as viewer.tsx — async load, useCallback onChange
function ViewerTreeExact() {
  const [store, setStore] = useState<NormalizedData | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate async fetch
    Promise.resolve(makeStore()).then((s) => {
      setStore(s)
      setLoading(false)
    })
  }, [])

  const handleChange = useCallback((newStore: NormalizedData) => {
    setStore(newStore)
    const focusedId = (newStore.entities['__focus__']?.focusedId as string) ?? ''
    const entity = newStore.entities[focusedId]
    if (entity?.data && (entity.data as Record<string, unknown>).type === 'file') {
      const filePath = (entity.data as Record<string, unknown>).path as string
      if (filePath !== selectedFile) {
        setSelectedFile(filePath)
      }
    }
  }, [selectedFile])

  if (loading || !store) return <div>Loading...</div>

  return (
    <Aria behavior={treegrid} data={store} plugins={[core()]} onChange={handleChange} aria-label="File tree">
      <Aria.Node render={(node, state) => {
        const data = node.data as { name: string; type: string }
        return (
          <div role="gridcell">
            <span data-testid={`node-${data.name}`} data-focused={state.focused}>
              {data.name}
            </span>
          </div>
        )
      }} />
    </Aria>
  )
}

describe('viewer keyboard reproduction', () => {
  it('ArrowDown moves focus after async store load', async () => {
    const user = userEvent.setup()
    const { container } = render(<ViewerTreeExact />)

    // Wait for async load
    await waitFor(() => {
      expect(container.querySelector('[data-node-id]')).toBeTruthy()
    })

    // Focus first node
    const first = container.querySelector('[data-node-id="/src"]') as HTMLElement
    expect(first).toBeTruthy()
    first.focus()
    expect(document.activeElement).toBe(first)

    // ArrowDown should move focus to /README.md
    await user.keyboard('{ArrowDown}')
    const focused = container.querySelector('[tabindex="0"][data-node-id]')
    expect(focused?.getAttribute('data-node-id')).toBe('/README.md')
  })

  it('ArrowUp moves focus backward', async () => {
    const user = userEvent.setup()
    const { container } = render(<ViewerTreeExact />)

    await waitFor(() => {
      expect(container.querySelector('[data-node-id]')).toBeTruthy()
    })

    // Focus /README.md (second node)
    const readme = container.querySelector('[data-node-id="/README.md"]') as HTMLElement
    readme.focus()

    await user.keyboard('{ArrowUp}')
    const focused = container.querySelector('[tabindex="0"][data-node-id]')
    expect(focused?.getAttribute('data-node-id')).toBe('/src')
  })

  it('repeated ArrowDown works through multiple presses', async () => {
    const user = userEvent.setup()
    const { container } = render(<ViewerTreeExact />)

    await waitFor(() => {
      expect(container.querySelector('[data-node-id]')).toBeTruthy()
    })

    const first = container.querySelector('[data-node-id="/src"]') as HTMLElement
    first.focus()

    // Expand /src
    await user.keyboard('{ArrowRight}')
    // Now visible: /src, /src/core, /src/app.tsx, /README.md
    // ArrowDown should go to /src/core
    await user.keyboard('{ArrowDown}')
    let focused = container.querySelector('[tabindex="0"][data-node-id]')
    expect(focused?.getAttribute('data-node-id')).toBe('/src/core')

    // ArrowDown again → /src/app.tsx
    await user.keyboard('{ArrowDown}')
    focused = container.querySelector('[tabindex="0"][data-node-id]')
    expect(focused?.getAttribute('data-node-id')).toBe('/src/app.tsx')
  })
})
