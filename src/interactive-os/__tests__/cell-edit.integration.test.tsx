import { useState } from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createStore, getEntity } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { createCommandEngine } from '../engine/createCommandEngine'
import { clipboardCommands, resetClipboard, clipboard } from '../plugins/clipboard'
import { history, historyCommands } from '../plugins/history'
import { core } from '../plugins/core'
import { crud } from '../plugins/crud'
import { rename } from '../plugins/rename'
import { dnd } from '../plugins/dnd'
import { focusRecovery } from '../plugins/focusRecovery'
import { cellEdit } from '../plugins/cellEdit'
import { Aria } from '../primitives/aria'
import { grid as gridBehavior } from '../pattern/grid'

function fixtureStore() {
  return createStore({
    entities: {
      'row-1': { id: 'row-1', data: { cells: ['hello', 'world', 'foo'] } },
      'row-2': { id: 'row-2', data: { cells: ['bar', 'baz', 'qux'] } },
    },
    relationships: { [ROOT_ID]: ['row-1', 'row-2'] },
  })
}

function createEngine(store = fixtureStore()) {
  const corePlugin = core()
  const clipboardPlugin = clipboard()
  const historyPlugin = history()
  const middlewares = [corePlugin, clipboardPlugin, historyPlugin]
    .map((p) => p.middleware)
    .filter((m): m is NonNullable<typeof m> => m != null)
  return createCommandEngine(store, middlewares, vi.fn(), { logger: false })
}

describe('clearCellValue', () => {
  beforeEach(() => resetClipboard())

  // V3: 2026-03-25-cell-edit-plugin-prd.md
  it('sets cell to empty string', () => {
    const engine = createEngine()
    engine.dispatch(clipboardCommands.clearCellValue('row-1', 0))
    const cells = (getEntity(engine.getStore(), 'row-1')?.data as any).cells
    expect(cells[0]).toBe('')
    expect(cells[1]).toBe('world') // other cells unchanged
  })

  // V7: 2026-03-25-cell-edit-plugin-prd.md
  it('undo restores original value', () => {
    const engine = createEngine()
    engine.dispatch(clipboardCommands.clearCellValue('row-1', 0))
    engine.dispatch(historyCommands.undo())
    const cells = (getEntity(engine.getStore(), 'row-1')?.data as any).cells
    expect(cells[0]).toBe('hello')
  })

  // V9: 2026-03-25-cell-edit-plugin-prd.md
  it('on empty cell is no-op', () => {
    const initial = createStore({
      entities: { 'row-1': { id: 'row-1', data: { cells: ['', 'world'] } } },
      relationships: { [ROOT_ID]: ['row-1'] },
    })
    const engine = createEngine(initial)
    const storeBefore = engine.getStore()
    engine.dispatch(clipboardCommands.clearCellValue('row-1', 0))
    expect(engine.getStore()).toBe(storeBefore) // reference equality = no change
  })
})

describe('cutCellValue', () => {
  beforeEach(() => resetClipboard())

  // V1: 2026-03-25-cell-edit-plugin-prd.md
  it('copies value to buffer and clears cell', () => {
    const engine = createEngine()
    engine.dispatch(clipboardCommands.cutCellValue('row-1', 0))
    // Cell cleared
    const cells = (getEntity(engine.getStore(), 'row-1')?.data as any).cells
    expect(cells[0]).toBe('')
    // Buffer has value — verify by pasting to another cell
    engine.dispatch(clipboardCommands.pasteCellValue('row-2', 0))
    const cells2 = (getEntity(engine.getStore(), 'row-2')?.data as any).cells
    expect(cells2[0]).toBe('hello')
  })

  // V6: 2026-03-25-cell-edit-plugin-prd.md
  it('undo restores original value', () => {
    const engine = createEngine()
    engine.dispatch(clipboardCommands.cutCellValue('row-1', 0))
    engine.dispatch(historyCommands.undo())
    const cells = (getEntity(engine.getStore(), 'row-1')?.data as any).cells
    expect(cells[0]).toBe('hello')
  })
})

// ── Integration tests ──────────────────────────────────────────────────────

function getFocusedRowId(container: HTMLElement): string | null {
  const focused = container.querySelector('[role="row"][tabindex="0"]')
  return focused?.getAttribute('data-node-id') ?? null
}

