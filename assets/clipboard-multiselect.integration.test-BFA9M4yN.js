var e=`/**
 * Integration test: multi-select clipboard operations
 *
 * Verifies that Shift+Arrow multi-select → copy/cut/paste works
 * through the full React render pipeline with native clipboard events.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { resetClipboard } from '../plugins/clipboard'
import { StatefulList, getVisibleLabels, getNodeElement } from './clipboardTestUtils'

describe('multi-select clipboard integration', () => {
  beforeEach(() => resetClipboard())

  it('Shift+Arrow selects range → copy → paste inserts all', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulList />)

    // Focus 'a', then Shift+Down twice to select a, b, c
    getNodeElement(container, 'a').focus()
    await user.keyboard('{Shift>}{ArrowDown}{ArrowDown}{/Shift}')

    // Copy selection
    fireEvent.copy(getNodeElement(container, 'a'))

    // Move focus to 'd', paste after it
    getNodeElement(container, 'd').focus()
    fireEvent.paste(getNodeElement(container, 'd'))

    const labels = getVisibleLabels(container)
    // Original 4 + 3 copies = 7
    expect(labels).toEqual([
      'Alpha', 'Bravo', 'Charlie', 'Delta',
      'Alpha', 'Bravo', 'Charlie',
    ])
  })

  it('Shift+Arrow selects range → cut → paste moves all', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulList />)

    // Focus 'a', Shift+Down to select a, b
    getNodeElement(container, 'a').focus()
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}')

    // Cut selection
    fireEvent.cut(getNodeElement(container, 'a'))

    // Focus 'd', paste
    getNodeElement(container, 'd').focus()
    fireEvent.paste(getNodeElement(container, 'd'))

    const labels = getVisibleLabels(container)
    // a, b moved after d
    expect(labels).toEqual(['Charlie', 'Delta', 'Alpha', 'Bravo'])
  })

  it('multi-select cut → paste → undo restores original', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulList />)

    // Select b, c
    getNodeElement(container, 'b').focus()
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}')

    // Cut
    fireEvent.cut(getNodeElement(container, 'b'))

    // Paste after 'd'
    getNodeElement(container, 'd').focus()
    fireEvent.paste(getNodeElement(container, 'd'))

    expect(getVisibleLabels(container)).toEqual(['Alpha', 'Delta', 'Bravo', 'Charlie'])

    // Undo
    await user.keyboard('{Control>}z{/Control}')
    expect(getVisibleLabels(container)).toEqual(['Alpha', 'Bravo', 'Charlie', 'Delta'])
  })

  it('Mod+D duplicates multi-selected nodes', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulList />)

    // Select a, b
    getNodeElement(container, 'a').focus()
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}')

    // Mod+D to duplicate
    await user.keyboard('{Control>}d{/Control}')

    expect(getVisibleLabels(container)).toEqual([
      'Alpha', 'Bravo', 'Alpha', 'Bravo', 'Charlie', 'Delta',
    ])
  })
})
`;export{e as default};