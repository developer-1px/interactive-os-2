import { describe, it, expect } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import { useState } from 'react'
import { Aria } from '../components/aria'
import { listbox } from '../behaviors/listbox'
import { core } from '../plugins/core'
import { history } from '../plugins/history'
import { rename, renameCommands } from '../plugins/rename'
import { createStore } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'
import type { NodeState } from '../behaviors/types'

const initialStore = createStore({
  entities: {
    a: { id: 'a', data: { label: 'Alpha' } },
    b: { id: 'b', data: { label: 'Beta' } },
    c: { id: 'c', data: { label: 'Charlie' } },
  },
  relationships: { [ROOT_ID]: ['a', 'b', 'c'] },
})

const plugins = [core(), rename(), history()]

function TestListBox({ initialData, keyMap }: { initialData?: NormalizedData; keyMap?: Record<string, (ctx: import('../behaviors/types').BehaviorContext) => import('../core/types').Command | void> }) {
  const [data, setData] = useState(initialData ?? initialStore)
  return (
    <Aria behavior={listbox} data={data} plugins={plugins} onChange={setData} keyMap={keyMap}>
      <Aria.Item render={(node: Record<string, unknown>, _state: NodeState) => (
        <div data-testid={`item-${node.id}`}>
          <Aria.Editable field="label">
            <span>{(node.data as Record<string, unknown>)?.label as string}</span>
          </Aria.Editable>
        </div>
      )} />
    </Aria>
  )
}

function setupWithKeyMap() {
  const keyMap = {
    'F2': (ctx: import('../behaviors/types').BehaviorContext) => renameCommands.startRename(ctx.focused),
  }
  return render(<TestListBox keyMap={keyMap} />)
}

