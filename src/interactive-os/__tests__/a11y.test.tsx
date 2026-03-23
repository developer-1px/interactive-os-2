/**
 * Accessibility validation tests using axe-core.
 * Validates that rendered components produce ARIA-compliant DOM.
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import axe from 'axe-core'
import { Aria } from '../components/aria'
import { tree } from '../behaviors/tree'
import { listbox } from '../behaviors/listbox'
import { tabs } from '../behaviors/tabs'
import { createStore } from '../core/createStore'
import { ROOT_ID } from '../core/types'

async function checkA11y(container: HTMLElement): Promise<axe.AxeResults> {
  return axe.run(container, {
    rules: {
      // Disable color-contrast (no real styles in test env)
      'color-contrast': { enabled: false },
      // Disable region rule (test fragments aren't full pages)
      region: { enabled: false },
    },
  })
}

const treeData = createStore({
  entities: {
    src: { id: 'src', data: { name: 'src' } },
    app: { id: 'app', data: { name: 'App.tsx' } },
    main: { id: 'main', data: { name: 'main.tsx' } },
  },
  relationships: {
    [ROOT_ID]: ['src'],
    src: ['app', 'main'],
  },
})

const listData = createStore({
  entities: {
    a: { id: 'a', data: { name: 'Apple' } },
    b: { id: 'b', data: { name: 'Banana' } },
    c: { id: 'c', data: { name: 'Cherry' } },
  },
  relationships: {
    [ROOT_ID]: ['a', 'b', 'c'],
  },
})

const tabData = createStore({
  entities: {
    t1: { id: 't1', data: { name: 'Tab 1' } },
    t2: { id: 't2', data: { name: 'Tab 2' } },
  },
  relationships: {
    [ROOT_ID]: ['t1', 't2'],
  },
})

describe('Accessibility (axe-core)', () => {
  it('Tree has no critical ARIA violations', async () => {
    const { container } = render(
      <Aria behavior={tree} data={treeData} plugins={[]}>
        <Aria.Item render={(node, _state, props) => <span {...props}>{(node.data as Record<string, unknown>)?.name as string}</span>} />
      </Aria>
    )

    const results = await checkA11y(container)
    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    if (critical.length > 0) {
      console.error(
        'Critical a11y violations:',
        critical.map((v) => `${v.id}: ${v.description} (${v.nodes.length} instances)`)
      )
    }

    expect(critical).toEqual([])
  })

  it('ListBox has no critical ARIA violations', async () => {
    const { container } = render(
      <Aria behavior={listbox()} data={listData} plugins={[]} aria-label="Fruits">
        <Aria.Item render={(node, _state, props) => <span {...props}>{(node.data as Record<string, unknown>)?.name as string}</span>} />
      </Aria>
    )

    const results = await checkA11y(container)
    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    if (critical.length > 0) {
      console.error(
        'Critical a11y violations:',
        critical.map((v) => `${v.id}: ${v.description} (${v.nodes.length} instances)`)
      )
    }

    expect(critical).toEqual([])
  })

  it('TabList has no critical ARIA violations', async () => {
    const { container } = render(
      <Aria behavior={tabs} data={tabData} plugins={[]}>
        <Aria.Item render={(node, _state, props) => <span {...props}>{(node.data as Record<string, unknown>)?.name as string}</span>} />
      </Aria>
    )

    const results = await checkA11y(container)
    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    if (critical.length > 0) {
      console.error(
        'Critical a11y violations:',
        critical.map((v) => `${v.id}: ${v.description} (${v.nodes.length} instances)`)
      )
    }

    expect(critical).toEqual([])
  })

  it('Tree nodes have required ARIA attributes', () => {
    const { container } = render(
      <Aria behavior={tree} data={treeData} plugins={[]}>
        <Aria.Item render={(node, _state, props) => <span {...props}>{(node.data as Record<string, unknown>)?.name as string}</span>} />
      </Aria>
    )

    const rows = container.querySelectorAll('[role="treeitem"]')
    expect(rows.length).toBeGreaterThan(0)

    // Check first row has all required tree attributes
    const firstRow = rows[0]!
    expect(firstRow.getAttribute('role')).toBe('treeitem')
    expect(firstRow.getAttribute('tabindex')).toBeDefined()
    expect(firstRow.getAttribute('aria-level')).toBeDefined()
    expect(firstRow.getAttribute('aria-posinset')).toBeDefined()
    expect(firstRow.getAttribute('aria-setsize')).toBeDefined()
    expect(firstRow.getAttribute('aria-selected')).toBeDefined()
  })

  it('ListBox nodes have required ARIA attributes', () => {
    const { container } = render(
      <Aria behavior={listbox()} data={listData} plugins={[]} aria-label="Fruits">
        <Aria.Item render={(node, _state, props) => <span {...props}>{(node.data as Record<string, unknown>)?.name as string}</span>} />
      </Aria>
    )

    const options = container.querySelectorAll('[role="option"]')
    expect(options.length).toBe(3)

    const firstOption = options[0]!
    expect(firstOption.getAttribute('aria-selected')).toBeDefined()
    expect(firstOption.getAttribute('aria-posinset')).toBeDefined()
    expect(firstOption.getAttribute('aria-setsize')).toBeDefined()
  })
})
