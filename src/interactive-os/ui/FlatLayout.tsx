// ② flat-layout-engine-prd.md  ② flatlayout-resizable-split-prd.md  ② cmux-layout-prd.md  ② inspectorDefinePagePanelPrd.md
import React, { useId, useEffect, useMemo, useRef, useCallback } from 'react'
import type { NormalizedData, PaneSize } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'
import { getChildren, getEntityData } from '@os/store/createStore'
import type { Plugin, Command } from '@os/engine/types'
import { useAria } from '@os/primitives/useAria'
import { registerFlatLayout, unregisterFlatLayout } from '@os/primitives/flatLayoutRegistry'
import type { WidgetRegistry } from '@os/layout/widgetRegistry'
import { resolveWidget } from '@os/layout/widgetRegistry'
import { layout } from '@os/layout/layoutPlugin'
import type { SplitNode, StackNode, BarNode, OverlayNode, WidgetNode, GridNode, NavNode, SectionNode, FloatingNode, TabgroupNode, TabNode } from '@os/layout/flatLayout'
import { resolveContainerPreset } from '@os/layout/containerPreset'
import { layoutCommands, FOCUS_STATE_ID, type FocusStateData } from '@os/layout/layoutCommands'
import { ax, type AxPlacement } from '@styles/ax'
import styles from './FlatLayout.module.css'
import { NavLayoutContext } from './NavLayoutContext'
import { SplitPane } from './SplitPane'
import { workspaceCommands } from '@os/plugins/workspaceStore'
import { FlatLayoutContext } from './useFlatLayout'
import { WorkspaceTabList } from './WorkspaceTabList'
import { Button } from './Button'

// ── Surface context ───────────────────────────────────
// ② cmux-layout-prd.md — tab 노드 아래 widget이 surrounding tab data를 pull

export interface FlatLayoutSurfaceCtx {
  tabNodeId: string
  tabData: TabNode
}

const FlatLayoutSurfaceContext = React.createContext<FlatLayoutSurfaceCtx | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export const useFlatLayoutSurface = (): FlatLayoutSurfaceCtx | null =>
  React.useContext(FlatLayoutSurfaceContext)

// ── Types ─────────────────────────────────────────────

interface LayoutRenderContext {
  nodeId: string
  store: NormalizedData
  registry: WidgetRegistry
  parentType?: string
  renderNode: (nodeId: string, parentType?: string) => React.ReactNode
  refCallback: (nodeId: string) => (el: HTMLElement | null) => void
  dispatch: (command: Command) => void
}

// ── Nav wrapper ───────────────────────────────────────

function NavLayoutWrapper({ nodeId, navId, contentIds, sidebarWidth, renderNode, refCallback }: {
  nodeId: string
  navId: string
  contentIds: string[]
  sidebarWidth: number
  renderNode: (id: string, parentType?: string) => React.ReactNode
  refCallback: (id: string) => (el: HTMLElement | null) => void
}) {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const ctx = useMemo(() => ({ activeIndex, setActiveIndex }), [activeIndex])

  return (
    <NavLayoutContext.Provider value={ctx}>
      <div ref={refCallback(nodeId)} className={`${ax({ layout: 'row', width: 'full' })} ${styles.navRoot}`}>
        <div
          className={`${styles.splitPane} ${styles.navSidebar}`}
          style={{ '--split-flex': '0 0 auto', '--split-basis': `${sidebarWidth * 100}%` } as React.CSSProperties}
        >
          {renderNode(navId, 'nav')}
        </div>
        <div
          className={`${styles.splitPane} ${styles.navContent} ${ax({ })}`}
          style={{ '--split-flex': '1', '--split-basis': 'auto' } as React.CSSProperties}
        >
          {contentIds[activeIndex] ? renderNode(contentIds[activeIndex], 'nav') : null}
        </div>
      </div>
    </NavLayoutContext.Provider>
  )
}

// ── Scroll axis ───────────────────────────────────────
// defineLayout의 LayoutBase.scroll 필드가 SSOT.
// 'y' → layout:'scroll' (column flex + overflow-y:auto)
// 'x' → layout:'scroll-x' (row flex + overflow-x:auto)
// 미지정 → fallback (노드 타입별 기본 layout 유지)
// pages·widget·module.css에서 overflow 직접 선언 금지.

type ScrollField = 'y' | 'x' | undefined
type AxLayoutCore = 'row' | 'center' | 'bar' | 'spread' | 'stack' | 'scroll' | 'scroll-x' | 'clip' | 'fill' | 'row-fill' | 'wrap' | 'grid-2' | 'grid-3' | 'grid-4' | 'grid-5' | 'grid-7' | 'table'

function resolveScrollLayout<T extends AxLayoutCore>(scroll: ScrollField, fallback: T): T | 'scroll' | 'scroll-x' {
  if (scroll === 'y') return 'scroll'
  if (scroll === 'x') return 'scroll-x'
  return fallback
}

