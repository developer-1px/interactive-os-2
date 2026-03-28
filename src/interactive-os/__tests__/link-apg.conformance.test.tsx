// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Link
 * https://www.w3.org/WAI/ARIA/apg/patterns/link/examples/link/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../primitives/aria'
import { link } from '../pattern/roles/link'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      home: { id: 'home', data: { name: 'Home' } },
      about: { id: 'about', data: { name: 'About' } },
    },
    relationships: { [ROOT_ID]: ['home', 'about'] },
  })
}

function renderLink(data: NormalizedData) {
  return render(
    <Aria pattern={link} data={data} plugins={[]}>
      <Aria.Item render={(props, item, state: NodeState) => (
        <span {...props} data-testid={`link-${item.id}`} data-selected={state.selected}>
          {(item.data as Record<string, unknown>)?.name as string}
        </span>
      )} />
    </Aria>,
  )
}

function getNode(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

describe('APG Link — ARIA Structure', () => {
  it('has role="link"', () => {
    const { container } = renderLink(fixtureData())
    expect(container.querySelectorAll('[role="link"]').length).toBe(2)
  })
})

describe('APG Link — Keyboard', () => {
  it('Enter activates link', async () => {
    const user = userEvent.setup()
    const { container } = renderLink(fixtureData())
    getNode(container, 'home')!.focus()
    await user.keyboard('{Enter}')
    const testNode = container.querySelector('[data-testid="link-home"]')
    expect(testNode?.getAttribute('data-selected')).toBe('true')
  })
})

describe('APG Link — Click', () => {
  it('click activates link', async () => {
    const user = userEvent.setup()
    const { container } = renderLink(fixtureData())
    await user.click(getNode(container, 'about')!)
    const testNode = container.querySelector('[data-testid="link-about"]')
    expect(testNode?.getAttribute('data-selected')).toBe('true')
  })
})
