import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { TreeView } from '../interactive-os/ui/TreeView'
import { FOCUS_ID, EXPANDED_ID } from '../interactive-os/plugins/core'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'

// --- Build tree data from glob keys ---

const mdModules = import.meta.glob<{ default: React.ComponentType }>('/docs/2-areas/**/*.md')

const L2_ORDER = ['vision', 'overview', 'core', 'axes', 'patterns', 'plugins', 'hooks', 'ui']

const L2_LABELS: Record<string, string> = {
  vision: 'Vision',
  overview: 'Overview',
  core: 'Core',
  axes: 'Axes',
  patterns: 'Patterns',
  plugins: 'Plugins',
  hooks: 'Hooks',
  ui: 'UI',
}

function buildAreaTree(): NormalizedData {
  // Parse glob keys into { l2, l3? } entries
  const entries: { l2: string; l3?: string; path: string }[] = []
  for (const key of Object.keys(mdModules)) {
    // key: /docs/2-areas/axes.md or /docs/2-areas/axes/navigate.md
    const match = key.match(/^\/docs\/2-areas\/(.+)\.md$/)
    if (!match) continue
    const segments = match[1].split('/')
    if (segments.length === 1) {
      entries.push({ l2: segments[0], path: segments[0] })
    } else if (segments.length === 2) {
      entries.push({ l2: segments[0], l3: segments[1], path: `${segments[0]}/${segments[1]}` })
    }
  }

  const entities: Record<string, { id: string; data: Record<string, unknown> }> = {}
  const relationships: Record<string, string[]> = { [ROOT_ID]: [] }

  // Add L2 nodes in fixed order
  for (const l2 of L2_ORDER) {
    entities[l2] = { id: l2, data: { name: L2_LABELS[l2] || l2 } }
    relationships[ROOT_ID].push(l2)

    // Collect L3 children for this L2, sorted alphabetically
    const children = entries
      .filter((e) => e.l2 === l2 && e.l3)
      .map((e) => e.l3!)
      .sort()

    if (children.length > 0) {
      relationships[l2] = children.map((c) => `${l2}/${c}`)
      for (const child of children) {
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

  // Extract current path segments: /internals/area/axes/navigate → "axes/navigate"
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

  const renderItem = useCallback((node: Record<string, unknown>, state: NodeState, props: Record<string, unknown>) => {
    const hasChildren = state.expanded !== undefined
    return (
      <span {...props} className="item-inner">
        <span className="item-chevron--tree">
          {hasChildren ? (state.expanded ? '▾' : '▸') : ''}
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
