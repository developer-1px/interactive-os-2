import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toaster } from '../interactive-os/ui/Toaster'
import { createToaster } from '../interactive-os/ui/createToaster'

describe('Toaster component', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders toasts in an aria-live region', () => {
    const toaster = createToaster()
    render(<Toaster toaster={toaster} />)

    act(() => { toaster.toast({ title: 'Saved' }) })

    const container = screen.getByText('Saved').closest('[aria-live]')
    expect(container?.getAttribute('aria-live')).toBe('polite')
    expect(container?.getAttribute('aria-atomic')).toBe('false')
  })

  it('renders description when provided', () => {
    const toaster = createToaster()
    render(<Toaster toaster={toaster} />)

    act(() => { toaster.toast({ title: 'Error', description: 'Something failed' }) })

    expect(screen.getByText('Error')).toBeTruthy()
    expect(screen.getByText('Something failed')).toBeTruthy()
  })

  it('removes toast from DOM after auto-dismiss', () => {
    const toaster = createToaster({ duration: 2000 })
    render(<Toaster toaster={toaster} />)

    act(() => { toaster.toast({ title: 'Bye' }) })
    expect(screen.getByText('Bye')).toBeTruthy()

    act(() => { vi.advanceTimersByTime(2000) })

    expect(screen.queryByText('Bye')).toBeNull()
  })

  it('dismiss button removes a toast', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()
    const toaster = createToaster({ duration: 0 })
    render(<Toaster toaster={toaster} />)

    act(() => { toaster.toast({ title: 'Dismissable' }) })

    const dismissBtn = screen.getByRole('button', { name: /dismiss/i })
    await user.click(dismissBtn)

    expect(screen.queryByText('Dismissable')).toBeNull()
  })

  it('renders multiple toasts', () => {
    const toaster = createToaster()
    render(<Toaster toaster={toaster} />)

    act(() => {
      toaster.toast({ title: 'First' })
      toaster.toast({ title: 'Second' })
    })

    expect(screen.getByText('First')).toBeTruthy()
    expect(screen.getByText('Second')).toBeTruthy()
  })
})
