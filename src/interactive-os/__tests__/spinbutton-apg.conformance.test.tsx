// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Spinbutton (Quantity)
 * https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/examples/quantity-spinbutton/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../primitives/aria'
import { spinbutton } from '../pattern/roles/spinbutton'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import { captureAriaTree } from './helpers/ariaTreeSnapshot'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      input: { id: 'input', data: { label: 'Quantity' } },
    },
    relationships: {
      [ROOT_ID]: ['input'],
    },
  })
}

const spinBehavior = spinbutton({ min: 0, max: 10, step: 1 })

function renderSpinbutton(data: NormalizedData) {
  return render(
    <Aria behavior={spinBehavior} data={data} plugins={[]}>
      <Aria.Item render={(props, item, _state) => (
        <span {...props}>{(item.data as Record<string, unknown>)?.label as string}</span>
      )} />
    </Aria>,
  )
}

function getSpinEl(container: HTMLElement): Element | null {
  return container.querySelector('[role="spinbutton"]')
}

function getValueNow(container: HTMLElement): string | null {
  return getSpinEl(container)?.getAttribute('aria-valuenow') ?? null
}

function focusSpin(container: HTMLElement): void {
  container.querySelector<HTMLElement>('[data-node-id="input"]')!.focus()
}

// ---------------------------------------------------------------------------
// 1. ARIA Tree Structure
// ---------------------------------------------------------------------------

describe('APG Spinbutton — ARIA Tree Structure', () => {
  it('has role="spinbutton"', () => {
    const { container } = renderSpinbutton(fixtureData())
    expect(getSpinEl(container)).toBeTruthy()
  })

  it('aria-valuenow starts at min (0)', () => {
    const { container } = renderSpinbutton(fixtureData())
    expect(getValueNow(container)).toBe('0')
  })

  it('aria-valuemin is set to 0', () => {
    const { container } = renderSpinbutton(fixtureData())
    expect(getSpinEl(container)?.getAttribute('aria-valuemin')).toBe('0')
  })

  it('aria-valuemax is set to 10', () => {
    const { container } = renderSpinbutton(fixtureData())
    expect(getSpinEl(container)?.getAttribute('aria-valuemax')).toBe('10')
  })

  it('aria-label is set from item data', () => {
    const { container } = renderSpinbutton(fixtureData())
    expect(getSpinEl(container)?.getAttribute('aria-label')).toBe('Quantity')
  })

  it('captureAriaTree includes valuenow/min/max', () => {
    const { container } = renderSpinbutton(fixtureData())
    const tree = captureAriaTree(container)
    expect(tree).toContain('valuenow=0')
    expect(tree).toContain('valuemin=0')
    expect(tree).toContain('valuemax=10')
  })
})

// ---------------------------------------------------------------------------
// 2. Keyboard Interaction
// ---------------------------------------------------------------------------

describe('APG Spinbutton — Keyboard Interaction', () => {
  describe('ArrowUp', () => {
    it('ArrowUp increments value by step', async () => {
      const user = userEvent.setup()
      const { container } = renderSpinbutton(fixtureData())
      focusSpin(container)
      await user.keyboard('{ArrowUp}')
      expect(getValueNow(container)).toBe('1')
    })

    it('ArrowUp increments multiple times', async () => {
      const user = userEvent.setup()
      const { container } = renderSpinbutton(fixtureData())
      focusSpin(container)
      await user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}')
      expect(getValueNow(container)).toBe('3')
    })

    it('ArrowUp clamps at max', async () => {
      const user = userEvent.setup()
      const { container } = renderSpinbutton(fixtureData())
      focusSpin(container)
      await user.keyboard('{End}{ArrowUp}')
      expect(getValueNow(container)).toBe('10')
    })
  })

  describe('ArrowDown', () => {
    it('ArrowDown decrements value by step', async () => {
      const user = userEvent.setup()
      const { container } = renderSpinbutton(fixtureData())
      focusSpin(container)
      await user.keyboard('{ArrowUp}{ArrowUp}{ArrowDown}')
      expect(getValueNow(container)).toBe('1')
    })

    it('ArrowDown clamps at min', async () => {
      const user = userEvent.setup()
      const { container } = renderSpinbutton(fixtureData())
      focusSpin(container)
      await user.keyboard('{ArrowDown}')
      expect(getValueNow(container)).toBe('0')
    })
  })

  describe('ArrowRight / ArrowLeft (vertical only)', () => {
    it('ArrowRight does nothing (spinbutton is vertical only)', async () => {
      const user = userEvent.setup()
      const { container } = renderSpinbutton(fixtureData())
      focusSpin(container)
      await user.keyboard('{ArrowRight}')
      expect(getValueNow(container)).toBe('0')
    })

    it('ArrowLeft does nothing (spinbutton is vertical only)', async () => {
      const user = userEvent.setup()
      const { container } = renderSpinbutton(fixtureData())
      focusSpin(container)
      await user.keyboard('{ArrowUp}{ArrowLeft}')
      expect(getValueNow(container)).toBe('1')
    })
  })

  describe('Home / End', () => {
    it('End sets value to max', async () => {
      const user = userEvent.setup()
      const { container } = renderSpinbutton(fixtureData())
      focusSpin(container)
      await user.keyboard('{End}')
      expect(getValueNow(container)).toBe('10')
    })

    it('Home sets value to min', async () => {
      const user = userEvent.setup()
      const { container } = renderSpinbutton(fixtureData())
      focusSpin(container)
      await user.keyboard('{End}{Home}')
      expect(getValueNow(container)).toBe('0')
    })
  })

  describe('PageUp / PageDown (big step = step × 10)', () => {
    it('PageUp increments by large step (step × 10)', async () => {
      const user = userEvent.setup()
      const { container } = renderSpinbutton(fixtureData())
      focusSpin(container)
      // step=1, bigStep=10; 0+10=10 (max)
      await user.keyboard('{PageUp}')
      expect(getValueNow(container)).toBe('10')
    })

    it('PageDown decrements by large step (step × 10)', async () => {
      const user = userEvent.setup()
      const { container } = renderSpinbutton(fixtureData())
      focusSpin(container)
      // Go to 5 first, then PageDown by 10 → clamps to 0
      await user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}')
      await user.keyboard('{PageDown}')
      expect(getValueNow(container)).toBe('0')
    })
  })
})

// ---------------------------------------------------------------------------
// 3. Boundary clamping
// ---------------------------------------------------------------------------

describe('APG Spinbutton — Boundary Clamping', () => {
  it('value never goes below min', async () => {
    const user = userEvent.setup()
    const { container } = renderSpinbutton(fixtureData())
    focusSpin(container)
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')
    expect(getValueNow(container)).toBe('0')
  })

  it('value never goes above max', async () => {
    const user = userEvent.setup()
    const { container } = renderSpinbutton(fixtureData())
    focusSpin(container)
    await user.keyboard('{End}{ArrowUp}{ArrowUp}')
    expect(getValueNow(container)).toBe('10')
  })
})
