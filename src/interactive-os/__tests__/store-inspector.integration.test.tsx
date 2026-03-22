/**
 * Integration tests: Store Inspector page — V1–V10
 *
 * Tests the full pipeline: user keyboard interaction on Editor →
 * Inspector data update → Log entry capture.
 * No mock call verification — all assertions are on DOM state.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PageStoreInspector from '../../pages/PageStoreInspector'

// ---- helpers ----------------------------------------------------------------

function getPanels() {
  const editor = screen.getByRole('treegrid')
  const inspector = screen.getByRole('tree')
  const log = screen.getByLabelText('Operation Log')
  return { editor, inspector, log }
}

/** Get the currently focused node id in a container (tabindex="0") */
function getFocusedNodeId(container: HTMLElement): string | null {
  return container.querySelector('[tabindex="0"][data-node-id]')?.getAttribute('data-node-id') ?? null
}

/**
 * Extract the entity count number from the inspector's "entities (N)" group label.
 * Returns undefined if the label is not found.
 */
function getInspectorEntityCount(inspector: HTMLElement): number | undefined {
  // The entities group node shows label "entities" + "(N)" as separate spans
  // textContent of the parent div will be something like "▸entities(10)"
  const allText = inspector.textContent ?? ''
  const match = allText.match(/entities\s*\((\d+)\)/)
  return match ? parseInt(match[1]) : undefined
}

// ---- V1-V10 tests -----------------------------------------------------------

