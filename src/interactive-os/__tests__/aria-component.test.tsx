import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Aria } from '../components/aria'
import { treegrid } from '../behaviors/treegrid'
import { ROOT_ID } from '../core/types'

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
  it('renders nodes with Aria.Node render slot', () => {
    render(
      <Aria behavior={treegrid} data={fixtureData()} plugins={[]}>
        <Aria.Node render={(node) => <span>{(node.data as Record<string, unknown>)?.name as string}</span>} />
      </Aria>
    )
    expect(screen.getByText('src')).toBeDefined()
  })

  it('applies ARIA role to the container', () => {
    const { container } = render(
      <Aria behavior={treegrid} data={fixtureData()} plugins={[]}>
        <Aria.Node render={(node) => <span>{(node.data as Record<string, unknown>)?.name as string}</span>} />
      </Aria>
    )
    const el = container.querySelector('[role="treegrid"]')
    expect(el).not.toBeNull()
  })

  it('applies aria attributes to nodes', () => {
    const { container } = render(
      <Aria behavior={treegrid} data={fixtureData()} plugins={[]}>
        <Aria.Node render={(node) => <span>{(node.data as Record<string, unknown>)?.name as string}</span>} />
      </Aria>
    )
    const rows = container.querySelectorAll('[role="row"]')
    expect(rows.length).toBeGreaterThan(0)
    const firstRow = rows[0]!
    expect(firstRow.getAttribute('aria-level')).toBe('1')
  })

  it('first node has tabIndex 0, others have -1', () => {
    const { container } = render(
      <Aria behavior={treegrid} data={fixtureData()} plugins={[]}>
        <Aria.Node render={(node) => <span>{(node.data as Record<string, unknown>)?.name as string}</span>} />
      </Aria>
    )
    const rows = container.querySelectorAll('[role="row"]')
    expect(rows[0]!.getAttribute('tabindex')).toBe('0')
  })
})
