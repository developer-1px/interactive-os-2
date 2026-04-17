import type { AxPrivate } from './axPrivate'
import { AX_PRIVATE_KEYS } from './axPrivate'

// Private 축 prefix 매핑 — ax.ts의 prefixes와 동일 규약.
const PRIVATE_PREFIXES: Record<keyof AxPrivate, string> = {
  padding: 'pd',
  gap: 'g',
  shape: 'sh',
  border: 'bd',
  icon: 'ic',
  square: 'sq',
  weight: 'wt',
  text: 'tx',
  opacity: 'op',
  state: 'st',
  motion: 'mo',
}

const PRIVATE_KEY_SET = new Set<string>(AX_PRIVATE_KEYS as readonly string[])

/**
 * Escape hatch. Private 10축 직접 지정의 유일 경로.
 * ax.ts 가 `ax.raw = axRaw` 로 부착해 공개한다.
 *
 * @invariant AxPublic 키 받지 않음 — Public 은 ax() 통해서만
 * @invariant 반환 문자열 포맷은 ax() 와 동일 (prefix-value 공백 구분)
 */
export function axRaw(input: Partial<AxPrivate>): string {
  let result = ''
  for (const key in input) {
    if (!PRIVATE_KEY_SET.has(key)) {
      if (import.meta.env?.DEV) {
        throw new TypeError(
          `ax.raw() received non-private key: "${key}". Use ax() for Public keys.`,
        )
      }
      continue
    }
    const value = (input as Record<string, string | undefined>)[key]
    if (value == null) continue
    if (result) result += ' '
    result += `${PRIVATE_PREFIXES[key as keyof AxPrivate]}-${value}`
  }
  return result
}
