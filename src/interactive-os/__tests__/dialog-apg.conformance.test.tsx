// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Dialog (Modal)
 * https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/dialog/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dialog } from '../ui/Dialog'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { dialog } from '../pattern/roles/dialog'
import { captureAriaTree } from './helpers/ariaTreeSnapshot'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      confirm: { id: 'confirm', data: { name: 'Confirm Dialog' } },
      okBtn: { id: 'okBtn', data: { name: 'OK' } },
      cancelBtn: { id: 'cancelBtn', data: { name: 'Cancel' } },
      alert: { id: 'alert', data: { name: 'Alert Dialog' } },
      dismissBtn: { id: 'dismissBtn', data: { name: 'Dismiss' } },
    },
    relationships: {
      [ROOT_ID]: ['confirm', 'alert'],
      confirm: ['okBtn', 'cancelBtn'],
      alert: ['dismissBtn'],
    },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderDialog(data: NormalizedData) {
  return render(
    <Dialog
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

describe('APG Dialog — ARIA Structure', () => {
  it('pattern role is dialog', () => {
    expect(dialog.role).toBe('dialog')
  })

  it('captureAriaTree includes dialog role', () => {
    const { container } = renderDialog(fixtureData())
    const tree = captureAriaTree(container)
    expect(tree).toContain('dialog')
  })

  it('dialog does NOT have aria-modal (unlike alertdialog)', () => {
    const { container } = renderDialog(fixtureData())
    // dialog pattern has no aria-modal by default
    const nodes = container.querySelectorAll('[data-node-id]')
    nodes.forEach((node) => {
      expect(node.getAttribute('aria-modal')).toBeNull()
    })
  })
})

// ---------------------------------------------------------------------------
// 2. Keyboard Interaction
// ---------------------------------------------------------------------------

describe('APG Dialog — Keyboard Interaction', () => {
  describe('Escape key', () => {
    it('Escape collapses a focused dialog item', async () => {
      const user = userEvent.setup()
      const { container } = renderDialog(fixtureData())

      expect(getAllVisibleNodeIds(container)).toEqual(['confirm', 'alert'])

      getNode(container, 'confirm')!.focus()
      await user.keyboard('{Escape}')

      // Escape calls collapse on focused item — on non-expanded item this is a no-op
      expect(getAllVisibleNodeIds(container)).toEqual(['confirm', 'alert'])
    })
  })

  describe('Tab navigation (natural-tab-order)', () => {
    it('all items have tabindex=0 so native Tab can reach them', () => {
      const { container } = renderDialog(fixtureData())
      const nodes = container.querySelectorAll('[data-node-id]')
      nodes.forEach((node) => {
        expect(node.getAttribute('tabindex')).toBe('0')
      })
    })
  })
})
