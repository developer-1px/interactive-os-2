import { createContext, useContext, useEffect, useMemo, useCallback, useState, type ReactNode } from 'react'
import { findMatchingKey } from './useKeyboard'

type RouteKeyMap = Record<string, () => void>

interface AriaRouteContextValue {
  register: (keyMap: RouteKeyMap) => void
}

const AriaRouteContext = createContext<AriaRouteContextValue | null>(null)

/** Placed in AppShell. Owns a single document keydown listener that dispatches route-registered keyMaps. */
export function AriaRouteProvider({ children }: { children: ReactNode }) {
  const [routeKeyMap, setRouteKeyMap] = useState<RouteKeyMap>({})

  useEffect(() => {
    if (Object.keys(routeKeyMap).length === 0) return
    const handler = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      const match = findMatchingKey(e, routeKeyMap)
      if (match) {
        routeKeyMap[match]()
        e.preventDefault()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [routeKeyMap])

  const register = useCallback((keyMap: RouteKeyMap) => {
    setRouteKeyMap(keyMap)
  }, [])

  const value = useMemo(() => ({ register }), [register])

  return (
    <AriaRouteContext.Provider value={value}>
      {children}
    </AriaRouteContext.Provider>
  )
}

/** Placed in route layouts. Registers keyMap on mount, deregisters on unmount.
 *  Falls back to a local document listener when no AriaRouteProvider exists (e.g. tests). */
export function AriaRoute({ keyMap, children }: { keyMap: RouteKeyMap; children: ReactNode }) {
  const ctx = useContext(AriaRouteContext)

  // Provider path: register into shared listener
  useEffect(() => {
    if (!ctx) return
    ctx.register(keyMap)
    return () => ctx.register({})
  }, [keyMap, ctx])

  // Fallback path: own document listener (no Provider, e.g. tests)
  useEffect(() => {
    if (ctx) return
    if (Object.keys(keyMap).length === 0) return
    const handler = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      const match = findMatchingKey(e, keyMap)
      if (match) {
        keyMap[match]()
        e.preventDefault()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [keyMap, ctx])

  return <>{children}</>
}
