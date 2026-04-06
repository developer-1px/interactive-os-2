// ② 2026-03-30-ui-common-interface-prd.md
import type React from 'react'
import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { NodeState } from '../pattern/types'

/** 노드 렌더러 함수 — 소비자/완성품이 사용하는 최종 시그니처 */
export type RenderItem = (
  props: React.HTMLAttributes<HTMLElement>,
  item: Record<string, unknown>,
  state: NodeState,
) => React.ReactElement

/** Plugin renderer 함수 — null 반환 시 다음 renderer로 fallback */
export type PluginRenderItem = (
  props: React.HTMLAttributes<HTMLElement>,
  item: Record<string, unknown>,
  state: NodeState,
) => React.ReactElement | null

/** 노드별 슬롯을 선언적으로 채우는 옵션 — renderItem 없이 아이콘/보조 콘텐츠 전달 */
export interface ItemSlots {
  icon?: (node: Record<string, unknown>, state: NodeState) => React.ReactNode
  rightContent?: (node: Record<string, unknown>, state: NodeState) => React.ReactNode
}

/** UI 완성품의 공통 props — Pattern은 정체성(고정), Plugin + Renderer는 교체 가능 */
export interface AriaComponentProps {
  data: NormalizedData
  onChange?: (data: NormalizedData) => void
  plugins?: Plugin[]
  renderItem?: RenderItem
  itemSlots?: ItemSlots
  onActivate?: (nodeId: string) => void
  onFocusChange?: (nodeId: string | null) => void
  className?: string
  'aria-label'?: string
}

/** Extract display label from a normalized entity */
export function getNodeLabel(item: Record<string, unknown>): string {
  return (item.data as Record<string, unknown>)?.label as string
    ?? (item.data as Record<string, unknown>)?.name as string
    ?? item.id as string
}

/**
 * Renderer 합성: user > plugin(뒤→앞) > default.
 * Plugin renderer는 null 반환 시 다음 레이어로 fallback.
 * 최종 반환은 항상 non-null (default가 보장).
 */
export function mergeRenderers(
  defaultRenderer: RenderItem,
  plugins: Plugin[],
  userRenderer?: RenderItem,
): RenderItem {
  const pluginRenderers = plugins
    .map(p => p.renderer?.renderItem as PluginRenderItem | undefined)
    .filter((r): r is PluginRenderItem => r != null)

  if (pluginRenderers.length === 0 && !userRenderer) return defaultRenderer
  if (userRenderer && pluginRenderers.length === 0) return userRenderer

  return (props, item, state) => {
    if (userRenderer) return userRenderer(props, item, state)

    for (let i = pluginRenderers.length - 1; i >= 0; i--) {
      const result = pluginRenderers[i](props, item, state)
      if (result !== null) return result
    }

    return defaultRenderer(props, item, state)
  }
}
