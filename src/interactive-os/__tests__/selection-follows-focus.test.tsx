// src/interactive-os/__tests__/selection-follows-focus.test.tsx
// V1: 2026-03-28-selection-follows-focus-prd.md
/**
 * Tests for selectionFollowsFocus + activationFollowsSelection.
 * Replaces follow-focus.test.tsx.
 *
 * Chain: focus →[selectionFollowsFocus]→ selection →[activationFollowsSelection]→ onActivate
 */
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../primitives/aria'
import { composePattern } from '../pattern/composePattern'
import { select } from '../axis/select'
import { activate } from '../axis/activate'
import { navigate } from '../axis/navigate'
import { tabs } from '../pattern/roles/tabs'
import { radiogroup } from '../pattern/roles/radiogroup'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      a: { id: 'a', data: { label: 'A' } },
      b: { id: 'b', data: { label: 'B' } },
      c: { id: 'c', data: { label: 'C' } },
    },
    relationships: {
      [ROOT_ID]: ['a', 'b', 'c'],
    },
  })
}

const bothOptions = composePattern(
  {
    role: 'toolbar',
    childRole: 'button',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-pressed': String(state.selected),
    }),
  },
  select({ mode: 'single', selectionFollowsFocus: true }),
  activate({ onClick: true, activationFollowsSelection: true }),
  navigate({ orientation: 'vertical' }),
)

const selectionOnly = composePattern(
  {
    role: 'radiogroup',
    childRole: 'radio',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-checked': String(state.selected),
    }),
  },
  select({ mode: 'single', selectionFollowsFocus: true }),
  activate({ onClick: true }),
  navigate({ orientation: 'both', wrap: true }),
)

const noOptions = composePattern(
  {
    role: 'toolbar',
    childRole: 'button',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-pressed': String(state.selected),
    }),
  },
  activate({ onClick: true }),
  navigate({ orientation: 'horizontal' }),
)

function getNode(container: HTMLElement, id: string): HTMLElement {
  return container.querySelector(`[data-node-id="${id}"]`)!
}

