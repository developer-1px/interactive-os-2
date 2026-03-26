import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Aria } from '../primitives/aria'
import { tree } from '../pattern/examples/tree'
import { ROOT_ID } from '../store/types'

function fixtureData() {
  return {
    entities: {
      src: { id: 'src', data: { name: 'src' } },
      app: { id: 'app', data: { name: 'App.tsx' } },
      main: { id: 'main', data: { name: 'main.tsx' } },
    },
    relationships: {
      [ROOT_ID]: ['src'],
      src: ['app', 'main'],
    },
  }
}

describe('<Aria> compound component', () => {
  it('renders nodes with Aria.Item render slot', () => {
    render(
      <Aria behavior={tree} data={fixtureData()} plugins={[]}>
        <Aria.Item render={(props, node, _state) => <span {...props}>{(node.data as Record<string, unknown>)?.name as string}</span>} />
      </Aria>
    )
    expect(screen.getByText('src')).toBeDefined()
  })

  it('applies ARIA role to the container', () => {
    const { container } = render(
      <Aria behavior={tree} data={fixtureData()} plugins={[]}>
        <Aria.Item render={(props, node, _state) => <span {...props}>{(node.data as Record<string, unknown>)?.name as string}</span>} />
      </Aria>
    )
    const el = container.querySelector('[role="tree"]')
    expect(el).not.toBeNull()
  })

  it('applies aria attributes to nodes', () => {
    const { container } = render(
      <Aria behavior={tree} data={fixtureData()} plugins={[]}>
        <Aria.Item render={(props, node, _state) => <span {...props}>{(node.data as Record<string, unknown>)?.name as string}</span>} />
      </Aria>
    )
    const rows = container.querySelectorAll('[role="treeitem"]')
    expect(rows.length).toBeGreaterThan(0)
    const firstRow = rows[0]!
    expect(firstRow.getAttribute('aria-level')).toBe('1')
  })

  it('first node has tabIndex 0, others have -1', () => {
    const { container } = render(
      <Aria behavior={tree} data={fixtureData()} plugins={[]}>
        <Aria.Item render={(props, node, _state) => <span {...props}>{(node.data as Record<string, unknown>)?.name as string}</span>} />
      </Aria>
    )
    const rows = container.querySelectorAll('[role="treeitem"]')
    expect(rows[0]!.getAttribute('tabindex')).toBe('0')
  })
})
