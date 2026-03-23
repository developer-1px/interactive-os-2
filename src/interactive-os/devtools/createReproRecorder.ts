/**
 * Reproduction Path Recorder (PoC)
 *
 * Captures 5 channels into a unified timeline:
 *   1. Route — current URL
 *   2. Component — React component stack + source file
 *   3. Input — keyboard/click/focus events
 *   4. State — store diffs from command engine dispatch
 *   5. Console — errors and warnings
 *
 * Usage:
 *   const rec = createReproRecorder()
 *   rec.start()
 *   // pass rec.logger to <Aria logger={rec.logger}>
 *   const data = rec.stop()
 */

import type { LogEntry, Logger } from '../core/dispatchLogger'

// ---- Types ----

interface ComponentInfo {
  stack: string[]
  source: string | null
}

interface AriaSnapshot {
  role: string | null
  label: string | null
  selected: string | null
  expanded: string | null
  activedescendant: string | null
  level: string | null
}

interface InputEntry {
  seq: number
  time: string
  ch: 'input'
  type: 'keydown' | 'click' | 'focus'
  key?: string
  target: string
  targetNodeId: string | null
  component: ComponentInfo
  aria: AriaSnapshot
}

interface StateEntry {
  seq: number
  time: string
  ch: 'state'
  command: string
  payload: unknown
  diff: string[]
  error?: string
}

interface ConsoleEntry {
  seq: number
  time: string
  ch: 'console'
  level: 'error' | 'warn'
  message: string
}

type ReproEvent = InputEntry | StateEntry | ConsoleEntry

interface ReproRecording {
  meta: {
    url: string
    startedAt: string
    duration: number
    eventCount: number
    channels: { input: number; state: number; console: number }
  }
  timeline: ReproEvent[]
}

// ---- Helpers ----

function getComponentInfo(el: Element | null): ComponentInfo {
  if (!el || !(el instanceof HTMLElement)) return { stack: [], source: null }

  // Source from data-inspector-line attribute (vite plugin)
  let source: string | null = null
  let current: HTMLElement | null = el
  while (current && current !== document.body) {
    const attr = current.getAttribute('data-inspector-line')
    if (attr) {
      source = attr
      break
    }
    current = current.parentElement
  }

  // Component stack from React Fiber
  const stack: string[] = []
  let fiberKey: string | undefined
  for (const k in el) {
    if (k.startsWith('__reactFiber$')) {
      fiberKey = k
      break
    }
  }
  if (fiberKey) {
    // @ts-expect-error accessing internal React fiber
    let fiber = el[fiberKey]
    while (fiber) {
      const type = fiber.type
      let name = ''
      if (typeof type === 'function') {
        name = type.displayName || type.name || ''
      } else if (type && typeof type === 'object' && type.$$typeof) {
        const wrappedType = type.type || type.render
        if (wrappedType) name = wrappedType.displayName || wrappedType.name || ''
      }
      if (name && name !== 'Anonymous' && !stack.includes(name)) {
        stack.unshift(name)
      }
      fiber = fiber.return
    }
  }

  return { stack, source }
}

function getAriaSnapshot(el: Element | null): AriaSnapshot {
  if (!el) return { role: null, label: null, selected: null, expanded: null, activedescendant: null, level: null }
  return {
    role: el.getAttribute('role'),
    label: el.getAttribute('aria-label') || el.getAttribute('aria-labelledby'),
    selected: el.getAttribute('aria-selected'),
    expanded: el.getAttribute('aria-expanded'),
    activedescendant: el.getAttribute('aria-activedescendant'),
    level: el.getAttribute('aria-level'),
  }
}

function describeTarget(el: Element | null): string {
  if (!el) return 'null'
  const tag = el.tagName.toLowerCase()
  const id = el.id ? `#${el.id}` : ''
  const role = el.getAttribute('role') ? `[role="${el.getAttribute('role')}"]` : ''
  const nodeId = el.closest('[data-node-id]')?.getAttribute('data-node-id')
  const nodeIdStr = nodeId ? `[node="${nodeId}"]` : ''
  const text = el.textContent?.trim().slice(0, 30)
  const textStr = text ? ` "${text}"` : ''
  return `${tag}${id}${role}${nodeIdStr}${textStr}`.slice(0, 150)
}

function getNodeId(el: Element | null): string | null {
  if (!el) return null
  return el.closest('[data-node-id]')?.getAttribute('data-node-id') ?? null
}

function formatDiff(diff: { path: string; kind: string; before?: unknown; after?: unknown }): string {
  if (diff.kind === 'added') return `+ ${diff.path}: ${JSON.stringify(diff.after)}`
  if (diff.kind === 'removed') return `- ${diff.path}: ${JSON.stringify(diff.before)}`
  return `${diff.path}: ${JSON.stringify(diff.before)} → ${JSON.stringify(diff.after)}`
}

// ---- Main ----

