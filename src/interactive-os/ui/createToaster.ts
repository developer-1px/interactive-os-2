export interface ToastData {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'success' | 'error'
  duration?: number
}

export interface ToasterOptions {
  duration?: number
  maxToasts?: number
}

export interface Toaster {
  toast(options: Omit<ToastData, 'id'>): string
  dismiss(id: string): void
  subscribe(listener: (toasts: ToastData[]) => void): () => void
  getToasts(): ToastData[]
}

export function createToaster(options: ToasterOptions = {}): Toaster {
  const { duration: defaultDuration = 5000, maxToasts = 5 } = options

  let counter = 0
  let snapshot: ToastData[] = []
  const listeners = new Set<(toasts: ToastData[]) => void>()
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  function setToasts(next: ToastData[]) {
    snapshot = next
    for (const listener of listeners) {
      listener(snapshot)
    }
  }

  function dismiss(id: string) {
    if (!snapshot.some((t) => t.id === id)) return
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
    setToasts(snapshot.filter((t) => t.id !== id))
  }

  function toast(input: Omit<ToastData, 'id'>): string {
    const id = `toast-${++counter}`
    const dur = input.duration ?? defaultDuration

    const newItem = { ...input, id }
    const evictCount = Math.max(0, snapshot.length + 1 - maxToasts)

    // clear timers for evicted toasts
    for (let i = 0; i < evictCount; i++) {
      const timer = timers.get(snapshot[i].id)
      if (timer) {
        clearTimeout(timer)
        timers.delete(snapshot[i].id)
      }
    }

    const next = [...snapshot.slice(evictCount), newItem]

    // schedule auto-dismiss (duration: 0 = persistent)
    if (dur > 0) {
      timers.set(id, setTimeout(() => dismiss(id), dur))
    }

    setToasts(next)
    return id
  }

  function subscribe(listener: (toasts: ToastData[]) => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  function getToasts(): ToastData[] {
    return snapshot
  }

  return { toast, dismiss, subscribe, getToasts }
}
