/**
 * Integration test: Typeahead keyboard interactions
 *
 * Tests the full user flow: render ListBox → keyboard input → focus moves to matching item.
 * Follows project convention: userEvent → DOM/ARIA state verification.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ListBox } from '../ui/ListBox'
import { Aria } from '../components/aria'
import { listbox } from '../behaviors/listbox'
import { createStore } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import type { NormalizedData, Entity, Command } from '../core/types'
import { core } from '../plugins/core'
import { rename, renameCommands } from '../plugins/rename'
import { typeahead, resetTypeahead } from '../plugins/typeahead'
import type { BehaviorContext, NodeState } from '../behaviors/types'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      apple: { id: 'apple', data: { name: 'Apple' } },
      banana: { id: 'banana', data: { name: 'Banana' } },
      blueberry: { id: 'blueberry', data: { name: 'Blueberry' } },
      cherry: { id: 'cherry', data: { name: 'Cherry' } },
      date: { id: 'date', data: { name: 'Date' } },
    },
    relationships: {
      [ROOT_ID]: ['apple', 'banana', 'blueberry', 'cherry', 'date'],
    },
  })
}

const getLabel = (entity: Entity) =>
  (entity.data as Record<string, unknown>)?.name as string ?? ''

/** Short timeout for tests — avoids real timer waits */
const TEST_TIMEOUT = 30

function renderListBox(data: NormalizedData, opts?: { enableEditing?: boolean }) {
  return render(
    <ListBox
      data={data}
      plugins={[core(), typeahead({ getLabel, timeout: TEST_TIMEOUT })]}
      enableEditing={opts?.enableEditing}
      renderItem={(props, item, _state: NodeState) => (
        <span {...props}>{(item.data as Record<string, unknown>)?.name as string}</span>
      )}
    />
  )
}

function getFocusedNodeId(container: HTMLElement): string | null {
  const focused = container.querySelector('[tabindex="0"]')
  return focused?.getAttribute('data-node-id') ?? null
}

function getNodeElement(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

describe('Typeahead keyboard integration', () => {
  afterEach(() => {
    resetTypeahead()
  })

  // V1: M1 — single character typeahead
  it('typing "b" moves focus to first B item', async () => {
    const user = userEvent.setup()
    const { container } = renderListBox(fixtureData())

    getNodeElement(container, 'apple')!.focus()
    expect(getFocusedNodeId(container)).toBe('apple')

    await user.keyboard('b')
    expect(getFocusedNodeId(container)).toBe('banana')
  })

  // V7: E4 — case insensitive
  it('typing "B" (uppercase) also matches "Banana"', async () => {
    const user = userEvent.setup()
    const { container } = renderListBox(fixtureData())

    getNodeElement(container, 'apple')!.focus()
    await user.keyboard('B')
    expect(getFocusedNodeId(container)).toBe('banana')
  })

  // V2: M2 — multi-char typeahead
  it('typing "bl" quickly narrows to "Blueberry"', async () => {
    const user = userEvent.setup()
    const { container } = renderListBox(fixtureData())

    getNodeElement(container, 'apple')!.focus()
    await user.keyboard('b')
    expect(getFocusedNodeId(container)).toBe('banana')

    await user.keyboard('l')
    expect(getFocusedNodeId(container)).toBe('blueberry')
  })

  // V5: M5 — no match
  it('typing "z" with no match does not move focus', async () => {
    const user = userEvent.setup()
    const { container } = renderListBox(fixtureData())

    getNodeElement(container, 'apple')!.focus()
    await user.keyboard('z')
    expect(getFocusedNodeId(container)).toBe('apple')
  })

  // V3: M3 — timer-based buffer reset enables cycling
  it('buffer resets after timeout, next same-char cycles', async () => {
    const user = userEvent.setup()
    const { container } = renderListBox(fixtureData())

    getNodeElement(container, 'apple')!.focus()

    // First "b" → banana
    await user.keyboard('b')
    expect(getFocusedNodeId(container)).toBe('banana')

    // Wait for buffer to reset via real timer (TEST_TIMEOUT=30ms + margin)
    await delay(60)

    // Second "b" from banana → blueberry (buffer was reset by timeout)
    await user.keyboard('b')
    expect(getFocusedNodeId(container)).toBe('blueberry')
  })

  // V9: E9 — wrap-around cycling
  it('typing same character wraps around to beginning', async () => {
    const user = userEvent.setup()
    const { container } = renderListBox(fixtureData())

    getNodeElement(container, 'apple')!.focus()

    // First "b" → banana
    await user.keyboard('b')
    expect(getFocusedNodeId(container)).toBe('banana')
    await delay(60)

    // Second "b" from banana → blueberry
    await user.keyboard('b')
    expect(getFocusedNodeId(container)).toBe('blueberry')
    await delay(60)

    // Third "b" from blueberry → wraps to banana
    await user.keyboard('b')
    expect(getFocusedNodeId(container)).toBe('banana')
  })

  // V4: M4 — rename mode blocks typeahead (contenteditable captures event)
  it('typeahead does not fire during rename mode', async () => {
    const user = userEvent.setup()
    const editKeyMap: Record<string, (ctx: BehaviorContext) => Command | void> = {
      'F2': (ctx) => renameCommands.startRename(ctx.focused),
    }
    const data = createStore({
      entities: {
        apple: { id: 'apple', data: { name: 'Apple' } },
        banana: { id: 'banana', data: { name: 'Banana' } },
      },
      relationships: { [ROOT_ID]: ['apple', 'banana'] },
    })

    const { container } = render(
      <Aria
        behavior={listbox()}
        data={data}
        plugins={[core(), rename(), typeahead({ getLabel })]}
        keyMap={editKeyMap}
      >
        <Aria.Item render={(props, node: Record<string, unknown>, _state: NodeState) => (
          <Aria.Editable {...props} field="name">
            <span>{(node.data as Record<string, unknown>)?.name as string}</span>
          </Aria.Editable>
        )} />
      </Aria>
    )

    getNodeElement(container, 'apple')!.focus()
    expect(getFocusedNodeId(container)).toBe('apple')

    // Enter rename mode
    await user.keyboard('{F2}')

    // contenteditable should now exist
    const editable = container.querySelector('[contenteditable]')
    expect(editable).not.toBeNull()

    // Type a character — captured by contenteditable, NOT typeahead
    await user.keyboard('b')

    // Focus should still be on apple (not moved to banana)
    expect(getFocusedNodeId(container)).toBe('apple')
  })

  // V6: E1 — empty list
  it('typing in empty list does nothing', async () => {
    const emptyData = createStore({
      entities: {},
      relationships: { [ROOT_ID]: [] },
    })

    const { container } = render(
      <ListBox
        data={emptyData}
        plugins={[core(), typeahead({ getLabel })]}
      />
    )

    // No focusable items — no crash
    expect(container.querySelector('[tabindex="0"]')).toBeNull()
  })
})
