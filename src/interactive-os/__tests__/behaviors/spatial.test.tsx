/**
 * Integration test: spatial behavior — Space, Home, End keyMap
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../../components/aria'
import { spatial } from '../../behaviors/spatial'
import { createStore } from '../../core/createStore'
import { ROOT_ID } from '../../core/types'
import { core, EXPANDED_ID } from '../../plugins/core'

function spatialFixture() {
  return createStore({
    entities: {
      sec1: { id: 'sec1', data: { label: 'Section 1' } },
      sec2: { id: 'sec2', data: { label: 'Section 2' } },
      sec3: { id: 'sec3', data: { label: 'Section 3' } },
      a: { id: 'a', data: { label: 'A' } },
      b: { id: 'b', data: { label: 'B' } },
      c: { id: 'c', data: { label: 'C' } },
    },
    relationships: {
      [ROOT_ID]: ['sec1', 'sec2', 'sec3'],
      sec1: ['a', 'b', 'c'],
    },
  })
}

/** Spatial with children visible — sec1 pre-expanded so children (a,b,c) are in the DOM */
function spatialFixtureExpanded() {
  const store = spatialFixture()
  return {
    ...store,
    entities: {
      ...store.entities,
      [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: ['sec1'] },
    },
  }
}

function getFocused(container: HTMLElement): string {
  return container.querySelector('[tabindex="0"][data-node-id]')?.getAttribute('data-node-id') ?? ''
}

describe('spatial behavior — Enter/Escape drill-in/out', () => {
  function setup() {
    const user = userEvent.setup()
    const result = render(
      <Aria behavior={spatial} data={spatialFixtureExpanded()} plugins={[core()]}>
        <Aria.Item render={(props, node, state) => (
          <span {...props} data-focused={state.focused} data-selected={state.selected}>
            {(node as { data: { label: string } }).data.label}
          </span>
        )} />
      </Aria>
    )
    return { user, container: result.container as HTMLElement }
  }

  it('Enter on parent with children drills into first child', async () => {
    const { user, container } = setup()
    // sec1 has children [a, b, c]
    const sec1 = container.querySelector('[data-node-id="sec1"]') as HTMLElement
    sec1.focus()
    expect(getFocused(container)).toBe('sec1')

    await user.keyboard('{Enter}')
    expect(getFocused(container)).toBe('a')
  })

  it('Escape after drill-in returns to parent level', async () => {
    const { user, container } = setup()
    // Drill into sec1
    const sec1 = container.querySelector('[data-node-id="sec1"]') as HTMLElement
    sec1.focus()
    await user.keyboard('{Enter}')
    expect(getFocused(container)).toBe('a')

    // Escape to go back up
    await user.keyboard('{Escape}')
    expect(getFocused(container)).toBe('sec1')
  })

  it('Home/End after drill-in navigates within child depth', async () => {
    const { user, container } = setup()
    // Drill into sec1's children
    const sec1 = container.querySelector('[data-node-id="sec1"]') as HTMLElement
    sec1.focus()
    await user.keyboard('{Enter}')
    expect(getFocused(container)).toBe('a')

    // End should go to last child (c)
    await user.keyboard('{End}')
    expect(getFocused(container)).toBe('c')

    // Home should go back to first child (a)
    await user.keyboard('{Home}')
    expect(getFocused(container)).toBe('a')
  })

  it('Escape at root level is no-op', async () => {
    const { user, container } = setup()
    const sec1 = container.querySelector('[data-node-id="sec1"]') as HTMLElement
    sec1.focus()
    // Escape at root — should stay focused on sec1
    await user.keyboard('{Escape}')
    expect(getFocused(container)).toBe('sec1')
  })

  it('Enter on leaf node does not drill deeper (no children to enter)', async () => {
    const { user, container } = setup()
    // Drill into sec1 first
    const sec1 = container.querySelector('[data-node-id="sec1"]') as HTMLElement
    sec1.focus()
    await user.keyboard('{Enter}')
    expect(getFocused(container)).toBe('a')

    // "a" is a leaf — Enter dispatches startRename (no drill-in). Focus stays on "a".
    await user.keyboard('{Enter}')
    expect(getFocused(container)).toBe('a')
  })
})

describe('spatial behavior — Space, Home, End', () => {
  function setup() {
    const user = userEvent.setup()
    const result = render(
      <Aria behavior={spatial} data={spatialFixture()} plugins={[core()]}>
        <Aria.Item render={(props, node, state) => (
          <span {...props} data-focused={state.focused} data-selected={state.selected}>
            {(node as { data: { label: string } }).data.label}
          </span>
        )} />
      </Aria>
    )
    return { user, container: result.container as HTMLElement }
  }

  it('Space toggles selection on focused node', async () => {
    const { user, container } = setup()
    const first = container.querySelector('[data-node-id="sec1"]') as HTMLElement
    first.focus()
    await user.keyboard(' ')
    // data-selected is set by the render prop from state.selected
    expect(container.querySelector('[data-node-id="sec1"]')?.getAttribute('data-selected')).toBe('true')
  })

  it('Home focuses first sibling in current spatial depth', async () => {
    const { user, container } = setup()
    // Focus sec3 directly (ArrowDown relies on DOM rects unavailable in jsdom)
    const sec3 = container.querySelector('[data-node-id="sec3"]') as HTMLElement
    sec3.focus()
    await user.keyboard('{Home}')
    expect(getFocused(container)).toBe('sec1')
  })

  it('End focuses last sibling in current spatial depth', async () => {
    const { user, container } = setup()
    const sec1 = container.querySelector('[data-node-id="sec1"]') as HTMLElement
    sec1.focus()
    await user.keyboard('{End}')
    expect(getFocused(container)).toBe('sec3')
  })
})
