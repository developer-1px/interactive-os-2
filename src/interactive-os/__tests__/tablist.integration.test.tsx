import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { TabList } from '../ui/TabList'
import { createStore } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'

function makeTabData(labels: string[]): NormalizedData {
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

function TabListWithActivatedDisplay({ data, ...rest }: { data: NormalizedData; 'aria-label': string }) {
  const [activated, setActivated] = useState('')
  return (
    <>
      <TabList data={data} onActivate={setActivated} {...rest} />
      <div data-testid="activated">{activated}</div>
    </>
  )
}

describe('TabList', () => {
  it('ArrowRight moves to next tab and activates it (followFocus)', async () => {
    const user = userEvent.setup()
    const { container } = render(<TabListWithActivatedDisplay data={makeTabData(['Alpha', 'Beta', 'Gamma'])} aria-label="Test tabs" />)

    getNodeEl(container, 'alpha')!.focus()
    await user.keyboard('{ArrowRight}')

    expect(getFocusedNodeId(container)).toBe('beta')
    expect(document.activeElement).toBe(getNodeEl(container, 'beta'))
    expect(screen.getByTestId('activated').textContent).toBe('beta')
  })

  it('ArrowLeft moves to previous tab and activates it', async () => {
    const user = userEvent.setup()
    const { container } = render(<TabListWithActivatedDisplay data={makeTabData(['Alpha', 'Beta', 'Gamma'])} aria-label="Test tabs" />)

    getNodeEl(container, 'beta')!.focus()
    await user.keyboard('{ArrowLeft}')

    expect(getFocusedNodeId(container)).toBe('alpha')
    expect(document.activeElement).toBe(getNodeEl(container, 'alpha'))
    expect(screen.getByTestId('activated').textContent).toBe('alpha')
  })

  it('Home moves to first, End moves to last', async () => {
    const user = userEvent.setup()
    const { container } = render(<TabListWithActivatedDisplay data={makeTabData(['Alpha', 'Beta', 'Gamma'])} aria-label="Test tabs" />)

    getNodeEl(container, 'beta')!.focus()
    await user.keyboard('{Home}')
    expect(getFocusedNodeId(container)).toBe('alpha')

    await user.keyboard('{End}')
    expect(getFocusedNodeId(container)).toBe('gamma')
    expect(screen.getByTestId('activated').textContent).toBe('gamma')
  })

  it('click on tab activates it', async () => {
    const user = userEvent.setup()
    const { container } = render(<TabListWithActivatedDisplay data={makeTabData(['Alpha', 'Beta'])} aria-label="Test tabs" />)

    await user.click(getNodeEl(container, 'beta')!)
    expect(getFocusedNodeId(container)).toBe('beta')
    expect(screen.getByTestId('activated').textContent).toBe('beta')
  })

  it('supports custom renderItem', () => {
    render(
      <TabList
        data={makeTabData(['Alpha'])}
        renderItem={(node) => <span data-testid="custom">{(node.data as { label: string }).label}!</span>}
        aria-label="Custom tabs"
      />
    )
    expect(screen.getByTestId('custom').textContent).toBe('Alpha!')
  })

  it('renders empty tablist without error', () => {
    const { container } = render(<TabList data={createStore({ entities: {}, relationships: { [ROOT_ID]: [] } })} aria-label="Empty tabs" />)
    const tablist = container.querySelector('[role="tablist"]')
    expect(tablist).not.toBeNull()
    expect(tablist!.getAttribute('aria-label')).toBe('Empty tabs')
    expect(tablist!.getAttribute('aria-orientation')).toBe('horizontal')
  })

  it('ArrowDown and ArrowUp do nothing (horizontal orientation)', async () => {
    const user = userEvent.setup()
    const { container } = render(<TabListWithActivatedDisplay data={makeTabData(['Alpha', 'Beta', 'Gamma'])} aria-label="Test tabs" />)

    getNodeEl(container, 'alpha')!.focus()
    await user.keyboard('{ArrowDown}')

    expect(getFocusedNodeId(container)).toBe('alpha')
    expect(document.activeElement).toBe(getNodeEl(container, 'alpha'))

    await user.keyboard('{ArrowUp}')

    expect(getFocusedNodeId(container)).toBe('alpha')
    expect(document.activeElement).toBe(getNodeEl(container, 'alpha'))
  })
})
