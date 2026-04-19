// V1: jsonEditorPrd.md
import { describe, it, expect } from 'vitest'
import { useState } from 'react'
import { render } from '@testing-library/react'
import { JsonEditor } from '../JsonEditor'
import type { JsonValue } from '../jsonToNormalized'

// @test-harness — controlled state wrapper to capture onChange emissions from JsonEditor
function FreeEditor({
  initial,
  onEmit,
}: {
  initial: JsonValue
  onEmit?: (v: JsonValue) => void
}) {
  const [value, setValue] = useState<JsonValue>(initial)
  return (
    <JsonEditor
      value={value}
      onChange={(next) => {
        setValue(next)
        onEmit?.(next)
      }}
      aria-label="json"
    />
  )
}

describe('JsonEditor — free mode (no schema)', () => {
  it('renders a treegrid with root entries', () => {
    const { getByRole, getAllByRole } = render(<FreeEditor initial={{ x: 'hello', y: 42 }} />)
    expect(getByRole('treegrid')).toBeTruthy()
    // key rows exist — each top-level entry should produce a treegrid row
    const rows = getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1) // includes header + at least 2 data rows
  })

  it('displays keys and values for a flat object', () => {
    const { container } = render(<FreeEditor initial={{ app: 'aria', enabled: true }} />)
    const text = container.textContent ?? ''
    expect(text).toContain('app')
    expect(text).toContain('aria')
    expect(text).toContain('enabled')
  })

  it('exposes aria-label on treegrid', () => {
    const { getByRole } = render(<FreeEditor initial={{ x: 1 }} />)
    const grid = getByRole('treegrid')
    expect(grid.getAttribute('aria-label')).toBe('json')
  })
})
