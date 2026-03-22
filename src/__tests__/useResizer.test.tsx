import { describe, it, expect, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useResizer } from '../hooks/useResizer'

function TestHarness(props: { defaultSize?: number; minSize?: number; maxSize?: number }) {
  const { separatorProps, size } = useResizer({
    defaultSize: props.defaultSize ?? 200,
    minSize: props.minSize ?? 100,
    maxSize: props.maxSize ?? 400,
  })
  return (
    <div style={{ display: 'flex' }}>
      <div data-testid="panel" style={{ width: size }} />
      <div data-testid="separator" {...separatorProps} />
      <div style={{ flex: 1 }} />
    </div>
  )
}

describe('useResizer', () => {
  describe('drag resize', () => {
    it('renders separator with correct ARIA attributes', () => {
      const { getByTestId } = render(<TestHarness />)
      const sep = getByTestId('separator')
      expect(sep.getAttribute('role')).toBe('separator')
      expect(sep.getAttribute('aria-valuenow')).toBe('200')
      expect(sep.getAttribute('aria-valuemin')).toBe('100')
      expect(sep.getAttribute('aria-valuemax')).toBe('400')
      expect(sep.getAttribute('aria-orientation')).toBe('vertical')
      expect(sep.tabIndex).toBe(0)
    })

    it('updates size on pointer drag', () => {
      const { getByTestId } = render(<TestHarness />)
      const sep = getByTestId('separator')

      act(() => {
        sep.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200, bubbles: true }))
        document.dispatchEvent(new PointerEvent('pointermove', { clientX: 250, bubbles: true }))
        document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
      })

      expect(getByTestId('separator').getAttribute('aria-valuenow')).toBe('250')
    })

    it('clamps to minSize', () => {
      const { getByTestId } = render(<TestHarness defaultSize={150} minSize={100} maxSize={400} />)
      const sep = getByTestId('separator')

      act(() => {
        sep.dispatchEvent(new PointerEvent('pointerdown', { clientX: 150, bubbles: true }))
        document.dispatchEvent(new PointerEvent('pointermove', { clientX: 50, bubbles: true }))
        document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
      })

      expect(sep.getAttribute('aria-valuenow')).toBe('100')
    })

    it('clamps to maxSize', () => {
      const { getByTestId } = render(<TestHarness defaultSize={200} minSize={100} maxSize={400} />)
      const sep = getByTestId('separator')

      act(() => {
        sep.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200, bubbles: true }))
        document.dispatchEvent(new PointerEvent('pointermove', { clientX: 700, bubbles: true }))
        document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
      })

      expect(sep.getAttribute('aria-valuenow')).toBe('400')
    })
  })

  describe('keyboard resize', () => {
    it('ArrowRight increases size by step', async () => {
      const user = userEvent.setup()
      const { getByTestId } = render(<TestHarness defaultSize={200} minSize={100} maxSize={400} />)
      const sep = getByTestId('separator')

      await user.click(sep)
      await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')

      expect(sep.getAttribute('aria-valuenow')).toBe('230')
    })

    it('ArrowLeft decreases size by step', async () => {
      const user = userEvent.setup()
      const { getByTestId } = render(<TestHarness defaultSize={200} minSize={100} maxSize={400} />)
      const sep = getByTestId('separator')

      await user.click(sep)
      await user.keyboard('{ArrowLeft}')

      expect(sep.getAttribute('aria-valuenow')).toBe('190')
    })

    it('Home sets minSize', async () => {
      const user = userEvent.setup()
      const { getByTestId } = render(<TestHarness defaultSize={200} minSize={100} maxSize={400} />)
      const sep = getByTestId('separator')

      await user.click(sep)
      await user.keyboard('{Home}')

      expect(sep.getAttribute('aria-valuenow')).toBe('100')
    })

    it('End sets maxSize', async () => {
      const user = userEvent.setup()
      const { getByTestId } = render(<TestHarness defaultSize={200} minSize={100} maxSize={400} />)
      const sep = getByTestId('separator')

      await user.click(sep)
      await user.keyboard('{End}')

      expect(sep.getAttribute('aria-valuenow')).toBe('400')
    })
  })

  describe('double-click reset', () => {
    it('resets to defaultSize on double-click', async () => {
      const user = userEvent.setup()
      const { getByTestId } = render(<TestHarness defaultSize={200} minSize={100} maxSize={400} />)
      const sep = getByTestId('separator')

      await user.click(sep)
      await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')
      expect(sep.getAttribute('aria-valuenow')).toBe('230')

      await user.dblClick(sep)
      expect(sep.getAttribute('aria-valuenow')).toBe('200')
    })
  })

  describe('localStorage persist', () => {
    beforeEach(() => localStorage.clear())

    function PersistHarness() {
      const { separatorProps, size } = useResizer({
        defaultSize: 200, minSize: 100, maxSize: 400, storageKey: 'test-panel',
      })
      return (
        <div style={{ display: 'flex' }}>
          <div data-testid="panel" style={{ width: size }} />
          <div data-testid="separator" {...separatorProps} />
        </div>
      )
    }

    it('persists size to localStorage on keyboard change', async () => {
      const user = userEvent.setup()
      const { getByTestId } = render(<PersistHarness />)

      await user.click(getByTestId('separator'))
      await user.keyboard('{ArrowRight}')

      expect(localStorage.getItem('test-panel')).toBe('210')
    })

    it('restores size from localStorage on mount', () => {
      localStorage.setItem('test-panel', '300')
      const { getByTestId } = render(<PersistHarness />)
      expect(getByTestId('separator').getAttribute('aria-valuenow')).toBe('300')
    })

    it('clamps stored value to min/max range', () => {
      localStorage.setItem('test-panel', '999')
      const { getByTestId } = render(<PersistHarness />)
      expect(getByTestId('separator').getAttribute('aria-valuenow')).toBe('400')
    })
  })
})
