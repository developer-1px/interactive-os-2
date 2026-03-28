// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Meter
 * https://www.w3.org/WAI/ARIA/apg/patterns/meter/examples/meter/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Aria } from '../primitives/aria'
import { meter } from '../pattern/roles/meter'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      battery: { id: 'battery', data: { value: 75, min: 0, max: 100 } },
    },
    relationships: { [ROOT_ID]: ['battery'] },
  })
}

function renderMeter(data: NormalizedData) {
  return render(
    <Aria behavior={meter} data={data} plugins={[]}>
      <Aria.Item render={(props, item, _state: NodeState) => (
        <span {...props} data-testid={`meter-${item.id}`}>
          {String((item.data as Record<string, unknown>)?.value)}%
        </span>
      )} />
    </Aria>,
  )
}

function getNode(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

describe('APG Meter — ARIA Structure', () => {
  it('has role="meter"', () => {
    const { container } = renderMeter(fixtureData())
    expect(container.querySelector('[role="meter"]')).not.toBeNull()
  })

  it('has aria-valuenow', () => {
    const { container } = renderMeter(fixtureData())
    expect(getNode(container, 'battery')?.getAttribute('aria-valuenow')).toBe('75')
  })

  it('has aria-valuemin and aria-valuemax', () => {
    const { container } = renderMeter(fixtureData())
    const node = getNode(container, 'battery')!
    expect(node.getAttribute('aria-valuemin')).toBe('0')
    expect(node.getAttribute('aria-valuemax')).toBe('100')
  })
})
