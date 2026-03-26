import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import CmsLayout from '../../pages/cms/CmsLayout'
import { resetCmsData } from '../../pages/cms/cms-state'
import { listbox } from '../pattern/listbox'
import { tree } from '../pattern/tree'
import { spatial } from '../misc/spatial'

/**
 * jsdom limitation: actual Tab DFS ordering and zone escape cannot be tested
 * in jsdom — those require real browser focus management. These tests verify
 * the DOM attribute contract (tabIndex=0 on all CMS nodes) and guard against
 * regression where existing behaviors accidentally switch away from roving-tabindex.
 */

describe('CMS tab flow (natural-tab-order)', () => {
  beforeEach(() => { resetCmsData() })

  it('all CMS nodes have tabIndex=0', () => {
    const { container } = render(<CmsLayout />)

    const nodes = container.querySelectorAll<HTMLElement>('[data-cms-id]')
    expect(nodes.length).toBeGreaterThan(0)

    for (const node of nodes) {
      expect(node.tabIndex, `node ${node.getAttribute('data-cms-id')} should have tabIndex=0`).toBe(0)
    }
  })
})

describe('V4 regression: existing behaviors retain roving-tabindex', () => {
  it('listbox uses roving-tabindex', () => {
    const behavior = listbox()
    expect(behavior.focusStrategy.type).toBe('roving-tabindex')
  })

  it('tree uses roving-tabindex', () => {
    expect(tree.focusStrategy.type).toBe('roving-tabindex')
  })

  it('spatial uses roving-tabindex', () => {
    expect(spatial.focusStrategy.type).toBe('roving-tabindex')
  })
})
