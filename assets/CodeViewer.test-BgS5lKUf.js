var e=`// ② code-viewer-prd.md
import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { CodeViewer, type HighlightTone } from './CodeViewer'

afterEach(cleanup)

describe('CodeViewer', () => {
  // V1: code-viewer-prd.md
  it('preset=doc renders figure/region + figcaption + pre', () => {
    render(<CodeViewer code="const x = 1" filename="example.ts" preset="doc" />)
    const figure = document.querySelector('figure.code-viewer--doc')
    expect(figure).not.toBeNull()
    expect(figure?.getAttribute('role')).toBe('region')
    const caption = figure?.querySelector('figcaption')
    expect(caption?.textContent).toContain('example.ts')
    expect(figure?.querySelector('pre.code-viewer-pre')).not.toBeNull()
  })

  // V5: code-viewer-prd.md — mac chrome dots as aria-hidden spans
  it('preset=presentation renders mac chrome dots as spans', () => {
    render(<CodeViewer code="const x = 1" filename="app.tsx" preset="presentation" />)
    const chrome = document.querySelector('.code-viewer-chrome-dots')
    expect(chrome).not.toBeNull()
    expect(chrome?.getAttribute('aria-hidden')).toBe('true')
    const dots = chrome?.querySelectorAll('.code-viewer-chrome-dot')
    expect(dots?.length).toBe(3)
    for (const d of dots ?? []) expect(d.tagName).toBe('SPAN')
  })

  // V6: code-viewer-prd.md — chat preset has no region role
  it('preset=chat renders plain figure without role=region', () => {
    render(<CodeViewer code="hello" preset="chat" />)
    const figure = document.querySelector('figure.code-viewer--chat')
    expect(figure).not.toBeNull()
    expect(figure?.getAttribute('role')).toBeNull()
  })

  // V6: code-viewer-prd.md — replay preset plain figure
  it('preset=replay renders plain figure', () => {
    render(<CodeViewer code="a\\nb" preset="replay" filename="x.ts" />)
    const figure = document.querySelector('figure.code-viewer--replay')
    expect(figure).not.toBeNull()
    expect(figure?.getAttribute('role')).toBeNull()
  })

  // V3: code-viewer-prd.md — highlightLines Map renders without throwing
  it('highlightLines Map renders', () => {
    const lines = new Map<number, HighlightTone>([[1, 'inserted'], [2, 'deleted']])
    render(<CodeViewer code="a\\nb\\nc" filename="x.ts" highlightLines={lines} />)
    expect(document.querySelector('.code-viewer')).not.toBeNull()
  })

  // V3: code-viewer-prd.md — highlightLines Set renders without throwing
  it('highlightLines Set renders', () => {
    const lines = new Set([1, 2])
    render(<CodeViewer code="a\\nb\\nc" filename="x.ts" highlightLines={lines} />)
    expect(document.querySelector('.code-viewer')).not.toBeNull()
  })

  // V1: code-viewer-prd.md — filename absent → aria-label
  it('without filename uses aria-label with language', () => {
    render(<CodeViewer code="const x = 1" preset="doc" />)
    const figure = document.querySelector('figure.code-viewer')
    expect(figure?.getAttribute('aria-label')).toBe('Code example, text')
    expect(figure?.getAttribute('aria-labelledby')).toBeNull()
    expect(figure?.querySelector('figcaption')).toBeNull()
  })

  // V1: code-viewer-prd.md — filename present → aria-labelledby
  it('with filename uses aria-labelledby binding to figcaption', () => {
    render(<CodeViewer code="const x = 1" filename="a.ts" preset="doc" />)
    const figure = document.querySelector('figure.code-viewer')
    const labelledBy = figure?.getAttribute('aria-labelledby')
    expect(labelledBy).toBeTruthy()
    const caption = document.getElementById(labelledBy!)
    expect(caption?.textContent).toContain('a.ts')
  })

  // V12: code-viewer-prd.md — startLine offsets gutter counter
  it('startLine=42 sets gutter offset via data attr and CSS var', () => {
    render(<CodeViewer code="a\\nb\\nc" filename="a.ts" preset="doc" startLine={42} />)
    const body = document.querySelector('.code-viewer-body')
    expect(body?.getAttribute('data-gutter-offset')).toBe('41')
    expect((body as HTMLElement)?.style.getPropertyValue('--_gutter-offset')).toBe('41')
  })

  // V10: code-viewer-prd.md — wrap + virtualized conflict → console.warn
  it('wrap + virtualized conflict warns on console', () => {
    const original = console.warn
    const captured: unknown[][] = []
    console.warn = (...args: unknown[]) => { captured.push(args) }
    try {
      render(<CodeViewer code="a\\nb" preset="doc" wrap virtualized />)
      const found = captured.some(args => String(args[0] ?? '').includes('[CodeViewer]'))
      expect(found).toBe(true)
    } finally {
      console.warn = original
    }
  })
})
`;export{e as default};