// V1: jsonEditorPrd.md
import { describe, it, expect } from 'vitest'
import { useState } from 'react'
import { render, fireEvent, act } from '@testing-library/react'
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
  it('renders type <select> toggle with 4 options', () => {
    const { container } = render(<FreeEditor initial={{ x: 'hello' }} />)
    const typeSelect = container.querySelector<HTMLSelectElement>('select[aria-label="type"]')
    expect(typeSelect).not.toBeNull()
    const opts = Array.from(typeSelect!.querySelectorAll('option')).map(o => o.value)
    expect(opts).toEqual(['string', 'object', 'array', 'auto'])
  })

  it('auto input: parses "42" as number on blur', () => {
    const emitted: JsonValue[] = []
    const { container } = render(<FreeEditor initial={{ x: 'hello' }} onEmit={v => emitted.push(v)} />)
    const valueInput = container.querySelector<HTMLInputElement>('input[type="text"][aria-label="value"]')
    expect(valueInput).not.toBeNull()

    act(() => {
      fireEvent.change(valueInput!, { target: { value: '42' } })
      fireEvent.blur(valueInput!)
    })

    // parseAutoValue → number 42로 타입 전환 + value=42
    expect(emitted.length).toBeGreaterThan(0)
    expect(emitted.at(-1)).toEqual({ x: 42 })
  })

  it('auto input: parses "true" as boolean on blur', () => {
    const emitted: JsonValue[] = []
    const { container } = render(<FreeEditor initial={{ x: 'hello' }} onEmit={v => emitted.push(v)} />)
    const input = container.querySelector<HTMLInputElement>('input[type="text"][aria-label="value"]')
    act(() => {
      fireEvent.change(input!, { target: { value: 'true' } })
      fireEvent.blur(input!)
    })
    expect(emitted.at(-1)).toEqual({ x: true })
  })

  it('auto input: parses "null" as null on blur', () => {
    const emitted: JsonValue[] = []
    const { container } = render(<FreeEditor initial={{ x: 'hello' }} onEmit={v => emitted.push(v)} />)
    const input = container.querySelector<HTMLInputElement>('input[type="text"][aria-label="value"]')
    act(() => {
      fireEvent.change(input!, { target: { value: 'null' } })
      fireEvent.blur(input!)
    })
    expect(emitted.at(-1)).toEqual({ x: null })
  })

  it('auto input: invalid JSON falls back to string literal', () => {
    const emitted: JsonValue[] = []
    const { container } = render(<FreeEditor initial={{ x: 'hello' }} onEmit={v => emitted.push(v)} />)
    const input = container.querySelector<HTMLInputElement>('input[type="text"][aria-label="value"]')
    act(() => {
      fireEvent.change(input!, { target: { value: 'not-json' } })
      fireEvent.blur(input!)
    })
    expect(emitted.at(-1)).toEqual({ x: 'not-json' })
  })
})
