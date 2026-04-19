/** @catalog AI 생성 UI 페이로드를 engine 기반 Surface로 렌더링 */
// ② 2026-04-04-a2ui-surface-showcase-prd.md
import React, { useMemo } from 'react'
import type { A2UIPayload } from './a2uiAdapter'
import { a2uiToNormalized, isSafeDepth } from './a2uiAdapter'
import type { A2UIComponentMap, A2UIRenderContext } from './a2uiComponentMap'
import { ROOT_ID } from '@os/store/types'
import { getChildren } from '@os/store/createStore'
import { defaultComponentMap, fallbackRenderer } from './a2uiRenderers'
import { ax } from '@styles/ax'

// ── A2UISurface ──

interface A2UISurfaceProps {
  payload: A2UIPayload
  componentMap?: A2UIComponentMap
  surfaceId?: string
  onAction?: (componentId: string, actionName: string, context?: Record<string, unknown>) => void
  dataModel?: Record<string, unknown>
}

export function A2UISurface({ payload, componentMap, surfaceId, onAction, dataModel }: A2UISurfaceProps) {
  const mergedMap = useMemo(
    () => ({ ...defaultComponentMap, ...componentMap }),
    [componentMap],
  )

  const store = useMemo(() => a2uiToNormalized(payload), [payload])

  const renderNode = (nodeId: string, depth: number): React.ReactNode => {
    if (!isSafeDepth(depth)) return null
    const entity = store.entities[nodeId]
    if (!entity) return null

    const d = entity.data as Record<string, unknown>
    const componentType = (d?.component as string) ?? ''
    const renderer = mergedMap[componentType] ?? fallbackRenderer

    const ctx: A2UIRenderContext = {
      entity,
      store,
      renderNode,
      renderChildren: (parentId, d) => {
        const childIds = getChildren(store, parentId)
        return childIds.map((cid) => (
          <React.Fragment key={cid}>{renderNode(cid, d + 1)}</React.Fragment>
        ))
      },
      depth,
      surfaceId,
      onAction,
      dataModel: dataModel ?? payload.dataModel,
    }

    return renderer(ctx)
  }

  const rootIds = getChildren(store, ROOT_ID)

  return (
    <div className={ax({ layout: 'stack' })}>
      {rootIds.map((id) => (
        <React.Fragment key={id}>{renderNode(id, 0)}</React.Fragment>
      ))}
    </div>
  )
}