// ── OCP renderer map ──────────────────────────────────

const layoutRenderers: Record<string, (ctx: LayoutRenderContext) => React.ReactNode> = {
  split: ({ nodeId, store, parentType, renderNode, refCallback, dispatch }) => {
    const node = getEntityData<SplitNode>(store, nodeId)
    if (!node) return null
    const childIds = getChildren(store, nodeId)
    const isHorizontal = node.direction === 'horizontal'

    // Container preset — root split만 바깥 padding 소유
    const preset = resolveContainerPreset('split', parentType ? 'nested' : 'root')
    const padding = node.padding ?? preset.padding

    // ② flatlayout-resizable-split-prd.md — resizable: false → 고정 비율
    // layout: 'fill'/'row-fill'을 써서 overflow:hidden + flex:1 + min-0으로 자식 panes를
    // 정확히 부모 높이에 캡. 'stack'/'row'로 두면 .splitPane의 height:100%가 auto-parent에서
    // 못 풀려 content natural height로 팽창 → 내부 scroll 체인 끊김.
    if (node.resizable === false) {
      return (
        <div ref={refCallback(nodeId)} className={ax({ layout: isHorizontal ? 'row-fill' : 'fill', width: 'full', ...(padding ? { padding } : {}) })}>
          {childIds.map((childId, i) => {
            const size = node.sizes[i]
            const isFlex = size === 'flex' || size === undefined
            const isAuto = size === 'auto'
            // pane 자체가 flex container여야 자식(widget/nested split)의 flex:1이
            // 부모 높이에 캡된다. layout:'stack' (flex-column) + inline flex로 sizing.
            const style: React.CSSProperties = isFlex
              ? { flex: 1, flexBasis: 'auto', minWidth: 0, minHeight: 0 }
              : isAuto
                ? { flex: '0 0 auto', flexBasis: 'auto', minWidth: 0, minHeight: 0 }
                : { flex: '0 0 auto', flexBasis: `${size * 100}%`, minWidth: 0, minHeight: 0 }

            return (
              <div key={childId} className={ax({ layout: 'stack' })} style={style}>
                {renderNode(childId, 'split')}
              </div>
            )
          })}
        </div>
      )
    }

    // resizable: true (기본) → SplitPane 위임
    const handleResize = (newSizes: PaneSize[]) => {
      dispatch(workspaceCommands.resize(nodeId, newSizes))
    }

    return (
      <div ref={refCallback(nodeId)} className={ax({ flex: '1', layout: 'fill', ...(padding ? { padding } : {}) })}>
        <SplitPane direction={node.direction} sizes={node.sizes} onResize={handleResize}>
          {childIds.map((childId) => renderNode(childId, 'split'))}
        </SplitPane>
      </div>
    )
  },

  stack: ({ nodeId, store, renderNode, refCallback }) => {
    const node = getEntityData<StackNode>(store, nodeId)
    if (!node) return null
    const childIds = getChildren(store, nodeId)
    const preset = resolveContainerPreset('stack')
    const gap = node.gap ?? preset.gap
    const padding = node.padding ?? preset.padding
    const layout = resolveScrollLayout(node.scroll, 'stack')

    return (
      <div ref={refCallback(nodeId)} className={ax({ layout, width: 'full', flex: '1', ...(gap ? { gap } : {}), ...(padding ? { padding } : {}) })}>
        {childIds.map((childId) => (
          <React.Fragment key={childId}>{renderNode(childId, 'stack')}</React.Fragment>
        ))}
      </div>
    )
  },

  grid: ({ nodeId, store, renderNode, refCallback }) => {
    const node = getEntityData<GridNode>(store, nodeId)
    if (!node) return null
    const childIds = getChildren(store, nodeId)
    const layoutValue = `grid-${node.columns}` as 'grid-2' | 'grid-3' | 'grid-4' | 'grid-5' | 'grid-7'
    const preset = resolveContainerPreset('grid')
    const gap = node.gap ?? preset.gap

    return (
      <div ref={refCallback(nodeId)} className={ax({ layout: layoutValue, width: 'full', ...(gap ? { gap } : {}) })}>
        {childIds.map((childId) => (
          <React.Fragment key={childId}>{renderNode(childId, 'grid')}</React.Fragment>
        ))}
      </div>
    )
  },

  bar: ({ nodeId, store, renderNode, refCallback }) => {
    const node = getEntityData<BarNode>(store, nodeId)
    if (!node) return null
    const childIds = getChildren(store, nodeId)
    const base = node.justify === 'between' ? 'spread' as const : 'bar' as const
    const preset = resolveContainerPreset('bar')
    const gap = node.gap ?? preset.gap
    const padding = node.padding ?? preset.padding
    const layout = resolveScrollLayout(node.scroll, base)

    return (
      <div ref={refCallback(nodeId)} className={ax({ layout, width: 'full', ...(gap ? { gap } : {}), ...(padding ? { padding } : {}) })}>
        {childIds.map((childId) => (
          <React.Fragment key={childId}>{renderNode(childId, 'bar')}</React.Fragment>
        ))}
      </div>
    )
  },

  overlay: ({ nodeId, store, renderNode, refCallback }) => {
    const node = getEntityData<OverlayNode>(store, nodeId)
    if (!node || !node.visible) return null
    const childIds = getChildren(store, nodeId)

    const defaultPlacement: Record<string, string> = {
      modal: 'center',
      popup: 'anchor-below',
      hint: 'anchor-below',
    }
    const pl = (node.placement ?? defaultPlacement[node.overlayType] ?? 'center') as AxPlacement

    return (
      <div ref={refCallback(nodeId)} className={ax({ placement: pl })}>
        {childIds.map((childId) => (
          <React.Fragment key={childId}>{renderNode(childId, 'overlay')}</React.Fragment>
        ))}
      </div>
    )
  },

  nav: ({ nodeId, store, renderNode, refCallback }) => {
    const node = getEntityData<NavNode>(store, nodeId)
    if (!node) return null
    const childIds = getChildren(store, nodeId)
    if (childIds.length === 0) return null

    const navId = childIds[0]
    const contentIds = childIds.slice(1)
    const sidebarWidth = node.sidebarWidth ?? 0.2

    return (
      <NavLayoutWrapper
        nodeId={nodeId}
        navId={navId}
        contentIds={contentIds}
        sidebarWidth={sidebarWidth}
        renderNode={renderNode}
        refCallback={refCallback}
      />
    )
  },

  tabgroup: ({ nodeId, store, renderNode, refCallback, dispatch }) => {
    const node = getEntityData<TabgroupNode>(store, nodeId)
    if (!node) return null
    const childIds = getChildren(store, nodeId)
    if (childIds.length === 0) return null
    const activeTabId = node.activeTabId && childIds.includes(node.activeTabId)
      ? node.activeTabId
      : childIds[0]!

    // 현재 __focus된 tabgroup인지 판별 — CSS가 outline 표시에 사용.
    const focusState = getEntityData<FocusStateData>(store, FOCUS_STATE_ID)
    const isFocused = focusState?.focusedTabgroupId === nodeId

    // ② cmux-layout-prd — external focus sync.
    // useAria는 data.entities[FOCUS_ID]가 있을 때만 external focus 변경을 전파한다.
    // activeTabId가 런타임에 바뀌면 내부 WorkspaceTabList의 focus/selection이 따라가야
    // aria-selected가 재그려진다 (⌘T, ⌘⇧] 등).
    const tabBarStore: NormalizedData = {
      entities: {
        ...Object.fromEntries(
          childIds.map(id => [id, { id, data: getEntityData(store, id) }])
        ),
        __focus__: { id: '__focus__', focusedId: activeTabId } as unknown as NormalizedData['entities'][string],
      },
      relationships: { [ROOT_ID]: childIds },
    }

    return (
      <div
        ref={refCallback(nodeId)}
        className={`${ax({ layout: 'stack', width: 'full', flex: '1' })} ${styles.tabgroupRoot}`}
        data-tabgroup-focused={isFocused || undefined}
        onPointerDownCapture={() => dispatch(layoutCommands.setFocus(nodeId, activeTabId))}
      >
        <div className={ax({ layout: 'bar', width: 'full' })}>
          <div className={ax({ flex: '1' })}>
            <WorkspaceTabList
              data={tabBarStore}
              initialFocus={activeTabId}
              onActivate={(tabId) => {
                dispatch(workspaceCommands.setActiveTab(nodeId, tabId))
                dispatch(layoutCommands.setFocus(nodeId, tabId))
              }}
              aria-label={`Tabgroup ${nodeId}`}
            />
          </div>
          <Button
            icon
            aria-label="New tab"
            onClick={() => {
              // active tab을 복제 — splitHere와 동일 규약.
              // tab이 하나도 없으면 no-op (addTab이 target paneId 필요).
              const src = getEntityData<TabNode>(store, activeTabId)
              if (!src) return
              const newId = `t-${Date.now().toString(36)}`
              dispatch(workspaceCommands.addTab(nodeId, {
                id: newId,
                data: {
                  type: 'tab',
                  label: src.label,
                  contentType: src.contentType,
                  contentRef: src.contentRef,
                },
              }))
              dispatch(workspaceCommands.setActiveTab(nodeId, newId))
            }}
          >+</Button>
        </div>
        {renderNode(activeTabId, 'tabgroup')}
      </div>
    )
  },

  tab: ({ nodeId, store, renderNode, refCallback }) => {
    const tabData = getEntityData<TabNode>(store, nodeId)
    const childIds = getChildren(store, nodeId)
    if (!tabData || childIds.length === 0) return null
    return (
      <FlatLayoutSurfaceContext.Provider value={{ tabNodeId: nodeId, tabData }}>
        <div ref={refCallback(nodeId)} className={ax({ layout: 'fill', flex: '1' })}>
          {renderNode(childIds[0]!, 'tab')}
        </div>
      </FlatLayoutSurfaceContext.Provider>
    )
  },

  section: ({ nodeId, store, renderNode, refCallback }) => {
    const node = getEntityData<SectionNode>(store, nodeId)
    if (!node) return null
    const childIds = getChildren(store, nodeId)

    return (
      <div ref={refCallback(nodeId)} className={ax({ layout: 'stack', width: 'full' })}>
        <div className={ax({ layout: 'spread', width: 'full' })}>
          <span className={ax({ textStyle: 'section',  })}>{node.title}</span>
          {node.count != null && (
            <span className={ax({ textStyle: 'caption',  })}>{node.count}</span>
          )}
        </div>
        {childIds.map(childId => (
          <React.Fragment key={childId}>{renderNode(childId, 'section')}</React.Fragment>
        ))}
      </div>
    )
  },

  floating: ({ nodeId, store, renderNode, refCallback }) => {
    const node = getEntityData<FloatingNode>(store, nodeId)
    if (!node || node.hidden) return null
    const childIds = getChildren(store, nodeId)

    return (
      <div ref={refCallback(nodeId)} className={ax({ placement: node.anchor })}>
        {childIds.map((childId) => (
          <React.Fragment key={childId}>{renderNode(childId, 'floating')}</React.Fragment>
        ))}
      </div>
    )
  },

  widget: ({ nodeId, store, parentType, registry, refCallback, renderNode }) => {
    const node = getEntityData<WidgetNode>(store, nodeId)
    if (!node) return null
    const Component = resolveWidget(registry, node.widget)

    if (!Component) {
      return (
        <div className={ax({
            role: 'control-group',
            surface: 'sunken' })}>
          Unknown widget: {node.widget}
        </div>
      )
    }

    const childIds = getChildren(store, nodeId)
    const children = childIds.length > 0
      ? childIds.map((childId) => <React.Fragment key={childId}>{renderNode(childId, 'widget')}</React.Fragment>)
      : undefined

    const isSplitChild = parentType === 'split' || parentType === 'nav'
    const fillSlot = isSplitChild || parentType === 'tab' || (node as Record<string, unknown>).fill

    const widgetPreset = resolveContainerPreset('widget')
    const padding = node.padding ?? widgetPreset.padding

    // scroll 필드가 1순위. 그 다음 fillSlot. 그 외는 clip (사일런트 overflow 차단).
    const layout = node.scroll === 'y' ? 'scroll' as const
                 : node.scroll === 'x' ? 'scroll-x' as const
                 : fillSlot ? 'fill' as const
                 : 'clip' as const

    return (
      <div ref={refCallback(nodeId)} className={`${ax({ width: 'full', layout, ...(padding ? { padding } : {}) })} ${isSplitChild ? styles.splitChild : ''}`}>
        <Component {...(node.props ?? {})} source={node.source}>{children}</Component>
      </div>
    )
  },
}

