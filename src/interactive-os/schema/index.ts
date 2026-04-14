// LLM-facing barrel for aria-os/schema. Type re-exports only.
// defineData() builders are Plan 3.

export type { NormalizedData, Entity, PaneSize, TransformAdapter } from '../store/types'
export { ROOT_ID } from '../store/types'
export { createStore, updateEntityData, getEntity, getChildren, getEntityData } from '../store/createStore'
export { useStore } from '../store/useStore'
