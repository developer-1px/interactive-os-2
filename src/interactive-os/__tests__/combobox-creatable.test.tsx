import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Combobox } from '../ui/Combobox'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import { core } from '../plugins/core'
import { combobox as comboboxPlugin } from '../plugins/combobox'
import type { NodeState } from '../pattern/types'
import { useState } from 'react'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      apple: { id: 'apple', data: { label: 'Apple' } },
      banana: { id: 'banana', data: { label: 'Banana' } },
    },
    relationships: { [ROOT_ID]: ['apple', 'banana'] },
  })
}

function CreatableHarness() {
  const [data, setData] = useState(fixtureData)
  return (
    <Combobox
      data={data}
      plugins={[core(), comboboxPlugin()]}
      placeholder="Pick or create..."
      editable
      creatable
      onChange={setData}
      renderItem={(props, item, state: NodeState) => (
        <span {...props} data-focused={state.focused}>
          {(item.data as Record<string, unknown>)?.label as string}
        </span>
      )}
    />
  )
}

describe('Creatable combobox', () => {
  it('typing a non-matching value shows Create option', async () => {
    const user = userEvent.setup()
    render(<CreatableHarness />)
    const input = screen.getByRole('combobox')

    await user.click(input)
    await user.type(input, 'Mango')

    expect(screen.getByText(/Create/)).toBeTruthy()
  })

  it('ArrowDown to Create option then Enter creates new item', async () => {
    const user = userEvent.setup()
    render(<CreatableHarness />)
    const input = screen.getByRole('combobox')

    await user.click(input)
    await user.type(input, 'Mango')
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Enter}')

    expect((input as HTMLInputElement).value).toBe('Mango')
  })

  it('Enter on create option creates item (ArrowDown to reach create option)', async () => {
    const user = userEvent.setup()
    render(<CreatableHarness />)
    const input = screen.getByRole('combobox') as HTMLInputElement

    await user.click(input)
    await user.type(input, 'Mango')
    // ArrowDown to focus the create option, then Enter to confirm
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Enter}')

    expect(input.value).toBe('Mango')
  })

  it('typing partial match filters and Create does not appear', async () => {
    const user = userEvent.setup()
    render(<CreatableHarness />)
    const input = screen.getByRole('combobox')

    await user.click(input)
    await user.type(input, 'app')

    // 'app' matches Apple, so Create should not show
    expect(screen.queryByText(/Create/)).toBeNull()
    expect(screen.getByText('Apple')).toBeTruthy()
  })
})
