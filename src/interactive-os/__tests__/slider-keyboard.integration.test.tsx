/**
 * Integration test: Slider keyboard interactions
 *
 * Tests the full user flow: render -> keyboard input -> aria-valuenow result.
 * Slider is a single-node widget with role="slider" on the thumb element.
 */
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { Aria } from '../primitives/aria'
import { slider } from '../pattern/slider'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import { core } from '../plugins/core'
import { history } from '../plugins/history'

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

function renderSlider(data: NormalizedData, plugins = [core(), history()]) {
  return render(
    <Aria behavior={sliderBehavior} data={data} plugins={plugins}>
      <Aria.Item render={(props, item, _state) => (
        <span {...props} data-testid="slider-thumb">
          {(item.data as Record<string, unknown>)?.label as string}
        </span>
      )} />
    </Aria>
  )
}

function getSliderElement(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[role="slider"]')
}

function getAriaValueNow(container: HTMLElement): string | null {
  return getSliderElement(container)?.getAttribute('aria-valuenow') ?? null
}

describe('Slider keyboard integration', () => {
  describe('increment/decrement', () => {
    it('ArrowRight increments value by step', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      getSliderElement(container)!.focus()
      await user.keyboard('{ArrowRight}')
      expect(getAriaValueNow(container)).toBe('1')
    })

    it('ArrowLeft decrements value by step', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      getSliderElement(container)!.focus()
      await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')
      await user.keyboard('{ArrowLeft}')
      expect(getAriaValueNow(container)).toBe('2')
    })

    it('ArrowUp increments value', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      getSliderElement(container)!.focus()
      await user.keyboard('{ArrowUp}')
      expect(getAriaValueNow(container)).toBe('1')
    })

    it('ArrowDown decrements value', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      getSliderElement(container)!.focus()
      await user.keyboard('{ArrowUp}{ArrowUp}{ArrowDown}')
      expect(getAriaValueNow(container)).toBe('1')
    })
  })

  describe('Home/End', () => {
    it('Home sets value to min', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      getSliderElement(container)!.focus()
      await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')
      await user.keyboard('{Home}')
      expect(getAriaValueNow(container)).toBe('0')
    })

    it('End sets value to max', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      getSliderElement(container)!.focus()
      await user.keyboard('{End}')
      expect(getAriaValueNow(container)).toBe('100')
    })
  })

  describe('PageUp/PageDown', () => {
    it('PageUp increments by step*10', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      getSliderElement(container)!.focus()
      await user.keyboard('{PageUp}')
      expect(getAriaValueNow(container)).toBe('10')
    })

    it('PageDown at min clamps to min', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      getSliderElement(container)!.focus()
      await user.keyboard('{PageDown}')
      expect(getAriaValueNow(container)).toBe('0')
    })
  })

  describe('clamping', () => {
    it('does not exceed max', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      getSliderElement(container)!.focus()
      await user.keyboard('{End}{ArrowRight}')
      expect(getAriaValueNow(container)).toBe('100')
    })

    it('does not go below min', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      getSliderElement(container)!.focus()
      await user.keyboard('{ArrowLeft}')
      expect(getAriaValueNow(container)).toBe('0')
    })
  })

  describe('undo/redo', () => {
    it('Mod+Z restores previous value', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      getSliderElement(container)!.focus()
      await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')
      expect(getAriaValueNow(container)).toBe('3')
      await user.keyboard('{Control>}z{/Control}')
      expect(getAriaValueNow(container)).toBe('2')
    })
  })

  describe('ARIA attributes', () => {
    it('renders aria-valuemin and aria-valuemax', () => {
      const { container } = renderSlider(fixtureData())
      const el = getSliderElement(container)
      expect(el?.getAttribute('aria-valuemin')).toBe('0')
      expect(el?.getAttribute('aria-valuemax')).toBe('100')
    })
  })

  describe('accessibility (axe-core)', () => {
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

    it('slider element has correct aria-valuenow/min/max attributes', () => {
      const { container } = renderSlider(fixtureData())
      const el = getSliderElement(container)
      expect(el?.getAttribute('aria-valuenow')).toBe('0')
      expect(el?.getAttribute('aria-valuemin')).toBe('0')
      expect(el?.getAttribute('aria-valuemax')).toBe('100')
    })
  })

  describe('onChange callback', () => {
    it('fires onChange with updated store after value change', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      const { container } = render(
        <Aria behavior={sliderBehavior} data={fixtureData()} plugins={[core()]} onChange={onChange}>
          <Aria.Item render={(props, item, _state) => (
            <span {...props}>{(item.data as Record<string, unknown>)?.label as string}</span>
          )} />
        </Aria>
      )
      getSliderElement(container)!.focus()
      await user.keyboard('{ArrowRight}')
      expect(onChange).toHaveBeenCalled()
      const newStore = onChange.mock.calls[onChange.mock.calls.length - 1][0]
      expect((newStore.entities['__value__'] as Record<string, unknown>).value).toBe(1)
    })
  })
})
