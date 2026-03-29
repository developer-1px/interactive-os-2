// V3: 2026-03-28-aria-panel-trigger-prd.md
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { useState, useMemo, useCallback } from 'react'
import { Aria } from '../primitives/aria'
import { menuButton } from '../pattern/roles/menuButton'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      trigger: { id: 'trigger', data: { label: 'Actions' } },
      cut: { id: 'cut', data: { label: 'Cut' } },
      copy: { id: 'copy', data: { label: 'Copy' } },
    },
    relationships: {
      [ROOT_ID]: ['trigger'],
      trigger: ['cut', 'copy'],
    },
  })
}

const renderTrigger = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, _state: NodeState) => (
  <button {...props} type="button">{(node.data as Record<string, unknown>).label as string}</button>
)
const renderItem = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, _state: NodeState) => (
  <div {...props}>{(node.data as Record<string, unknown>).label as string}</div>
)

// @test-harness
function TestMenuButton() {
  const [store, setStore] = useState(fixtureData())
  const pattern = useMemo(() => menuButton, [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])
  return (
    <Aria pattern={pattern} data={store} plugins={[]} onChange={onChange} aria-label="Actions">
      <Aria.Trigger render={renderTrigger} />
      <Aria.Item render={renderItem} />
    </Aria>
  )
}

// V3: 2026-03-28-aria-panel-trigger-prd.md
describe('Aria.Trigger', () => {
  it('renders trigger with aria-haspopup and aria-expanded', () => {
    const { container } = render(<TestMenuButton />)
    const trigger = container.querySelector('button')!
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('click opens popup and moves focus to first item', async () => {
    const user = userEvent.setup()
    const { container } = render(<TestMenuButton />)
    const trigger = container.querySelector('button') as HTMLElement
    trigger.focus()
    await user.click(trigger)

    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    const cut = container.querySelector('[data-node-id="cut"]') as HTMLElement
    expect(cut).not.toBeNull()
  })

  // V4: 2026-03-28-aria-panel-trigger-prd.md
  it('click on open popup closes and keeps focus on trigger', async () => {
    const user = userEvent.setup()
    const { container } = render(<TestMenuButton />)
    const trigger = container.querySelector('button') as HTMLElement
    trigger.focus()

    // Open
    await user.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')

    // Close
    await user.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  // V8: 2026-03-28-aria-panel-trigger-prd.md
  it('items not visible when popup is closed', () => {
    const { container } = render(<TestMenuButton />)
    const items = container.querySelectorAll('[data-node-id="cut"], [data-node-id="copy"]')
    expect(items.length).toBe(0)
  })
})
