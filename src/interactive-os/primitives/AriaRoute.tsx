// ② 2026-04-03-command-unification-prd.md
import { useEffect, type ReactNode } from 'react'
import { findMatchingKey } from './useKeyboard'
import type { Command } from '../engine/types'

export type RouteKeyMap = Record<string, () => Command | void>

/** Route-scoped global shortcuts. Owns a document keydown listener that lives
 *  for the lifetime of the component — mount = activate, unmount = deactivate.
 *  Handlers return Command for logging/communication. void is allowed for backward compat. */
export function AriaRoute({ keyMap, children }: { keyMap: RouteKeyMap; children: ReactNode }) {
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

  return <>{children}</>
}
