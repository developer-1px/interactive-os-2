// ② persistPluginPrd.md — parse/serialize 옵션으로 raw string·validation 지원
import { useState, useEffect } from 'react'

export interface PersistedStateOptions<T> {
  /** raw string → T. undefined 반환 시 defaultValue 사용. 기본: JSON.parse */
  parse?: (raw: string) => T | undefined
  /** T → raw string. 기본: JSON.stringify */
  serialize?: (value: T) => string
}

/**
 * 로컬 view 상태(토글·쿼리·뷰모드 등)를 localStorage에 자동 투영한다.
 *
 * CRUD 상태(엔티티 데이터)에는 사용 금지 — 그쪽은 engine + command.
 *
 * @invariant parse throw / undefined 반환 → defaultValue 사용
 * @invariant serialize throw / setItem throw → 조용히 무시 (quota 등)
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  options?: PersistedStateOptions<T>,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const parse = options?.parse ?? ((raw: string) => JSON.parse(raw) as T)
  const serialize = options?.serialize ?? ((v: T) => JSON.stringify(v))

  const [value, setValue] = useState<T>(() => {
    if (!key) return defaultValue
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return defaultValue
      const parsed = parse(raw)
      return parsed === undefined ? defaultValue : parsed
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    if (!key) return
    try {
      localStorage.setItem(key, serialize(value))
    } catch { /* quota/privacy mode */ }
  }, [key, value]) // eslint-disable-line react-hooks/exhaustive-deps

  return [value, setValue]
}
