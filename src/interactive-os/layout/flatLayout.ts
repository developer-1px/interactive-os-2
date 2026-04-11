// ② flat-layout-engine-prd.md
import type { NormalizedData, PaneSize } from '../store/types'
import { ROOT_ID } from '../store/types'
import { createStore } from '../store/createStore'

// ── Layout node types ─────────────────────────────────

/** 모든 레이아웃 노드의 공통 속성 — XY 배치 + Z 깊이 */
export interface LayoutBase extends Record<string, unknown> {
  surface?: 'sunken' | 'base' | 'raised' | 'overlay'
}

export interface SplitNode extends LayoutBase {
  type: 'split'
  direction: 'horizontal' | 'vertical'
  sizes: PaneSize[]
}

export interface StackNode extends LayoutBase {
  type: 'stack'
  gap?: 'sm' | 'md' | 'lg'
}

export interface OverlayNode extends LayoutBase {
  type: 'overlay'
  overlayType: 'modal' | 'popup' | 'hint'
  trigger?: string
  visible?: boolean
}

export interface BarNode extends LayoutBase {
  type: 'bar'
  justify?: 'start' | 'center' | 'between' | 'end'
}

export interface WidgetNode extends LayoutBase {
  type: 'widget'
  widget: string
  props?: Record<string, unknown>
  source?: string
}

export interface GridNode extends LayoutBase {
  type: 'grid'
  columns: 2 | 3 | 4 | 5 | 7
  gap?: 'sm' | 'md' | 'lg'
}

export interface NavNode extends LayoutBase {
  type: 'nav'
  sidebarWidth?: number  // 0~1 비율, 기본 0.2
}

export interface TabNode extends LayoutBase {
  type: 'tab'
}

export interface SectionNode extends LayoutBase {
  type: 'section'
  title: string
  count?: number
}

export type LayoutNode = SplitNode | StackNode | BarNode | OverlayNode | WidgetNode | GridNode | NavNode | TabNode | SectionNode

// ── definePage factory ────────────────────────────────

interface PageEntityConfig {
  data: LayoutNode
  children?: string[]
}

export function definePage(config: { entities: Record<string, PageEntityConfig> }): NormalizedData {
  const entities: Record<string, { id: string; data?: Record<string, unknown> }> = {}
  const relationships: Record<string, string[]> = { [ROOT_ID]: [] }

  const childSet = new Set<string>()

  // First pass: collect all children to determine root entities
  for (const [, cfg] of Object.entries(config.entities)) {
    if (cfg.children) {
      for (const childId of cfg.children) {
        childSet.add(childId)
      }
    }
  }

  // Second pass: build entities and relationships
  for (const [id, cfg] of Object.entries(config.entities)) {
    const label = cfg.data.type === 'widget'
      ? (cfg.data as WidgetNode).widget
      : `${cfg.data.type}: ${id}`
    entities[id] = { id, data: { ...cfg.data, label } }
    if (cfg.children) {
      relationships[id] = cfg.children
    }
    if (!childSet.has(id)) {
      relationships[ROOT_ID]!.push(id)
    }
  }

  return createStore({ entities, relationships })
}
