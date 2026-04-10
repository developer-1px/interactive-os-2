// ② 2026-03-28-overlay-core-layer-prd.md

export interface LayerEntry {
  id: string
  close(): void
}

const stack: LayerEntry[] = []

export const layerStack = {
  push(entry: LayerEntry): void {
    stack.push(entry)
  },

  remove(id: string): void {
    const idx = stack.findIndex((e) => e.id === id)
    if (idx !== -1) stack.splice(idx, 1)
  },

  /** Close the topmost overlay. Removal happens via the overlay's cleanup effect. */
  closeTop(): boolean {
    const top = stack[stack.length - 1]
    if (!top) return false
    top.close()
    return true
  },

  isTop(id: string): boolean {
    return stack.length > 0 && stack[stack.length - 1].id === id
  },

  get size(): number {
    return stack.length
  },

  /** For debugging */
  getStack(): readonly LayerEntry[] {
    return stack
  },

  /** Test-only: clear all entries */
  _reset(): void {
    stack.length = 0
  },
}
