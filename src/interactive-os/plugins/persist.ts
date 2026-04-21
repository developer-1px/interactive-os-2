// ② persistPluginPrd.md
import type { Command, Plugin } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { definePlugin } from './definePlugin'

export interface PersistAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface PersistBaseOptions<Picked> {
  /** localStorage key */
  key: string
  /** 스키마 버전. 저장물과 다르면 migrate 호출. */
  version: number
  /** old → current 변환. 실패 시 undefined 반환하면 저장물 폐기. */
  migrate?: (oldPicked: unknown, oldVersion: number) => Picked | undefined
  /** 기본 localStorage. 테스트/대체 어댑터 주입용. */
  storage?: PersistAdapter
  /**
   * raw string → Picked. envelope `{v,d}` 우회.
   * 기존 raw 저장물(legacy)과 호환하려면 제공.
   * 반환 undefined면 저장물 폐기.
   */
  parse?: (raw: string) => Picked | undefined
  /**
   * Picked → raw string. envelope `{v,d}` 우회.
   * parse와 쌍으로 제공.
   */
  serialize?: (picked: Picked) => string
}

export type LoadPersistedOptions<Picked> = PersistBaseOptions<Picked>

export interface PersistOptions<Picked> extends PersistBaseOptions<Picked> {
  /** 저장 대상 추출. 전체 store를 저장하지 않음. */
  pick: (store: NormalizedData) => Picked
  /** 쓰기 debounce ms. 기본 200. */
  debounce?: number
}

interface Envelope {
  v: number
  d: unknown
}

function defaultStorage(): PersistAdapter | null {
  if (typeof localStorage === 'undefined') return null
  return {
    getItem: (k) => localStorage.getItem(k),
    setItem: (k, v) => { localStorage.setItem(k, v) },
  }
}

/**
 * engine 생성 *이전* 동기 로드. 저장물이 없거나 version mismatch + migrate 실패 시 undefined.
 *
 * @invariant localStorage 미정의·JSON parse 실패·storage throw → undefined
 * @invariant version 일치 → 저장된 picked 반환
 * @invariant version 불일치 → migrate 호출, 반환값(undefined 포함) 그대로 전달
 */
export function loadPersisted<Picked>(options: LoadPersistedOptions<Picked>): Picked | undefined {
  const storage = options.storage ?? defaultStorage()
  if (!storage) return undefined
  try {
    const raw = storage.getItem(options.key)
    if (raw == null) return undefined
    if (options.parse) return options.parse(raw)
    const env = JSON.parse(raw) as Envelope
    if (env.v === options.version) return env.d as Picked
    return options.migrate?.(env.d, env.v)
  } catch {
    return undefined
  }
}

/**
 * engine 비(非)사용 write 헬퍼. FlatLayout·Map 기반 외부 store처럼
 * createCommandEngine 없이 localStorage 쓰기가 필요한 케이스용.
 *
 * @invariant storage 미정의·setItem throw → swallow
 * @invariant serialize 있으면 serialize(value), 없으면 envelope `{v,d}` JSON
 */
export function writePersisted<Picked>(
  options: Pick<PersistBaseOptions<Picked>, 'key' | 'version' | 'storage' | 'serialize'>,
  value: Picked,
): void {
  const storage = options.storage ?? defaultStorage()
  if (!storage) return
  try {
    const raw = options.serialize
      ? options.serialize(value)
      : JSON.stringify({ v: options.version, d: value } satisfies Envelope)
    storage.setItem(options.key, raw)
  } catch (e) { console.warn('[persist] write failed:', e) }
}

/**
 * Plugin: command 실행 후 debounced write로 localStorage에 반영.
 *
 * @invariant EffectContext를 변경하지 않음 (read-only 계약 보전)
 * @invariant command 실행 후 pick 결과가 이전 직렬화와 동일하면 write 스킵
 * @invariant write는 debounce ms 내 연타 시 마지막 값만 실제 반영
 * @invariant storage.setItem throw는 console.warn 후 swallow
 */
export function persist<Picked>(options: PersistOptions<Picked>): Plugin {
  const storage = options.storage ?? defaultStorage()
  const debounceMs = options.debounce ?? 200
  let prevSerialized: string | null = null
  let timer: ReturnType<typeof setTimeout> | null = null

  function scheduleWrite(picked: Picked) {
    if (!storage) return
    const next = options.serialize
      ? options.serialize(picked)
      : JSON.stringify({ v: options.version, d: picked } satisfies Envelope)
    if (next === prevSerialized) return
    prevSerialized = next
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      try { storage.setItem(options.key, next) }
      catch (e) { console.warn('[persist] setItem failed:', e) }
    }, debounceMs)
  }

  return definePlugin({
    name: 'persist',
    middleware: (next: (cmd: Command) => void, getStore: () => NormalizedData) => (cmd: Command) => {
      next(cmd)
      scheduleWrite(options.pick(getStore()))
    },
  })
}
