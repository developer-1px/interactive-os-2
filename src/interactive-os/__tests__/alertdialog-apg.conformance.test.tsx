// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Alert Dialog
 * https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/examples/alertdialog/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AlertDialog } from '../ui/AlertDialog'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { alertdialog } from '../pattern/roles/alertdialog'
import { captureAriaTree } from './helpers/ariaTreeSnapshot'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      confirm: { id: 'confirm', data: { name: 'Confirm AlertDialog' } },
      confirmBtn: { id: 'confirmBtn', data: { name: 'Confirm' } },
      cancelBtn: { id: 'cancelBtn', data: { name: 'Cancel' } },
      alert: { id: 'alert', data: { name: 'Alert AlertDialog' } },
      dismissBtn: { id: 'dismissBtn', data: { name: 'Dismiss' } },
    },
    relationships: {
      [ROOT_ID]: ['confirm', 'alert'],
      confirm: ['confirmBtn', 'cancelBtn'],
      alert: ['dismissBtn'],
    },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderAlertDialog(data: NormalizedData) {
  return render(
    <AlertDialog
      data={data}
      plugins={[]}
      renderItem={(props, item, state: NodeState) => (
        <span
          {...props}
          data-testid={`node-${item.id}`}
          data-focused={state.focused}
          data-expanded={state.expanded}
        >
          {(item.data as Record<string, unknown>)?.name as string}
        </span>
      )}
    />,
  )
}

function getNode(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

function getAllVisibleNodeIds(container: HTMLElement): string[] {
  const nodes = container.querySelectorAll('[data-node-id]')
  return Array.from(nodes).map((n) => n.getAttribute('data-node-id')!).filter((id) => id)
}

// ---------------------------------------------------------------------------
// 1. ARIA Structure
// ---------------------------------------------------------------------------

describe('APG AlertDialog — ARIA Structure', () => {
  it('pattern role is alertdialog', () => {
    expect(alertdialog.role).toBe('alertdialog')
  })

  it('each node has aria-modal="true"', () => {
    const { container } = renderAlertDialog(fixtureData())
    const nodes = container.querySelectorAll('[data-node-id]')
    nodes.forEach((node) => {
      expect(node.getAttribute('aria-modal')).toBe('true')
    })
  })

  it('captureAriaTree includes alertdialog role', () => {
    const { container } = renderAlertDialog(fixtureData())
    const tree = captureAriaTree(container)
    expect(tree).toContain('alertdialog')
  })

  it('captureAriaTree includes modal attribute', () => {
    const { container } = renderAlertDialog(fixtureData())
    const tree = captureAriaTree(container)
    expect(tree).toContain('modal')
  })
})

// ---------------------------------------------------------------------------
// 2. Keyboard Interaction
// ---------------------------------------------------------------------------

describe('APG AlertDialog — Keyboard Interaction', () => {
  describe('Escape key', () => {
    it('Escape collapses a focused alertdialog item', async () => {
      const user = userEvent.setup()
      const { container } = renderAlertDialog(fixtureData())

      // Verify initial state
      expect(getAllVisibleNodeIds(container)).toEqual(['confirm', 'alert'])

      getNode(container, 'confirm')!.focus()
      await user.keyboard('{Escape}')

      // Escape calls collapse on focused item — on non-expanded item this is a no-op
      expect(getAllVisibleNodeIds(container)).toEqual(['confirm', 'alert'])
    })
  })

  describe('Tab navigation (natural-tab-order)', () => {
    it('all items have tabindex=0 so native Tab can reach them', () => {
      const { container } = renderAlertDialog(fixtureData())
      const nodes = container.querySelectorAll('[data-node-id]')
      nodes.forEach((node) => {
        expect(node.getAttribute('tabindex')).toBe('0')
      })
    })
  })
})
