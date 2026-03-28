/**
 * Integration test: SplitPane separator ARIA + keyboard resize
 * PRD ref: 2026-03-28-splitpane-resize-prd.md
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SplitPane } from '../ui/SplitPane'
import type { PaneSize } from '../ui/SplitPane'

describe('SplitPane integration', () => {
  it('renders children with separator between them', () => {
    const onResize = vi.fn()
    render(
      <SplitPane direction="horizontal" sizes={[0.5, 'flex']} onResize={onResize}>
        <div>Left</div>
        <div>Right</div>
      </SplitPane>,
    )

    expect(screen.getByText('Left')).toBeTruthy()
    expect(screen.getByText('Right')).toBeTruthy()
    expect(screen.getByRole('separator')).toBeTruthy()
  })

  it('separator has correct ARIA attributes', () => {
    const onResize = vi.fn()
    render(
      <SplitPane direction="horizontal" sizes={[0.6, 'flex']} onResize={onResize} minRatio={0.2}>
        <div>A</div>
        <div>B</div>
      </SplitPane>,
    )

    const sep = screen.getByRole('separator')
    expect(sep.getAttribute('aria-orientation')).toBe('vertical')
    expect(sep.getAttribute('aria-valuenow')).toBe('60')
    expect(sep.getAttribute('aria-valuemin')).toBe('20')
    expect(sep.getAttribute('aria-valuemax')).toBe('80')
    expect(sep.getAttribute('aria-label')).toBe('Resize pane 1')
    expect(sep.tabIndex).toBe(0)
  })

  it('vertical split has horizontal separator orientation', () => {
    const onResize = vi.fn()
    render(
      <SplitPane direction="vertical" sizes={[0.5, 'flex']} onResize={onResize}>
        <div>Top</div>
        <div>Bottom</div>
      </SplitPane>,
    )

    const sep = screen.getByRole('separator')
    expect(sep.getAttribute('aria-orientation')).toBe('horizontal')
  })

  // V4: 2026-03-28-splitpane-resize-prd.md
  it('keyboard ArrowRight adjusts non-flex pane (2-panel, flex=last)', async () => {
    const user = userEvent.setup()
    const onResize = vi.fn()
    render(
      <SplitPane direction="horizontal" sizes={[0.5, 'flex']} onResize={onResize}>
        <div>A</div>
        <div>B</div>
      </SplitPane>,
    )

    const sep = screen.getByRole('separator')
    sep.focus()
    await user.keyboard('{ArrowRight}')

    expect(onResize).toHaveBeenCalledTimes(1)
    const newSizes = onResize.mock.calls[0][0] as PaneSize[]
    expect(newSizes[0]).toBeCloseTo(0.52, 5)
    expect(newSizes[1]).toBe('flex')
  })

  it('keyboard ArrowLeft adjusts non-flex pane', async () => {
    const user = userEvent.setup()
    const onResize = vi.fn()
    render(
      <SplitPane direction="horizontal" sizes={[0.5, 'flex']} onResize={onResize}>
        <div>A</div>
        <div>B</div>
      </SplitPane>,
    )

    const sep = screen.getByRole('separator')
    sep.focus()
    await user.keyboard('{ArrowLeft}')

    expect(onResize).toHaveBeenCalledTimes(1)
    const newSizes = onResize.mock.calls[0][0] as PaneSize[]
    expect(newSizes[0]).toBeCloseTo(0.48, 5)
    expect(newSizes[1]).toBe('flex')
  })

  it('keyboard ArrowDown adjusts sizes on vertical split', async () => {
    const user = userEvent.setup()
    const onResize = vi.fn()
    render(
      <SplitPane direction="vertical" sizes={[0.5, 'flex']} onResize={onResize}>
        <div>Top</div>
        <div>Bottom</div>
      </SplitPane>,
    )

    const sep = screen.getByRole('separator')
    sep.focus()
    await user.keyboard('{ArrowDown}')

    expect(onResize).toHaveBeenCalledTimes(1)
    const newSizes = onResize.mock.calls[0][0] as PaneSize[]
    expect(newSizes[0]).toBeCloseTo(0.52, 5)
    expect(newSizes[1]).toBe('flex')
  })

  it('keyboard clamps to minRatio', async () => {
    const user = userEvent.setup()
    const onResize = vi.fn()
    render(
      <SplitPane direction="horizontal" sizes={[0.12, 'flex']} onResize={onResize} minRatio={0.1}>
        <div>A</div>
        <div>B</div>
      </SplitPane>,
    )

    const sep = screen.getByRole('separator')
    sep.focus()
    await user.keyboard('{ArrowLeft}')

    expect(onResize).toHaveBeenCalledTimes(1)
    const newSizes = onResize.mock.calls[0][0] as PaneSize[]
    expect(newSizes[0] as number).toBeGreaterThanOrEqual(0.1)
    expect(newSizes[1]).toBe('flex')
  })

  it('single child renders without separator', () => {
    const onResize = vi.fn()
    render(
      <SplitPane direction="horizontal" sizes={['flex']} onResize={onResize}>
        <div>Only child</div>
      </SplitPane>,
    )

    expect(screen.getByText('Only child')).toBeTruthy()
    expect(screen.queryByRole('separator')).toBeNull()
  })

  // V1: 2026-03-28-splitpane-resize-prd.md
  it('3-panel flex=middle: sep 0 ArrowRight adjusts left only', async () => {
    const user = userEvent.setup()
    const onResize = vi.fn()
    render(
      <SplitPane direction="horizontal" sizes={[0.15, 'flex', 0.35]} onResize={onResize}>
        <div>A</div>
        <div>B</div>
        <div>C</div>
      </SplitPane>,
    )

    const seps = screen.getAllByRole('separator')
    seps[0].focus()
    await user.keyboard('{ArrowRight}')

    expect(onResize).toHaveBeenCalledTimes(1)
    const newSizes = onResize.mock.calls[0][0] as PaneSize[]
    expect(newSizes[0]).toBeCloseTo(0.17, 5)
    expect(newSizes[1]).toBe('flex')
    expect(newSizes[2]).toBe(0.35)
  })

  // V2: 2026-03-28-splitpane-resize-prd.md
  it('3-panel flex=middle: sep 1 ArrowLeft adjusts right only', async () => {
    const user = userEvent.setup()
    const onResize = vi.fn()
    render(
      <SplitPane direction="horizontal" sizes={[0.15, 'flex', 0.35]} onResize={onResize}>
        <div>A</div>
        <div>B</div>
        <div>C</div>
      </SplitPane>,
    )

    const seps = screen.getAllByRole('separator')
    seps[1].focus()
    await user.keyboard('{ArrowLeft}')

    expect(onResize).toHaveBeenCalledTimes(1)
    const newSizes = onResize.mock.calls[0][0] as PaneSize[]
    expect(newSizes[0]).toBe(0.15)
    expect(newSizes[1]).toBe('flex')
    expect(newSizes[2]).toBeCloseTo(0.37, 5)
  })

  // V3: 2026-03-28-splitpane-resize-prd.md
  it('3-panel flex=last: sep 0 ArrowRight adjusts pair sum', async () => {
    const user = userEvent.setup()
    const onResize = vi.fn()
    render(
      <SplitPane direction="horizontal" sizes={[0.15, 0.50, 'flex']} onResize={onResize}>
        <div>A</div>
        <div>B</div>
        <div>C</div>
      </SplitPane>,
    )

    const seps = screen.getAllByRole('separator')
    seps[0].focus()
    await user.keyboard('{ArrowRight}')

    expect(onResize).toHaveBeenCalledTimes(1)
    const newSizes = onResize.mock.calls[0][0] as PaneSize[]
    expect(newSizes[0]).toBeCloseTo(0.17, 5)
    expect(newSizes[1]).toBeCloseTo(0.48, 5)
    expect(newSizes[2]).toBe('flex')
    // pair sum preserved
    expect((newSizes[0] as number) + (newSizes[1] as number)).toBeCloseTo(0.65, 5)
  })

  // V5: 2026-03-28-splitpane-resize-prd.md
  it('10 repeated ArrowRight — no drift', async () => {
    const user = userEvent.setup()
    let current: PaneSize[] = [0.15, 'flex', 0.35]
    const onResize = vi.fn((s: PaneSize[]) => { current = s })

    const { rerender } = render(
      <SplitPane direction="horizontal" sizes={current} onResize={onResize}>
        <div>A</div><div>B</div><div>C</div>
      </SplitPane>,
    )

    const seps = screen.getAllByRole('separator')
    seps[0].focus()

    for (let i = 0; i < 10; i++) {
      await user.keyboard('{ArrowRight}')
      rerender(
        <SplitPane direction="horizontal" sizes={current} onResize={onResize}>
          <div>A</div><div>B</div><div>C</div>
        </SplitPane>,
      )
    }

    expect(current[0]).toBeCloseTo(0.35, 5)
    expect(current[1]).toBe('flex')
    expect(current[2]).toBe(0.35)
  })
})
