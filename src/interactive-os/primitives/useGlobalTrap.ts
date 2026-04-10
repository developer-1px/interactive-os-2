/**
 * useGlobalTrap — 글로벌 키 트랩 primitive
 *
 * 앱 위에 뜨는 레이어(inspector, command palette 등)가
 * 포커스와 무관하게 전역 키를 가로채야 할 때 사용한다.
 *
 * - active=true일 때 capture phase에서 모든 키를 가로챔
 * - keyMap에 매칭되는 키 → 핸들러 실행
 * - 매칭 안 되는 키 → 삼킴 (preventDefault + stopPropagation)
 * - active=false일 때 → 아무것도 안 함
 */
import { useEffect, useRef } from 'react'

type KeyHandler = (event: KeyboardEvent) => void

export interface GlobalTrapKeyMap {
  [key: string]: KeyHandler
}

/**
 * 키 문자열을 이벤트에서 생성한다.
 * 형식: "Mod+Shift+ArrowUp", "Escape", "Mod+o" 등
 * Mod = metaKey(Mac) || ctrlKey(Windows/Linux)
 */
function eventToKey(e: KeyboardEvent): string {
  const parts: string[] = []
  if (e.metaKey || e.ctrlKey) parts.push('Mod')
  if (e.shiftKey) parts.push('Shift')
  if (e.altKey) parts.push('Alt')
  // key 자체가 modifier인 경우 중복 방지
  if (!['Meta', 'Control', 'Shift', 'Alt'].includes(e.key)) {
    // 단일 문자는 소문자로 정규화 (Shift+D → 'D' → 'd')
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
    parts.push(k)
  }
  return parts.join('+')
}

interface GlobalTrapOptions {
  /** true(default): 매칭 안 되는 키를 삼킨다. false: 매칭된 키만 가로채고 나머지 통과 */
  trap?: boolean
}

export function useGlobalTrap(active: boolean, keyMap: GlobalTrapKeyMap, options?: GlobalTrapOptions) {
  const keyMapRef = useRef(keyMap)
  keyMapRef.current = keyMap
  const trap = options?.trap ?? true

  useEffect(() => {
    if (!active) return

    const handler = (e: KeyboardEvent) => {
      // modifier 단독 입력은 무시
      if (['Meta', 'Control', 'Shift', 'Alt'].includes(e.key)) return

      const key = eventToKey(e)
      const match = keyMapRef.current[key]

      if (match) {
        e.preventDefault()
        e.stopPropagation()
        match(e)
      } else if (trap) {
        // 트랩 모드: 매칭 안 되는 키 삼킴
        e.preventDefault()
        e.stopPropagation()
      }
      // passthrough: 매칭 안 되면 아무것도 안 함
    }

    window.addEventListener('keydown', handler, true) // capture phase
    return () => window.removeEventListener('keydown', handler, true)
  }, [active, trap])
}
