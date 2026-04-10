// ② flat-layout-engine-prd.md
import React, { useMemo } from 'react'
import type { NormalizedData } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'
import { getChildren, getEntityData } from '@os/store/createStore'
import { useEngine } from '@os/engine/useEngine'
import type { Plugin } from '@os/engine/types'
import type { WidgetRegistry } from '@os/layout/widgetRegistry'
import { resolveWidget } from '@os/layout/widgetRegistry'
import { layout } from '@os/layout/layoutPlugin'
import type { SplitNode, StackNode, OverlayNode, WidgetNode } from '@os/layout/flatLayout'
import { ax } from '@styles/ax'
import styles from './FlatLayout.module.css'

// ── Types ─────────────────────────────────────────────

interface LayoutRenderContext {
  nodeId: string
  store: NormalizedData
  registry: WidgetRegistry
  renderNode: (nodeId: string) => React.ReactNode
}

// ── OCP renderer map ──────────────────────────────────

const layoutRenderers: Record<string, (ctx: LayoutRenderContext) => React.ReactNode> = {
  split: ({ nodeId, store, renderNode }) => {
    const node = getEntityData<SplitNode>(store, nodeId)
    if (!node) return null
    const childIds = getChildren(store, nodeId)
    const isHorizontal = node.direction === 'horizontal'

    return (
      <div className={ax({ layout: isHorizontal ? 'row' : 'column', width: 'full' })}>
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

  stack: ({ nodeId, store, renderNode }) => {
    const node = getEntityData<StackNode>(store, nodeId)
    if (!node) return null
    const childIds = getChildren(store, nodeId)

    return (
      <div className={ax({ layout: 'column', gap: node.gap ?? 'md', width: 'full' })}>
        {childIds.map((childId) => (
          <React.Fragment key={childId}>{renderNode(childId)}</React.Fragment>
        ))}
      </div>
    )
  },

  overlay: ({ nodeId, store, renderNode }) => {
    const node = getEntityData<OverlayNode>(store, nodeId)
    if (!node || !node.visible) return null
    const childIds = getChildren(store, nodeId)

    const placementMap: Record<string, 'center' | 'anchor-below'> = {
      modal: 'center',
      popup: 'anchor-below',
      hint: 'anchor-below',
    }

    return (
      <div className={ax({ placement: placementMap[node.overlayType] ?? 'center' })}>
        {childIds.map((childId) => (
          <React.Fragment key={childId}>{renderNode(childId)}</React.Fragment>
        ))}
      </div>
    )
  },

  widget: ({ nodeId, store, registry }) => {
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

    return (
      <div className={ax({ width: 'full' })}>
        <Component {...(node.props ?? {})} source={node.source} />
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
}

export function FlatLayout({ data, registry, plugins: extraPlugins, onChange }: FlatLayoutProps) {
  const allPlugins = useMemo(
    () => [layout(), ...(extraPlugins ?? [])],
    [extraPlugins],
  )

  const { store } = useEngine({ data, plugins: allPlugins, onChange })

  const renderNode = (nodeId: string): React.ReactNode => {
    const entity = store.entities[nodeId]
    if (!entity) return null

    const nodeData = entity.data as Record<string, unknown> | undefined
    const type = nodeData?.type as string | undefined
    if (!type) return null

    const renderer = layoutRenderers[type]
    if (!renderer) return null

    const ctx: LayoutRenderContext = { nodeId, store, registry, renderNode }
    return renderer(ctx)
  }

  const rootIds = getChildren(store, ROOT_ID)

  return (
    <div className={ax({ layout: 'stack', gap: 'md', width: 'full' })}>
      {rootIds.map((id) => (
        <React.Fragment key={id}>{renderNode(id)}</React.Fragment>
      ))}
    </div>
  )
}
