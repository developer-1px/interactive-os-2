// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Window Splitter (#67)
 * https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../primitives/aria'
import { windowSplitter } from '../pattern/roles/windowSplitter'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function horizontalData(): NormalizedData {
  return createStore({
    entities: {
      splitter: { id: 'splitter', data: { label: 'Primary Content' } },
    },
    relationships: { [ROOT_ID]: ['splitter'] },
  })
}

function verticalData(): NormalizedData {
  return createStore({
    entities: {
      vsplitter: { id: 'vsplitter', data: { label: 'Vertical Splitter' } },
    },
    relationships: { [ROOT_ID]: ['vsplitter'] },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderSplitter(
  data: NormalizedData,
  options: { min: number; max: number; step: number; orientation?: 'horizontal' | 'vertical' },
) {
  return render(
    <Aria behavior={windowSplitter(options)} data={data} plugins={[]}>
      <Aria.Item
        render={(props, item, _state: NodeState) => (
          <div {...props} data-testid={`splitter-${item.id}`} />
        )}
      />
    </Aria>,
  )
}

function getNode(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

function getValueNow(container: HTMLElement, id: string): string | null {
  return getNode(container, id)?.getAttribute('aria-valuenow')
}

// ---------------------------------------------------------------------------
// 1. ARIA Structure — Horizontal (#67)
// ---------------------------------------------------------------------------

describe('APG Window Splitter (#67) — ARIA Structure', () => {
  it('has role="separator"', () => {
    const { container } = renderSplitter(horizontalData(), { min: 0, max: 100, step: 10 })
    expect(container.querySelector('[role="separator"]')).not.toBeNull()
  })

  it('has aria-valuenow', () => {
    const { container } = renderSplitter(horizontalData(), { min: 0, max: 100, step: 10 })
    const node = getNode(container, 'splitter')!
    expect(node.getAttribute('aria-valuenow')).not.toBeNull()
  })

  it('has aria-valuemin', () => {
    const { container } = renderSplitter(horizontalData(), { min: 0, max: 100, step: 10 })
    expect(getNode(container, 'splitter')?.getAttribute('aria-valuemin')).toBe('0')
  })

  it('has aria-valuemax', () => {
    const { container } = renderSplitter(horizontalData(), { min: 0, max: 100, step: 10 })
    expect(getNode(container, 'splitter')?.getAttribute('aria-valuemax')).toBe('100')
  })

  it('has aria-orientation="horizontal" by default', () => {
    const { container } = renderSplitter(horizontalData(), { min: 0, max: 100, step: 10 })
    expect(getNode(container, 'splitter')?.getAttribute('aria-orientation')).toBe('horizontal')
  })

  it('has aria-label when label data is provided', () => {
    const { container } = renderSplitter(horizontalData(), { min: 0, max: 100, step: 10 })
    expect(getNode(container, 'splitter')?.getAttribute('aria-label')).toBe('Primary Content')
  })
})

describe('APG Window Splitter (#67) — ARIA Structure Vertical', () => {
  it('has aria-orientation="vertical"', () => {
    const { container } = renderSplitter(verticalData(), { min: 0, max: 100, step: 10, orientation: 'vertical' })
    expect(getNode(container, 'vsplitter')?.getAttribute('aria-orientation')).toBe('vertical')
  })
})

// ---------------------------------------------------------------------------
// 2. Keyboard — Horizontal (#67)
// ---------------------------------------------------------------------------

describe('APG Window Splitter (#67) — Keyboard (horizontal)', () => {
  it('ArrowRight increases value by step', async () => {
    const user = userEvent.setup()
    const { container } = renderSplitter(horizontalData(), { min: 0, max: 100, step: 10 })

    getNode(container, 'splitter')!.focus()
    await user.keyboard('{ArrowRight}')

    expect(getValueNow(container, 'splitter')).toBe('10')
  })

  it('ArrowLeft decreases value by step', async () => {
    const user = userEvent.setup()
    const { container } = renderSplitter(horizontalData(), { min: 0, max: 100, step: 10 })

    getNode(container, 'splitter')!.focus()
    await user.keyboard('{ArrowRight}')
    await user.keyboard('{ArrowRight}')
    await user.keyboard('{ArrowLeft}')

    expect(getValueNow(container, 'splitter')).toBe('10')
  })

  it('Home sets value to min', async () => {
    const user = userEvent.setup()
    const { container } = renderSplitter(horizontalData(), { min: 0, max: 100, step: 10 })

    getNode(container, 'splitter')!.focus()
    await user.keyboard('{ArrowRight}')
    await user.keyboard('{ArrowRight}')
    await user.keyboard('{Home}')

    expect(getValueNow(container, 'splitter')).toBe('0')
  })

  it('End sets value to max', async () => {
    const user = userEvent.setup()
    const { container } = renderSplitter(horizontalData(), { min: 0, max: 100, step: 10 })

    getNode(container, 'splitter')!.focus()
    await user.keyboard('{End}')

    expect(getValueNow(container, 'splitter')).toBe('100')
  })

  it('does not exceed max', async () => {
    const user = userEvent.setup()
    const { container } = renderSplitter(horizontalData(), { min: 0, max: 100, step: 10 })

    getNode(container, 'splitter')!.focus()
    await user.keyboard('{End}')
    await user.keyboard('{ArrowRight}')

    expect(getValueNow(container, 'splitter')).toBe('100')
  })

  it('does not go below min', async () => {
    const user = userEvent.setup()
    const { container } = renderSplitter(horizontalData(), { min: 0, max: 100, step: 10 })

    getNode(container, 'splitter')!.focus()
    await user.keyboard('{ArrowLeft}')

    expect(getValueNow(container, 'splitter')).toBe('0')
  })
})

// ---------------------------------------------------------------------------
// 3. Keyboard — Vertical (#67)
// ---------------------------------------------------------------------------

describe('APG Window Splitter (#67) — Keyboard (vertical)', () => {
  it('ArrowUp increases value', async () => {
    const user = userEvent.setup()
    const { container } = renderSplitter(verticalData(), { min: 0, max: 100, step: 10, orientation: 'vertical' })

    getNode(container, 'vsplitter')!.focus()
    await user.keyboard('{ArrowUp}')

    expect(getValueNow(container, 'vsplitter')).toBe('10')
  })

  it('ArrowDown decreases value', async () => {
    const user = userEvent.setup()
    const { container } = renderSplitter(verticalData(), { min: 0, max: 100, step: 10, orientation: 'vertical' })

    getNode(container, 'vsplitter')!.focus()
    await user.keyboard('{ArrowUp}')
    await user.keyboard('{ArrowUp}')
    await user.keyboard('{ArrowDown}')

    expect(getValueNow(container, 'vsplitter')).toBe('10')
  })

  it('Home sets value to min', async () => {
    const user = userEvent.setup()
    const { container } = renderSplitter(verticalData(), { min: 0, max: 100, step: 10, orientation: 'vertical' })

    getNode(container, 'vsplitter')!.focus()
    await user.keyboard('{ArrowUp}')
    await user.keyboard('{Home}')

    expect(getValueNow(container, 'vsplitter')).toBe('0')
  })

  it('End sets value to max', async () => {
    const user = userEvent.setup()
    const { container } = renderSplitter(verticalData(), { min: 0, max: 100, step: 10, orientation: 'vertical' })

    getNode(container, 'vsplitter')!.focus()
    await user.keyboard('{End}')

    expect(getValueNow(container, 'vsplitter')).toBe('100')
  })
})
