// ② inspectorDefinePagePanelPrd.md
// @useState-hatch — devtools: inspector UI owns local view state (selection, copy flag)
// defineLayout 자기 참조 구조 — inspector 자체도 FlatLayout + defineLayout으로 조립하여
// scroll 오너십을 defineLayout 노드(scroll:'y')가 가지게 한다.
import React, { useState, useMemo, useCallback, useSyncExternalStore, useContext } from 'react'
import { TreeView } from '@os/ui/TreeView'
import { TreeGrid } from '@os/ui/TreeGrid'
import { CodePreview } from '@os/ui/CodePreview'
import { CopyIndicator } from '@os/ui/indicators/CopyIndicator'
import type { NormalizedData } from '@os/store/types'
import { getEntityData } from '@os/store/createStore'
import {
  getAllFlatLayouts,
  subscribeFlatLayoutRegistry,
  type FlatLayoutActions,
} from '@os/primitives/flatLayoutRegistry'
import { layoutCommands } from '@os/layout/layoutCommands'
import { defineLayout } from '@os/layout/flatLayout'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { FlatLayout } from '@os/ui/FlatLayout'
import { layoutStoreToTree } from './layoutStoreToTree'
import { layoutNodeToGridData, gridDataToLayoutPatch } from './layoutNodeToGridData'
import { serializeToDefineLayout } from './serializeToDefineLayout'
import { renderInspectorItem } from './renderInspectorItem'
import { ax } from '@styles/ax'

const GRID_COLUMNS = [
  { key: 'key', header: 'Prop' },
  { key: 'value', header: 'Value' },
]

function useRegistrySnapshot(): Map<string, FlatLayoutActions> {
  return useSyncExternalStore(subscribeFlatLayoutRegistry, getAllFlatLayouts, getAllFlatLayouts)
}

const EMPTY_SUBSCRIBE = (): (() => void) => () => {}

