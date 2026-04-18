import { useState, useEffect } from 'react'

/**
 * 로컬 view 상태(토글·쿼리·뷰모드 등)를 localStorage에 자동 투영한다.
 *
 * CRUD 상태(엔티티 데이터)에는 사용 금지 — 그쪽은 engine + command.
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return defaultValue
      return JSON.parse(raw) as T
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch { /* quota/privacy mode */ }
  }, [key, value])

  return [value, setValue]
}
