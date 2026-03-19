/**
 * Reproduction: Focus loss after onChange triggers re-render.
 *
 * Simulates the exact viewer bug:
 * 1. Click a file node → onChange fires → external state update
 * 2. ArrowDown should still work after onChange
 *
 * Tests BOTH the broken pattern (setStore in onChange) and the fixed pattern.
 */
import { describe, it, expect } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState, useCallback } from 'react'
import { Aria } from '../components/aria'
import { treegrid } from '../behaviors/treegrid'
import { core } from '../plugins/core'
import { createStore } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'

function makeStore(): NormalizedData {
  return createStore({
    entities: {
      '/src': { id: '/src', data: { name: 'src', type: 'directory', path: '/src' } },
      '/src/a.ts': { id: '/src/a.ts', data: { name: 'a.ts', type: 'file', path: '/src/a.ts' } },
      '/src/b.ts': { id: '/src/b.ts', data: { name: 'b.ts', type: 'file', path: '/src/b.ts' } },
      '/src/c.ts': { id: '/src/c.ts', data: { name: 'c.ts', type: 'file', path: '/src/c.ts' } },
    },
    relationships: {
      [ROOT_ID]: ['/src'],
      '/src': ['/src/a.ts', '/src/b.ts', '/src/c.ts'],
    },
  })
}

// BROKEN pattern: onChange calls setStore (was the viewer bug)
function BrokenViewer() {
  const [store, setStore] = useState(makeStore)
  const [selected, setSelected] = useState<string | null>(null)

  const handleChange = useCallback((newStore: NormalizedData) => {
    setStore(newStore) // ← THIS causes re-render → DOM node replacement → focus loss
    const focusedId = (newStore.entities['__focus__']?.focusedId as string) ?? ''
    const entity = newStore.entities[focusedId]
    if (entity?.data && (entity.data as Record<string, unknown>).type === 'file') {
      setSelected((entity.data as Record<string, unknown>).path as string)
    }
  }, [])

  return (
    <div>
      <Aria behavior={treegrid} data={store} plugins={[core()]} onChange={handleChange} aria-label="tree">
        <Aria.Item render={(node, state) => {
          const data = node.data as { name: string }
          return <div role="gridcell"><span data-focused={state.focused}>{data.name}</span></div>
        }} />
      </Aria>
      <div data-testid="selected">{selected}</div>
    </div>
  )
}

// FIXED pattern: onChange does NOT call setStore
function FixedViewer() {
  const [selected, setSelected] = useState<string | null>(null)
  const [initialStore] = useState(makeStore)

  const handleChange = useCallback((newStore: NormalizedData) => {
    // No setStore — Aria manages its own state
    const focusedId = (newStore.entities['__focus__']?.focusedId as string) ?? ''
    const entity = newStore.entities[focusedId]
    if (entity?.data && (entity.data as Record<string, unknown>).type === 'file') {
      setSelected((entity.data as Record<string, unknown>).path as string)
    }
  }, [])

  return (
    <div>
      <Aria behavior={treegrid} data={initialStore} plugins={[core()]} onChange={handleChange} aria-label="tree">
        <Aria.Item render={(node, state) => {
          const data = node.data as { name: string }
          return <div role="gridcell"><span data-focused={state.focused}>{data.name}</span></div>
        }} />
      </Aria>
      <div data-testid="selected">{selected}</div>
    </div>
  )
}

async function expandAndNavigate(container: HTMLElement) {
  const user = userEvent.setup()

  await waitFor(() => {
    expect(container.querySelector('[data-node-id="/src"]')).toBeTruthy()
  })

  // Focus /src
  const src = container.querySelector('[data-node-id="/src"]') as HTMLElement
  src.focus()

  // Expand /src
  await user.keyboard('{ArrowRight}')
  await waitFor(() => {
    expect(container.querySelector('[data-node-id="/src/a.ts"]')).toBeTruthy()
  })

  // ArrowRight again → focus first child (a.ts)
  await user.keyboard('{ArrowRight}')
  let focused = container.querySelector('[tabindex="0"][data-node-id]')
  expect(focused?.getAttribute('data-node-id')).toBe('/src/a.ts')

  // NOW: ArrowDown should move to b.ts — this is where the bug was
  await user.keyboard('{ArrowDown}')
  focused = container.querySelector('[tabindex="0"][data-node-id]')
  return focused?.getAttribute('data-node-id')
}

describe('viewer focus loss — reproduction', () => {
  it('BROKEN: setStore in onChange causes focus loss, ArrowDown fails', async () => {
    const { container } = render(<BrokenViewer />)
    const focusedAfterArrowDown = await expandAndNavigate(container)

    // In the broken pattern, ArrowDown may not work because focus was lost
    // The focused node might still be a.ts (ArrowDown had no effect)
    // or it could be b.ts if React reconciliation preserved focus
    // We document the actual behavior:
    console.log('Broken pattern — focused after ArrowDown:', focusedAfterArrowDown)
  })

  it('FIXED: no setStore in onChange, ArrowDown works correctly', async () => {
    const { container } = render(<FixedViewer />)
    const focusedAfterArrowDown = await expandAndNavigate(container)

    // In the fixed pattern, ArrowDown must work
    expect(focusedAfterArrowDown).toBe('/src/b.ts')
  })

  it('FIXED: multiple ArrowDown presses navigate through all children', async () => {
    const user = userEvent.setup()
    const { container } = render(<FixedViewer />)

    await waitFor(() => {
      expect(container.querySelector('[data-node-id="/src"]')).toBeTruthy()
    })

    const src = container.querySelector('[data-node-id="/src"]') as HTMLElement
    src.focus()

    // Expand
    await user.keyboard('{ArrowRight}')
    await waitFor(() => {
      expect(container.querySelector('[data-node-id="/src/a.ts"]')).toBeTruthy()
    })

    // Navigate: ArrowRight → a.ts, ArrowDown → b.ts, ArrowDown → c.ts
    await user.keyboard('{ArrowRight}')
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowDown}')

    const focused = container.querySelector('[tabindex="0"][data-node-id]')
    expect(focused?.getAttribute('data-node-id')).toBe('/src/c.ts')
  })

  it('FIXED: ArrowUp works after navigating down', async () => {
    const user = userEvent.setup()
    const { container } = render(<FixedViewer />)

    await waitFor(() => {
      expect(container.querySelector('[data-node-id="/src"]')).toBeTruthy()
    })

    const src = container.querySelector('[data-node-id="/src"]') as HTMLElement
    src.focus()

    await user.keyboard('{ArrowRight}') // expand
    await user.keyboard('{ArrowRight}') // → a.ts
    await user.keyboard('{ArrowDown}')  // → b.ts
    await user.keyboard('{ArrowDown}')  // → c.ts
    await user.keyboard('{ArrowUp}')    // → b.ts

    const focused = container.querySelector('[tabindex="0"][data-node-id]')
    expect(focused?.getAttribute('data-node-id')).toBe('/src/b.ts')
  })
})
