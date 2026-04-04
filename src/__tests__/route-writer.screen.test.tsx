import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import PageWriter from '../pages/writer/PageWriter'
import { writerState } from '../pages/writer/writerStore'
import { mdToStore } from '../pages/writer/writerTransform'
import { expandCommands } from '@os/axis/expand'

function renderWriter() {
  return render(<MemoryRouter initialEntries={['/writer']}><PageWriter /></MemoryRouter>)
}

function loadMd(md: string) {
  const store = expandCommands.expandAll.reduce(mdToStore(md))
  writerState.setData(store)
  writerState.markClean()
}

function getTree(): HTMLElement {
  return screen.getByLabelText('Document structure')
}

function getFocused(tree: HTMLElement): HTMLElement | null {
  return tree.querySelector('[data-focused]')
}

function getRows(tree: HTMLElement): HTMLElement[] {
  return Array.from(tree.querySelectorAll('[role="row"]'))
}

function text(el: HTMLElement | null): string {
  return el?.textContent?.trim() ?? ''
}

function findRow(tree: HTMLElement, needle: string): HTMLElement | undefined {
  return getRows(tree).find(r => text(r).includes(needle))
}

describe('PageWriter screen', () => {
  beforeEach(() => { writerState.reset() })

  it('renders toolbar and tree', () => {
    renderWriter()
    expect(screen.getByLabelText('Writer toolbar')).toBeTruthy()
    expect(getTree()).toBeTruthy()
  })
})

describe('Writer navigate skip', () => {
  beforeEach(() => { writerState.reset() })

  it('↓ from heading skips paragraph, lands on sentence', async () => {
    loadMd('# Intro\n\nFirst sentence.\n')
    renderWriter()
    const user = userEvent.setup()
    const tree = getTree()

    await user.click(findRow(tree, 'Intro')!)
    expect(text(getFocused(tree))).toContain('Intro')

    await user.keyboard('{ArrowDown}')
    await waitFor(() => {
      expect(text(getFocused(tree))).toContain('First sentence')
    })
  })

  it('↑↓ crosses paragraph boundaries between sentences', async () => {
    loadMd('# Title\n\nAlpha.\n\nBeta.\n')
    renderWriter()
    const user = userEvent.setup()
    const tree = getTree()

    await user.click(findRow(tree, 'Title')!)

    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(text(getFocused(tree))).toContain('Alpha'))

    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(text(getFocused(tree))).toContain('Beta'))

    await user.keyboard('{ArrowUp}')
    await waitFor(() => expect(text(getFocused(tree))).toContain('Alpha'))
  })
})

describe('Writer cross-paragraph move', () => {
  beforeEach(() => { writerState.reset() })

  it('Alt+↓ moves sentence past next sentence across paragraphs', async () => {
    loadMd('# Title\n\nFirst.\n\nSecond.\n')
    renderWriter()
    const user = userEvent.setup()
    const tree = getTree()

    // Focus heading, navigate to "First."
    await user.click(findRow(tree, 'Title')!)
    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(text(getFocused(tree))).toContain('First'))

    // Alt+↓ to move First past Second
    // Debug: check what Alt+Arrow produces
    const focused = getFocused(tree)!
    focused.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowDown', code: 'ArrowDown', altKey: true, bubbles: true, cancelable: true,
    }))

    // Verify new order: from heading → Second → First
    await user.click(findRow(tree, 'Title')!)
    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(text(getFocused(tree))).toContain('Second'))
    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(text(getFocused(tree))).toContain('First'))
  })

  it('Alt+↑ moves sentence up across paragraph boundary', async () => {
    loadMd('# Title\n\nAlpha.\n\nBeta.\n')
    renderWriter()
    const user = userEvent.setup()
    const tree = getTree()

    // Navigate to Beta
    await user.click(findRow(tree, 'Title')!)
    await user.keyboard('{ArrowDown}{ArrowDown}')
    await waitFor(() => expect(text(getFocused(tree))).toContain('Beta'))

    // Alt+↑ to move Beta above Alpha
    await user.keyboard('{Alt>}{ArrowUp}{/Alt}')

    // Verify: heading → Beta → Alpha
    await user.click(findRow(tree, 'Title')!)
    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(text(getFocused(tree))).toContain('Beta'))
    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(text(getFocused(tree))).toContain('Alpha'))
  })
})

describe('Writer indent/outdent', () => {
  beforeEach(() => { writerState.reset() })

  it('Tab indents heading — MD level increases', async () => {
    loadMd('# First\n\n# Second\n')
    renderWriter()
    const user = userEvent.setup()
    const tree = getTree()

    // Navigate to Second
    await user.click(findRow(tree, 'First')!)
    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(text(getFocused(tree))).toContain('Second'))

    // Tab to indent
    await user.keyboard('{Tab}')

    await waitFor(() => {
      const md = writerState.getMd()
      expect(md).toContain('## Second')
    })
  })

  it('Shift+Tab outdents heading — MD level decreases', async () => {
    loadMd('# Parent\n\n## Child\n')
    renderWriter()
    const user = userEvent.setup()
    const tree = getTree()

    await user.click(findRow(tree, 'Parent')!)
    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(text(getFocused(tree))).toContain('Child'))

    await user.keyboard('{Shift>}{Tab}{/Shift}')

    await waitFor(() => {
      const md = writerState.getMd()
      expect(md).toContain('# Child')
    })
  })
})

describe('Writer split', () => {
  beforeEach(() => { writerState.reset() })

  it('Cmd+Enter during editing splits sentence at cursor', async () => {
    loadMd('# Title\n\nHelloWorld.\n')
    renderWriter()
    const user = userEvent.setup()
    const tree = getTree()

    // Navigate to sentence
    await user.click(findRow(tree, 'Title')!)
    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(text(getFocused(tree))).toContain('HelloWorld'))

    // Enter to start editing
    await user.keyboard('{Enter}')

    await waitFor(() => {
      const editable = tree.querySelector('[contenteditable="true"]') as HTMLElement
      expect(editable).toBeTruthy()
    })

    // Find the actual text node and place cursor at position 5
    const editable = tree.querySelector('[contenteditable="true"]') as HTMLElement
    const walker = document.createTreeWalker(editable, NodeFilter.SHOW_TEXT)
    const textNode = walker.nextNode()
    if (textNode && textNode.textContent && textNode.textContent.length >= 5) {
      const range = document.createRange()
      range.setStart(textNode, 5)
      range.collapse(true)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    }

    // Cmd+Enter to split
    await user.keyboard('{Meta>}{Enter}{/Meta}')

    await waitFor(() => {
      const md = writerState.getMd()
      expect(md).toContain('Hello')
      expect(md).toContain('World')
    })
  })
})
