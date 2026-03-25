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

import type { LogEntry, Logger } from '../../interactive-os/engine/dispatchLogger'

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
  text: string
  meta: {
    url: string
    startedAt: string
    duration: number
    eventCount: number
  }
  timeline: ReproEvent[]
}

// ---- ARIA role containers (used to find the nearest meaningful subtree) ----

const CONTAINER_ROLES = new Set([
  'listbox', 'tree', 'treegrid', 'grid', 'table', 'tablist', 'menu',
  'menubar', 'toolbar', 'radiogroup', 'group', 'dialog', 'alertdialog',
  'navigation', 'main', 'region', 'application',
])

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

// ---- ARIA Tree Serialization (Playwright YAML-like format) ----

function describeFocus(el: Element | null): string {
  if (!el || el === document.body) return 'body'
  return describeTarget(el)
}

function findRoleContainer(el: Element | null): Element | null {
  let current = el
  while (current && current !== document.body) {
    const role = current.getAttribute('role')
    if (role && CONTAINER_ROLES.has(role)) return current
    current = current.parentElement
  }
  return null
}

const ARIA_STATE_ATTRS = [
  'aria-selected', 'aria-expanded', 'aria-checked', 'aria-disabled',
  'aria-pressed', 'aria-level', 'aria-activedescendant', 'aria-current',
  'aria-invalid', 'aria-required', 'aria-valuemin', 'aria-valuemax',
  'aria-valuenow', 'aria-valuetext',
] as const

function serializeAriaNode(el: Element, depth: number, activeEl: Element | null): string {
  const indent = '  '.repeat(depth)
  const role = el.getAttribute('role') || implicitRole(el)
  if (!role) return ''

  const name = el.getAttribute('aria-label')
    || el.getAttribute('aria-labelledby')
    || (el.children.length === 0 ? el.textContent?.trim().slice(0, 50) : null)
    || ''

  const attrs: string[] = []
  for (const attr of ARIA_STATE_ATTRS) {
    const val = el.getAttribute(attr)
    if (val !== null) {
      const shortName = attr.replace('aria-', '')
      attrs.push(val === 'true' ? shortName : `${shortName}=${val}`)
    }
  }

  const isActive = el === activeEl
  if (isActive) attrs.push('◀ focus')

  const attrStr = attrs.length > 0 ? ` [${attrs.join(', ')}]` : ''
  const nameStr = name ? ` "${name}"` : ''
  const line = `${indent}- ${role}${nameStr}${attrStr}`

  const childLines: string[] = []
  for (const child of el.children) {
    const childRole = child.getAttribute('role') || implicitRole(child)
    if (childRole) {
      const serialized = serializeAriaNode(child, depth + 1, activeEl)
      if (serialized) childLines.push(serialized)
    } else {
      // Walk deeper — non-role wrappers (div, span) are skipped
      for (const grandchild of child.children) {
        const serialized = serializeAriaNode(grandchild, depth + 1, activeEl)
        if (serialized) childLines.push(serialized)
      }
    }
  }

  return childLines.length > 0
    ? `${line}\n${childLines.join('\n')}`
    : line
}

const IMPLICIT_ROLES: Record<string, string> = {
  button: 'button', a: 'link', input: 'textbox', select: 'combobox',
  textarea: 'textbox', nav: 'navigation', main: 'main', header: 'banner',
  footer: 'contentinfo', aside: 'complementary', ul: 'list', ol: 'list',
  li: 'listitem', table: 'table', tr: 'row', td: 'cell', th: 'columnheader',
  h1: 'heading', h2: 'heading', h3: 'heading', h4: 'heading',
  h5: 'heading', h6: 'heading', dialog: 'dialog',
}

function implicitRole(el: Element): string | null {
  return IMPLICIT_ROLES[el.tagName.toLowerCase()] ?? null
}

// ---- ARIA Tree Diff ----

