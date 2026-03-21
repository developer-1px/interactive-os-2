/**
 * Event Recorder for interactive-os
 *
 * Captures ALL keyboard, click, and focus events at document level.
 * Each event records: what happened, where (target), and current focus state.
 * Analysis (what's inside/outside interactive-os) happens at read time, not capture time.
 *
 * Usage:
 *   const rec = createRecorder()
 *   rec.start()
 *   // ... user interacts ...
 *   const data = rec.stop()
 *   console.log(JSON.stringify(data, null, 2))
 */

interface RawEvent {
  ts: number
  type: 'keydown' | 'click' | 'focus' | 'blur'
  key?: string
  target: string
  targetNodeId: string | null
  activeElement: string
  activeNodeId: string | null
}

interface Recording {
  meta: {
    url: string
    startedAt: string
    duration: number
    eventCount: number
  }
  events: RawEvent[]
}

function describeElement(el: Element | null): string {
  if (!el) return 'null'
  const tag = el.tagName.toLowerCase()
  const id = el.id ? `#${el.id}` : ''
  const role = el.getAttribute('role') ? `[role="${el.getAttribute('role')}"]` : ''
  const nodeId = el.closest('[data-node-id]')?.getAttribute('data-node-id')
  const nodeIdStr = nodeId ? `[data-node-id="${nodeId}"]` : ''
  const cls = el.className && typeof el.className === 'string'
    ? '.' + el.className.split(' ').filter(Boolean).slice(0, 2).join('.')
    : ''
  return `${tag}${id}${role}${nodeIdStr}${cls}`.slice(0, 120)
}

function getNodeId(el: Element | null): string | null {
  if (!el) return null
  return el.closest('[data-node-id]')?.getAttribute('data-node-id') ?? null
}

export function createRecorder() {
  let events: RawEvent[] = []
  let startTime = 0
  let active = false
  const cleanups: (() => void)[] = []

  function ts() {
    return Math.round(performance.now() - startTime)
  }

  function snapshot(type: RawEvent['type'], e: Event, key?: string): RawEvent {
    const target = e.target as Element
    return {
      ts: ts(),
      type,
      key,
      target: describeElement(target),
      targetNodeId: getNodeId(target),
      activeElement: describeElement(document.activeElement),
      activeNodeId: getNodeId(document.activeElement),
    }
  }

  function onKeydown(e: KeyboardEvent) {
    if (!active) return
    const key = e.key === ' ' ? 'Space' : e.key
    const mods = [
      e.ctrlKey || e.metaKey ? 'Mod+' : '',
      e.shiftKey ? 'Shift+' : '',
      e.altKey ? 'Alt+' : '',
    ].join('')
    events.push(snapshot('keydown', e, mods + key))
  }

  function onClick(e: MouseEvent) {
    if (!active) return
    events.push(snapshot('click', e))
  }

  function onFocus(e: FocusEvent) {
    if (!active) return
    events.push(snapshot('focus', e))
  }

  function onBlur(e: FocusEvent) {
    if (!active) return
    events.push(snapshot('blur', e))
  }

  // Poll activeElement every frame to catch focus changes that events miss
  let lastActiveDesc = ''
  let rafId = 0

  function pollFocus() {
    if (!active) return
    const desc = describeElement(document.activeElement)
    if (desc !== lastActiveDesc) {
      const nodeId = getNodeId(document.activeElement)
      events.push({
        ts: ts(),
        type: 'focus' as const,
        target: desc,
        targetNodeId: nodeId,
        activeElement: desc,
        activeNodeId: nodeId,
        key: '(polled)',
      })
      lastActiveDesc = desc
    }
    rafId = requestAnimationFrame(pollFocus)
  }

  return {
    start() {
      events = []
      startTime = performance.now()
      active = true
      lastActiveDesc = describeElement(document.activeElement)

      // Use window (not document) to capture before React's event delegation
      window.addEventListener('keydown', onKeydown, true)
      window.addEventListener('click', onClick, true)
      window.addEventListener('focus', onFocus, true)
      window.addEventListener('blur', onBlur, true)
      rafId = requestAnimationFrame(pollFocus)
      cleanups.push(
        () => window.removeEventListener('keydown', onKeydown, true),
        () => window.removeEventListener('click', onClick, true),
        () => window.removeEventListener('focus', onFocus, true),
        () => window.removeEventListener('blur', onBlur, true),
        () => cancelAnimationFrame(rafId),
      )
    },

    stop(): Recording {
      active = false
      cleanups.forEach(fn => fn())
      cleanups.length = 0

      return {
        meta: {
          url: window.location.pathname,
          startedAt: new Date(Date.now() - (performance.now() - startTime)).toISOString(),
          duration: ts(),
          eventCount: events.length,
        },
        events,
      }
    },

    get isActive() {
      return active
    },
  }
}
