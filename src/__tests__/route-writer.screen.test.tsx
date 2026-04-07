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

describe('Writer navigate with paragraph', () => {
  beforeEach(() => { writerState.reset() })

  it('↓ from heading lands on paragraph, then sentence', async () => {
    loadMd('# Intro\n\nFirst sentence.\n')
    renderWriter()
    const user = userEvent.setup()
    const tree = getTree()

    await user.click(findRow(tree, 'Intro')!)
    expect(text(getFocused(tree))).toContain('Intro')

    // ArrowDown → paragraph ¶
    await user.keyboard('{ArrowDown}')
    await waitFor(() => {
      expect(text(getFocused(tree))).toContain('¶')
    })

    // ArrowDown → sentence inside paragraph
    await user.keyboard('{ArrowDown}')
    await waitFor(() => {
      expect(text(getFocused(tree))).toContain('First sentence')
    })
  })

  it('↑↓ navigates through paragraphs and sentences', async () => {
    loadMd('# Title\n\nAlpha.\n\nBeta.\n')
    renderWriter()
    const user = userEvent.setup()
    const tree = getTree()

    await user.click(findRow(tree, 'Title')!)

    // Title → ¶1 → Alpha → ¶2 → Beta
    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(text(getFocused(tree))).toContain('¶'))

    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(text(getFocused(tree))).toContain('Alpha'))

    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(text(getFocused(tree))).toContain('¶'))

    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(text(getFocused(tree))).toContain('Beta'))

    // Back up
    await user.keyboard('{ArrowUp}')
    await waitFor(() => expect(text(getFocused(tree))).toContain('¶'))

    await user.keyboard('{ArrowUp}')
    await waitFor(() => expect(text(getFocused(tree))).toContain('Alpha'))
  })

  it('paragraph is selectable and deletable', async () => {
    loadMd('# Title\n\nHello. World.\n')
    renderWriter()
    const user = userEvent.setup()
    const tree = getTree()

    // Navigate to paragraph
    await user.click(findRow(tree, 'Title')!)
    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(text(getFocused(tree))).toContain('¶'))

    // Delete paragraph — removes it and its sentences
    await user.keyboard('{Backspace}')

    await waitFor(() => {
      const md = writerState.getMd()
      expect(md).not.toContain('Hello')
      expect(md).not.toContain('World')
    })
  })
})

describe('Writer paragraph boundary jump', () => {
  beforeEach(() => { writerState.reset() })

  it('Cmd+↓ from last sentence jumps to next paragraph first sentence', async () => {
    loadMd('# Title\n\nAlpha. Bravo.\n\nCharlie.\n')
    renderWriter()
    const user = userEvent.setup()
    const tree = getTree()

    // Navigate to Bravo (last sentence of first paragraph)
    // Title → ¶1 → Alpha → Bravo
    await user.click(findRow(tree, 'Title')!)
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')
    await waitFor(() => expect(text(getFocused(tree))).toContain('Bravo'))

    // Cmd+↓ → Charlie (first sentence of next paragraph)
    // jsdom: Mod+ = Ctrl+ (not Mac)
    await user.keyboard('{Control>}{ArrowDown}{/Control}')
    await waitFor(() => expect(text(getFocused(tree))).toContain('Charlie'))
  })

  it('Cmd+↑ from first sentence jumps to previous paragraph last sentence', async () => {
    loadMd('# Title\n\nAlpha. Bravo.\n\nCharlie.\n')
    renderWriter()
    const user = userEvent.setup()
    const tree = getTree()

    // Navigate to Charlie: Title → ¶1 → Alpha → Bravo → ¶2 → Charlie
    await user.click(findRow(tree, 'Title')!)
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}')
    await waitFor(() => expect(text(getFocused(tree))).toContain('Charlie'))

    // Cmd+↑ → Bravo (last sentence of previous paragraph)
    // jsdom: Mod+ = Ctrl+ (not Mac)
    await user.keyboard('{Control>}{ArrowUp}{/Control}')
    await waitFor(() => expect(text(getFocused(tree))).toContain('Bravo'))
  })
})

describe('Writer cross-paragraph move', () => {
  beforeEach(() => { writerState.reset() })

  it('Alt+↓ moves sentence past next sentence across paragraphs', async () => {
    loadMd('# Title\n\nFirst.\n\nSecond.\n')
    renderWriter()
    const user = userEvent.setup()
    const tree = getTree()

    // Navigate past ¶ to "First."
    await user.click(findRow(tree, 'Title')!)
    await user.keyboard('{ArrowDown}{ArrowDown}')
    await waitFor(() => expect(text(getFocused(tree))).toContain('First'))

    // Alt+↓ to move First past Second (leaf-only swap)
    const focused = getFocused(tree)!
    focused.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowDown', code: 'ArrowDown', altKey: true, bubbles: true, cancelable: true,
    }))

    // Verify via MD output — Second should appear before First
    await waitFor(() => {
      const md = writerState.getMd()
      const secondIdx = md.indexOf('Second')
      const firstIdx = md.indexOf('First')
      expect(secondIdx).toBeLessThan(firstIdx)
    })
  })

  it('Alt+↑ moves sentence up across paragraph boundary', async () => {
    loadMd('# Title\n\nAlpha.\n\nBeta.\n')
    renderWriter()
    const user = userEvent.setup()
    const tree = getTree()

    // Navigate to Beta: Title → ¶1 → Alpha → ¶2 → Beta
    await user.click(findRow(tree, 'Title')!)
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}')
    await waitFor(() => expect(text(getFocused(tree))).toContain('Beta'))

    // Alt+↑ to move Beta above Alpha
    await user.keyboard('{Alt>}{ArrowUp}{/Alt}')

    // Verify via MD output — Beta should appear before Alpha
    await waitFor(() => {
      const md = writerState.getMd()
      const betaIdx = md.indexOf('Beta')
      const alphaIdx = md.indexOf('Alpha')
      expect(betaIdx).toBeLessThan(alphaIdx)
    })
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

    // Navigate to sentence: Title → ¶ → HelloWorld
    await user.click(findRow(tree, 'Title')!)
    await user.keyboard('{ArrowDown}{ArrowDown}')
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
