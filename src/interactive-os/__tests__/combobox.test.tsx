/**
 * Unit tests: Combobox multi-select mode + grouping support
 *
 * Tests the combobox behavior factory for single and multi selection modes,
 * and group header rendering with keyboard navigation that skips group headers.
 * Uses the Combobox UI component with controlled state via onChange.
 */
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { useState } from 'react'
import { Combobox } from '../ui/Combobox'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import { combobox as comboboxPlugin } from '../plugins/combobox'
import type { NodeState } from '../pattern/types'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      apple: { id: 'apple', data: { label: 'Apple' } },
      banana: { id: 'banana', data: { label: 'Banana' } },
      cherry: { id: 'cherry', data: { label: 'Cherry' } },
    },
    relationships: {
      [ROOT_ID]: ['apple', 'banana', 'cherry'],
    },
  })
}

function renderItem(props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState) {
  return (
    <span
      {...props}
      data-testid={`item-${item.id}`}
      data-selected={state.selected}
      data-focused={state.focused}
    >
      {(item.data as Record<string, unknown>)?.label as string}
    </span>
  )
}

function getInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[role="combobox"]') as HTMLInputElement
}

function getListbox(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[role="listbox"]')
}

function ControlledCombobox({
  selectionMode,
}: {
  selectionMode?: 'single' | 'multiple'
}) {
  const [data, setData] = useState(fixtureData)
  return (
    <Combobox
      data={data}
      plugins={[comboboxPlugin()]}
      onChange={setData}
      placeholder="Pick..."
      selectionMode={selectionMode}
      renderItem={renderItem}
    />
  )
}

