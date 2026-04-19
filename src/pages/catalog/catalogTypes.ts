// Shape of catalog.generated.ts — kept intentionally loose (generator output is frozen via `as const`).
export interface CatalogGeneratedEntry {
  name: string
  path: string
  demoPath: string | null
  category: string
  propsSignature: Record<string, unknown>
  gaps: {
    demoFile: string
    branchCoverage: {
      covered: number
      total: number
      missing: string[]
    }
    axAxes: {
      declared: string[]
      missing: string[]
    }
    aria: string
    docs: string
  }
  jsDoc: string | null
}

export interface CatalogGenerated {
  entries: readonly CatalogGeneratedEntry[]
  generatedAt: string
}