function diffAriaTree(prev: string, current: string): string {
  if (prev === current) return '(no changes)'

  const prevLines = prev.split('\n')
  const currentLines = current.split('\n')
  const prevSet = new Set(prevLines)
  const currentSet = new Set(currentLines)

  const removed = prevLines.filter(l => !currentSet.has(l))
  const added = currentLines.filter(l => !prevSet.has(l))

  if (removed.length === 0 && added.length === 0) return '(no changes)'

  const parts: string[] = []
  for (const line of removed) parts.push(`- ${line.trimStart()}`)
  for (const line of added) parts.push(`+ ${line.trimStart()}`)
  parts.push(`(${added.length} added, ${removed.length} removed, ${currentLines.length - added.length} unchanged)`)
  return parts.join('\n')
}

// ---- Text Formatter (LLM-readable output) ----

const INPUT_ICONS: Record<string, string> = {
  keydown: '⌨', click: '🖱', focus: '⏎',
}

function formatTimelineAsText(meta: ReproRecording['meta'], timeline: ReproEvent[]): string {
  const lines: string[] = []
  lines.push(`# Reproduction — ${meta.url}`)
  lines.push(`# ${meta.startedAt} · ${(meta.duration / 1000).toFixed(1)}s · ${meta.eventCount} events`)
  lines.push('')

  let lastSource = ''

  // Merge consecutive events: input followed by state/console entries = one "step"
  let i = 0
  while (i < timeline.length) {
    const ev = timeline[i]

    if (ev.ch === 'input') {
      const icon = INPUT_ICONS[ev.type] ?? '?'
      const keyStr = ev.key ? ` ${ev.key}` : ''
      // Only show source when it changes from previous
      const srcChanged = ev.source !== null && ev.source !== lastSource
      const srcStr = srcChanged ? `  ← ${ev.source}` : ''
      if (ev.source) lastSource = ev.source

      // Collect trailing state/console entries that belong to this input
      let j = i + 1
      const trailingLines: string[] = []
      while (j < timeline.length && timeline[j].ch !== 'input') {
        const trailing = timeline[j]
        if (trailing.ch === 'state') {
          const diffStr = trailing.diff.length > 0 ? trailing.diff.join(', ') : 'no diff'
          trailingLines.push(`  → ${trailing.command}: ${diffStr}`)
          if (trailing.error) trailingLines.push(`  ⚠ ${trailing.error}`)
        } else if (trailing.ch === 'console') {
          const prefix = trailing.level === 'error' ? '✗' : '⚠'
          trailingLines.push(`  ${prefix} ${trailing.message}`)
        }
        j++
      }

      const noChanges = ev.ariaTree === '(no changes)' && trailingLines.length === 0
      if (noChanges) {
        lines.push(`[${ev.seq}] ${ev.time} ${icon}${keyStr} → ${ev.target} (no changes)`)
      } else {
        lines.push(`[${ev.seq}] ${ev.time} ${icon}${keyStr} → ${ev.target}${srcStr}`)
        // Only show focus when different from target (e.g. activedescendant)
        const focusDiffers = ev.focus !== ev.target
        const focusStr = focusDiffers ? `focus: ${ev.focus}` : ''
        const preventedStr = ev.prevented ? 'prevented' : ''
        const metaLine = [focusStr, preventedStr].filter(Boolean).join(' | ')
        if (metaLine) lines.push(metaLine)
        for (const treeLine of ev.ariaTree.split('\n')) {
          lines.push(`  ${treeLine}`)
        }
        for (const tl of trailingLines) lines.push(tl)
      }

      lines.push('')
      i = j
    } else {
      // Orphan state/console entries (before any input)
      if (ev.ch === 'state') {
        lines.push(`[${ev.seq}] ${ev.time} → ${ev.command}: ${ev.diff.join(', ')}`)
      } else if (ev.ch === 'console') {
        const prefix = ev.level === 'error' ? '✗' : '⚠'
        lines.push(`[${ev.seq}] ${ev.time} ${prefix} ${ev.message}`)
      }
      lines.push('')
      i++
    }
  }

  return lines.join('\n')
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
      ? serializeAriaNode(container, 0, document.activeElement)
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
    timeline.push({
      seq: nextSeq(),
      time: elapsed(),
      ch: 'input',
      type,
      ...(key !== undefined ? { key } : {}),
      target: describeTarget(target),
      source,
      focus: describeFocus(document.activeElement),
      prevented,
      ariaTree: captureAriaTree(target),
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