describe('Combobox behavior factory', () => {
  describe('single select mode (default)', () => {
    it('Enter selects focused option and closes dropdown', async () => {
      const user = userEvent.setup()
      const { container } = render(<ControlledCombobox />)
      const input = getInput(container)

      input.focus()
      await user.keyboard('{ArrowDown}') // open + focus apple
      await user.keyboard('{ArrowDown}') // banana
      await user.keyboard('{Enter}')     // select banana + close

      // Dropdown closed
      expect(getListbox(container)).toBeNull()
      expect(input.getAttribute('aria-expanded')).toBe('false')

      // Input shows selected value
      expect(input.value).toBe('Banana')
    })

    it('Enter when closed opens dropdown (existing behavior preserved)', async () => {
      const user = userEvent.setup()
      const { container } = render(<ControlledCombobox selectionMode="single" />)
      const input = getInput(container)

      input.focus()
      await user.keyboard('{Enter}')

      expect(input.getAttribute('aria-expanded')).toBe('true')
      expect(getListbox(container)).toBeTruthy()
    })
  })

  describe('multi select mode', () => {
    it('Enter toggles selection and keeps dropdown open', async () => {
      const user = userEvent.setup()
      const { container } = render(<ControlledCombobox selectionMode="multiple" />)
      const input = getInput(container)

      input.focus()
      await user.keyboard('{ArrowDown}') // open + focus apple
      await user.keyboard('{Enter}')     // toggle apple

      // Dropdown stays open
      expect(getListbox(container)).toBeTruthy()
      expect(input.getAttribute('aria-expanded')).toBe('true')

      // Apple is selected
      const appleItem = container.querySelector('[data-testid="item-apple"]')
      expect(appleItem?.getAttribute('data-selected')).toBe('true')
    })

    it('second Enter on same item deselects it', async () => {
      const user = userEvent.setup()
      const { container } = render(<ControlledCombobox selectionMode="multiple" />)
      const input = getInput(container)

      input.focus()
      await user.keyboard('{ArrowDown}') // open + focus apple
      await user.keyboard('{Enter}')     // select apple

      const appleItem = container.querySelector('[data-testid="item-apple"]')
      expect(appleItem?.getAttribute('data-selected')).toBe('true')

      await user.keyboard('{Enter}')     // deselect apple (toggle again)

      expect(appleItem?.getAttribute('data-selected')).toBe('false')

      // Dropdown still open
      expect(getListbox(container)).toBeTruthy()
    })

    it('can select multiple items independently', async () => {
      const user = userEvent.setup()
      const { container } = render(<ControlledCombobox selectionMode="multiple" />)
      const input = getInput(container)

      input.focus()
      await user.keyboard('{ArrowDown}') // open + focus apple
      await user.keyboard('{Enter}')     // select apple
      await user.keyboard('{ArrowDown}') // banana
      await user.keyboard('{Enter}')     // select banana

      // Both selected, dropdown still open
      expect(getListbox(container)).toBeTruthy()

      const appleItem = container.querySelector('[data-testid="item-apple"]')
      const bananaItem = container.querySelector('[data-testid="item-banana"]')
      expect(appleItem?.getAttribute('data-selected')).toBe('true')
      expect(bananaItem?.getAttribute('data-selected')).toBe('true')
    })

    it('Escape closes the dropdown in multi mode', async () => {
      const user = userEvent.setup()
      const { container } = render(<ControlledCombobox selectionMode="multiple" />)
      const input = getInput(container)

      input.focus()
      await user.keyboard('{ArrowDown}') // open
      await user.keyboard('{Escape}')    // close

      expect(getListbox(container)).toBeNull()
      expect(input.getAttribute('aria-expanded')).toBe('false')
    })

    it('multi-select renders selected items as tokens', async () => {
      const user = userEvent.setup()
      const { container } = render(<ControlledCombobox selectionMode="multiple" />)
      const input = getInput(container)

      input.focus()
      await user.keyboard('{ArrowDown}') // open + focus apple
      await user.keyboard('{Enter}')     // select apple
      await user.keyboard('{ArrowDown}') // banana
      await user.keyboard('{Enter}')     // select banana

      const tokens = container.querySelectorAll('[data-combobox-token]')
      expect(tokens).toHaveLength(2)
      expect(tokens[0].textContent).toContain('Apple')
      expect(tokens[1].textContent).toContain('Banana')
    })

    it('Backspace on empty input removes last token', async () => {
      const user = userEvent.setup()
      const { container } = render(<ControlledCombobox selectionMode="multiple" />)
      const input = getInput(container)

      input.focus()
      await user.keyboard('{ArrowDown}') // open + focus apple
      await user.keyboard('{Enter}')     // select apple
      await user.keyboard('{ArrowDown}') // banana
      await user.keyboard('{Enter}')     // select banana
      await user.keyboard('{Escape}')    // close dropdown

      expect(container.querySelectorAll('[data-combobox-token]')).toHaveLength(2)

      input.focus()
      await user.keyboard('{Backspace}') // remove last token (banana)

      expect(container.querySelectorAll('[data-combobox-token]')).toHaveLength(1)
      expect(container.querySelector('[data-combobox-token]')?.textContent).toContain('Apple')
    })

    it('token × button removes that token without opening dropdown', async () => {
      const user = userEvent.setup()
      const { container } = render(<ControlledCombobox selectionMode="multiple" />)
      const input = getInput(container)

      input.focus()
      await user.keyboard('{ArrowDown}') // open + focus apple
      await user.keyboard('{Enter}')     // select apple
      await user.keyboard('{ArrowDown}') // banana
      await user.keyboard('{Enter}')     // select banana
      await user.keyboard('{Escape}')    // close dropdown

      const removeButtons = container.querySelectorAll('[data-combobox-token] button')
      expect(removeButtons).toHaveLength(2)

      // Click × on first token (Apple)
      await user.click(removeButtons[0])

      const tokens = container.querySelectorAll('[data-combobox-token]')
      expect(tokens).toHaveLength(1)
      expect(tokens[0].textContent).toContain('Banana')

      // Dropdown should remain closed
      expect(getListbox(container)).toBeNull()
    })

    it('tokens do not appear in single-select mode', async () => {
      const user = userEvent.setup()
      const { container } = render(<ControlledCombobox selectionMode="single" />)
      const input = getInput(container)

      input.focus()
      await user.keyboard('{ArrowDown}') // open + focus apple
      await user.keyboard('{Enter}')     // select apple

      expect(container.querySelectorAll('[data-combobox-token]')).toHaveLength(0)
    })
  })
})

// ─── Grouping support ────────────────────────────────────────────────────────

function groupedStore(): NormalizedData {
  return createStore({
    entities: {
      fruits: { id: 'fruits', data: { type: 'group', label: 'Fruits' } },
      apple:  { id: 'apple',  data: { label: 'Apple' } },
      banana: { id: 'banana', data: { label: 'Banana' } },
      vegs:   { id: 'vegs',   data: { type: 'group', label: 'Vegetables' } },
      carrot: { id: 'carrot', data: { label: 'Carrot' } },
    },
    relationships: {
      [ROOT_ID]: ['fruits', 'vegs'],
      fruits: ['apple', 'banana'],
      vegs: ['carrot'],
    },
  })
}

function ControlledGroupedCombobox() {
  const [data, setData] = useState(groupedStore)
  return (
    <Combobox
      data={data}
      plugins={[comboboxPlugin()]}
      onChange={setData}
      placeholder="Pick..."
      renderItem={renderItem}
    />
  )
}

