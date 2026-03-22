import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Aria } from '../components/aria'
import { toolbar } from '../behaviors/toolbar'
import { ROOT_ID } from '../core/types'
import { core } from '../plugins/core'
import type { NodeState } from '../behaviors/types'

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

const renderItem = (node: Record<string, unknown>, _state: NodeState) => (
  <span data-testid={node.id as string}>{(node.data as Record<string, unknown>)?.name as string}</span>
)

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
