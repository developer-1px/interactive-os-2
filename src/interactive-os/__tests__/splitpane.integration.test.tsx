/**
 * Integration test: SplitPane separator ARIA + keyboard resize
 * PRD ref: V16 — separator ARIA + keyboard resize
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SplitPane } from '../ui/SplitPane'

describe('SplitPane integration', () => {
  it('V16: renders children with separator between them', () => {
    const onResize = vi.fn()
    render(
      <SplitPane direction="horizontal" sizes={[0.5, 0.5]} onResize={onResize}>
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
      <SplitPane direction="horizontal" sizes={[0.6, 0.4]} onResize={onResize} minRatio={0.2}>
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
      <SplitPane direction="vertical" sizes={[0.5, 0.5]} onResize={onResize}>
        <div>Top</div>
        <div>Bottom</div>
      </SplitPane>,
    )

    const sep = screen.getByRole('separator')
    expect(sep.getAttribute('aria-orientation')).toBe('horizontal')
  })

  it('keyboard ArrowRight adjusts sizes on horizontal split', async () => {
    const user = userEvent.setup()
    const onResize = vi.fn()
    render(
      <SplitPane direction="horizontal" sizes={[0.5, 0.5]} onResize={onResize}>
        <div>A</div>
        <div>B</div>
      </SplitPane>,
    )

    const sep = screen.getByRole('separator')
    sep.focus()
    await user.keyboard('{ArrowRight}')

    expect(onResize).toHaveBeenCalledTimes(1)
    const newSizes = onResize.mock.calls[0][0] as number[]
    expect(newSizes[0]).toBeCloseTo(0.52, 5)
    expect(newSizes[1]).toBeCloseTo(0.48, 5)
  })

  it('keyboard ArrowLeft adjusts sizes on horizontal split', async () => {
    const user = userEvent.setup()
    const onResize = vi.fn()
    render(
      <SplitPane direction="horizontal" sizes={[0.5, 0.5]} onResize={onResize}>
        <div>A</div>
        <div>B</div>
      </SplitPane>,
    )

    const sep = screen.getByRole('separator')
    sep.focus()
    await user.keyboard('{ArrowLeft}')

    expect(onResize).toHaveBeenCalledTimes(1)
    const newSizes = onResize.mock.calls[0][0] as number[]
    expect(newSizes[0]).toBeCloseTo(0.48, 5)
    expect(newSizes[1]).toBeCloseTo(0.52, 5)
  })

  it('keyboard ArrowDown adjusts sizes on vertical split', async () => {
    const user = userEvent.setup()
    const onResize = vi.fn()
    render(
      <SplitPane direction="vertical" sizes={[0.5, 0.5]} onResize={onResize}>
        <div>Top</div>
        <div>Bottom</div>
      </SplitPane>,
    )

    const sep = screen.getByRole('separator')
    sep.focus()
    await user.keyboard('{ArrowDown}')

    expect(onResize).toHaveBeenCalledTimes(1)
    const newSizes = onResize.mock.calls[0][0] as number[]
    expect(newSizes[0]).toBeCloseTo(0.52, 5)
    expect(newSizes[1]).toBeCloseTo(0.48, 5)
  })

  it('keyboard clamps to minRatio', async () => {
    const user = userEvent.setup()
    const onResize = vi.fn()
    render(
      <SplitPane direction="horizontal" sizes={[0.12, 0.88]} onResize={onResize} minRatio={0.1}>
        <div>A</div>
        <div>B</div>
      </SplitPane>,
    )

    const sep = screen.getByRole('separator')
    sep.focus()
    await user.keyboard('{ArrowLeft}')

    expect(onResize).toHaveBeenCalledTimes(1)
    const newSizes = onResize.mock.calls[0][0] as number[]
    expect(newSizes[0]).toBeGreaterThanOrEqual(0.1)
    expect(newSizes[1]).toBeLessThanOrEqual(0.9)
  })

  it('single child renders without separator', () => {
    const onResize = vi.fn()
    render(
      <SplitPane direction="horizontal" sizes={[1]} onResize={onResize}>
        <div>Only child</div>
      </SplitPane>,
    )

    expect(screen.getByText('Only child')).toBeTruthy()
    expect(screen.queryByRole('separator')).toBeNull()
  })
})
