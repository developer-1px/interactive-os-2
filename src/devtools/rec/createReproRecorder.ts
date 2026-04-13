/**
 * Reproduction Path Recorder
 *
 * Captures 6 channels into a unified timeline:
 *   1. Route — current URL
 *   2. Component — React component stack + source file
 *   3. Input — keyboard/click/focus events + runtime state (focus, prevented)
 *   4. State — store diffs from command engine dispatch
 *   5. Console — errors and warnings
 *   6. AriaTree — accessibility tree snapshots (full on first event, diff after)
 *
 * Inspired by agentic browser patterns (Playwright MCP, agent-browser):
 * captures the accessibility tree per input event so an LLM can understand
 * "what state was the UI in when the user acted, and what changed (or didn't)."
 *
 * Usage:
 *   const rec = createReproRecorder()
 *   rec.start()
 *   // pass rec.logger to <Aria logger={rec.logger}>
 *   const data = rec.stop()
 */

import type { LogEntry, Logger } from '@os/engine/logger'
import type { EngineEvent } from '@os/engine/types'
import { getAllAriaActions } from '@os/primitives/ariaRegistry'
import { findRoleContainer, serializeAriaTree, diffAriaTree } from './reproAriaTree'
import { formatTimelineAsText } from './reproFormatter'

// ---- Types ----

interface ComponentInfo {
  stack: string[]
  source: string | null
}

interface InputEntry {
  seq: number
  time: string
  ch: 'input'
  type: 'keydown' | 'click' | 'focus'
  key?: string
  target: string
  source: string | null
  focus: string
  prevented: boolean
  ariaTree: string
}

interface StateEntry {
  seq: number
  time: string
  ch: 'state'
  command: string
  payload: unknown
  diff: string[]
  error?: string
  /** Engine registry ID that dispatched this command */
  engine?: string
  /** Original command type before middleware transformation */
  originalType?: string
}

interface RouteEntry {
  seq: number
  time: string
  ch: 'route'
  from: string
  to: string
  method: 'pushState' | 'replaceState' | 'popstate'
}

interface ConsoleEntry {
  seq: number
  time: string
  ch: 'console'
  level: 'error' | 'warn'
  message: string
}

type ReproEvent = InputEntry | StateEntry | RouteEntry | ConsoleEntry