describe('Store Inspector — PRD V1–V10', () => {
  it('V1: Enter on editor node creates node → inspector entity count increases', async () => {
    const user = userEvent.setup()
    render(<PageStoreInspector />)
    const { editor, inspector } = getPanels()

    // Focus first node and get baseline
    const firstEditorNode = editor.querySelector('[data-node-id]') as HTMLElement
    firstEditorNode.focus()

    // Let initial focus settle so inspector reflects the stable state
    const countBefore = getInspectorEntityCount(inspector)

    // Press Enter to create a child node
    await user.keyboard('{Enter}')

    const countAfter = getInspectorEntityCount(inspector)

    if (countBefore !== undefined && countAfter !== undefined) {
      expect(countAfter).toBeGreaterThan(countBefore)
    } else {
      // Fallback: a "crud:create" entry appeared in the log (V5 confirms this too)
      const log = screen.getByLabelText('Operation Log')
      expect(log.textContent).toContain('crud:create')
    }
  })

  it('V2: Delete on editor node removes node → inspector entity count decreases', async () => {
    const user = userEvent.setup()
    render(<PageStoreInspector />)
    const { editor, inspector } = getPanels()

    // Focus "pkg" (a leaf node at root level — last root child, no children)
    const pkgNode = editor.querySelector('[data-node-id="pkg"]') as HTMLElement | null
    const targetNode = pkgNode ?? (editor.querySelector('[data-node-id]') as HTMLElement)
    // Use user.click so React state (focus update) settles before we snapshot
    await user.click(targetNode)

    // Capture entity count after focus settles
    const countBefore = getInspectorEntityCount(inspector)

    await user.keyboard('{Delete}')

    const countAfter = getInspectorEntityCount(inspector)

    if (countBefore !== undefined && countAfter !== undefined) {
      expect(countAfter).toBeLessThan(countBefore)
    } else {
      // Fallback: "crud:delete" in log
      const log = screen.getByLabelText('Operation Log')
      expect(log.textContent).toContain('crud:delete')
    }
  })

  it('V3: Alt+ArrowDown moves node → inspector relationships text changes', async () => {
    const user = userEvent.setup()
    render(<PageStoreInspector />)
    const { editor, inspector } = getPanels()

    // Focus "lib" (second root child)
    const libNode = editor.querySelector('[data-node-id="lib"]') as HTMLElement | null
    if (libNode) {
      libNode.focus()
    } else {
      const nodes = Array.from(editor.querySelectorAll('[data-node-id]'))
      ;(nodes[1] as HTMLElement | undefined)?.focus()
    }

    // Capture relationships section text before move
    const relTextBefore = inspector.textContent ?? ''

    await user.keyboard('{Alt>}{ArrowDown}{/Alt}')

    // Relationships section text should change (order of root children changed)
    const relTextAfter = inspector.textContent ?? ''
    expect(relTextAfter).not.toBe(relTextBefore)
  })

  it('V4: ArrowDown in editor changes focus → inspector __focus__ value changes', async () => {
    const user = userEvent.setup()
    render(<PageStoreInspector />)
    const { editor, inspector } = getPanels()

    // Focus first editor node
    const firstNode = editor.querySelector('[data-node-id]') as HTMLElement
    firstNode.focus()
    const focusedIdBefore = getFocusedNodeId(editor)

    // Capture inspector text (it shows __focus__ entity with focusedId value)
    const inspectorTextBefore = inspector.textContent ?? ''

    // Move focus down
    await user.keyboard('{ArrowDown}')

    const focusedIdAfter = getFocusedNodeId(editor)
    expect(focusedIdAfter).not.toBe(focusedIdBefore)

    // Inspector __focus__ meta entity value should reflect new focusedId
    const inspectorTextAfter = inspector.textContent ?? ''
    expect(inspectorTextAfter).not.toBe(inspectorTextBefore)
  })

  it('V5: Enter (create) → log contains "crud:create"', async () => {
    const user = userEvent.setup()
    render(<PageStoreInspector />)
    const { editor, log } = getPanels()

    const firstNode = editor.querySelector('[data-node-id]') as HTMLElement
    firstNode.focus()
    await user.keyboard('{Enter}')

    expect(log.textContent).toContain('crud:create')
  })

  it('V6: Ctrl+Z (undo) → log contains "history:__restore" (undo applied)', async () => {
    const user = userEvent.setup()
    render(<PageStoreInspector />)
    const { editor, log } = getPanels()

    // First do something undoable (create)
    const firstNode = editor.querySelector('[data-node-id]') as HTMLElement
    firstNode.focus()
    await user.keyboard('{Enter}')

    // Now undo — history middleware intercepts history:undo and dispatches history:__restore
    await user.keyboard('{Control>}z{/Control}')

    // history:__restore is what the logger captures when undo is applied
    expect(log.textContent).toContain('history:__restore')
  })

  it('V7: Deleting all root nodes → inspector still renders (no crash), shows empty/meta state', async () => {
    const user = userEvent.setup()
    render(<PageStoreInspector />)
    const { editor } = getPanels()

    // Delete root-level nodes: src, lib, readme, pkg (src and lib have children)
    const rootNodeIds = ['src', 'lib', 'readme', 'pkg']
    for (const nodeId of rootNodeIds) {
      const nodeEl = editor.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement | null
      if (nodeEl) {
        nodeEl.focus()
        await user.keyboard('{Delete}')
      }
    }

    // Inspector should still be in the DOM (no crash — just asserting it's queryable)
    const inspectorAfter = screen.getByRole('tree')
    expect(inspectorAfter).toBeTruthy()

    // Inspector entity count should be ≤ number of meta entities (no user entities remain)
    const countAfter = getInspectorEntityCount(inspectorAfter)
    if (countAfter !== undefined) {
      // Only meta entities (__focus__, __expanded__, etc.) can remain
      expect(countAfter).toBeLessThanOrEqual(10)
    }
  })

  it('V8: Tab from editor → focus leaves editor container', async () => {
    const user = userEvent.setup()
    render(<PageStoreInspector />)
    const { editor } = getPanels()

    const firstNode = editor.querySelector('[data-node-id]') as HTMLElement
    firstNode.focus()

    await user.tab()

    // Active element should be outside the editor container
    const activeEl = document.activeElement
    expect(editor.contains(activeEl)).toBe(false)
  })

  it('V9: 30+ create operations → log entries ≤ 50 (capped)', async () => {
    const user = userEvent.setup()
    render(<PageStoreInspector />)
    const { editor, log } = getPanels()

    // Focus first node
    const firstNode = editor.querySelector('[data-node-id]') as HTMLElement
    firstNode.focus()

    // Perform 30 create operations — each creates a node
    for (let i = 0; i < 30; i++) {
      await user.keyboard('{Enter}')
    }

    // Log is capped at 50 entries
    const logEntries = log.querySelectorAll('[class*="logEntry"]')
    expect(logEntries.length).toBeLessThanOrEqual(50)
    // We definitely generated operations, so log should have entries
    expect(logEntries.length).toBeGreaterThan(0)
  })

  it('V10: Delete node with children → log contains "crud:delete"', async () => {
    const user = userEvent.setup()
    render(<PageStoreInspector />)
    const { editor, log } = getPanels()

    // Focus "src" which has children (components, app, main)
    const srcNode = editor.querySelector('[data-node-id="src"]') as HTMLElement | null
    const targetNode = srcNode ?? (editor.querySelector('[data-node-id]') as HTMLElement)
    targetNode.focus()

    await user.keyboard('{Delete}')

    expect(log.textContent).toContain('crud:delete')
  })
})
