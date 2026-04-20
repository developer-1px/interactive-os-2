// defineLayout() — 선언적 config를 NormalizedData로 빌드하는 팩토리.
// 타입 정의는 flatLayout.ts 소유, 이 파일은 빌드 로직만 소유.

import type { NormalizedData } from '../store/types'
import { ROOT_ID } from '../store/types'
import { createStore } from '../store/createStore'
import { getLayoutNode } from './defineLayoutNode'
import type { LayoutNode, LayoutBase } from './flatLayout'
import './nodes'

interface PageEntityConfig {
  data: LayoutNode
  children?: string[]
}

export function defineLayout(config: { entities: Record<string, PageEntityConfig> }): NormalizedData {
  const entities: Record<string, { id: string; data?: Record<string, unknown> }> = {}
  const relationships: Record<string, string[]> = { [ROOT_ID]: [] }

  const childSet = new Set<string>(
    Object.values(config.entities).flatMap((cfg) => cfg.children ?? []),
  )

  for (const [id, cfg] of Object.entries(config.entities)) {
    const rawLabel = (cfg.data as Record<string, unknown>).label
    const label = typeof rawLabel === 'string'
      ? rawLabel
      : getLayoutNode(cfg.data.type)?.labelFrom?.(cfg.data as LayoutBase & Record<string, unknown>, id)
        ?? `${cfg.data.type}: ${id}`
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
