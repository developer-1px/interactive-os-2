// PRD refs: V1 (single tabgroup renders), V9 (empty workspace)
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Workspace } from '../ui/Workspace'
import { createWorkspace, workspaceCommands, resetUidCounter } from '../plugins/workspaceStore'
import type { TabData } from '../plugins/workspaceStore'
import { getChildren } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { Entity } from '../store/types'

function renderPanel(tab: Entity) {
  return <div data-testid={`panel-${tab.id}`}>{(tab.data as TabData)?.contentRef ?? 'empty'}</div>
}

beforeEach(() => {
  resetUidCounter()
})

describe('Workspace', () => {
  it('V1: single tabgroup with tab renders tab header and panel content', () => {
    let data = createWorkspace()
    const tgId = getChildren(data, ROOT_ID)[0]!

    const tab: Entity = {
      id: 'tab-1',
      data: { type: 'tab', label: 'Hello', contentType: 'file', contentRef: 'hello.ts' } as TabData,
    }
    data = workspaceCommands.addTab(tgId, tab).execute(data)

    render(
      <Workspace
        data={data}
        onChange={() => {}}
        renderPanel={renderPanel}
        aria-label="Test workspace"
      />,
    )

    // Tab header is visible
    expect(screen.getByText('Hello')).toBeTruthy()
    // Panel content is rendered
    expect(screen.getByTestId('panel-tab-1').textContent).toBe('hello.ts')
  })

  it('split with two tabgroups renders both tabs and separator', () => {
    let data = createWorkspace()
    const tgId = getChildren(data, ROOT_ID)[0]!

    // Add a tab to the first tabgroup
    const tab1: Entity = {
      id: 'tab-1',
      data: { type: 'tab', label: 'Left', contentType: 'file', contentRef: 'left.ts' } as TabData,
    }
    data = workspaceCommands.addTab(tgId, tab1).execute(data)

    // Split the pane
    data = workspaceCommands.splitPane(tgId, 'horizontal').execute(data)

    // Find the new tabgroup (second child of the split)
    const splitId = getChildren(data, ROOT_ID)[0]!
    const splitChildren = getChildren(data, splitId)
    const newTgId = splitChildren[1]!

    // Add a tab to the new tabgroup
    const tab2: Entity = {
      id: 'tab-2',
      data: { type: 'tab', label: 'Right', contentType: 'file', contentRef: 'right.ts' } as TabData,
    }
    data = workspaceCommands.addTab(newTgId, tab2).execute(data)

    render(
      <Workspace
        data={data}
        onChange={() => {}}
        renderPanel={renderPanel}
        aria-label="Split workspace"
      />,
    )

    // Both tab headers visible
    expect(screen.getByText('Left')).toBeTruthy()
    expect(screen.getByText('Right')).toBeTruthy()
    // Both panels rendered
    expect(screen.getByTestId('panel-tab-1').textContent).toBe('left.ts')
    expect(screen.getByTestId('panel-tab-2').textContent).toBe('right.ts')
    // Separator present
    expect(screen.getByRole('separator')).toBeTruthy()
  })

  it('V9: empty workspace with no tabs shows empty state', () => {
    const data = createWorkspace()

    render(
      <Workspace
        data={data}
        onChange={() => {}}
        renderPanel={renderPanel}
        aria-label="Empty workspace"
      />,
    )

    expect(screen.getByText('No open tabs')).toBeTruthy()
  })
})
