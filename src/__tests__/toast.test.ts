import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createToaster } from '../interactive-os/ui/createToaster'

describe('createToaster', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('adds a toast and returns id', () => {
    const toaster = createToaster()
    const id = toaster.toast({ title: 'Hello' })

    expect(id).toBeTruthy()
    expect(toaster.getToasts()).toHaveLength(1)
    expect(toaster.getToasts()[0].title).toBe('Hello')
  })

  it('notifies subscribers on toast', () => {
    const toaster = createToaster()
    let lastSnapshot: ReturnType<typeof toaster.getToasts> = []
    toaster.subscribe((toasts) => { lastSnapshot = toasts })

    toaster.toast({ title: 'A' })

    expect(lastSnapshot).toHaveLength(1)
    expect(lastSnapshot[0].title).toBe('A')
  })

  it('auto-dismisses after duration', () => {
    const toaster = createToaster({ duration: 3000 })
    toaster.toast({ title: 'Temp' })

    expect(toaster.getToasts()).toHaveLength(1)

    vi.advanceTimersByTime(3000)

    expect(toaster.getToasts()).toHaveLength(0)
  })

  it('per-toast duration overrides default', () => {
    const toaster = createToaster({ duration: 5000 })
    toaster.toast({ title: 'Quick', duration: 1000 })

    vi.advanceTimersByTime(1000)

    expect(toaster.getToasts()).toHaveLength(0)
  })

  it('dismiss removes a specific toast', () => {
    const toaster = createToaster()
    const id1 = toaster.toast({ title: 'A' })
    toaster.toast({ title: 'B' })

    toaster.dismiss(id1)

    expect(toaster.getToasts()).toHaveLength(1)
    expect(toaster.getToasts()[0].title).toBe('B')
  })

  it('unsubscribe stops notifications', () => {
    const toaster = createToaster()
    let callCount = 0
    const unsub = toaster.subscribe(() => { callCount++ })

    unsub()
    toaster.toast({ title: 'Ignored' })

    expect(callCount).toBe(0)
  })

  it('respects maxToasts — oldest removed first', () => {
    const toaster = createToaster({ maxToasts: 2 })
    toaster.toast({ title: 'A' })
    toaster.toast({ title: 'B' })
    toaster.toast({ title: 'C' })

    const titles = toaster.getToasts().map((t) => t.title)
    expect(titles).toEqual(['B', 'C'])
  })

  it('duration: 0 means persistent (no auto-dismiss)', () => {
    const toaster = createToaster({ duration: 3000 })
    toaster.toast({ title: 'Sticky', duration: 0 })

    vi.advanceTimersByTime(10000)

    expect(toaster.getToasts()).toHaveLength(1)
  })

  it('double-dismiss is a no-op', () => {
    const toaster = createToaster()
    const id = toaster.toast({ title: 'Once' })

    toaster.dismiss(id)
    toaster.dismiss(id)

    expect(toaster.getToasts()).toHaveLength(0)
  })

  it('evicted toast timer does not fire phantom dismiss', () => {
    const toaster = createToaster({ maxToasts: 1, duration: 3000 })
    toaster.toast({ title: 'A' })
    toaster.toast({ title: 'B' })

    // A was evicted — its timer should be cleared
    vi.advanceTimersByTime(3000)

    // only B should have been auto-dismissed, A's timer should not cause issues
    expect(toaster.getToasts()).toHaveLength(0)
  })
})
