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
import { ax, type Axes } from '@styles/ax'
import styles from './FlatLayout.module.css'
import { NavLayoutContext } from './NavLayoutContext'
import { SplitPane } from './SplitPane'
import { workspaceCommands } from '@os/plugins/workspaceStore'
import { FlatLayoutContext } from './useFlatLayout'
import { ViewerTabList } from './ViewerTabList'
import { Button } from './Button'

// ── Surface context ───────────────────────────────────
// ② cmux-layout-prd.md — tab 노드 아래 widget이 surrounding tab data를 pull

export interface FlatLayoutSurfaceCtx {
  tabNodeId: string
  tabData: TabNode
}

const FlatLayoutSurfaceContext = React.createContext<FlatLayoutSurfaceCtx | null>(null)

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
    if (node.resizable === false) {
      return (
        <div ref={refCallback(nodeId)} className={ax({ layout: isHorizontal ? 'row' : 'stack', width: 'full', flex: '1', ...(padding ? { padding } : {}) })}>
          {childIds.map((childId, i) => {
            const size = node.sizes[i]
            const isFlex = size === 'flex' || size === undefined
            const isAuto = size === 'auto'
            const style = isFlex
              ? { '--split-flex': '1', '--split-basis': 'auto' } as React.CSSProperties
              : isAuto
                ? { '--split-flex': '0 0 auto', '--split-basis': 'auto' } as React.CSSProperties
                : { '--split-flex': '0 0 auto', '--split-basis': `${size * 100}%` } as React.CSSProperties

            return (
              <div key={childId} className={`${ax({ })} ${isAuto ? '' : styles.splitPane}`} style={style}>
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

    return (
      <div ref={refCallback(nodeId)} className={ax({ layout: 'stack', width: 'full', flex: '1', ...(gap ? { gap } : {}), ...(padding ? { padding } : {}) })}>
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
    const layout = node.justify === 'between' ? 'spread' as const : 'bar' as const
    const preset = resolveContainerPreset('bar')
    const gap = node.gap ?? preset.gap
    const padding = node.padding ?? preset.padding

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
    const pl = (node.placement ?? defaultPlacement[node.overlayType] ?? 'center') as Axes['placement']

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
    // activeTabId가 런타임에 바뀌면 내부 ViewerTabList의 focus/selection이 따라가야
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
            <ViewerTabList
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
            surface: 'sunken', textStyle: 'caption',  })}>
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

    return (
      <div ref={refCallback(nodeId)} className={`${ax({ width: 'full', ...(fillSlot ? { layout: 'fill' } : { scroll: 'hidden' }), ...(padding ? { padding } : {}) })} ${isSplitChild ? styles.splitChild : ''}`}>
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
      <div {...aria.containerProps} className={ax(isAppMode
        ? { layout: 'fill', width: 'full', scroll: 'hidden' }
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
