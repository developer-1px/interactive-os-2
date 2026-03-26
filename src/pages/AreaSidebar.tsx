// ② 2026-03-26-unified-navigation-prd.md
import { useCallback, useMemo } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { TreeView } from '../interactive-os/ui/TreeView'
import type { TreeItemRenderProps } from '../interactive-os/ui/TreeView'
import { FOCUS_ID } from '../interactive-os/plugins/core'
import { createStore } from '../interactive-os/store/createStore'
import { ROOT_ID } from '../interactive-os/store/types'
import type { NormalizedData } from '../interactive-os/store/types'
import type { NodeState } from '../interactive-os/pattern/types'

// --- Load _meta.yaml for a specific layer ---

const metaModules = import.meta.glob<{ default: string }>('/contents/**/_meta.yaml', {
  query: '?raw',
  eager: true,
})

const mdModules = import.meta.glob('/contents/**/*.md', { query: '?raw' })

interface LayerMeta {
  label: string
  order: string[]
}

function parseLayerMeta(raw: string): LayerMeta {
  const result: LayerMeta = { label: '', order: [] }
  let inOrder = false

  for (const line of raw.split('\n')) {
    const labelMatch = line.match(/^label:\s*(.+)/)
    if (labelMatch) {
      result.label = labelMatch[1].trim()
      inOrder = false
      continue
    }
    if (line.match(/^order:\s*$/)) {
      inOrder = true
      continue
    }
    if (inOrder) {
      const itemMatch = line.match(/^\s+-\s+(.+)/)
      if (itemMatch) {
        result.order.push(itemMatch[1].trim())
      } else if (!line.match(/^\s*$/)) {
        inOrder = false
      }
    }
  }
  return result
}

function getLayerItems(layer: string): { label: string; items: string[] } {
  const metaKey = `/contents/${layer}/_meta.yaml`
  const metaMod = metaModules[metaKey]

  // Collect actual MD files for this layer
  const prefix = `/contents/${layer}/`
  const mdNames = Object.keys(mdModules)
    .filter((k) => k.startsWith(prefix) && k.split('/').length === 4) // only direct children
    .map((k) => k.slice(prefix.length).replace(/\.md$/, ''))

  if (!metaMod) {
    return { label: layer, items: mdNames.sort() }
  }

  const meta = parseLayerMeta(metaMod.default)
  // Order: meta order first, then remaining alphabetically
  const ordered = [...meta.order.filter((n) => mdNames.includes(n))]
  for (const n of mdNames.sort()) {
    if (!ordered.includes(n)) ordered.push(n)
  }

  return { label: meta.label || layer, items: ordered }
}

function buildLayerTree(layer: string): { data: NormalizedData; label: string } | null {
  const { label, items } = getLayerItems(layer)
  if (items.length === 0) return null

  const entities: Record<string, { id: string; data: Record<string, unknown> }> = {}
  const ids: string[] = []

  for (const name of items) {
    const id = `${layer}/${name}`
    entities[id] = { id, data: { name } }
    ids.push(id)
  }

  return {
    label,
    data: createStore({ entities, relationships: { [ROOT_ID]: ids } }),
  }
}

// --- AreaSidebar component ---

export function AreaSidebar({ layer }: { layer: string }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const currentPath = pathname.replace(/^\/internals\/?/, '') || 'overview'

  const tree = useMemo(() => buildLayerTree(layer), [layer])

  const sidebarData = useMemo(() => {
    if (!tree) return null
    const { data } = tree

    // Sync focus to current path
    if (data.entities[currentPath]) {
      return {
        ...data,
        entities: {
          ...data.entities,
          [FOCUS_ID]: { id: FOCUS_ID, focusedId: currentPath },
        },
      } as NormalizedData
    }
    return data
  }, [tree, currentPath])

  const handleActivate = useCallback((nodeId: string) => {
    navigate(`/internals/${nodeId}`)
  }, [navigate])

  const renderItem = useCallback((_props: TreeItemRenderProps, node: Record<string, unknown>, state: NodeState) => {
    const hasChildren = state.expanded !== undefined
    return (
      <span className="inline-flex items-center gap-sm">
        <span className="item-chevron item-chevron--tree">
          {hasChildren ? (state.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : ''}
        </span>
        <span>{(node.data as Record<string, unknown>)?.name as string}</span>
      </span>
    )
  }, [])

  if (!sidebarData) {
    // No L3 items for this layer — no sidebar
    return (
      <nav className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-mark" />
            <h1>interactive-os</h1>
          </div>
          <span className="version">v0.1.0</span>
        </div>
      </nav>
    )
  }

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-mark" />
          <h1>interactive-os</h1>
        </div>
        <span className="version">v0.1.0</span>
      </div>
      <div className="sidebar-section-title">{tree!.label}</div>
      <TreeView
        data={sidebarData}
        followFocus
        onActivate={handleActivate}
        renderItem={renderItem}
        aria-label={`${tree!.label} documentation`}
      />
    </nav>
  )
}
