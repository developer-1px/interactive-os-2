// V1: 2026-03-28-aria-panel-trigger-prd.md
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { useState, useMemo, useCallback } from 'react'
import { Aria } from '../primitives/aria'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { composePattern } from '../pattern/composePattern'
import { select } from '../axis/select'
import { navigate } from '../axis/navigate'
import { expand, EXPANDED_ID } from '../axis/expand'

// Minimal tabs-like pattern for testing
const testTabs = composePattern(
  {
    role: 'tablist',
    childRole: 'tab',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-selected': String(state.selected),
    }),
    panelRole: 'tabpanel',
    panelVisibility: 'selected',
  },
  select({ mode: 'single', selectionFollowsFocus: true }),
  navigate({ orientation: 'horizontal' }),
)

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      tab1: { id: 'tab1', data: { label: 'Tab 1', content: 'Content 1' } },
      tab2: { id: 'tab2', data: { label: 'Tab 2', content: 'Content 2' } },
      tab3: { id: 'tab3', data: { label: 'Tab 3', content: 'Content 3' } },
    },
    relationships: { [ROOT_ID]: ['tab1', 'tab2', 'tab3'] },
  })
}

const renderTab = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, _state: NodeState) => (
  <div {...props}>{(node.data as Record<string, unknown>).label as string}</div>
)

const renderPanel = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, _state: NodeState) => (
  <div {...props}>{(node.data as Record<string, unknown>).content as string}</div>
)

function TestTabs() {
  const [store, setStore] = useState(fixtureData())
  const behavior = useMemo(() => testTabs, [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])
  return (
    <Aria behavior={behavior} data={store} plugins={[]} onChange={onChange} aria-label="Test Tabs">
      <Aria.Item render={renderTab} />
      <Aria.Panel render={renderPanel} />
    </Aria>
  )
}

describe('Aria.Panel', () => {
  it('renders panels with correct role and only selected panel visible', () => {
    const { container } = render(<TestTabs />)
    const panels = container.querySelectorAll('[role="tabpanel"]')
    expect(panels.length).toBe(3)

    const visiblePanels = Array.from(panels).filter(
      (p) => !p.hasAttribute('hidden')
    )
    expect(visiblePanels.length).toBe(1)
    expect(visiblePanels[0]!.textContent).toBe('Content 1')
  })

  it('generates aria-labelledby on panel and aria-controls on item', () => {
    const { container } = render(<TestTabs />)

    const tab1 = container.querySelector('[data-node-id="tab1"]')!
    const panels = container.querySelectorAll('[role="tabpanel"]')
    const panel1 = Array.from(panels).find(
      (p) => p.getAttribute('aria-labelledby') === 'tab1'
    )

    expect(panel1).toBeTruthy()
    expect(tab1.getAttribute('aria-controls')).toBe('panel-tab1')
    expect(panel1!.getAttribute('id')).toBe('panel-tab1')
  })

  it('switches visible panel when selection changes', async () => {
    const user = userEvent.setup()
    const { container } = render(<TestTabs />)

    const tab1 = container.querySelector('[data-node-id="tab1"]') as HTMLElement
    tab1.focus()
    await user.keyboard('{ArrowRight}')

    const panels = container.querySelectorAll('[role="tabpanel"]')
    const visiblePanels = Array.from(panels).filter(
      (p) => !p.hasAttribute('hidden')
    )
    expect(visiblePanels.length).toBe(1)
    expect(visiblePanels[0]!.textContent).toBe('Content 2')
  })
})

// V2: 2026-03-28-aria-panel-trigger-prd.md
const testAccordion = composePattern(
  {
    role: 'region',
    childRole: 'heading',
    ariaAttributes: (_node, state: NodeState) => {
      if (state.expanded !== undefined) return { 'aria-expanded': String(state.expanded) }
      return {}
    },
    panelRole: 'region',
    panelVisibility: 'expanded',
  },
  expand(),
  navigate({ orientation: 'vertical' }),
)

function accordionData(): NormalizedData {
  return createStore({
    entities: {
      h1: { id: 'h1', data: { label: 'Header 1', content: 'Region 1' } },
      h2: { id: 'h2', data: { label: 'Header 2', content: 'Region 2' } },
      [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: ['h1'] },
    },
    relationships: { [ROOT_ID]: ['h1', 'h2'] },
  })
}

const renderHeader = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, _state: NodeState) => (
  <div {...props}>{(node.data as Record<string, unknown>).label as string}</div>
)
const renderRegion = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, _state: NodeState) => (
  <div {...props}>{(node.data as Record<string, unknown>).content as string}</div>
)

function TestAccordion() {
  const [store, setStore] = useState(accordionData())
  const behavior = useMemo(() => testAccordion, [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])
  return (
    <Aria behavior={behavior} data={store} plugins={[]} onChange={onChange} aria-label="Test Accordion">
      <Aria.Item render={renderHeader} />
      <Aria.Panel render={renderRegion} />
    </Aria>
  )
}

describe('Aria.Panel (expanded visibility)', () => {
  it('only expanded items show their panel', () => {
    const { container } = render(<TestAccordion />)
    // Filter panels by id prefix to avoid matching the root role="region"
    const panelPanels = Array.from(container.querySelectorAll('[id^="panel-"]'))
    expect(panelPanels.length).toBe(2)

    const visible = panelPanels.filter((p) => !p.hasAttribute('hidden'))
    expect(visible.length).toBe(1)
    expect(visible[0]!.textContent).toBe('Region 1')
  })

  it('generates cross-references', () => {
    const { container } = render(<TestAccordion />)
    const h1 = container.querySelector('[data-node-id="h1"]')!
    expect(h1.getAttribute('aria-controls')).toBe('panel-h1')

    const panel1 = container.querySelector('#panel-h1')!
    expect(panel1.getAttribute('aria-labelledby')).toBe('h1')
  })
})