describe('selectionFollowsFocus + activationFollowsSelection', () => {
  describe('selectionFollowsFocus: focus change → auto-select', () => {
    it('Arrow key changes aria-checked when selectionFollowsFocus is true', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <Aria pattern={selectionOnly} data={fixtureData()} plugins={[]}>
          <Aria.Item render={(props, node, _state: NodeState) => (
            <span {...props}>{(node.data as Record<string, unknown>)?.label as string}</span>
          )} />
        </Aria>,
      )

      getNode(container, 'a').focus()
      expect(getNode(container, 'a').getAttribute('aria-checked')).toBe('true')

      await user.keyboard('{ArrowDown}')
      expect(getNode(container, 'b').getAttribute('aria-checked')).toBe('true')
      expect(getNode(container, 'a').getAttribute('aria-checked')).toBe('false')
    })

    it('Home/End changes selection when selectionFollowsFocus is true', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <Aria pattern={bothOptions} data={fixtureData()} plugins={[]}>
          <Aria.Item render={(props, node, _state: NodeState) => (
            <span {...props}>{(node.data as Record<string, unknown>)?.label as string}</span>
          )} />
        </Aria>,
      )

      getNode(container, 'a').focus()
      await user.keyboard('{End}')
      expect(getNode(container, 'c').getAttribute('aria-pressed')).toBe('true')
      expect(getNode(container, 'a').getAttribute('aria-pressed')).toBe('false')
    })
  })

  describe('activationFollowsSelection: selection change → onActivate', () => {
    it('Arrow key calls onActivate when both options are true', async () => {
      const user = userEvent.setup()
      const onActivate = vi.fn()
      const { container } = render(
        <Aria pattern={bothOptions} data={fixtureData()} plugins={[]} onActivate={onActivate}>
          <Aria.Item render={(props, node, _state: NodeState) => (
            <span {...props}>{(node.data as Record<string, unknown>)?.label as string}</span>
          )} />
        </Aria>,
      )

      getNode(container, 'a').focus()
      onActivate.mockClear()

      await user.keyboard('{ArrowDown}')
      expect(onActivate).toHaveBeenCalledWith('b')
    })

    it('does NOT call onActivate when only selectionFollowsFocus (no activationFollowsSelection)', async () => {
      const user = userEvent.setup()
      const onActivate = vi.fn()
      const { container } = render(
        <Aria pattern={selectionOnly} data={fixtureData()} plugins={[]} onActivate={onActivate}>
          <Aria.Item render={(props, node, _state: NodeState) => (
            <span {...props}>{(node.data as Record<string, unknown>)?.label as string}</span>
          )} />
        </Aria>,
      )

      getNode(container, 'a').focus()
      onActivate.mockClear()

      await user.keyboard('{ArrowDown}')
      expect(onActivate).not.toHaveBeenCalled()
    })

    it('does NOT call onActivate on initial mount', () => {
      const onActivate = vi.fn()
      render(
        <Aria pattern={bothOptions} data={fixtureData()} plugins={[]} onActivate={onActivate}>
          <Aria.Item render={(props, node, _state: NodeState) => (
            <span {...props}>{(node.data as Record<string, unknown>)?.label as string}</span>
          )} />
        </Aria>,
      )
      expect(onActivate).not.toHaveBeenCalled()
    })
  })

  describe('both options OFF → existing pattern preserved', () => {
    it('Arrow key moves focus only, no selection change', async () => {
      const user = userEvent.setup()
      const onActivate = vi.fn()
      const { container } = render(
        <Aria pattern={noOptions} data={fixtureData()} plugins={[]} onActivate={onActivate}>
          <Aria.Item render={(props, node, _state: NodeState) => (
            <span {...props}>{(node.data as Record<string, unknown>)?.label as string}</span>
          )} />
        </Aria>,
      )

      getNode(container, 'a').focus()
      onActivate.mockClear()

      await user.keyboard('{ArrowRight}')
      expect(onActivate).not.toHaveBeenCalled()
      expect(getNode(container, 'b').getAttribute('aria-pressed')).toBe('false')
    })
  })

  describe('explicit activation (Enter/Space) still works independently', () => {
    it('Enter calls onActivate via keymapHelpers regardless of options', async () => {
      const user = userEvent.setup()
      const onActivate = vi.fn()
      const { container } = render(
        <Aria pattern={noOptions} data={fixtureData()} plugins={[]} onActivate={onActivate}>
          <Aria.Item render={(props, node, _state: NodeState) => (
            <span {...props}>{(node.data as Record<string, unknown>)?.label as string}</span>
          )} />
        </Aria>,
      )

      getNode(container, 'a').focus()
      onActivate.mockClear()
      await user.keyboard('{Enter}')
      expect(onActivate).toHaveBeenCalledWith('a')
    })

    it('Space calls onActivate via keymapHelpers when no select axis', async () => {
      const user = userEvent.setup()
      const onActivate = vi.fn()
      const { container } = render(
        <Aria pattern={noOptions} data={fixtureData()} plugins={[]} onActivate={onActivate}>
          <Aria.Item render={(props, node, _state: NodeState) => (
            <span {...props}>{(node.data as Record<string, unknown>)?.label as string}</span>
          )} />
        </Aria>,
      )

      getNode(container, 'a').focus()
      onActivate.mockClear()
      await user.keyboard('{ }')
      expect(onActivate).toHaveBeenCalledWith('a')
    })
  })

  describe('pattern presets', () => {
    it('tabs has selectionFollowsFocus=true and activationFollowsSelection=true', () => {
      expect(tabs.selectionFollowsFocus).toBe(true)
      expect(tabs.activationFollowsSelection).toBe(true)
    })

    it('radiogroup has selectionFollowsFocus=true but no activationFollowsSelection', () => {
      expect(radiogroup.selectionFollowsFocus).toBe(true)
      expect(radiogroup.activationFollowsSelection).toBeUndefined()
    })

    it('tabs: Arrow changes selection and calls onActivate', async () => {
      const user = userEvent.setup()
      const onActivate = vi.fn()
      const { container } = render(
        <Aria pattern={tabs} data={fixtureData()} plugins={[]} onActivate={onActivate}>
          <Aria.Item render={(props, node, _state: NodeState) => (
            <span {...props}>{(node.data as Record<string, unknown>)?.label as string}</span>
          )} />
        </Aria>,
      )

      getNode(container, 'a').focus()
      onActivate.mockClear()

      await user.keyboard('{ArrowRight}')
      expect(onActivate).toHaveBeenCalledWith('b')
      expect(getNode(container, 'b').getAttribute('aria-selected')).toBe('true')
    })

    it('radiogroup: Arrow changes aria-checked without calling onActivate', async () => {
      const user = userEvent.setup()
      const onActivate = vi.fn()
      const { container } = render(
        <Aria pattern={radiogroup} data={fixtureData()} plugins={[]} onActivate={onActivate}>
          <Aria.Item render={(props, node, _state: NodeState) => (
            <span {...props}>{(node.data as Record<string, unknown>)?.label as string}</span>
          )} />
        </Aria>,
      )

      getNode(container, 'a').focus()
      onActivate.mockClear()

      await user.keyboard('{ArrowDown}')
      expect(getNode(container, 'b').getAttribute('aria-checked')).toBe('true')
      expect(onActivate).not.toHaveBeenCalled()
    })
  })

  describe('click activation', () => {
    it('click calls onActivate when activateOnClick is true', async () => {
      const user = userEvent.setup()
      const onActivate = vi.fn()
      const { container } = render(
        <Aria pattern={bothOptions} data={fixtureData()} plugins={[]} onActivate={onActivate}>
          <Aria.Item render={(props, node, _state: NodeState) => (
            <span {...props}>{(node.data as Record<string, unknown>)?.label as string}</span>
          )} />
        </Aria>,
      )

      await user.click(getNode(container, 'b'))
      expect(onActivate).toHaveBeenCalledWith('b')
    })
  })
})