interface ReproRecording {
  text: string
  meta: {
    url: string
    startedAt: string
    duration: number
    eventCount: number
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

function describeTarget(el: Element | null): string {
  if (!el) return 'null'
  const tag = el.tagName.toLowerCase()
  const id = el.id ? `#${el.id}` : ''
  const roleAttr = el.getAttribute('role')
  const role = roleAttr ? `[role="${roleAttr}"]` : ''
  const nodeId = el.closest('[data-node-id]')?.getAttribute('data-node-id')
  const nodeIdStr = nodeId ? `[node="${nodeId}"]` : ''
  const text = el.textContent?.trim().slice(0, 30)
  const textStr = text ? ` "${text}"` : ''
  return `${tag}${id}${role}${nodeIdStr}${textStr}`.slice(0, 150)
}

function formatDiff(diff: { path: string; kind: string; before?: unknown; after?: unknown }): string {
  if (diff.kind === 'added') return `+ ${diff.path}: ${JSON.stringify(diff.after)}`
  if (diff.kind === 'removed') return `- ${diff.path}: ${JSON.stringify(diff.before)}`
  return `${diff.path}: ${JSON.stringify(diff.before)} → ${JSON.stringify(diff.after)}`
}

function describeFocus(el: Element | null): string {
  if (!el || el === document.body) return 'body'
  return describeTarget(el)
}

// ---- Main ----

export function createReproRecorder() {
  let timeline: ReproEvent[] = []
  let startTime = 0
  let active = false
  let seq = 0
  let lastAriaTree = ''
  let isFirstInput = true
  const cleanups: (() => void)[] = []

  function elapsed(): string {
    const ms = Math.round(performance.now() - startTime)
    return ms < 1000 ? `+${ms}ms` : `+${(ms / 1000).toFixed(1)}s`
  }

  function nextSeq() {
    return ++seq
  }

  let lastContainer: Element | null = null

  function captureAriaTree(target: Element): string {
    const container = findRoleContainer(target)
    const containerChanged = container !== lastContainer
    lastContainer = container

    const current = container
      ? serializeAriaTree(container, document.activeElement)
      : '(no role container found)'

    // Full tree on first input or when container changes (re-baseline)
    if (isFirstInput || containerChanged) {
      isFirstInput = false
      lastAriaTree = current
      return current
    }
    const diff = diffAriaTree(lastAriaTree, current)
    lastAriaTree = current
    return diff
  }

  function pushInputEntry(type: InputEntry['type'], target: Element, prevented: boolean, key?: string) {
    const info = getComponentInfo(target)
    const source = info.source
      ? `${info.stack.at(-1) ?? ''} (${info.source})`.trim()
      : info.stack.at(-1) ?? null
    const entry: InputEntry = {
      seq: nextSeq(),
      time: elapsed(),
      ch: 'input',
      type,
      ...(key !== undefined ? { key } : {}),
      target: describeTarget(target),
      source,
      focus: describeFocus(document.activeElement),
      prevented,
      ariaTree: '(pending)',
    }
    timeline.push(entry)
    // Defer aria-tree capture to the next frame so React has a chance to
    // commit any state changes triggered by this event. Capturing
    // synchronously here races the dispatch and produces false "(no changes)".
    requestAnimationFrame(() => {
      entry.ariaTree = captureAriaTree(target)
      entry.focus = describeFocus(document.activeElement)
    })
  }

  // Channel 1+2+3+6: Input events with component + runtime state + ARIA tree
  function onKeydown(e: KeyboardEvent) {
    if (!active) return
    const mods = [
      e.ctrlKey || e.metaKey ? 'Mod+' : '',
      e.shiftKey ? 'Shift+' : '',
      e.altKey ? 'Alt+' : '',
    ].join('')
    const key = e.key === ' ' ? 'Space' : e.key
    pushInputEntry('keydown', e.target as Element, e.defaultPrevented, mods + key)
  }

  function onClick(e: MouseEvent) {
    if (!active) return
    pushInputEntry('click', e.target as Element, e.defaultPrevented)
  }

  // Focus tracking — only log when focus actually changes
  let lastFocusDesc = ''
  function onFocusIn(e: FocusEvent) {
    if (!active) return
    const target = e.target as Element
    const desc = describeTarget(target)
    if (desc === lastFocusDesc) return
    lastFocusDesc = desc
    pushInputEntry('focus', target, false)
  }

  // Channel 4: Engine dispatch via ariaRegistry subscribe
  // Subscribe to all registered engines and track new registrations
  const engineUnsubs = new Map<string, () => void>()
  let registryPollId: ReturnType<typeof setInterval> | undefined

  function subscribeEngine(engineId: string) {
    if (engineUnsubs.has(engineId)) return
    const actions = getAllAriaActions().get(engineId)
    if (!actions) return
    const unsub = actions.subscribe((event: EngineEvent) => {
      if (!active) return
      if (event.kind === 'unhandled-key') return // skip noise
      const entry: StateEntry = {
        seq: nextSeq(),
        time: elapsed(),
        ch: 'state',
        command: event.command.type,
        payload: event.command.payload,
        diff: event.diff.map(formatDiff),
        engine: engineId,
        ...(event.error ? { error: event.error } : {}),
        ...(event.originalType ? { originalType: event.originalType } : {}),
      }
      timeline.push(entry)
    })
    engineUnsubs.set(engineId, unsub)
  }

  function subscribeAllEngines() {
    for (const id of getAllAriaActions().keys()) {
      subscribeEngine(id)
    }
  }

  function unsubscribeAllEngines() {
    for (const unsub of engineUnsubs.values()) unsub()
    engineUnsubs.clear()
    if (registryPollId !== undefined) {
      clearInterval(registryPollId)
      registryPollId = undefined
    }
  }

  // Channel 4b: Route changes (pushState/replaceState/popstate)
  let lastUrl = ''

  function pushRouteEntry(method: RouteEntry['method'], to: string) {
    if (!active || to === lastUrl) return
    timeline.push({
      seq: nextSeq(),
      time: elapsed(),
      ch: 'route',
      from: lastUrl,
      to,
      method,
    })
    lastUrl = to
  }

  // Legacy logger callback (kept for backward compat but not primary path)
  const reproLogger: Logger = (entry: LogEntry) => {
    if (!active) return
    if (entry.kind === 'unhandled-key') return
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
    function wrapConsoleMethod(level: 'error' | 'warn') {
      const orig = console[level]
      console[level] = (...args: unknown[]) => {
        if (active) {
          timeline.push({
            seq: nextSeq(),
            time: elapsed(),
            ch: 'console',
            level,
            message: args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ').slice(0, 500),
          })
        }
        orig.apply(console, args)
      }
      return () => { console[level] = orig }
    }

    const restoreError = wrapConsoleMethod('error')
    const restoreWarn = wrapConsoleMethod('warn')

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
      restoreError()
      restoreWarn()
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }

  return {
    /** Logger callback — pass to <Aria logger={recorder.logger}> */
    logger: reproLogger,

    start() {
      // Prevent double-registration of listeners
      cleanups.forEach(fn => fn())
      cleanups.length = 0

      timeline = []
      seq = 0
      startTime = performance.now()
      active = true
      lastFocusDesc = ''
      lastAriaTree = ''
      lastContainer = null
      isFirstInput = true

      window.addEventListener('keydown', onKeydown, true)
      window.addEventListener('click', onClick, true)
      window.addEventListener('focusin', onFocusIn, true)
      const restoreConsole = interceptConsole()

      // Subscribe to all registered engines via ariaRegistry
      subscribeAllEngines()
      // Poll for newly registered engines (lazy-loaded pages)
      registryPollId = setInterval(() => {
        for (const id of getAllAriaActions().keys()) {
          subscribeEngine(id)
        }
      }, 200)

      // Intercept history.pushState / replaceState for route tracking
      lastUrl = window.location.pathname + window.location.hash
      const origPush = history.pushState.bind(history)
      const origReplace = history.replaceState.bind(history)
      history.pushState = function (...args) {
        origPush(...args)
        pushRouteEntry('pushState', window.location.pathname + window.location.hash)
      }
      history.replaceState = function (...args) {
        origReplace(...args)
        pushRouteEntry('replaceState', window.location.pathname + window.location.hash)
      }

      cleanups.push(
        () => window.removeEventListener('keydown', onKeydown, true),
        () => window.removeEventListener('click', onClick, true),
        () => window.removeEventListener('focusin', onFocusIn, true),
        restoreConsole,
        () => unsubscribeAllEngines(),
        () => { history.pushState = origPush; history.replaceState = origReplace },
      )
    },

    stop(): ReproRecording {
      active = false
      cleanups.forEach(fn => fn())
      cleanups.length = 0

      const meta = {
        url: window.location.pathname,
        startedAt: new Date(Date.now() - (performance.now() - startTime)).toISOString(),
        duration: Math.round(performance.now() - startTime),
        eventCount: timeline.length,
      }

      return {
        text: formatTimelineAsText(meta, timeline),
        meta,
        timeline,
      }
    },

    get isActive() {
      return active
    },
  }
}
