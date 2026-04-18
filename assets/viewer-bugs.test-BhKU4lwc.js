var e=`/**
 * Reproduction tests for viewer page bugs.
 * Tests the viewer's integration with interactive-os tree via ui/TreeView.
 */
import { describe, it, expect } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TreeView } from '../ui/TreeView'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'

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

describe('viewer tree — reproduction tests', () => {
  it('renders the file tree with correct structure', () => {
    const { container } = render(<TreeView data={fixtureStore()} aria-label="File tree" />)
    const nodes = container.querySelectorAll('[data-node-id]')
    // Root-level nodes: /src and /README.md (folders collapsed, children hidden)
    expect(nodes.length).toBeGreaterThanOrEqual(2)
  })

  it('navigates with ArrowDown through visible nodes', async () => {
    const user = userEvent.setup()
    const { container } = render(<TreeView data={fixtureStore()} aria-label="File tree" />)

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
    const { container } = render(<TreeView data={fixtureStore()} aria-label="File tree" />)

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
    const { container } = render(<TreeView data={fixtureStore()} aria-label="File tree" />)

    const src = container.querySelector('[data-node-id="/src"]') as HTMLElement
    src.focus()

    // Expand
    await user.keyboard('{ArrowRight}')
    // ArrowRight again should focus first child
    await user.keyboard('{ArrowRight}')

    const focused = container.querySelector('[tabindex="0"][data-node-id]')
    expect(focused?.getAttribute('data-node-id')).toBe('/src/core')
  })

  it('selecting a file navigates focus correctly', async () => {
    const user = userEvent.setup()
    const { container } = render(<TreeView data={fixtureStore()} aria-label="File tree" />)

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
    const { container } = render(<TreeView data={fixtureStore()} aria-label="File tree" />)
    // IDs contain full paths like /src/core/types.ts
    const readmeNode = container.querySelector('[data-node-id="/README.md"]')
    expect(readmeNode).toBeTruthy()
  })

  it('ArrowLeft on collapsed directory goes to parent', async () => {
    const user = userEvent.setup()
    const { container } = render(<TreeView data={fixtureStore()} aria-label="File tree" />)

    // Expand /src, navigate to /src/core
    const src = container.querySelector('[data-node-id="/src"]') as HTMLElement
    src.focus()
    await user.keyboard('{ArrowRight}') // expand
    await user.keyboard('{ArrowRight}') // focus /src/core

    // ArrowLeft should go to parent /src (since /src/core is collapsed)
    await user.keyboard('{ArrowLeft}')
    const focused = container.querySelector('[tabindex="0"][data-node-id]')
    expect(focused?.getAttribute('data-node-id')).toBe('/src')
  })
})
`;export{e as default};