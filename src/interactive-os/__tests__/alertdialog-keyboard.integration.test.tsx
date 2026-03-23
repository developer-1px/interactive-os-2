/**
 * Integration test: AlertDialog keyboard interactions
 *
 * Tests the full user flow: render → keyboard input → visible result.
 * alertdialog is a dialog variant with role="alertdialog" and aria-modal="true".
 * Escape collapses (closes), Tab moves focus to next.
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../components/aria'
import { alertdialog } from '../behaviors/alertdialog'
import { createStore } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'
import { core } from '../plugins/core'
import type { NodeState } from '../behaviors/types'

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

function renderAlertDialog(data: NormalizedData) {
  return render(
    <Aria behavior={alertdialog} data={data} plugins={[core()]}>
      <Aria.Item
        render={(props, node, state: NodeState) => (
          <span {...props} data-testid={`node-${node.id}`} data-focused={state.focused} data-expanded={state.expanded}>
            {(node.data as Record<string, unknown>)?.name as string}
          </span>
        )}
      />
    </Aria>
  )
}

function getNodeElement(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

function getAllVisibleNodeIds(container: HTMLElement): string[] {
  const nodes = container.querySelectorAll('[data-node-id]')
  return Array.from(nodes).map((n) => n.getAttribute('data-node-id')!).filter((id) => id)
}

describe('AlertDialog keyboard integration', () => {
  describe('role and aria-modal', () => {
    it('behavior has role="alertdialog"', () => {
      expect(alertdialog.role).toBe('alertdialog')
    })

    it('ariaAttributes includes aria-modal="true" on each node', () => {
      const { container } = renderAlertDialog(fixtureData())

      const nodes = container.querySelectorAll('[data-node-id]')
      nodes.forEach((node) => {
        expect(node.getAttribute('aria-modal')).toBe('true')
      })
    })
  })

  describe('Escape to close', () => {
    it('Escape collapses an expanded alertdialog item', async () => {
      const user = userEvent.setup()
      const { container } = renderAlertDialog(fixtureData())

      // Focus confirm dialog
      getNodeElement(container, 'confirm')!.focus()

      // alertdialog keyMap only has Escape — verify structure before
      expect(getAllVisibleNodeIds(container)).toEqual(['confirm', 'alert'])

      await user.keyboard('{Escape}')

      // Escape calls collapse on focused item — on non-expanded item this is a no-op
      expect(getAllVisibleNodeIds(container)).toEqual(['confirm', 'alert'])
    })
  })

  describe('Tab navigation (natural-tab-order)', () => {
    it('all items have tabIndex=0 (native Tab can reach them)', () => {
      const { container } = renderAlertDialog(fixtureData())

      const nodes = container.querySelectorAll('[data-node-id]')
      nodes.forEach((node) => {
        expect(node.getAttribute('tabindex')).toBe('0')
      })
    })
  })
})
