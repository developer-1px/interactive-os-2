// V1: jsonEditorPrd.md
import { describe, it, expect } from 'vitest'
import { useState } from 'react'
import { render, fireEvent, act } from '@testing-library/react'
import { JsonEditor } from '../JsonEditor'
import type { JsonValue } from '../jsonToNormalized'
import { z } from 'zod'

// ── Helpers ────────────────────────────────────────────────────────────

// @test-harness — controlled state wrapper to capture onChange emissions from JsonEditor
function ControlledEditor<T extends JsonValue>({
  initial,
  schema,
  onEmit,
}: {
  initial: T
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema?: z.ZodType<any>
  onEmit?: (v: T) => void
}) {
  const [value, setValue] = useState<T>(initial)
  return (
    <JsonEditor<T>
      value={value}
      onChange={(next) => {
        setValue(next)
        onEmit?.(next)
      }}
      schema={schema as unknown as z.ZodType<T>}
      aria-label="json"
    />
  )
}

// ── enum axis ──────────────────────────────────────────────────────────

describe('JsonValueCell — enum axis', () => {
  it('renders <select> and dispatches setValue on change', () => {
    const schema = z.object({ color: z.enum(['red', 'green', 'blue']) })
    const emitted: Array<{ color: string }> = []
    const { container } = render(
      <ControlledEditor
        initial={{ color: 'red' }}
        schema={schema}
        onEmit={(v) => emitted.push(v as { color: string })}
      />,
    )

    const select = container.querySelector<HTMLSelectElement>('select[aria-label="value"]')
    expect(select).not.toBeNull()
    expect(select!.value).toBe('red')

    const options = Array.from(select!.querySelectorAll('option')).map(o => o.value)
    expect(options).toEqual(['red', 'green', 'blue'])

    act(() => {
      fireEvent.change(select!, { target: { value: 'green' } })
    })

    expect(emitted.length).toBeGreaterThan(0)
    expect(emitted.at(-1)).toEqual({ color: 'green' })
  })
})

// ── boolean axis ───────────────────────────────────────────────────────

describe('JsonValueCell — boolean axis', () => {
  it('renders <input type=checkbox> and dispatches on toggle', () => {
    const schema = z.object({ enabled: z.boolean() })
    const emitted: Array<{ enabled: boolean }> = []
    const { container } = render(
      <ControlledEditor
        initial={{ enabled: false }}
        schema={schema}
        onEmit={(v) => emitted.push(v as { enabled: boolean })}
      />,
    )
    const checkbox = container.querySelector<HTMLInputElement>('input[type="checkbox"][aria-label="value"]')
    expect(checkbox).not.toBeNull()
    expect(checkbox!.checked).toBe(false)

    act(() => {
      fireEvent.click(checkbox!)
    })
    expect(emitted.at(-1)).toEqual({ enabled: true })
  })
})

// ── number axis ────────────────────────────────────────────────────────

describe('JsonValueCell — number axis', () => {
  it('renders <input type=number> and dispatches on blur', () => {
    const schema = z.object({ count: z.number() })
    const emitted: Array<{ count: number }> = []
    const { container } = render(
      <ControlledEditor
        initial={{ count: 3 }}
        schema={schema}
        onEmit={(v) => emitted.push(v as { count: number })}
      />,
    )
    const input = container.querySelector<HTMLInputElement>('input[type="number"][aria-label="value"]')
    expect(input).not.toBeNull()
    expect(input!.value).toBe('3')

    act(() => {
      fireEvent.change(input!, { target: { value: '42' } })
      fireEvent.blur(input!)
    })
    expect(emitted.at(-1)).toEqual({ count: 42 })
  })
})

// ── string axis ────────────────────────────────────────────────────────

describe('JsonValueCell — string axis', () => {
  it('renders <input type=text> and dispatches on blur', () => {
    const schema = z.object({ name: z.string() })
    const emitted: Array<{ name: string }> = []
    const { container } = render(
      <ControlledEditor
        initial={{ name: 'aria' }}
        schema={schema}
        onEmit={(v) => emitted.push(v as { name: string })}
      />,
    )
    const input = container.querySelector<HTMLInputElement>('input[type="text"][aria-label="value"]')
    expect(input).not.toBeNull()
    expect(input!.value).toBe('aria')

    act(() => {
      fireEvent.change(input!, { target: { value: 'claude' } })
      fireEvent.blur(input!)
    })
    expect(emitted.at(-1)).toEqual({ name: 'claude' })
  })
})
