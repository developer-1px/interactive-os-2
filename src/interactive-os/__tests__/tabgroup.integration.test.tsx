// PRD refs: V14 (tab switching), V2 (Delete close), V17 (close button bubbling)
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TabGroup } from '../ui/TabGroup'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData, Entity } from '../store/types'

function makeTabGroupData(): NormalizedData {
  return createStore({
    entities: {
      'tg-1': { id: 'tg-1', data: { type: 'tabgroup', activeTabId: 'tab-a' } },
      'tab-a': { id: 'tab-a', data: { type: 'tab', label: 'Alpha', contentType: 'file', contentRef: 'a.ts' } },
      'tab-b': { id: 'tab-b', data: { type: 'tab', label: 'Beta', contentType: 'file', contentRef: 'b.ts' } },
    },
    relationships: {
      [ROOT_ID]: ['tg-1'],
      'tg-1': ['tab-a', 'tab-b'],
    },
  })
}

function getNodeEl(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

function renderPanel(tab: Entity): React.ReactNode {
  const label = (tab.data as Record<string, unknown>)?.label as string ?? tab.id
  return <div data-testid="panel-content">{`Content: ${label}`}</div>
}

describe('TabGroup', () => {
  it('V14: renders active panel and switches on ArrowRight', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { container } = render(
      <TabGroup
        data={makeTabGroupData()}
        tabgroupId="tg-1"
        onChange={onChange}
        renderPanel={renderPanel}
        aria-label="Test tabs"
      />
    )

    // Active tab-a panel is shown
    expect(screen.getByTestId('panel-content').textContent).toBe('Content: Alpha')

    // Focus first tab and arrow right
    getNodeEl(container, 'tab-a')!.focus()
    await user.keyboard('{ArrowRight}')

    // onChange called with activeTabId set to tab-b
    expect(onChange).toHaveBeenCalled()
    const newData = onChange.mock.calls[0]![0] as NormalizedData
    const tgData = newData.entities['tg-1']?.data as Record<string, unknown>
    expect(tgData.activeTabId).toBe('tab-b')
  })

  it('V2: Delete key removes focused tab via onChange', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { container } = render(
      <TabGroup
        data={makeTabGroupData()}
        tabgroupId="tg-1"
        onChange={onChange}
        renderPanel={renderPanel}
        aria-label="Test tabs"
      />
    )

    getNodeEl(container, 'tab-a')!.focus()
    await user.keyboard('{Delete}')

    expect(onChange).toHaveBeenCalled()
    const newData = onChange.mock.calls[0]![0] as NormalizedData
    // tab-a should be removed
    expect(newData.entities['tab-a']).toBeUndefined()
    // tab-b should remain
    expect(newData.entities['tab-b']).toBeDefined()
  })

  it('V17: close button removes tab without triggering tab activation', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { container } = render(
      <TabGroup
        data={makeTabGroupData()}
        tabgroupId="tg-1"
        onChange={onChange}
        renderPanel={renderPanel}
        aria-label="Test tabs"
      />
    )

    // Click close button on tab-b (not the active tab)
    const tabB = getNodeEl(container, 'tab-b')!
    const closeBtn = tabB.querySelector('button')!
    await user.click(closeBtn)

    // onChange should have been called exactly once (close only, no activation)
    expect(onChange).toHaveBeenCalledTimes(1)
    const newData = onChange.mock.calls[0]![0] as NormalizedData
    // tab-b removed
    expect(newData.entities['tab-b']).toBeUndefined()
    // tab-a still there
    expect(newData.entities['tab-a']).toBeDefined()
  })
})
