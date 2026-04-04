// V1: 2026-04-04-md-writer-prd.md
// V2: 2026-04-04-md-writer-prd.md
// V4: 2026-04-04-md-writer-prd.md
// V8: 2026-04-04-md-writer-prd.md
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PageWriter from '../pages/writer/PageWriter'
import { writerState } from '../pages/writer/writerStore'
import { mdToStore } from '../pages/writer/writerTransform'

describe('PageWriter screen', () => {
  beforeEach(() => {
    writerState.reset()
  })

  it('renders toolbar and file browser', () => {
    render(<PageWriter />)
    expect(screen.getByText('New')).toBeTruthy()
    expect(screen.getByText('Save')).toBeTruthy()
    expect(screen.getByText('Files')).toBeTruthy()
    expect(screen.getByText('Preview')).toBeTruthy()
  })

  it('loads MD and displays document in tree', async () => {
    const store = mdToStore('# Title\n\nParagraph text.\n')
    writerState.setData(store)

    render(<PageWriter />)
    const user = userEvent.setup()

    // Document structure treegrid should exist
    const treegrid = screen.getByLabelText('Document structure')
    expect(treegrid).toBeTruthy()

    // Expand document root to see heading
    const docRow = treegrid.querySelector('[role="row"]')!
    await user.click(docRow)
    await user.keyboard('{ArrowRight}')

    expect(screen.getByText('Title')).toBeTruthy()
  })

  it('toggles between tree and preview', async () => {
    const store = mdToStore('# Hello\n\nWorld.\n')
    writerState.setData(store)

    render(<PageWriter />)
    const user = userEvent.setup()

    expect(screen.getByText('Preview')).toBeTruthy()

    await user.click(screen.getByText('Preview'))
    expect(screen.getByText('Edit')).toBeTruthy()
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.textContent).toBe('Hello')

    await user.click(screen.getByText('Edit'))
    expect(screen.getByText('Preview')).toBeTruthy()
  })
})
