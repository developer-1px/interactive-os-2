// V1: 2026-04-04-md-writer-prd.md
// V2: 2026-04-04-md-writer-prd.md
// V4: 2026-04-04-md-writer-prd.md
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import PageWriter from '../pages/writer/PageWriter'
import { writerState } from '../pages/writer/writerStore'
import { mdToStore } from '../pages/writer/writerTransform'

function renderWriter() {
  return render(<MemoryRouter initialEntries={['/writer']}><PageWriter /></MemoryRouter>)
}

describe('PageWriter screen', () => {
  beforeEach(() => {
    writerState.reset()
  })

  it('renders toolbar and file browser', () => {
    renderWriter()
    expect(screen.getByText('New')).toBeTruthy()
    expect(screen.getByText('Save')).toBeTruthy()
    expect(screen.getByText('Analyze')).toBeTruthy()
    expect(screen.getByText('Files')).toBeTruthy()
    expect(screen.getByText('Chat')).toBeTruthy()
  })

  it('loads MD and displays document in tree', async () => {
    const store = mdToStore('# Title\n\nParagraph text.\n')
    writerState.setData(store)

    renderWriter()
    const user = userEvent.setup()

    const treegrid = screen.getByLabelText('Document structure')
    expect(treegrid).toBeTruthy()

    const docRow = treegrid.querySelector('[role="row"]')!
    await user.click(docRow)
    await user.keyboard('{ArrowRight}')

    expect(screen.getByText('Title')).toBeTruthy()
  })
})
