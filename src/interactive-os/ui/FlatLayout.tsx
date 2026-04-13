// ② flat-layout-engine-prd.md  ② flatlayout-resizable-split-prd.md
import React, { useMemo, useRef, useCallback } from 'react'
import type { NormalizedData, PaneSize } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'
import { getChildren, getEntityData } from '@os/store/createStore'
import type { Plugin, Command } from '@os/engine/types'
import { useAria } from '@os/primitives/useAria'
import type { WidgetRegistry } from '@os/layout/widgetRegistry'
import { resolveWidget } from '@os/layout/widgetRegistry'
import { layout } from '@os/layout/layoutPlugin'
import type { SplitNode, StackNode, BarNode, OverlayNode, WidgetNode, GridNode, NavNode, SectionNode, FloatingNode } from '@os/layout/flatLayout'
import { ax } from '@styles/ax'
import styles from './FlatLayout.module.css'
import { NavLayoutContext } from './NavLayoutContext'
import { SplitPane } from './SplitPane'
import { workspaceCommands } from '@os/plugins/workspaceStore'
import { FlatLayoutContext } from './useFlatLayout'

// ── Types ─────────────────────────────────────────────

type LayoutSurface = 'sunken' | 'base' | 'raised' | 'overlay'

interface LayoutRenderContext {
  nodeId: string
  store: NormalizedData
  registry: WidgetRegistry
  surface?: LayoutSurface
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
          className={`${styles.splitPane} ${styles.navContent}`}
          style={{ '--split-flex': '1', '--split-basis': 'auto' } as React.CSSProperties}
        >
          {contentIds[activeIndex] ? renderNode(contentIds[activeIndex], 'nav') : null}
        </div>
      </div>
    </NavLayoutContext.Provider>
  )
}

// ── Tab wrapper ───────────────────────────────────────

function TabLayoutWrapper({ nodeId, store, renderNode, refCallback }: {
  nodeId: string
  store: NormalizedData
  renderNode: (id: string, parentType?: string) => React.ReactNode
  refCallback: (id: string) => (el: HTMLElement | null) => void
}) {
  const childIds = getChildren(store, nodeId)
  const [activeTab, setActiveTab] = React.useState(0)

  return (
    <div ref={refCallback(nodeId)} className={ax({ layout: 'column', width: 'full', gap: 'md' })}>
      <div className={ax({ layout: 'bar', gap: 'xs', surface: 'base', padding: 'xs', shape: 'sm' })}>
        {childIds.map((childId, i) => {
          const data = getEntityData(store, childId)
          const label = (data as Record<string, unknown> | undefined)?.label ?? childId
          return (
            <button
              key={childId}
              className={ax({
                interactive: 'tab',
                recipe: 'item',
                surface: i === activeTab ? 'display' : 'ghost',
                text: i === activeTab ? 'primary' : 'secondary',
                padding: 'sm',
                shape: 'sm',
              })}
              onClick={() => setActiveTab(i)}
            >
              {String(label)}
            </button>
          )
        })}
      </div>
      {childIds[activeTab] ? renderNode(childIds[activeTab], 'tab') : null}
    </div>
  )
}

// ── OCP renderer map ──────────────────────────────────