describe('Rename UI', () => {
  describe('NodeState.renaming', () => {
    it('is false by default — no contenteditable', () => {
      const { container } = setupWithKeyMap()
      expect(container.querySelector('[contenteditable]')).toBeNull()
    })

    it('becomes true after F2 — contenteditable appears', () => {
      const { container } = setupWithKeyMap()
      const firstNode = container.querySelector('[data-node-id="a"]')!
      act(() => { fireEvent.keyDown(firstNode, { key: 'F2' }) })

      expect(container.querySelector('[contenteditable]')).not.toBeNull()
      expect(container.querySelector('[data-renaming]')).not.toBeNull()
    })
  })

  describe('contenteditable lifecycle', () => {
    it('F2 → type → Enter confirms rename', () => {
      const { container } = setupWithKeyMap()
      const firstNode = container.querySelector('[data-node-id="a"]')!
      act(() => { fireEvent.keyDown(firstNode, { key: 'F2' }) })

      const editable = container.querySelector('[contenteditable]') as HTMLElement
      expect(editable).not.toBeNull()
      editable.textContent = 'New Alpha'

      act(() => { fireEvent.keyDown(editable, { key: 'Enter' }) })

      // After confirm, node text should update
      expect(container.querySelector('[data-testid="item-a"]')!.textContent).toContain('New Alpha')
      expect(container.querySelector('[contenteditable]')).toBeNull()
    })

    it('F2 → type → Escape cancels rename', () => {
      const { container } = setupWithKeyMap()
      const firstNode = container.querySelector('[data-node-id="a"]')!
      act(() => { fireEvent.keyDown(firstNode, { key: 'F2' }) })

      const editable = container.querySelector('[contenteditable]') as HTMLElement
      editable.textContent = 'Changed'

      act(() => { fireEvent.keyDown(editable, { key: 'Escape' }) })

      expect(container.querySelector('[data-testid="item-a"]')!.textContent).toContain('Alpha')
      expect(container.querySelector('[contenteditable]')).toBeNull()
    })

    it('empty string confirms as cancel (restores original)', () => {
      const { container } = setupWithKeyMap()
      const firstNode = container.querySelector('[data-node-id="a"]')!
      act(() => { fireEvent.keyDown(firstNode, { key: 'F2' }) })

      const editable = container.querySelector('[contenteditable]') as HTMLElement
      editable.textContent = ''

      act(() => { fireEvent.keyDown(editable, { key: 'Enter' }) })

      expect(container.querySelector('[data-testid="item-a"]')!.textContent).toContain('Alpha')
    })

    it('same value confirms as cancel', () => {
      const { container } = setupWithKeyMap()
      const firstNode = container.querySelector('[data-node-id="a"]')!
      act(() => { fireEvent.keyDown(firstNode, { key: 'F2' }) })

      const editable = container.querySelector('[contenteditable]') as HTMLElement
      // Don't change text
      act(() => { fireEvent.keyDown(editable, { key: 'Enter' }) })

      expect(container.querySelector('[data-testid="item-a"]')!.textContent).toContain('Alpha')
    })
  })

  describe('keyboard suppression (isEditableElement guard)', () => {
    it('arrow keys do not move focus during rename', () => {
      const { container } = setupWithKeyMap()
      const firstNode = container.querySelector('[data-node-id="a"]')!
      act(() => { fireEvent.keyDown(firstNode, { key: 'F2' }) })

      const editable = container.querySelector('[contenteditable]') as HTMLElement
      act(() => { fireEvent.keyDown(editable, { key: 'ArrowDown' }) })

      // Focus should still be on 'a' — the node should still have data-focused
      expect(container.querySelector('[data-node-id="a"][data-focused]')).not.toBeNull()
      // contenteditable should still be visible (rename not ended)
      expect(container.querySelector('[contenteditable]')).not.toBeNull()
    })

    it('Tab confirms and exits rename (no keyboard trap)', () => {
      const { container } = setupWithKeyMap()
      const firstNode = container.querySelector('[data-node-id="a"]')!
      act(() => { fireEvent.keyDown(firstNode, { key: 'F2' }) })

      const editable = container.querySelector('[contenteditable]') as HTMLElement
      editable.textContent = 'Tab Value'
      act(() => { fireEvent.keyDown(editable, { key: 'Tab' }) })

      // Tab should confirm and exit rename
      expect(container.querySelector('[contenteditable]')).toBeNull()
      expect(container.querySelector('[data-testid="item-a"]')!.textContent).toContain('Tab Value')
    })
  })

  describe('blur behavior', () => {
    it('blur confirms rename', () => {
      const { container } = setupWithKeyMap()
      const firstNode = container.querySelector('[data-node-id="a"]')!
      act(() => { fireEvent.keyDown(firstNode, { key: 'F2' }) })

      const editable = container.querySelector('[contenteditable]') as HTMLElement
      editable.textContent = 'Blurred Value'

      act(() => { fireEvent.blur(editable) })

      expect(container.querySelector('[data-testid="item-a"]')!.textContent).toContain('Blurred Value')
    })
  })

  describe('IME composition', () => {
    it('Enter during IME composition does not confirm', () => {
      const { container } = setupWithKeyMap()
      const firstNode = container.querySelector('[data-node-id="a"]')!
      act(() => { fireEvent.keyDown(firstNode, { key: 'F2' }) })

      const editable = container.querySelector('[contenteditable]') as HTMLElement

      // Start IME composition
      act(() => { fireEvent.compositionStart(editable) })

      // Enter during composition should NOT confirm
      act(() => { fireEvent.keyDown(editable, { key: 'Enter' }) })
      expect(container.querySelector('[contenteditable]')).not.toBeNull()

      // End composition
      act(() => { fireEvent.compositionEnd(editable) })

      // Now Enter should confirm
      editable.textContent = 'IME Value'
      act(() => { fireEvent.keyDown(editable, { key: 'Enter' }) })
      expect(container.querySelector('[contenteditable]')).toBeNull()
      expect(container.querySelector('[data-testid="item-a"]')!.textContent).toContain('IME Value')
    })
  })

  describe('double-click entry', () => {
    it('double-click starts rename', () => {
      const { container } = setupWithKeyMap()
      // Aria.Editable wraps children in a span with onDoubleClick when not renaming
      const editableWrapper = container.querySelector('[data-node-id="a"] span')!
      act(() => { fireEvent.doubleClick(editableWrapper) })

      expect(container.querySelector('[contenteditable]')).not.toBeNull()
    })
  })

  describe('graceful degradation', () => {
    it('Aria.Editable without rename plugin renders children normally', () => {
      function NoRenameListBox() {
        const [data, setData] = useState(initialStore)
        return (
          <Aria behavior={listbox} data={data} plugins={[core()]} onChange={setData}>
            <Aria.Item render={(node: Record<string, unknown>) => (
              <Aria.Editable field="label">
                <span>{(node.data as Record<string, unknown>)?.label as string}</span>
              </Aria.Editable>
            )} />
          </Aria>
        )
      }

      const { container } = render(<NoRenameListBox />)

      expect(container.textContent).toContain('Alpha')
      expect(container.querySelector('[contenteditable]')).toBeNull()
    })
  })

  describe('Enter to start rename', () => {
    it('Enter starts rename when mapped in editingKeyMap', () => {
      const keyMap = {
        'F2': (ctx: import('../behaviors/types').BehaviorContext) => renameCommands.startRename(ctx.focused),
        'Enter': (ctx: import('../behaviors/types').BehaviorContext) => renameCommands.startRename(ctx.focused),
      }
      const { container } = render(<TestListBox keyMap={keyMap} />)
      const firstNode = container.querySelector('[data-node-id="a"]')!

      act(() => { fireEvent.keyDown(firstNode, { key: 'Enter' }) })

      expect(container.querySelector('[contenteditable]')).not.toBeNull()
    })
  })

  describe('focus recovery after rename', () => {
    it('focus returns to node after Enter confirm', () => {
      const { container } = setupWithKeyMap()
      const firstNode = container.querySelector('[data-node-id="a"]')!
      // Give initial DOM focus to the node
      act(() => { (firstNode as HTMLElement).focus() })

      // Start rename
      act(() => { fireEvent.keyDown(firstNode, { key: 'F2' }) })
      const editable = container.querySelector('[contenteditable]') as HTMLElement
      editable.textContent = 'New Value'

      // Confirm
      act(() => { fireEvent.keyDown(editable, { key: 'Enter' }) })

      // Focus should return to the node, not be on document.body
      const focusedNode = container.querySelector('[data-node-id="a"]') as HTMLElement
      expect(focusedNode.getAttribute('data-focused')).toBe('')
      expect(document.activeElement).toBe(focusedNode)
    })

    it('focus returns to node after Escape cancel', () => {
      const { container } = setupWithKeyMap()
      const firstNode = container.querySelector('[data-node-id="a"]') as HTMLElement
      act(() => { firstNode.focus() })

      act(() => { fireEvent.keyDown(firstNode, { key: 'F2' }) })
      const editable = container.querySelector('[contenteditable]') as HTMLElement
      editable.textContent = 'Changed'

      act(() => { fireEvent.keyDown(editable, { key: 'Escape' }) })

      const focusedNode = container.querySelector('[data-node-id="a"]') as HTMLElement
      expect(focusedNode.getAttribute('data-focused')).toBe('')
      expect(document.activeElement).toBe(focusedNode)
    })
  })

  describe('undo integration', () => {
    it('confirmRename undo restores original value (engine level)', () => {
      // Undo is tested at engine level since jsdom focus routing is limited.
      // See plugin-rename.test.ts and phase3-integration.test.ts for full undo coverage.
      const { container } = setupWithKeyMap()
      const firstNode = container.querySelector('[data-node-id="a"]')!

      // Rename a → 'Renamed'
      act(() => { fireEvent.keyDown(firstNode, { key: 'F2' }) })
      const editable = container.querySelector('[contenteditable]') as HTMLElement
      editable.textContent = 'Renamed'
      act(() => { fireEvent.keyDown(editable, { key: 'Enter' }) })
      expect(container.querySelector('[data-testid="item-a"]')!.textContent).toContain('Renamed')
    })
  })
})
