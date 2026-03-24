import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../primitives/aria'
import { listbox } from '../pattern/listbox'
import { ROOT_ID } from '../store/types'

const behavior = listbox()

function fixtureData() {
  return {
    entities: {
      a: { id: 'a', data: { name: 'Alpha' } },
      b: { id: 'b', data: { name: 'Bravo' } },
      c: { id: 'c', data: { name: 'Charlie' } },
    },
    relationships: {
      [ROOT_ID]: ['a', 'b', 'c'],
    },
  }
}

function renderItem(props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>) {
  return <div {...props}>{(node.data as Record<string, unknown>)?.name as string}</div>
}

describe('disabled', () => {
  it('applies inert to the container when disabled', () => {
    const { container } = render(
      <Aria behavior={behavior} data={fixtureData()} plugins={[]} disabled>
        <Aria.Item render={renderItem} />
      </Aria>
    )
    const el = container.querySelector('[data-aria-container]')!
    expect(el.hasAttribute('inert')).toBe(true)
  })

  it('does not apply inert when not disabled', () => {
    const { container } = render(
      <Aria behavior={behavior} data={fixtureData()} plugins={[]}>
        <Aria.Item render={renderItem} />
      </Aria>
    )
    const el = container.querySelector('[data-aria-container]')!
    expect(el.hasAttribute('inert')).toBe(false)
  })

  it('keyboard navigation does not move focus when disabled', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Aria behavior={behavior} data={fixtureData()} plugins={[]} disabled>
        <Aria.Item render={renderItem} />
      </Aria>
    )
    const items = container.querySelectorAll('[role="option"]')
    ;(items[0] as HTMLElement).focus()
    expect(document.activeElement).not.toBe(items[0])

    await user.keyboard('{ArrowDown}')
    for (const item of items) {
      expect(document.activeElement).not.toBe(item)
    }
  })

  it('removes inert when disabled transitions to false', () => {
    const { container, rerender } = render(
      <Aria behavior={behavior} data={fixtureData()} plugins={[]} disabled>
        <Aria.Item render={renderItem} />
      </Aria>
    )
    const el = container.querySelector('[data-aria-container]')!
    expect(el.hasAttribute('inert')).toBe(true)

    rerender(
      <Aria behavior={behavior} data={fixtureData()} plugins={[]}>
        <Aria.Item render={renderItem} />
      </Aria>
    )
    expect(el.hasAttribute('inert')).toBe(false)
  })
})