describe('Combobox grouping support', () => {
  it('renders group headers as non-interactive labels', async () => {
    const user = userEvent.setup()
    const { container } = render(<ControlledGroupedCombobox />)
    const input = getInput(container)

    input.focus()
    await user.keyboard('{ArrowDown}') // open

    const groupLabels = container.querySelectorAll('[role="presentation"]')
    expect(groupLabels).toHaveLength(2)
    expect(groupLabels[0].textContent).toBe('Fruits')
    expect(groupLabels[1].textContent).toBe('Vegetables')
  })

  it('ArrowDown navigates only options, skipping group headers', async () => {
    const user = userEvent.setup()
    const { container } = render(<ControlledGroupedCombobox />)
    const input = getInput(container)

    input.focus()
    await user.keyboard('{ArrowDown}') // open + focus first option (apple)

    const appleItem = container.querySelector('[data-testid="item-apple"]')
    expect(appleItem?.getAttribute('data-focused')).toBe('true')

    await user.keyboard('{ArrowDown}') // banana
    const bananaItem = container.querySelector('[data-testid="item-banana"]')
    expect(bananaItem?.getAttribute('data-focused')).toBe('true')

    await user.keyboard('{ArrowDown}') // carrot (skips "Vegetables" group header)
    const carrotItem = container.querySelector('[data-testid="item-carrot"]')
    expect(carrotItem?.getAttribute('data-focused')).toBe('true')
  })

  it('Enter on grouped option selects it and closes dropdown', async () => {
    const user = userEvent.setup()
    const { container } = render(<ControlledGroupedCombobox />)
    const input = getInput(container)

    input.focus()
    await user.keyboard('{ArrowDown}') // open + focus apple
    await user.keyboard('{ArrowDown}') // banana
    await user.keyboard('{Enter}')     // select banana

    expect(getListbox(container)).toBeNull()
    expect(input.value).toBe('Banana')
  })
})

// ─── Creatable mode ───────────────────────────────────────────────────────────

function ControlledCreatableCombobox({
  selectionMode,
  onChange,
}: {
  selectionMode?: 'single' | 'multiple'
  onChange?: (data: NormalizedData) => void
}) {
  const [data, setData] = useState(fixtureData)
  const handleChange = (d: NormalizedData) => {
    setData(d)
    onChange?.(d)
  }
  return (
    <Combobox
      data={data}
      plugins={[comboboxPlugin()]}
      onChange={handleChange}
      placeholder="Pick..."
      editable
      creatable
      selectionMode={selectionMode}
      renderItem={renderItem}
    />
  )
}

describe('combobox — creatable', () => {
  it('shows create option when filter has no matches', async () => {
    const user = userEvent.setup()
    const { container } = render(<ControlledCreatableCombobox />)
    const input = getInput(container)

    input.focus()
    await user.keyboard('{ArrowDown}') // open
    await user.type(input, 'Mango')

    const createOption = container.querySelector('[data-combobox-create]')
    expect(createOption).toBeTruthy()
    expect(createOption?.textContent).toContain('Mango')
  })

  it('does not show create option when there are matching items', async () => {
    const user = userEvent.setup()
    const { container } = render(<ControlledCreatableCombobox />)
    const input = getInput(container)

    input.focus()
    await user.keyboard('{ArrowDown}') // open
    await user.type(input, 'App')

    const createOption = container.querySelector('[data-combobox-create]')
    expect(createOption).toBeNull()
  })

  it('Enter on create option adds new entity (single mode)', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { container } = render(<ControlledCreatableCombobox onChange={onChange} />)
    const input = getInput(container)

    input.focus()
    await user.keyboard('{ArrowDown}') // open
    await user.type(input, 'Mango')

    // ArrowDown past all items to focus the create option
    await user.keyboard('{ArrowDown}') // apple
    await user.keyboard('{ArrowDown}') // banana
    await user.keyboard('{ArrowDown}') // cherry
    await user.keyboard('{ArrowDown}') // create option

    await user.keyboard('{Enter}')

    // Dropdown closed (single mode)
    expect(getListbox(container)).toBeNull()

    // onChange was called with data containing the new entity
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]
    const newData: NormalizedData = lastCall[0]
    const newEntity = Object.values(newData.entities).find(
      (e) => (e.data as Record<string, unknown>)?.label === 'Mango'
    )
    expect(newEntity).toBeTruthy()
  })

  it('Enter on create option adds entity and keeps dropdown open (multi mode)', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { container } = render(
      <ControlledCreatableCombobox selectionMode="multiple" onChange={onChange} />
    )
    const input = getInput(container)

    input.focus()
    await user.keyboard('{ArrowDown}') // open
    await user.type(input, 'Mango')

    // ArrowDown to create option (no items match, so it's the first/only focusable)
    await user.keyboard('{ArrowDown}') // create option

    await user.keyboard('{Enter}')

    // Dropdown stays open (multi mode)
    expect(getListbox(container)).toBeTruthy()

    // Token was added
    const tokens = container.querySelectorAll('[data-combobox-token]')
    expect(tokens).toHaveLength(1)
    expect(tokens[0].textContent).toContain('Mango')
  })
})