function StatefulCellEditGrid({ initialData, withCellEdit = true }: { initialData: NormalizedData; withCellEdit?: boolean }) {
  const [data, setData] = useState(initialData)
  const plugins = [
    core(),
    crud(),
    rename(),
    dnd(),
    history(),
    focusRecovery(),
    clipboard(),
    ...(withCellEdit ? [cellEdit()] : []),
  ]
  const behavior = gridBehavior({ columns: 3, edit: true })
  return (
    <Aria behavior={behavior} data={data} plugins={plugins} onChange={setData} aria-label="Test Grid">
      <Aria.Item render={(props, node, state: NodeState) => {
        const cells = (node.data as any)?.cells as string[] ?? []
        return (
          <div {...props}>
            {cells.map((cell, i) => (
              <Aria.Cell key={i} index={i}>
                <span data-testid={`cell-${node.id}-${i}`}>{cell}</span>
              </Aria.Cell>
            ))}
          </div>
        )
      }} />
    </Aria>
  )
}

describe('cellEdit plugin integration', () => {
  beforeEach(() => resetClipboard())

  // V3: 2026-03-25-cell-edit-plugin-prd.md
  it('Delete in cell mode clears cell value, not row', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulCellEditGrid initialData={fixtureStore()} />)
    const row1 = container.querySelector('[data-node-id="row-1"]') as HTMLElement
    act(() => row1.focus())
    await user.keyboard('{Delete}')
    // Row still exists
    expect(container.querySelectorAll('[role="row"]')).toHaveLength(2)
    // Cell value cleared
    expect(container.querySelector('[data-testid="cell-row-1-0"]')?.textContent).toBe('')
  })

  // V12: 2026-03-25-cell-edit-plugin-prd.md
  it('Enter in cell mode moves focus to next row without entering edit mode', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulCellEditGrid initialData={fixtureStore()} />)
    const row1 = container.querySelector('[data-node-id="row-1"]') as HTMLElement
    act(() => row1.focus())
    await user.keyboard('{Enter}')
    expect(getFocusedRowId(container)).toBe('row-2')
    // No rename active
    expect(container.querySelector('[data-renaming]')).toBeNull()
  })

  // V13a: 2026-03-25-cell-edit-plugin-prd.md
  it('Shift+Enter in cell mode moves focus to previous row', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulCellEditGrid initialData={fixtureStore()} />)
    const row2 = container.querySelector('[data-node-id="row-2"]') as HTMLElement
    act(() => row2.focus())
    await user.keyboard('{Shift>}{Enter}{/Shift}')
    expect(getFocusedRowId(container)).toBe('row-1')
  })

  // V1: 2026-03-25-cell-edit-plugin-prd.md
  it('Mod+X in cell mode cuts cell value', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulCellEditGrid initialData={fixtureStore()} />)
    const row1 = container.querySelector('[data-node-id="row-1"]') as HTMLElement
    act(() => row1.focus())
    await user.keyboard('{Control>}x{/Control}')
    expect(container.querySelector('[data-testid="cell-row-1-0"]')?.textContent).toBe('')
  })

  // V2: 2026-03-25-cell-edit-plugin-prd.md
  it('Mod+X then Mod+V pastes cut value to target cell', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulCellEditGrid initialData={fixtureStore()} />)
    const row1 = container.querySelector('[data-node-id="row-1"]') as HTMLElement
    act(() => row1.focus())
    await user.keyboard('{Control>}x{/Control}')
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Control>}v{/Control}')
    expect(container.querySelector('[data-testid="cell-row-2-0"]')?.textContent).toBe('hello')
  })

  // V10: 2026-03-25-cell-edit-plugin-prd.md
  it('Grid without cellEdit: Delete removes row', async () => {
    const user = userEvent.setup()
    const { container } = render(<StatefulCellEditGrid initialData={fixtureStore()} withCellEdit={false} />)
    const row1 = container.querySelector('[data-node-id="row-1"]') as HTMLElement
    act(() => row1.focus())
    await user.keyboard('{Delete}')
    expect(container.querySelectorAll('[role="row"]')).toHaveLength(1)
  })
})
