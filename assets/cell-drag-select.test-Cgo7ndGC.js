var e=`// V1: 2026-04-13-grid-cell-range-prd.md
/**
 * Integration test: cellDragSelect plugin
 *
 * pointerdown(cell) → pointermove(otherCell) → pointerup creates a 2D
 * cellRange. dnd / [data-drag-handle] elements never engage cellDragSelect.
 *
 * JSDOM does not implement document.elementFromPoint — we monkey-patch it
 * for the duration of each test to map (clientX, clientY) → cell element.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { Grid } from '../ui/Grid'
import { createStore } from '../store/createStore'
import { ROOT_ID, type NormalizedData } from '../store/types'
import { cellDragSelect } from '../plugins/cellDragSelect'
import { resetClipboard } from '../plugins/clipboard'

const COLUMNS = [
  { key: 'key', header: 'Key' },
  { key: 'en', header: 'EN' },
  { key: 'ko', header: 'KO' },
  { key: 'ja', header: 'JA' },
]

function fixture(): NormalizedData {
  const rows: Record<string, { id: string; data: { cells: string[] } }> = {}
  const ids: string[] = []
  for (let i = 1; i <= 5; i++) {
    const id = \`r\${i}\`
    ids.push(id)
    rows[id] = { id, data: { cells: [\`k\${i}\`, \`en\${i}\`, \`ko\${i}\`, \`ja\${i}\`] } }
  }
  return createStore({ entities: rows, relationships: { [ROOT_ID]: ids } })
}

// @test-harness
function Harness({ withDragHandle = false }: { withDragHandle?: boolean }) {
  const [data, setData] = React.useState<NormalizedData>(() => fixture())
  return (
    <Grid
      data={data}
      columns={COLUMNS}
      plugins={[cellDragSelect()]}
      initialColIndex={1}
      onChange={setData}
      aria-label="drag"
      renderCell={(_p, value, col) => {
        if (col.key === 'key' && withDragHandle) {
          return <span data-drag-handle="true">{String(value ?? '')}</span>
        }
        return <span>{String(value ?? '')}</span>
      }}
    />
  )
}

function getCell(container: HTMLElement, rowId: string, col: number): HTMLElement {
  const row = container.querySelector(\`[data-node-id="\${rowId}"]\`) as HTMLElement
  return row.querySelector(\`[role="gridcell"][aria-colindex="\${col + 1}"]\`) as HTMLElement
}

function inRangeCount(container: HTMLElement): number {
  return container.querySelectorAll('[data-in-range="true"]').length
}

let savedElementFromPoint: typeof document.elementFromPoint
let pointTarget: Element | null = null
function installElementFromPointStub() {
  savedElementFromPoint = document.elementFromPoint
  document.elementFromPoint = ((_x: number, _y: number) => pointTarget) as typeof document.elementFromPoint
}
function restoreElementFromPoint() {
  document.elementFromPoint = savedElementFromPoint
  pointTarget = null
}

describe('cellDragSelect plugin', () => {
  beforeEach(() => {
    resetClipboard()
    installElementFromPointStub()
  })
  afterEach(() => {
    restoreElementFromPoint()
  })

  it('#4 pointerdown → pointermove → pointerup builds rect', () => {
    const { container } = render(<Harness />)
    const start = getCell(container, 'r2', 1)
    const end = getCell(container, 'r4', 3)

    // pointerdown on B2-equivalent
    fireEvent.pointerDown(start, { button: 0, clientX: 10, clientY: 10 })
    // After pointerdown the range is degenerate (1 cell) — verify at least 1 in range
    expect(inRangeCount(container)).toBeGreaterThanOrEqual(1)

    // pointermove to D4 — stub elementFromPoint to return our target
    pointTarget = end
    fireEvent.pointerMove(document, { buttons: 1, clientX: 200, clientY: 200 })

    // Range should now span r2..r4 × col 1..3 = 9 cells
    expect(inRangeCount(container)).toBe(9)

    // pointerup ends drag, range persists
    fireEvent.pointerUp(document, { clientX: 200, clientY: 200 })
    expect(inRangeCount(container)).toBe(9)
  })

  it('#15 cell body drag engages cellDragSelect', () => {
    const { container } = render(<Harness />)
    const start = getCell(container, 'r1', 1)
    const end = getCell(container, 'r3', 2)

    fireEvent.pointerDown(start, { button: 0, clientX: 5, clientY: 5 })
    pointTarget = end
    fireEvent.pointerMove(document, { buttons: 1, clientX: 100, clientY: 100 })

    // 3 rows × 2 cols = 6 cells
    expect(inRangeCount(container)).toBe(6)
  })

  it('#14 pointerdown on [data-drag-handle] does not engage cellDragSelect', () => {
    const { container } = render(<Harness withDragHandle />)
    // The key column cell now contains a [data-drag-handle] span. pointerdown
    // on the span should be filtered out by findCell()'s closest('[data-drag-handle]') check.
    const handle = container.querySelector('[data-drag-handle]') as HTMLElement
    expect(handle).not.toBeNull()
    fireEvent.pointerDown(handle, { button: 0, clientX: 5, clientY: 5 })

    // No cellRange should have been created
    expect(inRangeCount(container)).toBe(0)

    // Even a subsequent move should not produce a range
    pointTarget = getCell(container, 'r3', 2)
    fireEvent.pointerMove(document, { buttons: 1, clientX: 100, clientY: 100 })
    expect(inRangeCount(container)).toBe(0)
  })
})
`;export{e as default};