function useStoreSnapshot(actions: FlatLayoutActions | undefined): NormalizedData | null {
  const subscribe = actions?.subscribe ?? EMPTY_SUBSCRIBE
  const getSnapshot = useCallback(() => actions?.getStore() ?? null, [actions])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

// ── Shared context — widget들이 Push 없이 pull ──

interface InspectorPageCtx {
  instanceIds: string[]
  activeId: string | null
  setPreferredId: (id: string | null) => void
  store: NormalizedData | null
  treeData: NormalizedData | null
  gridData: NormalizedData | null
  setSelectedNodeId: (id: string | null) => void
  handleGridChange: (next: NormalizedData) => void
  rawSource: string
  handleCopy: () => void
  copied: boolean
}

const InspectorPageContext = React.createContext<InspectorPageCtx | null>(null)

function useInspectorPage(): InspectorPageCtx {
  const ctx = useContext(InspectorPageContext)
  if (!ctx) throw new Error('InspectorPageContext missing')
  return ctx
}

// ── Widgets (defineLayout 조립용) ──

function InstanceSelector() {
  const { instanceIds, activeId, setPreferredId } = useInspectorPage()
  if (instanceIds.length <= 1) return null
  return (
    <select
      value={activeId ?? ''}
      onChange={(e) => setPreferredId(e.target.value || null)}
      className={ax({ role: 'control', surface: 'input', interactive: 'input', textStyle: 'caption' })}
    >
      {instanceIds.map(id => <option key={id} value={id}>{id}</option>)}
    </select>
  )
}

function LayoutTree() {
  const { treeData, setSelectedNodeId } = useInspectorPage()
  if (!treeData) return null
  return (
    <TreeView
      data={treeData}
      plugins={[]}
      renderItem={renderInspectorItem}
      onFocusChange={(id) => setSelectedNodeId(id)}
      aria-label="Layout tree"
    />
  )
}

function LayoutGrid() {
  const { gridData, handleGridChange } = useInspectorPage()
  if (!gridData) return null
  return (
    <TreeGrid
      data={gridData}
      columns={GRID_COLUMNS}
      enableEditing
      onChange={handleGridChange}
      header
      aria-label="Layout node props"
    />
  )
}

function DefineLayoutSource() {
  const { rawSource } = useInspectorPage()
  if (!rawSource) return null
  return <CodePreview code={rawSource} filename="defineLayout.ts" preset="doc" />
}

function CopyBar() {
  const { handleCopy, copied, store } = useInspectorPage()
  return (
    <div className={ax({ layout: 'bar' })}>
      <button
        className={ax({ role: 'control', interactive: 'button', surface: 'action', tone: 'accent', textStyle: 'caption' })}
        onClick={handleCopy}
        disabled={!store}
      >
        <span className={ax({ layout: 'bar' })}>
          <CopyIndicator copied={copied} />
          {copied ? 'Copied' : 'Copy as defineLayout'}
        </span>
      </button>
    </div>
  )
}

// ── defineLayout SSOT — scroll 오너는 tree/code 노드 ──

const inspectorPageLayout = defineLayout({
  entities: {
    root: {
      data: { type: 'split', direction: 'vertical', sizes: [0.4, 'auto', 'auto', 0.5, 'auto'], resizable: false },
      children: ['tree', 'grid', 'selector', 'code', 'bar'],
    },
    tree: { data: { type: 'widget', widget: 'LayoutTree', scroll: 'y' } },
    grid: { data: { type: 'widget', widget: 'LayoutGrid' } },
    selector: { data: { type: 'widget', widget: 'InstanceSelector' } },
    code: { data: { type: 'widget', widget: 'DefineLayoutSource', scroll: 'y' } },
    bar: { data: { type: 'widget', widget: 'CopyBar' } },
  },
})

const inspectorPageRegistry = createWidgetRegistry({
  InstanceSelector,
  LayoutTree,
  LayoutGrid,
  DefineLayoutSource,
  CopyBar,
})

// ── Entry ──

export function InspectorPageTab() {
  const registry = useRegistrySnapshot()
  const instanceIds = useMemo(() => [...registry.keys()], [registry])
  // @useState-hatch — devtools UI local selection (user-picked id; null = fall back to first)
  const [preferredId, setPreferredId] = useState<string | null>(null)
  // @useState-hatch — devtools UI local selection
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  // @useState-hatch — clipboard feedback transient flag
  const [copied, setCopied] = useState(false)

  // Derived: 유효한 preferredId면 그것을, 아니면 첫 번째 instance. setState in effect 회피.
  const activeId = useMemo(() => {
    if (preferredId && registry.has(preferredId)) return preferredId
    return instanceIds[0] ?? null
  }, [preferredId, registry, instanceIds])

  const actions = activeId ? registry.get(activeId) : undefined
  const store = useStoreSnapshot(actions)

  const treeData = useMemo(() => store ? layoutStoreToTree(store) : null, [store])

  const selectedData = useMemo(() => {
    if (!store || !selectedNodeId) return null
    return getEntityData<Record<string, unknown>>(store, selectedNodeId) ?? null
  }, [store, selectedNodeId])

  const gridData = useMemo(
    () => selectedData ? layoutNodeToGridData(selectedData) : null,
    [selectedData],
  )

  const rawSource = useMemo(() => store ? serializeToDefineLayout(store) : '', [store])

  const handleGridChange = useCallback((next: NormalizedData) => {
    if (!selectedNodeId || !actions) return
    const patch = gridDataToLayoutPatch(next)
    actions.dispatch(layoutCommands.updateNode(selectedNodeId, patch))
  }, [selectedNodeId, actions])

  const handleCopy = useCallback(async () => {
    if (!store) return
    await navigator.clipboard.writeText(serializeToDefineLayout(store))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [store])

  const ctx = useMemo<InspectorPageCtx>(() => ({
    instanceIds, activeId, setPreferredId,
    store, treeData, gridData,
    setSelectedNodeId,
    handleGridChange,
    rawSource, handleCopy, copied,
  }), [instanceIds, activeId, store, treeData, gridData, handleGridChange, rawSource, handleCopy, copied])

  if (registry.size === 0) {
    return (
      <div className={ax({ textStyle: 'caption' })}>
        No defineLayout detected. This page may be hand-coded outside FlatLayout.
      </div>
    )
  }

  return (
    <InspectorPageContext.Provider value={ctx}>
      <FlatLayout
        id="inspector-page-tab"
        data={inspectorPageLayout}
        registry={inspectorPageRegistry}
        aria-label="Inspector Page"
      />
    </InspectorPageContext.Provider>
  )
}