const layoutRenderers: Record<string, (ctx: LayoutRenderContext) => React.ReactNode> = {
  split: ({ nodeId, store, surface, renderNode, refCallback, dispatch }) => {
    const node = getEntityData<SplitNode>(store, nodeId)
    if (!node) return null
    const childIds = getChildren(store, nodeId)
    const isHorizontal = node.direction === 'horizontal'

    // ② flatlayout-resizable-split-prd.md — resizable: false → 고정 비율
    if (node.resizable === false) {
      return (
        <div ref={refCallback(nodeId)} className={ax({ layout: isHorizontal ? 'row' : 'column', width: 'full', scroll: 'hidden', surface })}>
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
              <div key={childId} className={`${ax({ scroll: 'hidden' })} ${isAuto ? '' : styles.splitPane}`} style={style}>
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
      <div ref={refCallback(nodeId)} className={ax({ flex: '1', layout: 'fill', scroll: 'hidden', surface })}>
        <SplitPane direction={node.direction} sizes={node.sizes} onResize={handleResize}>
          {childIds.map((childId) => renderNode(childId, 'split'))}
        </SplitPane>
      </div>
    )
  },

  stack: ({ nodeId, store, surface, renderNode, refCallback }) => {
    const node = getEntityData<StackNode>(store, nodeId)
    if (!node) return null
    const childIds = getChildren(store, nodeId)

    return (
      <div ref={refCallback(nodeId)} className={ax({ layout: 'stack', gap: node.gap ?? 'md', width: 'full', surface, ...(node.padding ? { padding: node.padding } : {}) })}>
        {childIds.map((childId) => (
          <React.Fragment key={childId}>{renderNode(childId, 'stack')}</React.Fragment>
        ))}
      </div>
    )
  },

  grid: ({ nodeId, store, surface, renderNode, refCallback }) => {
    const node = getEntityData<GridNode>(store, nodeId)
    if (!node) return null
    const childIds = getChildren(store, nodeId)
    const layoutValue = `grid-${node.columns}` as 'grid-2' | 'grid-3' | 'grid-4' | 'grid-5' | 'grid-7'

    return (
      <div ref={refCallback(nodeId)} className={ax({ layout: layoutValue, gap: node.gap ?? 'md', width: 'full', surface })}>
        {childIds.map((childId) => (
          <React.Fragment key={childId}>{renderNode(childId, 'grid')}</React.Fragment>
        ))}
      </div>
    )
  },

  bar: ({ nodeId, store, surface, renderNode, refCallback }) => {
    const node = getEntityData<BarNode>(store, nodeId)
    if (!node) return null
    const childIds = getChildren(store, nodeId)
    const layout = node.justify === 'between' ? 'spread' as const : 'bar' as const

    return (
      <div ref={refCallback(nodeId)} className={ax({ layout, width: 'full', surface, ...(node.gap ? { gap: node.gap } : {}), ...(node.padding ? { padding: node.padding } : {}) })}>
        {childIds.map((childId) => (
          <React.Fragment key={childId}>{renderNode(childId, 'bar')}</React.Fragment>
        ))}
      </div>
    )
  },

  overlay: ({ nodeId, store, surface, renderNode, refCallback }) => {
    const node = getEntityData<OverlayNode>(store, nodeId)
    if (!node || !node.visible) return null
    const childIds = getChildren(store, nodeId)

    const placementMap: Record<string, 'center' | 'anchor-below'> = {
      modal: 'center',
      popup: 'anchor-below',
      hint: 'anchor-below',
    }

    return (
      <div ref={refCallback(nodeId)} className={ax({ placement: placementMap[node.overlayType] ?? 'center', surface })}>
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

  tab: ({ nodeId, store, renderNode, refCallback }) => {
    return <TabLayoutWrapper nodeId={nodeId} store={store} renderNode={renderNode} refCallback={refCallback} />
  },

  section: ({ nodeId, store, surface, renderNode, refCallback }) => {
    const node = getEntityData<SectionNode>(store, nodeId)
    if (!node) return null
    const childIds = getChildren(store, nodeId)

    return (
      <div ref={refCallback(nodeId)} className={ax({ layout: 'column', gap: 'md', width: 'full', surface })}>
        <div className={ax({ layout: 'spread', width: 'full', padding: 'sm' })}>
          <span className={ax({ textStyle: 'section', text: 'primary' })}>{node.title}</span>
          {node.count != null && (
            <span className={ax({ textStyle: 'caption', text: 'muted' })}>{node.count}</span>
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
        <div className={ax({ surface: 'sunken', padding: 'sm', textStyle: 'caption', text: 'muted' })}>
          Unknown widget: {node.widget}
        </div>
      )
    }

    const childIds = getChildren(store, nodeId)
    const children = childIds.length > 0
      ? childIds.map((childId) => <React.Fragment key={childId}>{renderNode(childId, 'widget')}</React.Fragment>)
      : undefined

    const isSplitChild = parentType === 'split' || parentType === 'nav'
    const fillSlot = isSplitChild || parentType === 'tab'

    return (
      <div ref={refCallback(nodeId)} className={`${ax({ width: 'full', scroll: 'hidden', ...(fillSlot ? { flex: '1', layout: 'fill' } : {}) })} ${isSplitChild ? styles.splitChild : ''} min-h-0`}>
        <Component {...(node.props ?? {})} source={node.source}>{children}</Component>
      </div>
    )
  },
}

// ── FlatLayout component ──────────────────────────────

interface FlatLayoutProps {
  data: NormalizedData
  registry: WidgetRegistry
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  'aria-label'?: string
}

export function FlatLayout({ data, registry, plugins: extraPlugins, onChange, 'aria-label': ariaLabel }: FlatLayoutProps) {
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
  const layoutCtx = useMemo(() => ({ store, dispatch: aria.dispatch }), [store, aria.dispatch])

  const renderNode = (nodeId: string, parentType?: string): React.ReactNode => {
    const entity = store.entities[nodeId]
    if (!entity) return null

    const nodeData = entity.data as Record<string, unknown> | undefined
    const type = nodeData?.type as string | undefined
    if (!type) return null
    if (nodeData?.hidden) return null

    const renderer = layoutRenderers[type]
    if (!renderer) return null

    const surface = nodeData?.surface as LayoutSurface | undefined
    const ctx: LayoutRenderContext = { nodeId, store, registry, surface, parentType, renderNode, refCallback, dispatch: aria.dispatch }
    return renderer(ctx)
  }

  const rootIds = getChildren(store, ROOT_ID)

  // root 노드 타입으로 app/document 모드 자동 파생
  const firstRootId = rootIds[0]
  const firstRootData = firstRootId ? store.entities[firstRootId]?.data as Record<string, unknown> | undefined : undefined
  const rootType = firstRootData?.type as string | undefined
  const isAppMode = rootType === 'split' || rootType === 'nav' || rootType === 'tab'

  return (
    <FlatLayoutContext.Provider value={layoutCtx}>
      <div {...aria.containerProps} className={ax(isAppMode
        ? { layout: 'fill', width: 'full', scroll: 'hidden' }
        : { layout: 'scroll', width: 'full', flex: '1' }
      )}>
        {rootIds.map((id) => (
          <React.Fragment key={id}>{renderNode(id)}</React.Fragment>
        ))}
      </div>
    </FlatLayoutContext.Provider>
  )
}
