// ② 2026-04-03-command-unification-prd.md
import { useEffect, type ReactNode } from 'react'
import { findMatchingKey } from './useKeyboard'
import type { Command } from '../engine/types'
import { registerAria, unregisterAria } from './ariaRegistry'

export type RouteKeyMap = Record<string, () => Command | void>

/** Route-scoped global shortcuts. Owns a document keydown listener that lives
 *  for the lifetime of the component — mount = activate, unmount = deactivate.
 *  Handlers return Command for logging/communication. */
interface AriaRouteProps {
  keyMap: RouteKeyMap
  label?: string
  /** Extra keyMap entries from child components — for inspector visibility only (no listener) */
  inspectKeyMap?: Record<string, string>
  children: ReactNode
}

export function AriaRoute({ keyMap, label, inspectKeyMap, children }: AriaRouteProps) {
  useEffect(() => {
    if (Object.keys(keyMap).length === 0) return
    const handler = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      const match = findMatchingKey(e, keyMap)
      if (match) {
        const command = keyMap[match]()
        if (command && typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
          console.log(`[AriaRoute] ${command.type} | ${JSON.stringify(command.payload)}`)
        }
        e.preventDefault()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [keyMap])

  // Register route-level keyMap in devtools registry
  useEffect(() => {
    const registryKey = label ? `route:${label}` : undefined
    if (!registryKey || Object.keys(keyMap).length === 0) return
    const keyMapDesc: Record<string, string> = {}
    for (const key of Object.keys(keyMap)) {
      keyMapDesc[key] = label ?? 'route'
    }
    if (inspectKeyMap) {
      for (const [key, owner] of Object.entries(inspectKeyMap)) {
        keyMapDesc[key] = owner
      }
    }
    registerAria(registryKey, {
      dispatch: () => {},
      getStore: () => ({ entities: {}, relationships: {} }),
      inspect: () => ({
        commands: Object.keys(keyMap),
        keyMap: keyMapDesc,
        plugins: [],
        state: { entities: {}, relationships: {} },
        extras: {},
      }),
    })
    return () => unregisterAria(registryKey)
  }, [keyMap, label, inspectKeyMap])

  return <>{children}</>
}