export function createReproRecorder() {
  let timeline: ReproEvent[] = []
  let startTime = 0
  let active = false
  let seq = 0
  const cleanups: (() => void)[] = []

  function elapsed(): string {
    const ms = Math.round(performance.now() - startTime)
    return ms < 1000 ? `+${ms}ms` : `+${(ms / 1000).toFixed(1)}s`
  }

  function nextSeq() {
    return ++seq
  }

  // Channel 1+2+3: Input events with component + ARIA context
  function onKeydown(e: KeyboardEvent) {
    if (!active) return
    const mods = [
      e.ctrlKey || e.metaKey ? 'Mod+' : '',
      e.shiftKey ? 'Shift+' : '',
      e.altKey ? 'Alt+' : '',
    ].join('')
    const key = e.key === ' ' ? 'Space' : e.key
    const target = e.target as Element
    timeline.push({
      seq: nextSeq(),
      time: elapsed(),
      ch: 'input',
      type: 'keydown',
      key: mods + key,
      target: describeTarget(target),
      targetNodeId: getNodeId(target),
      component: getComponentInfo(target),
      aria: getAriaSnapshot(target),
    })
  }

  function onClick(e: MouseEvent) {
    if (!active) return
    const target = e.target as Element
    timeline.push({
      seq: nextSeq(),
      time: elapsed(),
      ch: 'input',
      type: 'click',
      target: describeTarget(target),
      targetNodeId: getNodeId(target),
      component: getComponentInfo(target),
      aria: getAriaSnapshot(target),
    })
  }

  // Focus tracking — only log when focus actually changes
  let lastFocusDesc = ''
  function onFocusIn(e: FocusEvent) {
    if (!active) return
    const target = e.target as Element
    const desc = describeTarget(target)
    if (desc === lastFocusDesc) return
    lastFocusDesc = desc
    timeline.push({
      seq: nextSeq(),
      time: elapsed(),
      ch: 'input',
      type: 'focus',
      target: desc,
      targetNodeId: getNodeId(target),
      component: getComponentInfo(target),
      aria: getAriaSnapshot(target),
    })
  }

  // Channel 4: Store diffs (passed as logger to <Aria>)
  const reproLogger: Logger = (entry: LogEntry) => {
    if (!active) return
    timeline.push({
      seq: nextSeq(),
      time: elapsed(),
      ch: 'state',
      command: entry.type,
      payload: entry.payload,
      diff: entry.diff.map(formatDiff),
      ...(entry.error ? { error: entry.error } : {}),
    })
  }

  // Channel 5: Console errors/warnings
  function interceptConsole() {
    const origError = console.error
    const origWarn = console.warn

    console.error = (...args: unknown[]) => {
      if (active) {
        timeline.push({
          seq: nextSeq(),
          time: elapsed(),
          ch: 'console',
          level: 'error',
          message: args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ').slice(0, 500),
        })
      }
      origError.apply(console, args)
    }

    console.warn = (...args: unknown[]) => {
      if (active) {
        timeline.push({
          seq: nextSeq(),
          time: elapsed(),
          ch: 'console',
          level: 'warn',
          message: args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ').slice(0, 500),
        })
      }
      origWarn.apply(console, args)
    }

    // Also catch uncaught errors
    const onError = (event: ErrorEvent) => {
      if (!active) return
      timeline.push({
        seq: nextSeq(),
        time: elapsed(),
        ch: 'console',
        level: 'error',
        message: `Uncaught: ${event.message} at ${event.filename}:${event.lineno}`,
      })
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (!active) return
      timeline.push({
        seq: nextSeq(),
        time: elapsed(),
        ch: 'console',
        level: 'error',
        message: `Unhandled rejection: ${event.reason}`,
      })
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)

    return () => {
      console.error = origError
      console.warn = origWarn
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }

  return {
    /** Logger callback — pass to <Aria logger={recorder.logger}> */
    logger: reproLogger,

    start() {
      timeline = []
      seq = 0
      startTime = performance.now()
      active = true
      lastFocusDesc = ''

      window.addEventListener('keydown', onKeydown, true)
      window.addEventListener('click', onClick, true)
      window.addEventListener('focusin', onFocusIn, true)
      const restoreConsole = interceptConsole()

      cleanups.push(
        () => window.removeEventListener('keydown', onKeydown, true),
        () => window.removeEventListener('click', onClick, true),
        () => window.removeEventListener('focusin', onFocusIn, true),
        restoreConsole,
      )
    },

    stop(): ReproRecording {
      active = false
      cleanups.forEach(fn => fn())
      cleanups.length = 0

      const counts = { input: 0, state: 0, console: 0 }
      for (const e of timeline) counts[e.ch]++

      return {
        meta: {
          url: window.location.pathname,
          startedAt: new Date(Date.now() - (performance.now() - startTime)).toISOString(),
          duration: Math.round(performance.now() - startTime),
          eventCount: timeline.length,
          channels: counts,
        },
        timeline,
      }
    },

    get isActive() {
      return active
    },
  }
}
