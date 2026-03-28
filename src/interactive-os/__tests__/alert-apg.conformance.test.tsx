// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Alert
 * https://www.w3.org/WAI/ARIA/apg/patterns/alert/examples/alert/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Aria } from '../primitives/aria'
import { alert } from '../pattern/examples/alert'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      msg: { id: 'msg', data: { text: 'Error: Invalid entry' } },
    },
    relationships: { [ROOT_ID]: ['msg'] },
  })
}

function renderAlert(data: NormalizedData) {
  return render(
    <Aria behavior={alert} data={data} plugins={[]}>
      <Aria.Item render={(props, item, _state: NodeState) => (
        <span {...props}>{(item.data as Record<string, unknown>)?.text as string}</span>
      )} />
    </Aria>,
  )
}

describe('APG Alert — ARIA Structure', () => {
  it('has role="alert"', () => {
    const { container } = renderAlert(fixtureData())
    expect(container.querySelector('[role="alert"]')).not.toBeNull()
  })

  it('alert content is rendered', () => {
    const { container } = renderAlert(fixtureData())
    expect(container.textContent).toContain('Error: Invalid entry')
  })
})
