// ② 2026-04-04-a2ui-surface-showcase-prd.md
import type { ReactNode } from 'react'
import type { NormalizedData, Entity } from '@os/store/types'

/**
 * Render context passed to each A2UI component renderer.
 * Provides the entity, its children renderer, and the full store.
 */
export interface A2UIRenderContext {
  entity: Entity
  store: NormalizedData
  renderChildren: (parentId: string, depth: number) => ReactNode
  depth: number
}

/**
 * A2UI component renderer: receives context, returns React element.
 */
export type A2UIComponentRenderer = (ctx: A2UIRenderContext) => ReactNode

/**
 * Registry mapping A2UI component type string → renderer function.
 */
export type A2UIComponentMap = Record<string, A2UIComponentRenderer>
