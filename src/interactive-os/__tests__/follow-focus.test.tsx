/**
 * Tests for followFocus + onActivate feature.
 *
 * PRD: docs/superpowers/specs/2026-03-20-follow-focus-activation-prd.md
 */
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../primitives/aria'
import { toolbar } from '../pattern/toolbar'
import { tabs } from '../pattern/tabs'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { AriaPattern, NodeState } from '../pattern/types'
import { core } from '../plugins/core'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      store: { id: 'store', data: { label: 'Store' } },
      engine: { id: 'engine', data: { label: 'Engine' } },
      theme: { id: 'theme', data: { label: 'Theme', followFocus: false } },
    },
    relationships: {
      [ROOT_ID]: ['store', 'engine', 'theme'],
    },
  })
}

function fixtureDataAllFollowFocus(): NormalizedData {
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

const verticalToolbar: AriaPattern = {
  ...toolbar,
  keyMap: {
    ArrowDown: (ctx) => ctx.focusNext(),
    ArrowUp: (ctx) => ctx.focusPrev(),
    Home: (ctx) => ctx.focusFirst(),
    End: (ctx) => ctx.focusLast(),
    Enter: (ctx) => ctx.activate(),
    Space: (ctx) => ctx.activate(),
  },
  focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
  followFocus: true,
}

function renderWithActivate(
  data: NormalizedData,
  behavior: AriaPattern,
  onActivate: (id: string) => void,
) {
  return render(
    <Aria behavior={behavior} data={data} plugins={[core()]} onActivate={onActivate}>
      <Aria.Item
        render={(props, node, state: NodeState) => (
          <span {...props} data-testid={`item-${node.id}`} data-focused={state.focused}>
            {(node.data as Record<string, unknown>)?.label as string}
          </span>
        )}
      />
    </Aria>,
  )
}

function getNodeElement(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

describe('followFocus + onActivate', () => {
  describe('followFocus=true with onActivate', () => {
    it('calls onActivate when focus moves to a followFocus item (PRD검증#1)', async () => {
      const user = userEvent.setup()
      const onActivate = vi.fn()
      const { container } = renderWithActivate(fixtureData(), verticalToolbar, onActivate)

      const firstNode = getNodeElement(container, 'store')!
      await user.click(firstNode)
      onActivate.mockClear()

      await user.keyboard('{ArrowDown}')
      expect(onActivate).toHaveBeenCalledWith('engine')
    })

    it('does NOT call onActivate when focus moves to entity.data.followFocus=false (PRD검증#2)', async () => {
      const user = userEvent.setup()
      const onActivate = vi.fn()
      const { container } = renderWithActivate(fixtureData(), verticalToolbar, onActivate)

      const engineNode = getNodeElement(container, 'engine')!
      await user.click(engineNode)
      onActivate.mockClear()

      // engine → theme (followFocus=false)
      await user.keyboard('{ArrowDown}')
      expect(onActivate).not.toHaveBeenCalled()
    })

    it('calls onActivate on Enter even for followFocus=false items (PRD검증#3)', async () => {
      const user = userEvent.setup()
      const onActivate = vi.fn()
      const { container } = renderWithActivate(fixtureData(), verticalToolbar, onActivate)

      // Navigate to theme (followFocus=false)
      const engineNode = getNodeElement(container, 'engine')!
      await user.click(engineNode)
      onActivate.mockClear()
      await user.keyboard('{ArrowDown}') // → theme
      expect(onActivate).not.toHaveBeenCalled()

      await user.keyboard('{Enter}')
      expect(onActivate).toHaveBeenCalledWith('theme')
    })

    it('calls onActivate on Space for explicit activation', async () => {
      const user = userEvent.setup()
      const onActivate = vi.fn()
      const { container } = renderWithActivate(fixtureData(), verticalToolbar, onActivate)

      const engineNode = getNodeElement(container, 'engine')!
      await user.click(engineNode)
      onActivate.mockClear()
      await user.keyboard('{ArrowDown}') // → theme

      await user.keyboard('{ }')
      expect(onActivate).toHaveBeenCalledWith('theme')
    })
  })

  describe('tabs behavior has followFocus=true by default', () => {
    it('tabs preset includes followFocus=true (PRD검증#4)', () => {
      expect(tabs.followFocus).toBe(true)
    })

    it('calls onActivate on focus change for tabs (PRD검증#4)', async () => {
      const user = userEvent.setup()
      const onActivate = vi.fn()
      const { container } = renderWithActivate(fixtureDataAllFollowFocus(), tabs, onActivate)

      const firstNode = getNodeElement(container, 'a')!
      await user.click(firstNode)
      onActivate.mockClear()

      await user.keyboard('{ArrowRight}')
      expect(onActivate).toHaveBeenCalledWith('b')
    })
  })

  describe('onActivate not registered', () => {
    it('uses default activate() when onActivate is not provided (PRD검증#5)', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <Aria behavior={toolbar} data={fixtureDataAllFollowFocus()} plugins={[core()]}>
          <Aria.Item
            render={(props, node, state: NodeState) => (
              <span {...props} data-testid={`item-${node.id}`} data-selected={state.selected}>
                {(node.data as Record<string, unknown>)?.label as string}
              </span>
            )}
          />
        </Aria>,
      )

      const firstNode = getNodeElement(container, 'a')!
      await user.click(firstNode)
      await user.keyboard('{Enter}')
      // Default activate selects the item
      const el = container.querySelector('[data-node-id="a"]')
      expect(el?.getAttribute('aria-pressed')).toBe('true')
    })
  })

  describe('followFocus=false (toolbar default)', () => {
    it('toolbar preset does NOT have followFocus=true', () => {
      expect(toolbar.followFocus).toBeUndefined()
    })

    it('does NOT call onActivate on focus change when followFocus is falsy', async () => {
      const user = userEvent.setup()
      const onActivate = vi.fn()
      const toolbarNoFollow: AriaPattern = { ...toolbar }
      const { container } = renderWithActivate(fixtureDataAllFollowFocus(), toolbarNoFollow, onActivate)

      const firstNode = getNodeElement(container, 'a')!
      await user.click(firstNode)
      onActivate.mockClear()

      await user.keyboard('{ArrowRight}')
      expect(onActivate).not.toHaveBeenCalled()
    })

    it('still calls onActivate on Enter even when followFocus is false', async () => {
      const user = userEvent.setup()
      const onActivate = vi.fn()
      const { container } = renderWithActivate(fixtureDataAllFollowFocus(), toolbar, onActivate)

      const firstNode = getNodeElement(container, 'a')!
      await user.click(firstNode)
      onActivate.mockClear()

      await user.keyboard('{Enter}')
      expect(onActivate).toHaveBeenCalledWith('a')
    })
  })

  describe('click activation', () => {
    it('calls onActivate on click when activateOnClick=true (PRD인터페이스)', async () => {
      const user = userEvent.setup()
      const onActivate = vi.fn()
      const { container } = renderWithActivate(fixtureDataAllFollowFocus(), toolbar, onActivate)

      const nodeB = getNodeElement(container, 'b')!
      await user.click(nodeB)
      expect(onActivate).toHaveBeenCalledWith('b')
    })
  })

  describe('Home/End + followFocus', () => {
    it('Home triggers followFocus onActivate', async () => {
      const user = userEvent.setup()
      const onActivate = vi.fn()
      const { container } = renderWithActivate(fixtureDataAllFollowFocus(), verticalToolbar, onActivate)

      // Focus last item first
      const lastNode = getNodeElement(container, 'c')!
      await user.click(lastNode)
      onActivate.mockClear()

      await user.keyboard('{Home}')
      expect(onActivate).toHaveBeenCalledWith('a')
    })
  })

  describe('Tab stop count', () => {
    it('entire container is a single tab stop (PRD검증#9)', async () => {
      const onActivate = vi.fn()
      const { container } = renderWithActivate(fixtureData(), verticalToolbar, onActivate)

      // Only 1 element with tabindex=0 (roving-tabindex)
      const tabbable = container.querySelectorAll('[tabindex="0"]')
      expect(tabbable).toHaveLength(1)
    })
  })
})
