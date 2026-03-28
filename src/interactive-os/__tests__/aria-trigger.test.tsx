// V3: 2026-03-28-aria-panel-trigger-prd.md
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { useState, useMemo, useCallback } from 'react'
import { Aria } from '../primitives/aria'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { composePattern } from '../pattern/composePattern'
import { popup } from '../axis/popup'
import { navigate } from '../axis/navigate'

const pop = popup({ type: 'menu' })
const nav = navigate({ orientation: 'vertical', wrap: true })

// Trigger uses popup axis's own keyMap entries for open pattern
const testMenuButton = composePattern(
  {
    role: 'menu',
    childRole: 'menuitem',
    ariaAttributes: () => ({}),
    triggerKeyMap: {
      Enter: pop.keyMap.Enter!,
      ' ': pop.keyMap.Space!,
      ArrowDown: pop.keyMap.ArrowDown!,
    },
  },
  pop,
  nav,
)

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

function TestMenuButton() {
  const [store, setStore] = useState(fixtureData())
  const pattern = useMemo(() => testMenuButton, [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])
  return (
    <Aria pattern={pattern} data={store} plugins={[]} onChange={onChange} aria-label="Actions">
      <Aria.Trigger render={renderTrigger} />
      <Aria.Item render={renderItem} />
    </Aria>
  )
}

describe('Aria.Trigger', () => {
  it('renders trigger with aria-haspopup and aria-expanded', () => {
    const { container } = render(<TestMenuButton />)
    const trigger = container.querySelector('button')!
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('Enter opens popup and moves focus to first item', async () => {
    const user = userEvent.setup()
    const { container } = render(<TestMenuButton />)
    const trigger = container.querySelector('button') as HTMLElement
    trigger.focus()
    await user.keyboard('{Enter}')

    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    const cut = container.querySelector('[data-node-id="cut"]') as HTMLElement
    expect(document.activeElement).toBe(cut)
  })

  // V4: 2026-03-28-aria-panel-trigger-prd.md
  it('Escape in popup closes and returns focus to trigger', async () => {
    const user = userEvent.setup()
    const { container } = render(<TestMenuButton />)
    const trigger = container.querySelector('button') as HTMLElement
    trigger.focus()
    await user.keyboard('{Enter}')

    // Now in popup, press Escape
    await user.keyboard('{Escape}')

    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger)
  })

  // V8: 2026-03-28-aria-panel-trigger-prd.md
  it('trigger key events do not bubble to Aria container', async () => {
    const user = userEvent.setup()
    const { container } = render(<TestMenuButton />)
    const trigger = container.querySelector('button') as HTMLElement
    trigger.focus()

    // Space on trigger should open popup, not bubble
    await user.keyboard(' ')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })
})
