import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../components/aria'
import { toolbar } from '../behaviors/toolbar'
import { ROOT_ID } from '../core/types'
import { core } from '../plugins/core'
import { createStore } from '../core/createStore'
import type { AriaBehavior, NodeState } from '../behaviors/types'

function fixtureData() {
  return {
    entities: {
      a: { id: 'a', data: { name: 'A' } },
      b: { id: 'b', data: { name: 'B' } },
      c: { id: 'c', data: { name: 'C' } },
      d: { id: 'd', data: { name: 'D' } },
    },
    relationships: { [ROOT_ID]: ['a', 'b', 'c', 'd'] },
  }
}

const renderItem = (props: Record<string, unknown>, node: Record<string, unknown>, _state: NodeState) => (
  <span {...props} data-testid={node.id as string}>{(node.data as Record<string, unknown>)?.name as string}</span>
)

const verticalToolbar: AriaBehavior = {
  ...toolbar,
  keyMap: {
    ArrowDown: (ctx) => ctx.focusNext(),
    ArrowUp: (ctx) => ctx.focusPrev(),
    Home: (ctx) => ctx.focusFirst(),
    End: (ctx) => ctx.focusLast(),
    Enter: (ctx) => ctx.activate(),
    Space: (ctx) => ctx.activate(),
  },
  focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
}

describe('Aria.Item ids prop', () => {
  it('renders only specified ids', () => {
    const { queryByTestId } = render(
      <Aria behavior={toolbar} data={fixtureData()} plugins={[core()]}>
        <Aria.Item ids={['a', 'c']} render={renderItem} />
      </Aria>,
    )
    expect(queryByTestId('a')).not.toBeNull()
    expect(queryByTestId('b')).toBeNull()
    expect(queryByTestId('c')).not.toBeNull()
    expect(queryByTestId('d')).toBeNull()
  })

  it('renders in ids array order', () => {
    const { container } = render(
      <Aria behavior={toolbar} data={fixtureData()} plugins={[core()]}>
        <Aria.Item ids={['c', 'a']} render={renderItem} />
      </Aria>,
    )
    const items = container.querySelectorAll('[data-testid]')
    expect(items[0]?.getAttribute('data-testid')).toBe('c')
    expect(items[1]?.getAttribute('data-testid')).toBe('a')
  })

  it('skips ids not in store', () => {
    const { queryByTestId } = render(
      <Aria behavior={toolbar} data={fixtureData()} plugins={[core()]}>
        <Aria.Item ids={['a', 'nonexistent', 'b']} render={renderItem} />
      </Aria>,
    )
    expect(queryByTestId('a')).not.toBeNull()
    expect(queryByTestId('b')).not.toBeNull()
    expect(queryByTestId('nonexistent')).toBeNull()
  })

  it('renders empty when ids is empty array', () => {
    const { container } = render(
      <Aria behavior={toolbar} data={fixtureData()} plugins={[core()]}>
        <Aria.Item ids={[]} render={renderItem} />
      </Aria>,
    )
    expect(container.querySelectorAll('[data-testid]')).toHaveLength(0)
  })

  it('renders all from ROOT when ids is not specified (backward compat)', () => {
    const { queryByTestId } = render(
      <Aria behavior={toolbar} data={fixtureData()} plugins={[core()]}>
        <Aria.Item render={renderItem} />
      </Aria>,
    )
    expect(queryByTestId('a')).not.toBeNull()
    expect(queryByTestId('b')).not.toBeNull()
    expect(queryByTestId('c')).not.toBeNull()
    expect(queryByTestId('d')).not.toBeNull()
  })
})

describe('Aria.Item ids — keyboard navigation', () => {
  it('navigates across multiple Aria.Items with ids in flat order (horizontal)', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Aria behavior={toolbar} data={fixtureData()} plugins={[core()]}>
        <div role="group">
          <Aria.Item ids={['a', 'b']} render={renderItem} />
        </div>
        <div role="separator" />
        <div role="group">
          <Aria.Item ids={['c', 'd']} render={renderItem} />
        </div>
      </Aria>,
    )

    const firstItem = container.querySelector('[tabindex="0"]') as HTMLElement
    firstItem.focus()
    expect(firstItem.getAttribute('data-node-id')).toBe('a')

    await user.keyboard('{ArrowRight}')
    expect(container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')).toBe('b')

    await user.keyboard('{ArrowRight}')
    expect(container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')).toBe('c')

    await user.keyboard('{ArrowRight}')
    expect(container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')).toBe('d')
  })

  it('vertical toolbar: ArrowDown/Up navigates across groups', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Aria behavior={verticalToolbar} data={fixtureData()} plugins={[core()]}>
        <div role="group">
          <Aria.Item ids={['a', 'b']} render={renderItem} />
        </div>
        <div role="separator" />
        <div role="group">
          <Aria.Item ids={['c', 'd']} render={renderItem} />
        </div>
      </Aria>,
    )

    const firstItem = container.querySelector('[tabindex="0"]') as HTMLElement
    firstItem.focus()

    await user.keyboard('{ArrowDown}')
    expect(container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')).toBe('b')

    await user.keyboard('{ArrowDown}')
    expect(container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')).toBe('c')

    await user.keyboard('{ArrowUp}')
    expect(container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')).toBe('b')
  })

  it('Home/End works across groups', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Aria behavior={toolbar} data={fixtureData()} plugins={[core()]}>
        <div role="group">
          <Aria.Item ids={['a', 'b']} render={renderItem} />
        </div>
        <div role="group">
          <Aria.Item ids={['c', 'd']} render={renderItem} />
        </div>
      </Aria>,
    )

    const firstItem = container.querySelector('[tabindex="0"]') as HTMLElement
    firstItem.focus()

    await user.keyboard('{End}')
    expect(container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')).toBe('d')

    await user.keyboard('{Home}')
    expect(container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')).toBe('a')
  })

  it('navigate skips ids not in store (V9: dynamic removal)', async () => {
    const user = userEvent.setup()
    const data = createStore({
      entities: {
        a: { id: 'a', data: { name: 'A' } },
        c: { id: 'c', data: { name: 'C' } },
        d: { id: 'd', data: { name: 'D' } },
      },
      relationships: { [ROOT_ID]: ['a', 'c', 'd'] },
    })
    const { container } = render(
      <Aria behavior={toolbar} data={data} plugins={[core()]}>
        <Aria.Item ids={['a', 'b', 'c', 'd']} render={renderItem} />
      </Aria>,
    )

    const firstItem = container.querySelector('[tabindex="0"]') as HTMLElement
    firstItem.focus()

    await user.keyboard('{ArrowRight}')
    expect(container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')).toBe('c')

    await user.keyboard('{ArrowRight}')
    expect(container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')).toBe('d')
  })

  it('separator click does not move focus (V7)', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Aria behavior={toolbar} data={fixtureData()} plugins={[core()]}>
        <div role="group">
          <Aria.Item ids={['a', 'b']} render={renderItem} />
        </div>
        <div role="separator" data-testid="sep" />
        <div role="group">
          <Aria.Item ids={['c', 'd']} render={renderItem} />
        </div>
      </Aria>,
    )

    const firstItem = container.querySelector('[tabindex="0"]') as HTMLElement
    firstItem.focus()
    expect(firstItem.getAttribute('data-node-id')).toBe('a')

    const sep = container.querySelector('[data-testid="sep"]') as HTMLElement
    await user.click(sep)

    expect(container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id')).toBe('a')
  })
})
