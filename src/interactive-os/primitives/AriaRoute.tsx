// ② 2026-04-03-command-unification-prd.md
import { useEffect, type ReactNode } from 'react'
import { findMatchingKey } from './useKeyboard'
import type { Command } from '../engine/types'
import { registerAria, unregisterAria } from './ariaRegistry'

export type RouteKeyMap = Record<string, () => Command | void>

/** key → { command: command type, owner: 소유 컴포넌트 } */
export type RouteInspectMap = Record<string, { command: string; owner: string }>

interface AriaRouteProps {
  keyMap: RouteKeyMap
  label?: string
  /** 선언적 inspect 메타 — key별 command type과 소유자 */
  inspectMap?: RouteInspectMap
  children: ReactNode
}

export function AriaRoute({ keyMap, label, inspectMap, children }: AriaRouteProps) {
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
    if (!registryKey) return
    const commands: string[] = []
    const keyMapDesc: Record<string, import('../engine/types').KeyMapEntry> = {}

    if (inspectMap) {
      for (const [key, meta] of Object.entries(inspectMap)) {
        commands.push(meta.command)
        keyMapDesc[key] = { owner: meta.owner, command: meta.command }
      }
    } else {
      for (const key of Object.keys(keyMap)) {
        commands.push(key)
        keyMapDesc[key] = { owner: label ?? 'route' }
      }
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
    })
    return () => unregisterAria(registryKey)
  }, [keyMap, label, inspectMap])

  return <>{children}</>
}
