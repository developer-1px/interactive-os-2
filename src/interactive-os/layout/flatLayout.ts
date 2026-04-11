// ② flat-layout-engine-prd.md
import type { NormalizedData, PaneSize } from '../store/types'
import { ROOT_ID } from '../store/types'
import { createStore } from '../store/createStore'

// ── Layout node types ─────────────────────────────────

export interface SplitNode extends Record<string, unknown> {
  type: 'split'
  direction: 'horizontal' | 'vertical'
  sizes: PaneSize[]
}

export interface StackNode extends Record<string, unknown> {
  type: 'stack'
  gap?: 'sm' | 'md' | 'lg'
}

export interface OverlayNode extends Record<string, unknown> {
  type: 'overlay'
  overlayType: 'modal' | 'popup' | 'hint'
  trigger?: string
  visible?: boolean
}

export interface BarNode extends Record<string, unknown> {
  type: 'bar'
  justify?: 'start' | 'center' | 'between' | 'end'
}

export interface WidgetNode extends Record<string, unknown> {
  type: 'widget'
  widget: string
  props?: Record<string, unknown>
  source?: string
}

export interface GridNode extends Record<string, unknown> {
  type: 'grid'
  columns: 2 | 3 | 4 | 5 | 7
  gap?: 'sm' | 'md' | 'lg'
}

export interface NavNode extends Record<string, unknown> {
  type: 'nav'
  sidebarWidth?: number  // 0~1 비율, 기본 0.2
}

export interface TabNode extends Record<string, unknown> {
  type: 'tab'
}

export interface SectionNode extends Record<string, unknown> {
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
