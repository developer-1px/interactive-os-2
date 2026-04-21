/**
 * Shallow equality for selector results. Use as the `equalityFn` arg of
 * `useEngineSelector` when the selector composes a new object/array each call.
 *
 * Supports plain objects, arrays, `Map`, and `Set`. Matches Zustand semantics.
 */
function shallowMap(a: Map<unknown, unknown>, b: Map<unknown, unknown>): boolean {
  if (a.size !== b.size) return false
  for (const [k, v] of a) {
    if (!b.has(k) || !Object.is(v, b.get(k))) return false
  }
  return true
}

function shallowSet(a: Set<unknown>, b: Set<unknown>): boolean {
  if (a.size !== b.size) return false
  for (const v of a) {
    if (!b.has(v)) return false
  }
  return true
}

function shallowObject(a: object, b: object): boolean {
  const keysA = Object.keys(a)
  if (keysA.length !== Object.keys(b).length) return false
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false
    if (!Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) return false
  }
  return true
}

export function shallow<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false
  if (a instanceof Map && b instanceof Map) return shallowMap(a, b)
  if (a instanceof Set && b instanceof Set) return shallowSet(a, b)
  return shallowObject(a as object, b as object)
}
