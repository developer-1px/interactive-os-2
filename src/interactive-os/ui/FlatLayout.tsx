// ② flat-layout-engine-prd.md
import React, { useMemo, useRef, useCallback } from 'react'
import type { NormalizedData } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'
import { getChildren, getEntityData } from '@os/store/createStore'
import type { Plugin } from '@os/engine/types'
import { useAria } from '@os/primitives/useAria'
import type { WidgetRegistry } from '@os/layout/widgetRegistry'
import { resolveWidget } from '@os/layout/widgetRegistry'
import { layout } from '@os/layout/layoutPlugin'
import type { SplitNode, StackNode, BarNode, OverlayNode, WidgetNode, GridNode } from '@os/layout/flatLayout'
import { ax } from '@styles/ax'
import styles from './FlatLayout.module.css'

// ── Types ─────────────────────────────────────────────

interface LayoutRenderContext {
  nodeId: string
  store: NormalizedData
  registry: WidgetRegistry
  renderNode: (nodeId: string) => React.ReactNode
  refCallback: (nodeId: string) => (el: HTMLElement | null) => void
}

// ── OCP renderer map ──────────────────────────────────

const layoutRenderers: Record<string, (ctx: LayoutRenderContext) => React.ReactNode> = {
  split: ({ nodeId, store, renderNode, refCallback }) => {
    const node = getEntityData<SplitNode>(store, nodeId)
    if (!node) return null
    const childIds = getChildren(store, nodeId)
    const isHorizontal = node.direction === 'horizontal'

    return (
      <div ref={refCallback(nodeId)} className={ax({ layout: isHorizontal ? 'row' : 'column', width: 'full' })}>
        {childIds.map((childId, i) => {
          const size = node.sizes[i]
          const isFlex = size === 'flex' || size === undefined
          const style = isFlex
            ? { '--split-flex': '1', '--split-basis': 'auto' } as React.CSSProperties
            : { '--split-flex': '0 0 auto', '--split-basis': `${size * 100}%` } as React.CSSProperties

          return (
            <div key={childId} className={styles.splitPane} style={style}>
              {renderNode(childId)}
            </div>
          )
        })}
      </div>
    )
  },

  stack: ({ nodeId, store, renderNode, refCallback }) => {
    const node = getEntityData<StackNode>(store, nodeId)
    if (!node) return null
    const childIds = getChildren(store, nodeId)

    return (
      <div ref={refCallback(nodeId)} className={ax({ layout: 'column', gap: node.gap ?? 'md', width: 'full' })}>
        {childIds.map((childId) => (
          <React.Fragment key={childId}>{renderNode(childId)}</React.Fragment>
        ))}
      </div>
    )
  },

  grid: ({ nodeId, store, renderNode, refCallback }) => {
    const node = getEntityData<GridNode>(store, nodeId)
    if (!node) return null
    const childIds = getChildren(store, nodeId)
    const layoutValue = `grid-${node.columns}` as 'grid-2' | 'grid-3' | 'grid-4' | 'grid-5' | 'grid-7'

    return (
      <div ref={refCallback(nodeId)} className={ax({ layout: layoutValue, gap: node.gap ?? 'md', width: 'full' })}>
        {childIds.map((childId) => (
          <React.Fragment key={childId}>{renderNode(childId)}</React.Fragment>
        ))}
      </div>
    )
  },

  bar: ({ nodeId, store, renderNode, refCallback }) => {
    const node = getEntityData<BarNode>(store, nodeId)
    if (!node) return null
    const childIds = getChildren(store, nodeId)
    const layout = node.justify === 'between' ? 'spread' as const : 'bar' as const

    return (
      <div ref={refCallback(nodeId)} className={ax({ layout, width: 'full' })}>
        {childIds.map((childId) => (
          <React.Fragment key={childId}>{renderNode(childId)}</React.Fragment>
        ))}
      </div>
    )
  },

  overlay: ({ nodeId, store, renderNode, refCallback }) => {
    const node = getEntityData<OverlayNode>(store, nodeId)
    if (!node || !node.visible) return null
    const childIds = getChildren(store, nodeId)

    const placementMap: Record<string, 'center' | 'anchor-below'> = {
      modal: 'center',
      popup: 'anchor-below',
      hint: 'anchor-below',
    }

    return (
      <div ref={refCallback(nodeId)} className={ax({ placement: placementMap[node.overlayType] ?? 'center' })}>
        {childIds.map((childId) => (
          <React.Fragment key={childId}>{renderNode(childId)}</React.Fragment>
        ))}
      </div>
    )
  },

  widget: ({ nodeId, store, registry, refCallback, renderNode }) => {
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
      ? childIds.map((childId) => <React.Fragment key={childId}>{renderNode(childId)}</React.Fragment>)
      : undefined

    return (
      <div ref={refCallback(nodeId)} className={ax({ width: 'full' })}>
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

  const renderNode = (nodeId: string): React.ReactNode => {
    const entity = store.entities[nodeId]
    if (!entity) return null

    const nodeData = entity.data as Record<string, unknown> | undefined
    const type = nodeData?.type as string | undefined
    if (!type) return null

    const renderer = layoutRenderers[type]
    if (!renderer) return null

    const ctx: LayoutRenderContext = { nodeId, store, registry, renderNode, refCallback }
    return renderer(ctx)
  }

  const rootIds = getChildren(store, ROOT_ID)

  return (
    <div {...aria.containerProps} className={ax({ layout: 'stack', gap: 'md', width: 'full' })}>
      {rootIds.map((id) => (
        <React.Fragment key={id}>{renderNode(id)}</React.Fragment>
      ))}
    </div>
  )
}
