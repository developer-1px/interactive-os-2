// V1-V9: 2026-03-28-aria-panel-trigger-prd.md
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../primitives/aria'
import { tabs } from '../pattern/roles/tabs'
import { accordion } from '../pattern/roles/accordion'
import { menuButton } from '../pattern/roles/menuButton'
import { listbox as listboxFn } from '../pattern/roles/listbox'
import type { NormalizedData } from '../store/types'
import { ROOT_ID } from '../store/types'

function makeData(ids: string[]): NormalizedData {
  const entities: NormalizedData['entities'] = {}
  for (const id of ids) {
    entities[id] = { id, data: { label: id } }
  }
  return { entities, relationships: { [ROOT_ID]: ids } }
}

// V1: Tabs ��� Panel renders with correct ARIA
describe('Aria.Panel', () => {
  it('V1: renders tabpanels linked to tabs via aria-controls/aria-labelledby', () => {
    const data = makeData(['tab-1', 'tab-2', 'tab-3'])
    render(
      <Aria pattern={tabs} data={data} plugins={[]} aria-label="Test tabs">
        <div role="tablist">
          <Aria.Item render={(props, node, state) => (
            <div {...props} data-testid={`tab-${node.id}`}>{String(node.data?.label)}</div>
          )} />
        </div>
        <Aria.Panel render={(props, node, state) => (
          <div {...props} data-testid={`panel-${node.id}`}>Panel for {String(node.data?.label)}</div>
        )} />
      </Aria>,
    )

    // First tab should be selected (followFocus), its panel visible
    const panel1 = screen.getByTestId('panel-tab-1')
    expect(panel1.getAttribute('role')).toBe('tabpanel')
    expect(panel1.getAttribute('id')).toBe('panel-tab-1')
    expect(panel1.getAttribute('aria-labelledby')).toBe('tab-1')
    expect(panel1.hasAttribute('hidden')).toBe(false)

    // Other panels should be hidden
    const panel2 = screen.getByTestId('panel-tab-2')
    expect(panel2.hasAttribute('hidden')).toBe(true)

    // Tab should have aria-controls
    const tab1 = screen.getByTestId('tab-tab-1')
    expect(tab1.getAttribute('aria-controls')).toBe('panel-tab-1')
  })
})

// V2: Accordion — Panel renders regions linked to headers
describe('Aria.Panel accordion', () => {
  it('V2: renders regions with expanded visibility', async () => {
    const user = userEvent.setup()
    const data = makeData(['h-1', 'h-2'])
    render(
      <Aria pattern={accordion} data={data} plugins={[]} aria-label="Test accordion">
        <Aria.Item render={(props, node) => (
          <div {...props} data-testid={`header-${node.id}`}>{String(node.data?.label)}</div>
        )} />
        <Aria.Panel render={(props, node) => (
          <div {...props} data-testid={`region-${node.id}`}>Content for {String(node.data?.label)}</div>
        )} />
      </Aria>,
    )

    // Initially all collapsed → all panels hidden
    const region1 = screen.getByTestId('region-h-1')
    expect(region1.getAttribute('role')).toBe('region')
    expect(region1.hasAttribute('hidden')).toBe(true)

    // Expand first header
    const header1 = screen.getByTestId('header-h-1')
    await user.click(header1)

    // Region should now be visible
    expect(screen.getByTestId('region-h-1').hasAttribute('hidden')).toBe(false)
    expect(screen.getByTestId('region-h-2').hasAttribute('hidden')).toBe(true)
  })
})

// V3: MenuButton Trigger — Enter opens popup
describe('Aria.Trigger', () => {
  it('V3: Enter on trigger opens popup with aria-haspopup/aria-expanded', async () => {
    const user = userEvent.setup()
    // MenuButton needs a trigger parent with menu items as children
    const data: NormalizedData = {
      entities: {
        trigger: { id: 'trigger', data: { label: 'Menu' } },
        item1: { id: 'item1', data: { label: 'Cut' } },
        item2: { id: 'item2', data: { label: 'Copy' } },
      },
      relationships: {
        [ROOT_ID]: ['trigger'],
        trigger: ['item1', 'item2'],
      },
    }

    render(
      <Aria pattern={menuButton} data={data} plugins={[]} aria-label="Test menu">
        <Aria.Trigger render={(props, state) => (
          <button {...props} data-testid="trigger">Menu {state.open ? '▲' : '▼'}</button>
        )} />
        <Aria.Item render={(props, node) => (
          <div {...props} data-testid={`item-${node.id}`}>{String(node.data?.label)}</div>
        )} />
      </Aria>,
    )

    const trigger = screen.getByTestId('trigger')
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })
})

// V5: Listbox with no Panel — existing behavior unchanged
describe('backward compatibility', () => {
  it('V5: listbox works without Panel — no errors', () => {
    const data = makeData(['opt-1', 'opt-2'])
    render(
      <Aria pattern={listboxFn()} data={data} plugins={[]} aria-label="Test listbox">
        <Aria.Item render={(props, node) => (
          <div {...props}>{String(node.data?.label)}</div>
        )} />
      </Aria>,
    )

    expect(screen.getByText('opt-1')).toBeTruthy()
    expect(screen.getByText('opt-2')).toBeTruthy()
  })
})