// ── FlatLayout component ──────────────────────────────

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

  // ② inspectorDefinePagePanelPrd.md — store 변경 시 레지스트리 구독자에게 전파
  useEffect(() => { listenersRef.current.forEach(fn => fn()) }, [store])

  // ② inspectorDefinePagePanelPrd.md — FlatLayout 인스턴스 레지스트리 등록
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

    const renderer = layoutRenderers[type]
    if (!renderer) return null

    const ctx: LayoutRenderContext = { nodeId, store, registry, parentType, renderNode, refCallback, dispatch: aria.dispatch }
    return renderer(ctx)
  }

  const rootIds = getChildren(store, ROOT_ID)

  // root 노드 타입으로 app/document 모드 자동 파생
  const firstRootId = rootIds[0]
  const firstRootData = firstRootId ? store.entities[firstRootId]?.data as Record<string, unknown> | undefined : undefined
  const rootType = firstRootData?.type as string | undefined
  const isAppMode = rootType === 'split' || rootType === 'nav' || rootType === 'tab' || rootType === 'tabgroup'

  return (
    <FlatLayoutContext.Provider value={layoutCtx}>
      {/* 앱 모드: fill로 부모(page-content .ly-scroll)의 flex-column 안에서 viewport 높이에 캡.
          내부 split/widget이 그 안에서 배분·scroll 관리. clip으로 두면 flex/height 제약이 없어
          내부 overflow가 조용히 숨겨지고 pane-level scroll 체인이 끊긴다. */}
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
