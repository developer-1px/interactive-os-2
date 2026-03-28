// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Slider (Color Viewer)
 * https://www.w3.org/WAI/ARIA/apg/patterns/slider/examples/slider-color-viewer/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { Aria } from '../primitives/aria'
import { slider } from '../pattern/roles/slider'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import { history } from '../plugins/history'
import { captureAriaTree } from './helpers/ariaTreeSnapshot'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      thumb: { id: 'thumb', data: { label: 'Volume' } },
    },
    relationships: {
      [ROOT_ID]: ['thumb'],
    },
  })
}

const sliderBehavior = slider({ min: 0, max: 100, step: 1 })

function renderSlider(data: NormalizedData, plugins = [history()]) {
  return render(
    <Aria behavior={sliderBehavior} data={data} plugins={plugins}>
      <Aria.Item
        render={(props, item, _state) => (
          <span {...props} data-testid="slider-thumb">
            {(item.data as Record<string, unknown>)?.label as string}
          </span>
        )}
      />
    </Aria>,
  )
}

function getSlider(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[role="slider"]')
}

function getValueNow(container: HTMLElement): string | null {
  return getSlider(container)?.getAttribute('aria-valuenow') ?? null
}

// ---------------------------------------------------------------------------
// 1. ARIA Structure
// ---------------------------------------------------------------------------

describe('APG Slider — ARIA Structure', () => {
  it('slider element has role="slider"', () => {
    const { container } = renderSlider(fixtureData())
    expect(getSlider(container)).not.toBeNull()
  })

  it('slider has aria-valuemin and aria-valuemax', () => {
    const { container } = renderSlider(fixtureData())
    const el = getSlider(container)
    expect(el?.getAttribute('aria-valuemin')).toBe('0')
    expect(el?.getAttribute('aria-valuemax')).toBe('100')
  })

  it('slider has initial aria-valuenow=0', () => {
    const { container } = renderSlider(fixtureData())
    expect(getValueNow(container)).toBe('0')
  })

  it('captureAriaTree includes valuenow/min/max', () => {
    const { container } = renderSlider(fixtureData())
    const tree = captureAriaTree(container)
    expect(tree).toContain('valuenow=0')
    expect(tree).toContain('valuemin=0')
    expect(tree).toContain('valuemax=100')
  })
})

// ---------------------------------------------------------------------------
// 2. Keyboard Interaction
// ---------------------------------------------------------------------------

describe('APG Slider — Keyboard Interaction', () => {
  describe('ArrowRight / ArrowUp — increment', () => {
    it('ArrowRight increments value by step', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      getSlider(container)!.focus()
      await user.keyboard('{ArrowRight}')
      expect(getValueNow(container)).toBe('1')
    })

    it('ArrowUp increments value', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      getSlider(container)!.focus()
      await user.keyboard('{ArrowUp}')
      expect(getValueNow(container)).toBe('1')
    })
  })

  describe('ArrowLeft / ArrowDown — decrement', () => {
    it('ArrowLeft decrements value by step', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      getSlider(container)!.focus()
      await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')
      await user.keyboard('{ArrowLeft}')
      expect(getValueNow(container)).toBe('2')
    })

    it('ArrowDown decrements value', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      getSlider(container)!.focus()
      await user.keyboard('{ArrowUp}{ArrowUp}{ArrowDown}')
      expect(getValueNow(container)).toBe('1')
    })
  })

  describe('Home / End', () => {
    it('Home sets value to min', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      getSlider(container)!.focus()
      await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')
      await user.keyboard('{Home}')
      expect(getValueNow(container)).toBe('0')
    })

    it('End sets value to max', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      getSlider(container)!.focus()
      await user.keyboard('{End}')
      expect(getValueNow(container)).toBe('100')
    })
  })

  describe('PageUp / PageDown', () => {
    it('PageUp increments by step*10', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      getSlider(container)!.focus()
      await user.keyboard('{PageUp}')
      expect(getValueNow(container)).toBe('10')
    })

    it('PageDown at min clamps to min', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      getSlider(container)!.focus()
      await user.keyboard('{PageDown}')
      expect(getValueNow(container)).toBe('0')
    })
  })
})

// ---------------------------------------------------------------------------
// 3. Clamping
// ---------------------------------------------------------------------------

describe('APG Slider — Clamping', () => {
  it('does not exceed max', async () => {
    const user = userEvent.setup()
    const { container } = renderSlider(fixtureData())
    getSlider(container)!.focus()
    await user.keyboard('{End}{ArrowRight}')
    expect(getValueNow(container)).toBe('100')
  })

  it('does not go below min', async () => {
    const user = userEvent.setup()
    const { container } = renderSlider(fixtureData())
    getSlider(container)!.focus()
    await user.keyboard('{ArrowLeft}')
    expect(getValueNow(container)).toBe('0')
  })
})

// ---------------------------------------------------------------------------
// 4. Undo/Redo (history plugin)
// ---------------------------------------------------------------------------

describe('APG Slider — Undo/Redo', () => {
  it('Ctrl+Z restores previous value', async () => {
    const user = userEvent.setup()
    const { container } = renderSlider(fixtureData())
    getSlider(container)!.focus()
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')
    expect(getValueNow(container)).toBe('3')
    await user.keyboard('{Control>}z{/Control}')
    expect(getValueNow(container)).toBe('2')
  })
})

// ---------------------------------------------------------------------------
// 5. Accessibility (axe-core)
// ---------------------------------------------------------------------------

describe('APG Slider — Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderSlider(fixtureData())
    const results = await axe.run(container, {
      rules: {
        'color-contrast': { enabled: false },
        region: { enabled: false },
      },
    })
    expect(results.violations).toEqual([])
  })
})
