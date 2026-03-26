import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Aria } from '../primitives/aria'
import { listbox } from '../pattern/examples/listbox'
import { ROOT_ID } from '../store/types'
import type { Command } from '../engine/types'
import type { PatternContext } from '../pattern/types'
import { matchKeyEvent } from '../primitives/useKeyboard'

function fixtureData() {
  return {
    entities: {
      a: { id: 'a', data: { label: 'A' } },
      b: { id: 'b', data: { label: 'B' } },
    },
    relationships: { [ROOT_ID]: ['a', 'b'] },
  }
}

/** keyMap-only parent Aria (no behavior) wrapping a listbox child */
function NestedAriaHarness({ parentKey }: { parentKey: string }) {
  const [opened, setOpened] = useState(false)
  return (
    <div data-testid="root" data-opened={opened || undefined}>
      <Aria
        keyMap={{ [parentKey]: (() => { setOpened(true); return undefined }) as (ctx: PatternContext) => Command | void }}
        data={{ entities: {}, relationships: { [ROOT_ID]: [] } }}
        plugins={[]}
      >
        <Aria behavior={listbox()} data={fixtureData()} plugins={[]} aria-label="inner">
          <Aria.Item render={(props, node, _state) => <span {...props}>{(node.data as Record<string, unknown>)?.label as string}</span>} />
        </Aria>
      </Aria>
    </div>
  )
}

describe('Nested Aria bubbling', () => {
  it('parent keyMap receives keys not handled by child', async () => {
    const user = userEvent.setup()
    render(<NestedAriaHarness parentKey="Meta+p" />)

    const option = document.querySelector('[role="option"]')!
    await user.click(option)
    await user.keyboard('{Meta>}p{/Meta}')

    expect(document.querySelector('[data-testid="root"]')!.hasAttribute('data-opened')).toBe(true)
  })

  it('parent does NOT receive keys already handled by child', async () => {
    const user = userEvent.setup()
    render(<NestedAriaHarness parentKey="ArrowDown" />)

    const option = document.querySelector('[role="option"]')!
    await user.click(option)
    await user.keyboard('{ArrowDown}')

    // ArrowDown은 listbox가 처리 → preventDefault → 부모 스킵
    expect(document.querySelector('[data-testid="root"]')!.hasAttribute('data-opened')).toBe(false)
  })

  it('matchKeyEvent handles backslash combo', () => {
    const event = new KeyboardEvent('keydown', { key: '\\', metaKey: true })
    expect(matchKeyEvent(event, 'Meta+\\')).toBe(true)
  })

  it('keyMap-only Aria (no behavior) renders without role/tabIndex', () => {
    const { container } = render(
      <Aria
        keyMap={{ 'Meta+k': (() => undefined) as (ctx: PatternContext) => Command | void }}
        data={{ entities: {}, relationships: { [ROOT_ID]: [] } }}
        plugins={[]}
      >
        <button>child</button>
      </Aria>
    )

    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.getAttribute('role')).toBeNull()
    expect(wrapper.getAttribute('tabindex')).toBeNull()
    expect(wrapper.hasAttribute('data-aria-container')).toBe(true)
  })
})
