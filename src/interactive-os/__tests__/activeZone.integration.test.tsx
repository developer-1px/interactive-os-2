/**
 * Integration test: Active Zone — pointerdown on empty area activates zone
 *
 * PRD: docs/superpowers/prds/2026-03-23-active-zone-prd.md
 * Tests V1~V7: empty area click → focusedId gets DOM focus, nested guard, edge cases.
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../primitives/aria'
import { toolbar } from '../pattern/examples/toolbar'
import { listbox } from '../pattern/examples/listbox'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { PatternContext, NodeState } from '../pattern/types'

function toolbarData(): NormalizedData {
  return createStore({
    entities: {
      bold: { id: 'bold', data: { name: 'Bold' } },
      italic: { id: 'italic', data: { name: 'Italic' } },
    },
    relationships: { [ROOT_ID]: ['bold', 'italic'] },
  })
}

function listboxData(): NormalizedData {
  return createStore({
    entities: {
      alpha: { id: 'alpha', data: { label: 'Alpha' } },
      beta: { id: 'beta', data: { label: 'Beta' } },
    },
    relationships: { [ROOT_ID]: ['alpha', 'beta'] },
  })
}

function renderItem(props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, _state: NodeState) {
  return <span {...props}>{(node.data as Record<string, unknown>)?.name as string ?? (node.data as Record<string, unknown>)?.label as string}</span>
}

function getNodeEl(container: HTMLElement, id: string): HTMLElement {
  return container.querySelector(`[data-node-id="${id}"]`)!
}

describe('Active Zone', () => {
  // V1: empty area pointerdown → focusedId gets DOM focus
  it('pointerdown on empty area focuses the focusedId item', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Aria behavior={toolbar} data={toolbarData()} plugins={[]} aria-label="toolbar" autoFocus={false}>
        <div role="separator" data-testid="separator" style={{ height: 10 }} />
        <Aria.Item render={renderItem} />
      </Aria>,
    )

    // autoFocus=false, so no DOM focus yet
    expect(document.activeElement).toBe(document.body)

    // Click the separator (empty area, not an item)
    const separator = container.querySelector('[data-testid="separator"]')!
    await user.pointer({ keys: '[MouseLeft]', target: separator })

    // focusedId (bold) should now have DOM focus
    expect(document.activeElement).toBe(getNodeEl(container, 'bold'))
  })

  // V1 cont: after activation, keyboard works
  it('keyboard works after empty area activation', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Aria behavior={toolbar} data={toolbarData()} plugins={[]} aria-label="toolbar" autoFocus={false}>
        <div role="separator" data-testid="separator" style={{ height: 10 }} />
        <Aria.Item render={renderItem} />
      </Aria>,
    )

    const separator = container.querySelector('[data-testid="separator"]')!
    await user.pointer({ keys: '[MouseLeft]', target: separator })
    await user.keyboard('{ArrowRight}')

    expect(document.activeElement).toBe(getNodeEl(container, 'italic'))
  })

  // V2: zone switch — clicking zone B deactivates zone A
  it('clicking zone B empty area moves focus away from zone A', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <div>
        <Aria behavior={toolbar} data={toolbarData()} plugins={[]} aria-label="toolbar" autoFocus={false}>
          <Aria.Item render={renderItem} />
        </Aria>
        <Aria behavior={listbox()} data={listboxData()} plugins={[]} aria-label="listbox" autoFocus={false}>
          <div data-testid="list-empty" style={{ height: 10 }} />
          <Aria.Item render={renderItem} />
        </Aria>
      </div>,
    )

    // Focus toolbar item directly
    await user.click(getNodeEl(container, 'bold'))
    expect(document.activeElement).toBe(getNodeEl(container, 'bold'))

    // Click listbox empty area
    const listEmpty = container.querySelector('[data-testid="list-empty"]')!
    await user.pointer({ keys: '[MouseLeft]', target: listEmpty })

    // Listbox focusedId (alpha) should have focus
    expect(document.activeElement).toBe(getNodeEl(container, 'alpha'))
  })

  // V3: focus recovery after body loss
  it('pointerdown recovers focus after body loss', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Aria behavior={toolbar} data={toolbarData()} plugins={[]} aria-label="toolbar" autoFocus={false}>
        <div data-testid="gap" style={{ height: 10 }} />
        <Aria.Item render={renderItem} />
      </Aria>,
    )

    // Focus an item, then blur to body
    await user.click(getNodeEl(container, 'italic'))
    expect(document.activeElement).toBe(getNodeEl(container, 'italic'))

    ;(document.activeElement as HTMLElement).blur()
    expect(document.activeElement).toBe(document.body)

    // Click gap area
    const gap = container.querySelector('[data-testid="gap"]')!
    await user.pointer({ keys: '[MouseLeft]', target: gap })

    // Should recover to italic (last focusedId)
    expect(document.activeElement).toBe(getNodeEl(container, 'italic'))
  })

  // V4: focusedId empty — no error
  it('does nothing when focusedId is empty', async () => {
    const user = userEvent.setup()
    const emptyData = createStore({
      entities: {},
      relationships: { [ROOT_ID]: [] },
    })
    const { container } = render(
      <Aria behavior={toolbar} data={emptyData} plugins={[]} aria-label="empty-toolbar" autoFocus={false}>
        <div data-testid="empty-gap" style={{ height: 10 }} />
      </Aria>,
    )

    const gap = container.querySelector('[data-testid="empty-gap"]')!
    // Should not throw — no focusedId means no active zone delegation
    await user.pointer({ keys: '[MouseLeft]', target: gap })
    // Browser default: tabIndex=-1 container gets focus, but no item is focused
    expect(container.querySelector('[data-focused]')).toBeNull()
  })

  // V5: nested — inner zone click does not activate outer zone
  it('nested: inner zone empty area activates only inner zone', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Aria behavior={toolbar} data={toolbarData()} plugins={[]} aria-label="outer" autoFocus={false}>
        <Aria.Item render={renderItem} />
        <Aria behavior={listbox()} data={listboxData()} plugins={[]} aria-label="inner" autoFocus={false}>
          <div data-testid="inner-gap" style={{ height: 10 }} />
          <Aria.Item render={renderItem} />
        </Aria>
      </Aria>,
    )

    const innerGap = container.querySelector('[data-testid="inner-gap"]')!
    await user.pointer({ keys: '[MouseLeft]', target: innerGap })

    // Inner zone's focusedId (alpha) should have focus
    expect(document.activeElement).toBe(getNodeEl(container, 'alpha'))
  })

  // V6: keyMap-only zone — no handler attached
  it('keyMap-only zone does not respond to empty area pointerdown', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Aria
        keyMap={{ 'Meta+k': (_ctx: PatternContext) => undefined }}
        data={{ entities: {}, relationships: { [ROOT_ID]: [] } }}
        plugins={[]}
      >
        <div data-testid="keymap-gap" style={{ height: 10 }} />
        <button data-testid="child-btn">child</button>
      </Aria>,
    )

    const gap = container.querySelector('[data-testid="keymap-gap"]')!
    await user.pointer({ keys: '[MouseLeft]', target: gap })

    // No focus change — body remains
    expect(document.activeElement).toBe(document.body)
  })

  // V7: autoFocus=false — click still recovers
  it('autoFocus=false zone still responds to explicit click', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Aria behavior={toolbar} data={toolbarData()} plugins={[]} aria-label="no-auto" autoFocus={false}>
        <div data-testid="no-auto-gap" style={{ height: 10 }} />
        <Aria.Item render={renderItem} />
      </Aria>,
    )

    // Initially no DOM focus (autoFocus=false)
    expect(document.activeElement).toBe(document.body)

    const gap = container.querySelector('[data-testid="no-auto-gap"]')!
    await user.pointer({ keys: '[MouseLeft]', target: gap })

    // Explicit click should activate
    expect(document.activeElement).toBe(getNodeEl(container, 'bold'))
  })
})
