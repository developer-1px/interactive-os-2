// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Feed
 * https://www.w3.org/WAI/ARIA/apg/patterns/feed/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../primitives/aria'
import { feed } from '../pattern/roles/feed'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      article1: { id: 'article1', data: { title: 'Article 1' } },
      article2: { id: 'article2', data: { title: 'Article 2' } },
      article3: { id: 'article3', data: { title: 'Article 3' } },
    },
    relationships: { [ROOT_ID]: ['article1', 'article2', 'article3'] },
  })
}

function renderFeed(data: NormalizedData) {
  return render(
    <Aria pattern={feed} data={data} plugins={[]}>
      <Aria.Item render={(props, item, _state: NodeState) => (
        <div {...props} data-testid={`article-${item.id}`}>
          {(item.data as Record<string, unknown>)?.title as string}
        </div>
      )} />
    </Aria>,
  )
}

function getNode(container: HTMLElement, id: string): HTMLElement {
  return container.querySelector(`[data-node-id="${id}"]`)!
}

function getFocusedNodeId(container: HTMLElement): string | null {
  return container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id') ?? null
}

// ---------------------------------------------------------------------------
// 1. ARIA Structure
// ---------------------------------------------------------------------------

describe('APG Feed — ARIA Structure', () => {
  it('container has role="feed"', () => {
    const { container } = renderFeed(fixtureData())
    expect(container.querySelector('[role="feed"]')).not.toBeNull()
  })

  it('each child has role="article"', () => {
    const { container } = renderFeed(fixtureData())
    const articles = container.querySelectorAll('[role="article"]')
    expect(articles.length).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// 2. Keyboard Navigation
// ---------------------------------------------------------------------------

describe('APG Feed — Keyboard Navigation', () => {
  it('PageDown moves focus to next article', async () => {
    const user = userEvent.setup()
    const { container } = renderFeed(fixtureData())

    getNode(container, 'article1').focus()
    await user.keyboard('{PageDown}')

    expect(getFocusedNodeId(container)).toBe('article2')
  })

  it('PageDown again moves focus to third article', async () => {
    const user = userEvent.setup()
    const { container } = renderFeed(fixtureData())

    getNode(container, 'article2').focus()
    await user.keyboard('{PageDown}')

    expect(getFocusedNodeId(container)).toBe('article3')
  })

  it('PageDown on last article stays on last (no wrap)', async () => {
    const user = userEvent.setup()
    const { container } = renderFeed(fixtureData())

    getNode(container, 'article3').focus()
    await user.keyboard('{PageDown}')

    expect(getFocusedNodeId(container)).toBe('article3')
  })

  it('PageUp moves focus to previous article', async () => {
    const user = userEvent.setup()
    const { container } = renderFeed(fixtureData())

    getNode(container, 'article3').focus()
    await user.keyboard('{PageUp}')

    expect(getFocusedNodeId(container)).toBe('article2')
  })

  it('PageUp on first article stays on first (no wrap)', async () => {
    const user = userEvent.setup()
    const { container } = renderFeed(fixtureData())

    getNode(container, 'article1').focus()
    await user.keyboard('{PageUp}')

    expect(getFocusedNodeId(container)).toBe('article1')
  })
})
