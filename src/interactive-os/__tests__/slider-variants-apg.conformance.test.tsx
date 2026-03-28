// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Slider Variants (Rating, Vertical Temperature)
 * https://www.w3.org/WAI/ARIA/apg/patterns/slider/examples/slider-rating/
 * https://www.w3.org/WAI/ARIA/apg/patterns/slider/examples/slider-temperature/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../primitives/aria'
import { slider } from '../pattern/roles/slider'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function ratingData(): NormalizedData {
  return createStore({
    entities: {
      rating: { id: 'rating', data: { label: 'Rating', value: 5 } },
    },
    relationships: { [ROOT_ID]: ['rating'] },
  })
}

function temperatureData(): NormalizedData {
  return createStore({
    entities: {
      temp: { id: 'temp', data: { label: 'Temperature', value: 70 } },
    },
    relationships: { [ROOT_ID]: ['temp'] },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderSlider(data: NormalizedData, options: { min: number; max: number; step: number; orientation?: 'horizontal' | 'vertical' }) {
  return render(
    <Aria pattern={slider(options)} data={data} plugins={[]}>
      <Aria.Item render={(props, item, _state: NodeState) => (
        <span {...props} data-testid={`slider-${item.id}`}>
          {(item.data as Record<string, unknown>)?.label as string}
        </span>
      )} />
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
// 1. Rating Slider (#49) — horizontal, 0-10, step=1
// ---------------------------------------------------------------------------

describe('APG Slider Rating (#49) — ARIA Structure', () => {
  it('has role="slider"', () => {
    const { container } = renderSlider(ratingData(), { min: 0, max: 10, step: 1 })
    expect(container.querySelector('[role="slider"]')).not.toBeNull()
  })

  it('has aria-valuemin, aria-valuemax, aria-valuenow', () => {
    const { container } = renderSlider(ratingData(), { min: 0, max: 10, step: 1 })
    const node = getNode(container, 'rating')!
    expect(node.getAttribute('aria-valuemin')).toBe('0')
    expect(node.getAttribute('aria-valuemax')).toBe('10')
    expect(node.getAttribute('aria-valuenow')).toBe('0')
  })

  it('has aria-label', () => {
    const { container } = renderSlider(ratingData(), { min: 0, max: 10, step: 1 })
    expect(getNode(container, 'rating')?.getAttribute('aria-label')).toBe('Rating')
  })
})

describe('APG Slider Rating (#49) — Keyboard', () => {
  it('ArrowRight increments value by step', async () => {
    const user = userEvent.setup()
    const { container } = renderSlider(ratingData(), { min: 0, max: 10, step: 1 })

    getNode(container, 'rating')!.focus()
    await user.keyboard('{ArrowRight}')

    expect(getValueNow(container, 'rating')).toBe('1')
  })

  it('ArrowLeft decrements value by step', async () => {
    const user = userEvent.setup()
    const { container } = renderSlider(ratingData(), { min: 0, max: 10, step: 1 })

    getNode(container, 'rating')!.focus()
    await user.keyboard('{ArrowRight}')
    await user.keyboard('{ArrowRight}')
    await user.keyboard('{ArrowLeft}')

    expect(getValueNow(container, 'rating')).toBe('1')
  })

  it('Home sets value to min', async () => {
    const user = userEvent.setup()
    const { container } = renderSlider(ratingData(), { min: 0, max: 10, step: 1 })

    getNode(container, 'rating')!.focus()
    await user.keyboard('{ArrowRight}')
    await user.keyboard('{ArrowRight}')
    await user.keyboard('{Home}')

    expect(getValueNow(container, 'rating')).toBe('0')
  })

  it('End sets value to max', async () => {
    const user = userEvent.setup()
    const { container } = renderSlider(ratingData(), { min: 0, max: 10, step: 1 })

    getNode(container, 'rating')!.focus()
    await user.keyboard('{End}')

    expect(getValueNow(container, 'rating')).toBe('10')
  })

  it('does not exceed max', async () => {
    const user = userEvent.setup()
    const { container } = renderSlider(ratingData(), { min: 0, max: 10, step: 1 })

    getNode(container, 'rating')!.focus()
    await user.keyboard('{End}')
    await user.keyboard('{ArrowRight}')

    expect(getValueNow(container, 'rating')).toBe('10')
  })
})

// ---------------------------------------------------------------------------
// 2. Vertical Temperature Slider (#51) — vertical, 50-100, step=1
// ---------------------------------------------------------------------------

describe('APG Slider Vertical Temperature (#51) — ARIA Structure', () => {
  it('has correct aria-valuemin/max', () => {
    const { container } = renderSlider(temperatureData(), { min: 50, max: 100, step: 1, orientation: 'vertical' })
    const node = getNode(container, 'temp')!
    expect(node.getAttribute('aria-valuemin')).toBe('50')
    expect(node.getAttribute('aria-valuemax')).toBe('100')
  })

  it('has aria-label', () => {
    const { container } = renderSlider(temperatureData(), { min: 50, max: 100, step: 1, orientation: 'vertical' })
    expect(getNode(container, 'temp')?.getAttribute('aria-label')).toBe('Temperature')
  })
})

describe('APG Slider Vertical Temperature (#51) — Keyboard', () => {
  it('ArrowUp increments value (vertical orientation)', async () => {
    const user = userEvent.setup()
    const { container } = renderSlider(temperatureData(), { min: 50, max: 100, step: 1, orientation: 'vertical' })

    getNode(container, 'temp')!.focus()
    await user.keyboard('{ArrowUp}')

    expect(getValueNow(container, 'temp')).toBe('51')
  })

  it('ArrowDown decrements value (vertical orientation)', async () => {
    const user = userEvent.setup()
    const { container } = renderSlider(temperatureData(), { min: 50, max: 100, step: 1, orientation: 'vertical' })

    getNode(container, 'temp')!.focus()
    await user.keyboard('{ArrowUp}')
    await user.keyboard('{ArrowUp}')
    await user.keyboard('{ArrowDown}')

    expect(getValueNow(container, 'temp')).toBe('51')
  })

  it('Home sets value to min', async () => {
    const user = userEvent.setup()
    const { container } = renderSlider(temperatureData(), { min: 50, max: 100, step: 1, orientation: 'vertical' })

    getNode(container, 'temp')!.focus()
    await user.keyboard('{ArrowUp}')
    await user.keyboard('{Home}')

    expect(getValueNow(container, 'temp')).toBe('50')
  })

  it('End sets value to max', async () => {
    const user = userEvent.setup()
    const { container } = renderSlider(temperatureData(), { min: 50, max: 100, step: 1, orientation: 'vertical' })

    getNode(container, 'temp')!.focus()
    await user.keyboard('{End}')

    expect(getValueNow(container, 'temp')).toBe('100')
  })
})

// ---------------------------------------------------------------------------
// 3. Media Seek Slider (#50) — horizontal, 0-100, step=1
// ---------------------------------------------------------------------------

describe('APG Slider Media Seek (#50) — ARIA Structure', () => {
  it('has role="slider"', () => {
    const seekData = createStore({
      entities: { seek: { id: 'seek', data: { label: 'Media Seek', value: 0 } } },
      relationships: { [ROOT_ID]: ['seek'] },
    })
    const { container } = renderSlider(seekData, { min: 0, max: 100, step: 1 })
    expect(container.querySelector('[role="slider"]')).not.toBeNull()
  })

  it('has correct value range', () => {
    const seekData = createStore({
      entities: { seek: { id: 'seek', data: { label: 'Media Seek', value: 0 } } },
      relationships: { [ROOT_ID]: ['seek'] },
    })
    const { container } = renderSlider(seekData, { min: 0, max: 100, step: 1 })
    const node = getNode(container, 'seek')!
    expect(node.getAttribute('aria-valuemin')).toBe('0')
    expect(node.getAttribute('aria-valuemax')).toBe('100')
  })
})

describe('APG Slider Media Seek (#50) — Keyboard', () => {
  it('ArrowRight increments', async () => {
    const user = userEvent.setup()
    const seekData = createStore({
      entities: { seek: { id: 'seek', data: { label: 'Media Seek', value: 0 } } },
      relationships: { [ROOT_ID]: ['seek'] },
    })
    const { container } = renderSlider(seekData, { min: 0, max: 100, step: 1 })
    getNode(container, 'seek')!.focus()
    await user.keyboard('{ArrowRight}')
    expect(getValueNow(container, 'seek')).toBe('1')
  })
})
