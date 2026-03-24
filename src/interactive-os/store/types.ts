// ② 2026-03-24-isomorphic-layer-tree-prd.md
export interface Entity<T extends Record<string, unknown> = Record<string, unknown>> {
  id: string
  data?: T
  [key: string]: unknown
}

export interface NormalizedData {
  entities: Record<string, Entity>
  relationships: Record<string, string[]>
}

export const ROOT_ID = '__root__' as const

export interface TransformAdapter<TExternal> {
  normalize(external: TExternal): NormalizedData
  denormalize(internal: NormalizedData): TExternal
}
