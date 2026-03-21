import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../components/aria'
import { spinbutton } from '../behaviors/spinbutton'
import { createStore } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'
import { core } from '../plugins/core'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      input: { id: 'input', data: { label: 'Quantity' } },
    },
    relationships: {
      [ROOT_ID]: ['input'],
    },
  })
}

const spinBehavior = spinbutton({ min: 0, max: 10, step: 1 })

function renderSpinbutton(data: NormalizedData) {
  return render(
    <Aria behavior={spinBehavior} data={data} plugins={[core()]}>
      <Aria.Item render={(item) => (
        <span>{(item.data as Record<string, unknown>)?.label as string}</span>
      )} />
    </Aria>
  )
}

function getAriaValueNow(container: HTMLElement): string | null {
  return container.querySelector('[role="spinbutton"]')?.getAttribute('aria-valuenow')
}

describe('Spinbutton keyboard integration', () => {
  it('ArrowUp increments', async () => {
    const user = userEvent.setup()
    const { container } = renderSpinbutton(fixtureData())
    container.querySelector<HTMLElement>('[data-node-id="input"]')!.focus()
    await user.keyboard('{ArrowUp}')
    expect(getAriaValueNow(container)).toBe('1')
  })

  it('ArrowDown decrements', async () => {
    const user = userEvent.setup()
    const { container } = renderSpinbutton(fixtureData())
    container.querySelector<HTMLElement>('[data-node-id="input"]')!.focus()
    await user.keyboard('{ArrowUp}{ArrowUp}{ArrowDown}')
    expect(getAriaValueNow(container)).toBe('1')
  })

  it('ArrowRight does nothing (vertical only)', async () => {
    const user = userEvent.setup()
    const { container } = renderSpinbutton(fixtureData())
    container.querySelector<HTMLElement>('[data-node-id="input"]')!.focus()
    await user.keyboard('{ArrowRight}')
    expect(getAriaValueNow(container)).toBe('0')
  })

  it('Home/End sets min/max', async () => {
    const user = userEvent.setup()
    const { container } = renderSpinbutton(fixtureData())
    container.querySelector<HTMLElement>('[data-node-id="input"]')!.focus()
    await user.keyboard('{End}')
    expect(getAriaValueNow(container)).toBe('10')
    await user.keyboard('{Home}')
    expect(getAriaValueNow(container)).toBe('0')
  })

  it('clamps at boundaries', async () => {
    const user = userEvent.setup()
    const { container } = renderSpinbutton(fixtureData())
    container.querySelector<HTMLElement>('[data-node-id="input"]')!.focus()
    await user.keyboard('{ArrowDown}')
    expect(getAriaValueNow(container)).toBe('0')
    await user.keyboard('{End}{ArrowUp}')
    expect(getAriaValueNow(container)).toBe('10')
  })
})
