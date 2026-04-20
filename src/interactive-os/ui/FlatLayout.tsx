// ② flat-layout-engine-prd.md  ② inspectorDefinePagePanelPrd.md
// Renderer·policy는 @os/layout/nodes/* 로 분산 co-locate — 이 파일은 FlatLayout 컴포넌트 본체만.
import React, { useId, useEffect, useMemo, useRef, useCallback } from 'react'
import type { NormalizedData } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'
import { getChildren } from '@os/store/createStore'
import type { Plugin } from '@os/engine/types'
import { useAria } from '@os/primitives/useAria'
import { registerFlatLayout, unregisterFlatLayout } from '@os/primitives/flatLayoutRegistry'
import type { WidgetRegistry } from '@os/layout/widgetRegistry'
import { layout } from '@os/layout/layoutPlugin'
import { getLayoutNode, type LayoutRenderContext } from '@os/layout/defineLayoutNode'
import '@os/layout/nodes'
import { ax } from '@styles/ax'
import { FlatLayoutContext } from './useFlatLayout'

interface FlatLayoutProps {
  /** ② inspectorDefinePagePanelPrd.md — 레지스트리 key. 미지정 시 useId()로 자동 생성 */
  id?: string
  data: NormalizedData
  registry: WidgetRegistry
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  'aria-label'?: string
  /** FlatLayoutContext 안에서 mount되는 부작용 전용 자식 (예: 전역 단축키). DOM에 렌더되지 않는 부분만 사용. */
  children?: React.ReactNode
}

export function FlatLayout({ id: propId, data, registry, plugins: extraPlugins, onChange, 'aria-label': ariaLabel, children }: FlatLayoutProps) {
  const fallbackId = useId()
  const instanceId = propId ?? fallbackId
  const listenersRef = useRef(new Set<() => void>())

  const allPlugins = useMemo(
    () => [layout(), ...(extraPlugins ?? [])],
    [extraPlugins],
  )

  const nodeElMap = useRef(new Map<string, HTMLElement>())
  const getNodeElement = useCallback((nodeId: string) => nodeElMap.current.get(nodeId) ?? null, [])
  const refCallback = useCallback((nodeId: string) => (el: HTMLElement | null) => {
    if (el) nodeElMap.current.set(nodeId, el)
    else nodeElMap.current.delete(nodeId)
  }, [])

  const aria = useAria({
    data,
    plugins: allPlugins,
    onChange,
    autoFocus: false,
    'aria-label': ariaLabel,
    getNodeElement,
  })

  const store = aria.getStore()
  const layoutCtx = useMemo(() => ({ store, dispatch: aria.dispatch, getNodeElement }), [store, aria.dispatch, getNodeElement])

  useEffect(() => { listenersRef.current.forEach(fn => fn()) }, [store])

  useEffect(() => {
    registerFlatLayout(instanceId, {
      getStore: () => store,
      dispatch: aria.dispatch,
      getNodeElement,
      subscribe: (fn) => {
        listenersRef.current.add(fn)
        return () => { listenersRef.current.delete(fn) }
      },
    })
    return () => unregisterFlatLayout(instanceId)
  }, [instanceId, store, aria.dispatch, getNodeElement])

  const renderNode = (nodeId: string, parentType?: string): React.ReactNode => {
    const entity = store.entities[nodeId]
    if (!entity) return null

    const nodeData = entity.data as Record<string, unknown> | undefined
    const type = nodeData?.type as string | undefined
    if (!type) return null
    if (nodeData?.hidden) return null

    const desc = getLayoutNode(type)
    if (!desc?.render) return null

    const ctx: LayoutRenderContext = { nodeId, store, registry, parentType, renderNode, refCallback, dispatch: aria.dispatch }
    return desc.render(ctx)
  }

  const rootIds = getChildren(store, ROOT_ID)

  const firstRootId = rootIds[0]
  const firstRootData = firstRootId ? store.entities[firstRootId]?.data as Record<string, unknown> | undefined : undefined
  const rootType = firstRootData?.type as string | undefined
  const isAppMode = getLayoutNode(rootType)?.isAppRoot ?? false

  return (
    <FlatLayoutContext.Provider value={layoutCtx}>
      {/* 앱 모드: fill로 부모(page-content .ly-scroll)의 flex-column 안에서 viewport 높이에 캡.
          clip으로 두면 flex/height 제약이 없어 내부 overflow가 조용히 숨겨지고 pane-level scroll 체인이 끊긴다. */}
      <div {...aria.containerProps} className={ax(isAppMode
        ? { layout: 'fill', width: 'full' }
        : { layout: 'scroll', width: 'full', flex: '1' }
      )}>
        {rootIds.map((id) => (
          <React.Fragment key={id}>{renderNode(id)}</React.Fragment>
        ))}
        {children}
      </div>
    </FlatLayoutContext.Provider>
  )
}
