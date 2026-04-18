var e=`// ② 2026-03-24-isomorphic-layer-tree-prd.md
export interface Entity<T extends Record<string, unknown> = Record<string, unknown>> {
  id: string
  data?: T
  [key: string]: unknown
}

// ② 2026-03-31-store-slots-prd.md
export interface NormalizedData {
  entities: Record<string, Entity>
  relationships: Record<string, string[]>
  /** Named fixed-structure slots: parentId → { slotName → childId }. Object semantics — no CRUD, edit only. */
  slots?: Record<string, Record<string, string>>
}

export const ROOT_ID = '__root__' as const

/** Size of a pane in a split layout: a ratio (0–1), 'flex' for CSS flex:1, or 'auto' for content size */
export type PaneSize = number | 'flex' | 'auto'

export interface TransformAdapter<TExternal> {
  normalize(external: TExternal): NormalizedData
  denormalize(internal: NormalizedData): TExternal
}
`;export{e as default};