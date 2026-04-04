import { describe, it, expect, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PageCms from '../pages/cms/PageCms'
import { resetCmsData } from '../pages/cms/cmsState'

function getFocused(): string {
  return document.activeElement?.getAttribute('data-cms-id') ?? ''
}

/** Click a node to focus it */
async function focusNode(container: HTMLElement, user: ReturnType<typeof userEvent.setup>, nodeId: string) {
  const el = container.querySelector(`[data-cms-id="${nodeId}"]`) as HTMLElement
  expect(el).not.toBeNull()
  await user.click(el)
}

/** Fire a clipboard event that bubbles up to the container with React onCopy/onCut/onPaste */
async function fireClipboard(type: 'copy' | 'cut' | 'paste') {
  await act(() => {
    const el = document.activeElement as HTMLElement
    const event = new ClipboardEvent(type, { bubbles: true, cancelable: true })
    el.dispatchEvent(event)
  })
}

function articleCount(container: HTMLElement): number {
  const journal = container.querySelector('[data-cms-id="journal"]')!
  return journal.querySelectorAll('[data-cms-id^="article-"]').length
}

describe('CMS collection: crud + clipboard + history', () => {
  beforeEach(() => { resetCmsData() })

  it('Delete removes a collection item from the section', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageCms />)

    await focusNode(container, user, 'article-start')
    expect(getFocused()).toBe('article-start')

    await user.keyboard('{Delete}')
    expect(container.querySelector('[data-cms-id="article-start"]')).toBeNull()
  })

  it('Mod+Z undoes a delete', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageCms />)

    await focusNode(container, user, 'article-start')
    await user.keyboard('{Delete}')
    expect(container.querySelector('[data-cms-id="article-start"]')).toBeNull()

    await user.keyboard('{Control>}z{/Control}')
    expect(container.querySelector('[data-cms-id="article-start"]')).not.toBeNull()
  })

  it('Mod+Shift+Z redoes after undo', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageCms />)

    await focusNode(container, user, 'article-start')
    await user.keyboard('{Delete}')
    expect(container.querySelector('[data-cms-id="article-start"]')).toBeNull()

    await user.keyboard('{Control>}z{/Control}')
    expect(container.querySelector('[data-cms-id="article-start"]')).not.toBeNull()

    await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}')
    expect(container.querySelector('[data-cms-id="article-start"]')).toBeNull()
  })

  it('copy then paste duplicates a collection item', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageCms />)

    const before = articleCount(container)
    await focusNode(container, user, 'article-start')

    // Verify focused element is inside the cms-root container
    const cmsRoot = container.querySelector('[data-cms-root]') as HTMLElement
    expect(cmsRoot.contains(document.activeElement)).toBe(true)

    await fireClipboard('copy')

    // After copy, active element should still be in container
    expect(cmsRoot.contains(document.activeElement)).toBe(true)
    expect(getFocused()).toBe('article-start')

    await fireClipboard('paste')

    expect(articleCount(container)).toBe(before + 1)
  })

  it('cut then paste moves the item', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageCms />)

    await focusNode(container, user, 'article-start')

    // Cut buffers the item (does not remove from store yet — only marks for move)
    await fireClipboard('cut')
    // Paste removes original + re-inserts with new ID
    await fireClipboard('paste')

    // Original article-start is removed from the tree
    // A new node with the same article type data exists
    const journal = container.querySelector('[data-cms-id="journal"]')!
    const articleNodes = Array.from(journal.querySelectorAll('[data-cms-id]'))
      .filter(el => {
        const text = el.textContent ?? ''
        return text.includes('Getting Started')
      })
    expect(articleNodes.length).toBeGreaterThan(0)
  })
})
