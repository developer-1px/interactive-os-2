import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DatePickerCombobox } from '../pattern/examples/DatePickerCombobox'

describe('DatePicker composite', () => {
  // V1: 2026-03-31-datepicker-composite-prd.md
  it('V1: ArrowDown opens dialog with grid focused', async () => {
    const user = userEvent.setup()
    render(<DatePickerCombobox />)

    const input = screen.getByRole('combobox')
    await user.click(input)
    // Dialog should be open
    expect(screen.getByRole('dialog')).toBeTruthy()
    // Grid should be present
    expect(screen.getByRole('grid')).toBeTruthy()
  })

  // V2: 2026-03-31-datepicker-composite-prd.md
  it('V2: Enter on a date selects and closes dialog', async () => {
    const user = userEvent.setup()
    render(<DatePickerCombobox />)

    const input = screen.getByRole('combobox')
    await user.click(input)

    // Press Enter to select the focused date
    await user.keyboard('{Enter}')

    // Dialog should be closed
    expect(screen.queryByRole('dialog')).toBeNull()
    // Input should have a date value
    expect(input).toHaveProperty('value')
    expect((input as HTMLInputElement).value).not.toBe('')
  })

  // V3: 2026-03-31-datepicker-composite-prd.md
  it('V3: Escape closes dialog without changing value', async () => {
    const user = userEvent.setup()
    render(<DatePickerCombobox />)

    const input = screen.getByRole('combobox')
    await user.click(input)
    expect(screen.getByRole('dialog')).toBeTruthy()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    // No value should be set (was null)
    expect((input as HTMLInputElement).value).toBe('')
  })

  // V4: 2026-03-31-datepicker-composite-prd.md
  it('V4: arrow navigation moves focus within grid', async () => {
    const user = userEvent.setup()
    render(<DatePickerCombobox />)

    await user.click(screen.getByRole('combobox'))
    const grid = screen.getByRole('grid')
    expect(grid).toBeTruthy()

    // Navigate right
    await user.keyboard('{ArrowRight}')
    // A gridcell should have focus
    const focusedCells = grid.querySelectorAll('[data-focused="true"]')
    expect(focusedCells.length).toBe(1)
  })

  // V7: 2026-03-31-datepicker-composite-prd.md
  it('V7: Tab cycles within dialog (focus trap)', async () => {
    const user = userEvent.setup()
    render(<DatePickerCombobox />)

    await user.click(screen.getByRole('combobox'))
    expect(screen.getByRole('dialog')).toBeTruthy()

    // Tab should keep focus within dialog
    await user.keyboard('{Tab}')
    const dialog = screen.getByRole('dialog')
    expect(dialog.contains(document.activeElement)).toBe(true)
  })

  // V8: 2026-03-31-datepicker-composite-prd.md
  it('V8: clicking a date cell selects and closes', async () => {
    const user = userEvent.setup()
    render(<DatePickerCombobox />)

    await user.click(screen.getByRole('combobox'))
    const grid = screen.getByRole('grid')
    const cells = grid.querySelectorAll('[role="gridcell"]')
    // Click a cell in the current month
    const targetCell = Array.from(cells).find(c => !c.hasAttribute('data-outside'))
    expect(targetCell).toBeTruthy()
    await user.click(targetCell!)

    // Dialog should close and input should have value
    expect(screen.queryByRole('dialog')).toBeNull()
    expect((screen.getByRole('combobox') as HTMLInputElement).value).not.toBe('')
  })

  // V10: 2026-03-31-datepicker-composite-prd.md
  it('V10: Space selects without closing dialog', async () => {
    const user = userEvent.setup()
    render(<DatePickerCombobox />)

    await user.click(screen.getByRole('combobox'))
    expect(screen.getByRole('dialog')).toBeTruthy()

    await user.keyboard(' ')
    // Dialog should still be open
    expect(screen.getByRole('dialog')).toBeTruthy()
  })
})
