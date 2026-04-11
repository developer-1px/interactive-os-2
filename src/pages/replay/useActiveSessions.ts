import { useState, useEffect } from 'react'

export interface ActiveSession {
  id: string
  label: string
  mtime: number
  active: boolean
}

const POLL_INTERVAL = 10_000

export function useActiveSessions(options?: { activeOnly?: boolean }): ActiveSession[] {
  const activeOnly = options?.activeOnly ?? true
  const [sessions, setSessions] = useState<ActiveSession[]>([])

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const res = await fetch('/api/agent-ops/sessions')
        if (!res.ok) return
        const data: ActiveSession[] = await res.json()
        if (!cancelled) {
          const filtered = activeOnly ? data.filter(s => s.active) : data
          setSessions(prev => {
            if (prev.length === filtered.length && prev.every((s, i) => s.id === filtered[i].id && s.mtime === filtered[i].mtime))
              return prev
            return filtered
          })
        }
      } catch { /* server unavailable */ }
    }

    poll()
    const id = setInterval(poll, POLL_INTERVAL)
    return () => { cancelled = true; clearInterval(id) }
  }, [activeOnly])

  return sessions
}
