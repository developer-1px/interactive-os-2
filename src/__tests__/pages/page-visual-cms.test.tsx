import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PageVisualCms from '../../pages/PageVisualCms'

function getEditor() {
  return screen.getByRole('group', { name: 'Page content editor' })
}

function getVisibleNodeIds() {
  const editor = getEditor()
  return Array.from(editor.querySelectorAll<HTMLElement>('[data-node-id]'))
    .map((el) => el.dataset.nodeId!)
}

function getFocusedNode() {
  const editor = getEditor()
  return Array.from(editor.querySelectorAll<HTMLElement>('[data-node-id]'))
    .find((el) => el.getAttribute('tabindex') === '0')
}

function focusNodeById(id: string) {
  const node = getEditor().querySelector<HTMLElement>(`[data-node-id="${id}"]`)
  if (!node) throw new Error(`Node ${id} not found`)
  node.focus()
  return node
}

function pressKey(el: HTMLElement, key: string, opts: Record<string, unknown> = {}) {
  fireEvent.keyDown(el, { key, ...opts })
}

describe('Visual CMS spatial navigation', () => {
  beforeEach(() => {
    render(<PageVisualCms />)
  })

  it('renders ALL nodes at all times (page always fully visible)', () => {
    const ids = getVisibleNodeIds()
    // Root-level sections
    expect(ids).toContain('hero')
    expect(ids).toContain('features')
    expect(ids).toContain('stats')
    expect(ids).toContain('footer')
    // Nested children are ALSO visible (full page always rendered)
    expect(ids).toContain('hero-title')
    expect(ids).toContain('card-1')
    expect(ids).toContain('logo-1')
  })

  it('Enter on container moves focus to first child (page stays same)', () => {
    const heroNode = focusNodeById('hero')
    pressKey(heroNode, 'Enter')

    // Page still shows everything
    const ids = getVisibleNodeIds()
    expect(ids).toContain('hero')
    expect(ids).toContain('features')
    expect(ids).toContain('footer')

    // Focus moved to first child of hero
    const focused = getFocusedNode()
    expect(focused?.dataset.nodeId).toBe('hero-tag')
  })

  it('Escape returns focus to parent', () => {
    // Enter hero
    const heroNode = focusNodeById('hero')
    pressKey(heroNode, 'Enter')

    // Now inside hero — Escape to go back
    const tagNode = focusNodeById('hero-tag')
    pressKey(tagNode, 'Escape')

    // Focus should be back on hero
    const focused = getFocusedNode()
    expect(focused?.dataset.nodeId).toBe('hero')
  })

  it('Enter on leaf starts inline editing (rename)', () => {
    // Enter hero first
    const heroNode = focusNodeById('hero')
    pressKey(heroNode, 'Enter')

    // Enter on hero-title (leaf) should start rename, not navigate
    const titleNode = focusNodeById('hero-title')
    pressKey(titleNode, 'Enter')

    // Focus stays on hero-title (rename started, no depth change)
    const focused = getFocusedNode()
    expect(focused?.dataset.nodeId).toBe('hero-title')
  })

  it('F2 starts editing without entering children', () => {
    const heroNode = focusNodeById('hero')
    pressKey(heroNode, 'F2')

    // Focus stays on hero (F2 = rename, not enter)
    const focused = getFocusedNode()
    expect(focused?.dataset.nodeId).toBe('hero')
  })

  it('Breadcrumb shows current depth', () => {
    const breadcrumb = document.querySelector('.vc-breadcrumb')!
    expect(breadcrumb.textContent).toContain('Flux')

    const featuresNode = focusNodeById('features')
    pressKey(featuresNode, 'Enter')

    expect(breadcrumb.textContent).toContain('features')
  })

  it('double depth: root → features → card-1', () => {
    // Enter features
    const featuresNode = focusNodeById('features')
    pressKey(featuresNode, 'Enter')
    expect(getFocusedNode()?.dataset.nodeId).toBe('feat-heading')

    // Enter card-1
    const card1 = focusNodeById('card-1')
    pressKey(card1, 'Enter')
    expect(getFocusedNode()?.dataset.nodeId).toBe('card-1-title')

    // Escape back to features level
    const titleNode = focusNodeById('card-1-title')
    pressKey(titleNode, 'Escape')
    expect(getFocusedNode()?.dataset.nodeId).toBe('card-1')
  })
})
