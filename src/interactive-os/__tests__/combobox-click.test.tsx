/**
 * Integration test: Combobox click interactions
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Combobox } from '../ui/Combobox'
import { createStore } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'
import { core } from '../plugins/core'
import { combobox as comboboxPlugin } from '../plugins/combobox'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      apple: { id: 'apple', data: { label: 'Apple' } },
      banana: { id: 'banana', data: { label: 'Banana' } },
      cherry: { id: 'cherry', data: { label: 'Cherry' } },
    },
    relationships: { [ROOT_ID]: ['apple', 'banana', 'cherry'] },
  })
}

describe('combobox click interaction', () => {
  it('clicking input opens the dropdown', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Combobox
        data={fixtureData()}
        plugins={[core(), comboboxPlugin()]}
        placeholder="Pick a fruit..."
        renderItem={(item, _state, props) => <span {...props}>{(item.data as { label: string }).label}</span>}
      />
    )
    const input = container.querySelector('[role="combobox"]') as HTMLElement
    await user.click(input)
    expect(input.getAttribute('aria-expanded')).toBe('true')
  })

  it('clicking an option in single mode selects and closes', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Combobox
        data={fixtureData()}
        plugins={[core(), comboboxPlugin()]}
        placeholder="Pick a fruit..."
        renderItem={(item, _state, props) => <span {...props}>{(item.data as { label: string }).label}</span>}
      />
    )
    const input = container.querySelector('[role="combobox"]') as HTMLElement
    await user.click(input)
    const option = container.querySelector('[data-node-id="banana"]') as HTMLElement
    await user.click(option)
    expect(input.getAttribute('aria-expanded')).toBe('false')
  })

  it('clicking an option in multiple mode toggles without closing', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Combobox
        data={fixtureData()}
        plugins={[core(), comboboxPlugin()]}
        placeholder="Pick..."
        selectionMode="multiple"
        renderItem={(item, _state, props) => <span {...props}>{(item.data as { label: string }).label}</span>}
      />
    )
    const input = container.querySelector('[role="combobox"]') as HTMLElement
    await user.click(input)
    const option = container.querySelector('[data-node-id="banana"]') as HTMLElement
    await user.click(option)
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(option.getAttribute('aria-selected')).toBe('true')
  })
})
