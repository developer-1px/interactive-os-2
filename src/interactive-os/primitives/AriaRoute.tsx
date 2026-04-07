// ② 2026-04-03-command-unification-prd.md
import { useEffect, type ReactNode } from 'react'
import { findMatchingKey } from './useKeyboard'
import { registerAria, unregisterAria } from './ariaRegistry'
import type { RouteKeyMap } from './defineRouteKey'

interface AriaRouteProps {
  keyMap: RouteKeyMap
  label?: string
  children: ReactNode
}

export function AriaRoute({ keyMap, label, children }: AriaRouteProps) {
  useEffect(() => {
    if (Object.keys(keyMap).length === 0) return
    const handler = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      const match = findMatchingKey(e, keyMap)
      if (match) {
        const command = keyMap[match]()
        if (command && import.meta.env?.DEV) {
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
    if (!registryKey) return
    const commands: string[] = []
    const keyMapDesc: Record<string, import('../engine/types').KeyMapEntry> = {}

    for (const [key, handler] of Object.entries(keyMap)) {
      const owner = handler.owner ?? label ?? 'route'
      commands.push(handler.type)
      keyMapDesc[key] = { owner, command: handler.type }
    }

    registerAria(registryKey, {
      dispatch: () => {},
      getStore: () => ({ entities: {}, relationships: {} }),
      inspect: () => ({
        commands,
        keyMap: keyMapDesc,
        plugins: [],
        state: { entities: {}, relationships: {} },
        extras: {},
      }),
      getElement: () => null,
      subscribe: () => () => {},
    })
    return () => unregisterAria(registryKey)
  }, [keyMap, label])

  return <>{children}</>
}
