/**
 * Merge two props objects. Event handlers are chained, className joined,
 * style merged, everything else the latter wins.
 */
export function mergeProps<T extends Record<string, unknown>>(
  a: T,
  b: Partial<T>,
): T {
  const merged = { ...a } as Record<string, unknown>

  for (const key of Object.keys(b)) {
    const bVal = b[key]
    const aVal = a[key as keyof T]

    if (key === 'className') {
      merged[key] = [aVal, bVal].filter(Boolean).join(' ')
    } else if (key === 'style') {
      merged[key] = { ...(aVal as object ?? {}), ...(bVal as object ?? {}) }
    } else if (
      typeof aVal === 'function' &&
      typeof bVal === 'function'
    ) {
      merged[key] = (...args: unknown[]) => {
        ;(aVal as Function)(...args)
        ;(bVal as Function)(...args)
      }
    } else {
      merged[key] = bVal
    }
  }

  return merged as T
}
