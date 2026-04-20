import { useSyncExternalStore } from 'react'

/**
 * 모듈-스코프 전역 상태용 경량 store. 훅/페이지가 각자
 * `useSyncExternalStore + listener Set` 보일러플레이트를 재구현하지 않도록
 * OS가 흡수하는 최소 프리미티브.
 *
 * 반환값(get/set/use)은 모듈-스코프 stable reference — 소비자의 useMemo deps에
 * 넣어도 렌더 사이 무효화되지 않는다.
 *
 * 큰 도메인 상태(트리/선택/편집)는 createCommandEngine을 써야 하고, 이 API는
 * 단일 값 토글/설정(theme, locale, current user 등)용이다.
 */
export function createModuleStore<T>(options: {
  initial: T | (() => T)
  storageKey?: string
  parse?: (raw: string) => T | undefined
  serialize?: (value: T) => string
}) {
  const { storageKey, parse, serialize } = options

  function loadInitial(): T {
    if (storageKey) {
      try {
        const raw = localStorage.getItem(storageKey)
        if (raw != null) {
          const parsed = parse ? parse(raw) : (JSON.parse(raw) as T)
          if (parsed !== undefined) return parsed
        }
      } catch { /* fall through */ }
    }
    return typeof options.initial === 'function' ? (options.initial as () => T)() : options.initial
  }

  let state: T = loadInitial()
  const listeners = new Set<() => void>()

  function persist(value: T) {
    if (!storageKey) return
    try { localStorage.setItem(storageKey, serialize ? serialize(value) : JSON.stringify(value)) } catch { /* ignore */ }
  }

  function get(): T { return state }

  function set(next: T | ((prev: T) => T)): void {
    const resolved = typeof next === 'function' ? (next as (prev: T) => T)(state) : next
    if (Object.is(resolved, state)) return
    state = resolved
    persist(state)
    for (const listener of Array.from(listeners)) {
      try { listener() } catch (e) { console.error('[module-store] listener threw:', e) }
    }
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }

  function use(): T {
    return useSyncExternalStore(subscribe, get, get)
  }

  return { get, set, subscribe, use } as const
}

export type ModuleStore<T> = ReturnType<typeof createModuleStore<T>>
