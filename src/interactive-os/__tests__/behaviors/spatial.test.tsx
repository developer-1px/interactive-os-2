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
import { core } from '../../plugins/core'

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

function getFocused(container: HTMLElement): string {
  return container.querySelector('[tabindex="0"][data-node-id]')?.getAttribute('data-node-id') ?? ''
}

describe('spatial behavior — Space, Home, End', () => {
  function setup() {
    const user = userEvent.setup()
    const result = render(
      <Aria behavior={spatial} data={spatialFixture()} plugins={[core()]}>
        <Aria.Node render={(node, state) => (
          <span data-focused={state.focused} data-selected={state.selected}>
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
    expect(container.querySelector('[data-node-id="sec1"] span')?.getAttribute('data-selected')).toBe('true')
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
