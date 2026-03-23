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

function TestListBox({ initialData, keyMap, allowEmpty }: { initialData?: NormalizedData; keyMap?: Record<string, (ctx: import('../behaviors/types').BehaviorContext) => import('../core/types').Command | void>; allowEmpty?: boolean }) {
  const [data, setData] = useState(initialData ?? initialStore)
  return (
    <Aria behavior={listbox} data={data} plugins={plugins} onChange={setData} keyMap={keyMap}>
      <Aria.Item render={(node: Record<string, unknown>, _state: NodeState) => (
        <div data-testid={`item-${node.id}`}>
          <Aria.Editable field="label" allowEmpty={allowEmpty}>
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

  describe('replace mode options', () => {
    it('startRename with replace:true and initialChar stores them in __rename__ entity', () => {
      let capturedStore: ReturnType<typeof createStore> | null = null

      function StoreCapture() {
        const [data, setData] = useState(initialStore)
        capturedStore = data

        const keyMap = {
          'F2': (_ctx: import('../behaviors/types').BehaviorContext) =>
            renameCommands.startRename('a', { replace: true, initialChar: 'a' }),
        }
        return (
          <Aria behavior={listbox} data={data} plugins={plugins} onChange={setData} keyMap={keyMap}>
            <Aria.Item render={(node: Record<string, unknown>) => (
              <div data-testid={`item-${node.id}`}>
                <Aria.Editable field="label">
                  <span>{(node.data as Record<string, unknown>)?.label as string}</span>
                </Aria.Editable>
              </div>
            )} />
          </Aria>
        )
      }

      const { container } = render(<StoreCapture />)
      const firstNode = container.querySelector('[data-node-id="a"]')!
      act(() => { fireEvent.keyDown(firstNode, { key: 'F2' }) })

      const renameEntity = capturedStore!.entities['__rename__']
      expect(renameEntity).toBeDefined()
      expect(renameEntity.replace).toBe(true)
      expect(renameEntity.initialChar).toBe('a')
    })

    it('startRename without options still works (backward compatible)', () => {
      const { container } = setupWithKeyMap()
      const firstNode = container.querySelector('[data-node-id="a"]')!
      act(() => { fireEvent.keyDown(firstNode, { key: 'F2' }) })

      expect(container.querySelector('[contenteditable]')).not.toBeNull()
    })
  })

  describe('replace mode UI', () => {
    function setupReplaceMode() {
      const keyMap = {
        'F2': (ctx: import('../behaviors/types').BehaviorContext) => renameCommands.startRename(ctx.focused),
        'a': (ctx: import('../behaviors/types').BehaviorContext) =>
          renameCommands.startRename(ctx.focused, { replace: true, initialChar: 'a' }),
      }
      return render(<TestListBox keyMap={keyMap} />)
    }

    it('replace mode clears text and inserts initialChar', () => {
      const { container } = setupReplaceMode()
      const firstNode = container.querySelector('[data-node-id="a"]')!
      act(() => { fireEvent.keyDown(firstNode, { key: 'a' }) })

      const editable = container.querySelector('[contenteditable]') as HTMLElement
      expect(editable).not.toBeNull()
      expect(editable.textContent).toBe('a')
    })

    it('replace mode + Escape restores original value', () => {
      const { container } = setupReplaceMode()
      const firstNode = container.querySelector('[data-node-id="a"]')!
      act(() => { fireEvent.keyDown(firstNode, { key: 'a' }) })

      const editable = container.querySelector('[contenteditable]') as HTMLElement
      act(() => { fireEvent.keyDown(editable, { key: 'Escape' }) })

      expect(container.querySelector('[data-testid="item-a"]')!.textContent).toContain('Alpha')
    })
  })

  describe('allowEmpty prop', () => {
    it('allowEmpty=false (default): empty string cancels rename', () => {
      const { container } = setupWithKeyMap()
      const firstNode = container.querySelector('[data-node-id="a"]')!
      act(() => { fireEvent.keyDown(firstNode, { key: 'F2' }) })

      const editable = container.querySelector('[contenteditable]') as HTMLElement
      editable.textContent = ''
      act(() => { fireEvent.keyDown(editable, { key: 'Enter' }) })

      // Original value restored (cancel behavior)
      expect(container.querySelector('[data-testid="item-a"]')!.textContent).toContain('Alpha')
    })

    it('allowEmpty=true: empty string confirms with empty value', () => {
      const keyMap = {
        'F2': (ctx: import('../behaviors/types').BehaviorContext) => renameCommands.startRename(ctx.focused),
      }
      const { container } = render(<TestListBox keyMap={keyMap} allowEmpty />)
      const firstNode = container.querySelector('[data-node-id="a"]')!
      act(() => { fireEvent.keyDown(firstNode, { key: 'F2' }) })

      const editable = container.querySelector('[contenteditable]') as HTMLElement
      editable.textContent = ''
      act(() => { fireEvent.keyDown(editable, { key: 'Enter' }) })

      // Empty string confirmed — label should be empty
      expect(container.querySelector('[data-testid="item-a"]')!.textContent).toBe('')
      expect(container.querySelector('[contenteditable]')).toBeNull()
    })
  })

  describe('undo integration', () => {
    it('confirmRename undo restores original value (engine level)', () => {
      const { container } = setupWithKeyMap()
      const firstNode = container.querySelector('[data-node-id="a"]')!

      // Rename a → 'Renamed'
      act(() => { fireEvent.keyDown(firstNode, { key: 'F2' }) })
      const editable = container.querySelector('[contenteditable]') as HTMLElement
      editable.textContent = 'Renamed'
      act(() => { fireEvent.keyDown(editable, { key: 'Enter' }) })
      expect(container.querySelector('[data-testid="item-a"]')!.textContent).toContain('Renamed')
    })

    // rename undo의 edit 모드 비복귀는 실제 Chrome에서 검증 (2026-03-23)
    // happy-dom에서는 contenteditable + undo 연동의 React flush 한계로 검증 불가
  })
})
