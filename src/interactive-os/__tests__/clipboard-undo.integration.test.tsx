/**
 * Integration test: clipboard + crud undo via userEvent
 *
 * Tests the full user flow: render → keyboard input → DOM result.
 * No engine.dispatch() — only userEvent simulation.
 * Covers cut-paste-undo, copy-paste-undo, delete-undo, paste position.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { ListBox } from '../ui/ListBox'
import { createStore } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { core } from '../plugins/core'
import { crud } from '../plugins/crud'
import { clipboard, resetClipboard } from '../plugins/clipboard'
import { history } from '../plugins/history'
import { Aria } from '../components/aria'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      a: { id: 'a', data: { label: 'Alpha' } },
      b: { id: 'b', data: { label: 'Bravo' } },
      c: { id: 'c', data: { label: 'Charlie' } },
      d: { id: 'd', data: { label: 'Delta' } },
    },
    relationships: {
      [ROOT_ID]: ['a', 'b', 'c', 'd'],
    },
  })
}

const plugins = [core(), crud(), clipboard(), history()]

const renderItem = (item: Record<string, unknown>, state: NodeState) => (
  <span data-testid={`item-${item.id}`}>
    <Aria.Editable field="label">
      <span>{(item.data as Record<string, unknown>)?.label as string}</span>
    </Aria.Editable>
  </span>
)

function StatefulList() {
  const [data, setData] = useState(fixtureData())
  return (
    <ListBox
      data={data}
      onChange={setData}
      plugins={plugins}
      enableEditing
      renderItem={renderItem}
    />
  )
}

function getVisibleLabels(container: HTMLElement): string[] {
  const items = container.querySelectorAll('[data-node-id]')
  return Array.from(items)
    .filter((el) => !el.getAttribute('data-node-id')!.startsWith('__'))
    .map((el) => el.textContent?.trim() ?? '')
}

function getFocusedNodeId(container: HTMLElement): string | null {
  const focused = container.querySelector('[tabindex="0"]')
  return focused?.getAttribute('data-node-id') ?? null
}

function getNodeElement(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

describe('clipboard + crud undo integration (userEvent)', () => {
  beforeEach(() => resetClipboard())

  it('Mod+C → Mod+V pastes after cursor, Mod+Z undoes', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulList />)

    // Focus on 'b', copy it
    getNodeElement(container, 'b')!.focus()
    await user.keyboard('{Control>}c{/Control}')

    // Paste — should insert after 'b'
    await user.keyboard('{Control>}v{/Control}')

    const afterPaste = getVisibleLabels(container)
    expect(afterPaste.length).toBe(5)
    expect(afterPaste[0]).toBe('Alpha')
    expect(afterPaste[1]).toBe('Bravo')
    // pasted copy is at index 2
    expect(afterPaste[3]).toBe('Charlie')
    expect(afterPaste[4]).toBe('Delta')

    // Undo → back to 4 items
    await user.keyboard('{Control>}z{/Control}')
    const afterUndo = getVisibleLabels(container)
    expect(afterUndo).toEqual(['Alpha', 'Bravo', 'Charlie', 'Delta'])
  })

  it('Mod+X → Mod+V moves item, Mod+Z undoes', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulList />)

    // Focus on 'a', cut it
    getNodeElement(container, 'a')!.focus()
    await user.keyboard('{Control>}x{/Control}')

    // Move focus to 'c', paste
    getNodeElement(container, 'c')!.focus()
    await user.keyboard('{Control>}v{/Control}')

    // 'a' moved after 'c'
    const afterPaste = getVisibleLabels(container)
    expect(afterPaste).toEqual(['Bravo', 'Charlie', 'Alpha', 'Delta'])

    // Undo → original order
    await user.keyboard('{Control>}z{/Control}')
    const afterUndo = getVisibleLabels(container)
    expect(afterUndo).toEqual(['Alpha', 'Bravo', 'Charlie', 'Delta'])
  })

  it('Delete removes item, focus recovers, Mod+Z restores', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulList />)

    // Focus on 'b', delete
    getNodeElement(container, 'b')!.focus()
    await user.keyboard('{Delete}')

    const afterDelete = getVisibleLabels(container)
    expect(afterDelete).toEqual(['Alpha', 'Charlie', 'Delta'])
    // Focus should recover to next sibling ('c')
    expect(getFocusedNodeId(container)).toBe('c')

    // Undo → 'b' restored
    await user.keyboard('{Control>}z{/Control}')
    const afterUndo = getVisibleLabels(container)
    expect(afterUndo).toEqual(['Alpha', 'Bravo', 'Charlie', 'Delta'])
  })

  it('Delete last item, focus recovers to previous sibling', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulList />)

    // Focus on 'd' (last), delete
    getNodeElement(container, 'd')!.focus()
    await user.keyboard('{Delete}')

    expect(getVisibleLabels(container)).toEqual(['Alpha', 'Bravo', 'Charlie'])
    expect(getFocusedNodeId(container)).toBe('c')
  })

  it('paste position: always after cursor, not at end', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulList />)

    // Copy 'd'
    getNodeElement(container, 'd')!.focus()
    await user.keyboard('{Control>}c{/Control}')

    // Paste on 'a' (first item) — should insert after 'a', not at end
    getNodeElement(container, 'a')!.focus()
    await user.keyboard('{Control>}v{/Control}')

    const labels = getVisibleLabels(container)
    expect(labels[0]).toBe('Alpha')
    // pasted 'Delta' copy at index 1
    expect(labels[1]).toBe('Delta')
    expect(labels[2]).toBe('Bravo')
  })

  it('Mod+Z → Mod+Shift+Z redo round-trip', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulList />)

    // Delete 'b'
    getNodeElement(container, 'b')!.focus()
    await user.keyboard('{Delete}')
    expect(getVisibleLabels(container)).toEqual(['Alpha', 'Charlie', 'Delta'])

    // Undo
    await user.keyboard('{Control>}z{/Control}')
    expect(getVisibleLabels(container)).toEqual(['Alpha', 'Bravo', 'Charlie', 'Delta'])

    // Redo
    await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}')
    expect(getVisibleLabels(container)).toEqual(['Alpha', 'Charlie', 'Delta'])

    // Undo again
    await user.keyboard('{Control>}z{/Control}')
    expect(getVisibleLabels(container)).toEqual(['Alpha', 'Bravo', 'Charlie', 'Delta'])
  })
})
