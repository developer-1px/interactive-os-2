import type { Entity } from '../store/types'
import type { CommandEngine } from '../engine/createCommandEngine'
import { definePlugin } from './definePlugin'
import { focusCommands, FOCUS_ID } from './core'
import { getVisibleNodes } from '../pattern/createPatternContext'

export type GetLabelFn = (entity: Entity) => string

export interface TypeaheadNode {
  id: string
  label: string
}

/**
 * Pure function: find the best typeahead match.
 *
 * Search strategy:
 * - Case-insensitive prefix match against buffer
 * - Start searching from the node AFTER currentFocusId (wrap-around)
 * - If buffer is multi-char, search from beginning (not cycling)
 */
export function findTypeaheadMatch(
  nodes: TypeaheadNode[],
  buffer: string,
  currentFocusId: string,
): string | null {
  if (nodes.length === 0 || buffer.length === 0) return null

  const search = buffer.toLowerCase()
  const isMultiChar = search.length > 1

  // For multi-char buffer, search from the start (narrowing, not cycling)
  // For single-char, search from AFTER current focus (cycling behavior)
  let startIdx = 0
  if (!isMultiChar && currentFocusId) {
    const currentIdx = nodes.findIndex((n) => n.id === currentFocusId)
    if (currentIdx >= 0) startIdx = currentIdx + 1
  }

  for (let i = 0; i < nodes.length; i++) {
    const idx = (startIdx + i) % nodes.length
    const node = nodes[idx]!
    if (node.label && node.label.toLowerCase().startsWith(search)) {
      return node.id
    }
  }

  return null
}

export function isPrintableKey(event: KeyboardEvent): boolean {
  if (event.key.length !== 1) return false
  if (event.ctrlKey || event.metaKey || event.altKey) return false
  if (event.isComposing) return false
  return true
}

const DEFAULT_TIMEOUT = 500

export interface TypeaheadOptions {
  getLabel: GetLabelFn
  timeout?: number
}

// Per-instance state holder for resetTypeahead access in tests
let activeReset: (() => void) | null = null

/** Reset the active typeahead buffer — use in tests to isolate state between cases */
export function resetTypeahead(): void {
  activeReset?.()
}

export function typeahead(options: TypeaheadOptions) {
  const { getLabel, timeout = DEFAULT_TIMEOUT } = options

  // Per-instance state (NOT module-level) — each typeahead() call gets its own buffer
  let buffer = ''
  let timer: ReturnType<typeof setTimeout> | null = null

  const reset = () => {
    buffer = ''
    if (timer) clearTimeout(timer)
    timer = null
  }

  // Register as active instance for resetTypeahead()
  activeReset = reset

  return definePlugin({
    name: 'typeahead',
    onUnhandledKey(event: KeyboardEvent, engine: CommandEngine): boolean {
      if (!isPrintableKey(event)) return false

      // Accumulate buffer
      buffer += event.key.toLowerCase()

      // Reset timer
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        buffer = ''
        timer = null
      }, timeout)

      const store = engine.getStore()
      const focusedId = (store.entities[FOCUS_ID]?.focusedId as string) ?? ''

      const visibleIds = getVisibleNodes(engine)
      const nodes: TypeaheadNode[] = []
      for (const id of visibleIds) {
        const entity = store.entities[id]
        if (entity) {
          nodes.push({ id, label: getLabel(entity) })
        }
      }

      const matchId = findTypeaheadMatch(nodes, buffer, focusedId)
      if (matchId && matchId !== focusedId) {
        engine.dispatch(focusCommands.setFocus(matchId))
      }

      return true // always consume printable chars to prevent browser default
    },
  })
}
