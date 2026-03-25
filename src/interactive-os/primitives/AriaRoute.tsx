import { useEffect, type ReactNode } from 'react'
import { findMatchingKey } from './useKeyboard'

type RouteKeyMap = Record<string, () => void>

/** Route-scoped global shortcuts. Owns a document keydown listener that lives
 *  for the lifetime of the component — mount = activate, unmount = deactivate. */
export function AriaRoute({ keyMap, children }: { keyMap: RouteKeyMap; children: ReactNode }) {
  useEffect(() => {
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
  }, [keyMap])

  return <>{children}</>
}
