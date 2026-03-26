import { useCallback, useMemo } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { TreeView } from '../interactive-os/ui/TreeView'
import type { TreeItemRenderProps } from '../interactive-os/ui/TreeView'
import { FOCUS_ID, EXPANDED_ID } from '../interactive-os/plugins/core'
import { createStore } from '../interactive-os/store/createStore'
import { ROOT_ID } from '../interactive-os/store/types'
import type { NormalizedData } from '../interactive-os/store/types'
import type { NodeState } from '../interactive-os/pattern/types'

// --- Build tree data from contents/ + _meta.yaml ---

const mdModules = import.meta.glob('/contents/**/*.md', { query: '?raw' })

const metaModules = import.meta.glob<{ default: string }>('/contents/**/_meta.yaml', {
  query: '?raw',
  eager: true,
})

interface MetaYaml {
  label?: string
  order?: string[]
}

function parseMeta(raw: string): MetaYaml {
  const result: MetaYaml = {}
  const lines = raw.split('\n')
  let inOrder = false

  for (const line of lines) {
    const labelMatch = line.match(/^label:\s*(.+)/)
    if (labelMatch) {
      result.label = labelMatch[1].trim()
      inOrder = false
      continue
    }
    if (line.match(/^order:\s*$/)) {
      inOrder = true
      result.order = []
      continue
    }
    if (inOrder) {
      const itemMatch = line.match(/^\s+-\s+(.+)/)
      if (itemMatch) {
        result.order!.push(itemMatch[1].trim())
      } else if (!line.match(/^\s*$/)) {
        inOrder = false
      }
    }
  }
  return result
}

function getLayerMeta(layer: string): MetaYaml {
  const key = `/contents/${layer}/_meta.yaml`
  const mod = metaModules[key]
  if (!mod) return {}
  return parseMeta(mod.default)
}

function getRootOrder(): string[] {
  const mod = metaModules['/contents/_meta.yaml']
  if (!mod) return []
  return parseMeta(mod.default).order ?? []
}

function buildAreaTree(): NormalizedData {
  // Parse glob keys into { l2, l3? } entries
  const entries: { l2: string; l3?: string; path: string }[] = []
  for (const key of Object.keys(mdModules)) {
    const match = key.match(/^\/contents\/(.+)\.md$/)
    if (!match) continue
    const segments = match[1].split('/')
    if (segments.length === 1) {
      entries.push({ l2: segments[0], path: segments[0] })
    } else if (segments.length === 2) {
      entries.push({ l2: segments[0], l3: segments[1], path: `${segments[0]}/${segments[1]}` })
    }
  }

  const rootOrder = getRootOrder()
  const entities: Record<string, { id: string; data: Record<string, unknown> }> = {}
  const relationships: Record<string, string[]> = { [ROOT_ID]: [] }

  // Collect all known L2 keys from entries
  const knownL2 = new Set(entries.map((e) => e.l2))

  // Use root order, then append any L2 not in order
  const orderedL2 = [...rootOrder.filter((l2) => knownL2.has(l2))]
  for (const l2 of knownL2) {
    if (!orderedL2.includes(l2)) orderedL2.push(l2)
  }

  for (const l2 of orderedL2) {
    const meta = getLayerMeta(l2)
    entities[l2] = { id: l2, data: { name: meta.label || l2 } }
    relationships[ROOT_ID].push(l2)

    // Collect L3 children, ordered by _meta.yaml then alphabetical fallback
    const allChildren = entries
      .filter((e) => e.l2 === l2 && e.l3)
      .map((e) => e.l3!)

    const metaOrder = meta.order ?? []
    const ordered = [...metaOrder.filter((c) => allChildren.includes(c))]
    for (const c of allChildren.sort()) {
      if (!ordered.includes(c)) ordered.push(c)
    }

    if (ordered.length > 0) {
      relationships[l2] = ordered.map((c) => `${l2}/${c}`)
      for (const child of ordered) {
        const id = `${l2}/${child}`
        entities[id] = { id, data: { name: child } }
      }
    }
  }

  return createStore({ entities, relationships })
}

const baseAreaTree = buildAreaTree()

// --- AreaSidebar component ---

export function AreaSidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Extract current path segments: /internals/area/axis/navigate → "axis/navigate"
  const currentPath = pathname.replace(/^\/internals\/area\/?/, '') || 'overview'
  const currentL2 = currentPath.split('/')[0]

  // Sync URL → focus + expand
  const areaStore = useMemo(() => {
    const store = { ...baseAreaTree }
    const entities = { ...store.entities }

    // Set focus to current path
    if (entities[currentPath]) {
      entities[FOCUS_ID] = { id: FOCUS_ID, focusedId: currentPath }
    } else if (entities[currentL2]) {
      entities[FOCUS_ID] = { id: FOCUS_ID, focusedId: currentL2 }
    }

    // Expand current L2 (if it has children)
    if (store.relationships[currentL2]) {
      entities[EXPANDED_ID] = {
        id: EXPANDED_ID,
        expandedIds: [currentL2],
      }
    }

    return { ...store, entities } as NormalizedData
  }, [currentPath, currentL2])

  const handleActivate = useCallback((nodeId: string) => {
    navigate(`/internals/area/${nodeId}`)
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

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-mark" />
          <h1>interactive-os</h1>
        </div>
        <span className="version">v0.1.0</span>
      </div>
      <div className="sidebar-section-title">Area</div>
      <TreeView
        data={areaStore}
        followFocus
        onActivate={handleActivate}
        renderItem={renderItem}
        aria-label="Area documentation"
      />
    </nav>
  )
}
