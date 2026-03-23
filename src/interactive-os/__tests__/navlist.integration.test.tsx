import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { NavList } from '../ui/NavList'
import { createStore } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'

function makeNavData(labels: string[]): NormalizedData {
  const entities: Record<string, { id: string; data: Record<string, unknown> }> = {}
  const ids: string[] = []
  for (const label of labels) {
    const id = label.toLowerCase().replace(/\s+/g, '-')
    entities[id] = { id, data: { label } }
    ids.push(id)
  }
  return createStore({ entities, relationships: { [ROOT_ID]: ids } })
}

function getNodeEl(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

function getFocusedNodeId(container: HTMLElement): string | null {
  const focused = container.querySelector('[tabindex="0"]')
  return focused?.getAttribute('data-node-id') ?? null
}

function NavListWithActivatedDisplay({ data, ...rest }: { data: NormalizedData; 'aria-label': string }) {
  const [activated, setActivated] = useState('')
  return (
    <>
      <NavList data={data} onActivate={setActivated} {...rest} />
      <div data-testid="activated">{activated}</div>
    </>
  )
}

describe('NavList', () => {
  it('ArrowDown moves focus to next item and activates it', async () => {
    const user = userEvent.setup()
    const { container } = render(<NavListWithActivatedDisplay data={makeNavData(['Alpha', 'Beta', 'Gamma'])} aria-label="Test nav" />)

    getNodeEl(container, 'alpha')!.focus()
    await user.keyboard('{ArrowDown}')

    expect(getFocusedNodeId(container)).toBe('beta')
    expect(document.activeElement).toBe(getNodeEl(container, 'beta'))
    expect(screen.getByTestId('activated').textContent).toBe('beta')
  })

  it('ArrowUp moves focus to previous item and activates it', async () => {
    const user = userEvent.setup()
    const { container } = render(<NavListWithActivatedDisplay data={makeNavData(['Alpha', 'Beta', 'Gamma'])} aria-label="Test nav" />)

    getNodeEl(container, 'beta')!.focus()
    await user.keyboard('{ArrowUp}')

    expect(getFocusedNodeId(container)).toBe('alpha')
    expect(document.activeElement).toBe(getNodeEl(container, 'alpha'))
    expect(screen.getByTestId('activated').textContent).toBe('alpha')
  })

  it('Home moves to first, End moves to last', async () => {
    const user = userEvent.setup()
    const { container } = render(<NavListWithActivatedDisplay data={makeNavData(['Alpha', 'Beta', 'Gamma'])} aria-label="Test nav" />)

    getNodeEl(container, 'beta')!.focus()
    await user.keyboard('{Home}')
    expect(getFocusedNodeId(container)).toBe('alpha')

    await user.keyboard('{End}')
    expect(getFocusedNodeId(container)).toBe('gamma')
    expect(screen.getByTestId('activated').textContent).toBe('gamma')
  })

  it('click on item focuses and activates it', async () => {
    const user = userEvent.setup()
    const { container } = render(<NavListWithActivatedDisplay data={makeNavData(['Alpha', 'Beta'])} aria-label="Test nav" />)

    await user.click(getNodeEl(container, 'beta')!)
    expect(getFocusedNodeId(container)).toBe('beta')
    expect(screen.getByTestId('activated').textContent).toBe('beta')
  })

  it('renders empty listbox without error', () => {
    const { container } = render(<NavList data={createStore({ entities: {}, relationships: { [ROOT_ID]: [] } })} aria-label="Empty nav" />)
    const listbox = container.querySelector('[role="listbox"]')
    expect(listbox).not.toBeNull()
    expect(listbox!.getAttribute('aria-label')).toBe('Empty nav')
  })

  it('supports custom renderItem', () => {
    render(
      <NavList
        data={makeNavData(['Alpha'])}
        renderItem={(node, _state, props) => <span {...props} data-testid="custom">{(node.data as { label: string }).label}!</span>}
        aria-label="Custom nav"
      />
    )
    expect(screen.getByTestId('custom').textContent).toBe('Alpha!')
  })

  it('syncs focus when data changes with new FOCUS_ID', async () => {
    const user = userEvent.setup()
    function ExternalSync() {
      const [data, setData] = useState(makeNavData(['Alpha', 'Beta', 'Gamma']))
      return (
        <>
          <NavList data={data} aria-label="Sync nav" />
          <button onClick={() => {
            setData(prev => ({
              ...prev,
              entities: { ...prev.entities, __focus__: { id: '__focus__', focusedId: 'gamma' } },
            }))
          }}>Focus Gamma</button>
        </>
      )
    }
    const { container } = render(<ExternalSync />)
    getNodeEl(container, 'alpha')!.focus()
    await user.click(screen.getByRole('button', { name: 'Focus Gamma' }))
    const gammaEl = getNodeEl(container, 'gamma')!
    expect(gammaEl.getAttribute('aria-selected')).toBe('true')
  })

  it('handles nonexistent activeId gracefully', () => {
    const data = makeNavData(['Alpha', 'Beta'])
    const withBadFocus = {
      ...data,
      entities: { ...data.entities, __focus__: { id: '__focus__', focusedId: 'nonexistent' } },
    }
    const { container } = render(<NavList data={withBadFocus} aria-label="Bad focus nav" />)
    const listbox = container.querySelector('[role="listbox"]')
    expect(listbox).not.toBeNull()
    const options = container.querySelectorAll('[role="option"]')
    expect(options).toHaveLength(2)
  })

  it('End key reaches last item in a long list', async () => {
    const user = userEvent.setup()
    const labels = Array.from({ length: 30 }, (_, i) => `Item ${i + 1}`)
    const { container } = render(<NavList data={makeNavData(labels)} aria-label="Long nav" />)

    getNodeEl(container, 'item-1')!.focus()
    await user.keyboard('{End}')
    expect(getFocusedNodeId(container)).toBe('item-30')
    expect(document.activeElement).toBe(getNodeEl(container, 'item-30'))
  })
})
