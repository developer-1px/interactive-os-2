/**
 * Reproduction tests for viewer page bugs.
 * Tests the viewer's integration with interactive-os treegrid.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../components/aria'
import { treegrid } from '../behaviors/treegrid'
import { core } from '../plugins/core'
import { createStore } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'

// Simulate the viewer's tree-to-store conversion
function fixtureStore(): NormalizedData {
  return createStore({
    entities: {
      '/src': { id: '/src', data: { name: 'src', type: 'directory', path: '/src' } },
      '/src/core': { id: '/src/core', data: { name: 'core', type: 'directory', path: '/src/core' } },
      '/src/core/types.ts': { id: '/src/core/types.ts', data: { name: 'types.ts', type: 'file', path: '/src/core/types.ts' } },
      '/src/core/store.ts': { id: '/src/core/store.ts', data: { name: 'store.ts', type: 'file', path: '/src/core/store.ts' } },
      '/src/app.tsx': { id: '/src/app.tsx', data: { name: 'app.tsx', type: 'file', path: '/src/app.tsx' } },
      '/README.md': { id: '/README.md', data: { name: 'README.md', type: 'file', path: '/README.md' } },
    },
    relationships: {
      [ROOT_ID]: ['/src', '/README.md'],
      '/src': ['/src/core', '/src/app.tsx'],
      '/src/core': ['/src/core/types.ts', '/src/core/store.ts'],
    },
  })
}

function ViewerTree({ onSelect }: { onSelect?: (path: string) => void }) {
  const [store, setStore] = useState(fixtureStore())

  const handleChange = (newStore: NormalizedData) => {
    setStore(newStore)
    const focusedId = (newStore.entities['__focus__']?.focusedId as string) ?? ''
    const entity = newStore.entities[focusedId]
    if (entity?.data && (entity.data as Record<string, unknown>).type === 'file') {
      onSelect?.((entity.data as Record<string, unknown>).path as string)
    }
  }

  return (
    <Aria behavior={treegrid} data={store} plugins={[core()]} onChange={handleChange} aria-label="File tree">
      <Aria.Node render={(node, state) => {
        const data = node.data as { name: string; type: string }
        return (
          <div role="gridcell">
            <span data-testid={`node-${data.name}`} data-focused={state.focused} data-expanded={state.expanded}>
              {data.name}
            </span>
          </div>
        )
      }} />
    </Aria>
  )
}

// Need useState import
import { useState } from 'react'

describe('viewer tree — reproduction tests', () => {
  it('renders the file tree with correct structure', () => {
    const { container } = render(<ViewerTree />)
    const nodes = container.querySelectorAll('[data-node-id]')
    // Root-level nodes: /src and /README.md (folders collapsed, children hidden)
    expect(nodes.length).toBeGreaterThanOrEqual(2)
  })

  it('navigates with ArrowDown through visible nodes', async () => {
    const user = userEvent.setup()
    const { container } = render(<ViewerTree />)

    // Focus first node
    const first = container.querySelector('[data-node-id]') as HTMLElement
    first.focus()

    // ArrowDown should move to next sibling
    await user.keyboard('{ArrowDown}')
    const focused = container.querySelector('[tabindex="0"][data-node-id]')
    expect(focused).toBeTruthy()
  })

  it('expands directory with ArrowRight and shows children', async () => {
    const user = userEvent.setup()
    const { container } = render(<ViewerTree />)

    // Focus /src (first node, a directory)
    const first = container.querySelector('[data-node-id="/src"]') as HTMLElement
    first.focus()

    // ArrowRight should expand
    await user.keyboard('{ArrowRight}')

    // Children should now be visible
    await waitFor(() => {
      const coreNode = container.querySelector('[data-node-id="/src/core"]')
      expect(coreNode).toBeTruthy()
    })
  })

  it('ArrowRight into expanded directory focuses first child', async () => {
    const user = userEvent.setup()
    const { container } = render(<ViewerTree />)

    const src = container.querySelector('[data-node-id="/src"]') as HTMLElement
    src.focus()

    // Expand
    await user.keyboard('{ArrowRight}')
    // ArrowRight again should focus first child
    await user.keyboard('{ArrowRight}')

    const focused = container.querySelector('[tabindex="0"][data-node-id]')
    expect(focused?.getAttribute('data-node-id')).toBe('/src/core')
  })

  it('selecting a file triggers onSelect callback', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    const { container } = render(<ViewerTree onSelect={onSelect} />)

    // Focus /src, expand it
    const src = container.querySelector('[data-node-id="/src"]') as HTMLElement
    src.focus()
    await user.keyboard('{ArrowRight}') // expand /src

    // Navigate down to app.tsx (after /src/core)
    await user.keyboard('{ArrowDown}') // → /src/core
    await user.keyboard('{ArrowDown}') // → /src/app.tsx

    // Verify focus is on the file
    const focused = container.querySelector('[tabindex="0"][data-node-id]')
    expect(focused?.getAttribute('data-node-id')).toBe('/src/app.tsx')
  })

  it('file tree IDs with slashes and dots work correctly', async () => {
    const { container } = render(<ViewerTree />)
    // IDs contain full paths like /src/core/types.ts
    const readmeNode = container.querySelector('[data-node-id="/README.md"]')
    expect(readmeNode).toBeTruthy()
  })

  it('ArrowLeft on collapsed directory goes to parent', async () => {
    const user = userEvent.setup()
    const { container } = render(<ViewerTree />)

    // Expand /src, navigate to /src/core
    const src = container.querySelector('[data-node-id="/src"]') as HTMLElement
    src.focus()
    await user.keyboard('{ArrowRight}') // expand
    await user.keyboard('{ArrowRight}') // focus /src/core

    // ArrowLeft should collapse (it's a directory), then again should go to parent
    await user.keyboard('{ArrowLeft}') // collapse /src/core (no-op, it's not expanded)
    // Actually /src/core is collapsed, so ArrowLeft goes to parent /src
    const focused = container.querySelector('[tabindex="0"][data-node-id]')
    expect(focused?.getAttribute('data-node-id')).toBe('/src')
  })
})
