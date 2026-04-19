// ② inspectorDefinePagePanelPrd.md
// @useState-hatch — devtools: inspector UI owns local view state (selection, copy flag, split sizes)
import { useState, useMemo, useCallback, useSyncExternalStore } from 'react'
import { TreeView } from '@os/ui/TreeView'
import { TreeGrid } from '@os/ui/TreeGrid'
import { SplitPane } from '@os/ui/SplitPane'
import { CopyIndicator } from '@os/ui/indicators/CopyIndicator'
import type { NormalizedData, PaneSize } from '@os/store/types'
import { getEntityData } from '@os/store/createStore'
import {
  getAllFlatLayouts,
  subscribeFlatLayoutRegistry,
  type FlatLayoutActions,
} from '@os/primitives/flatLayoutRegistry'
import { layoutCommands } from '@os/layout/layoutCommands'
import { layoutStoreToTree } from './layoutStoreToTree'
import { layoutNodeToGridData, gridDataToLayoutPatch } from './layoutNodeToGridData'
import { serializeToDefinePage } from './serializeToDefinePage'
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

export function InspectorPageTab() {
  const registry = useRegistrySnapshot()
  const instanceIds = useMemo(() => [...registry.keys()], [registry])
  // @useState-hatch — devtools UI local selection (user-picked id; null = fall back to first)
  const [preferredId, setPreferredId] = useState<string | null>(null)
  // @useState-hatch — devtools UI local selection
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  // @useState-hatch — clipboard feedback transient flag
  const [copied, setCopied] = useState(false)
  // @useState-hatch — SplitPane sizes 외부 제어
  const [sizes, setSizes] = useState<PaneSize[]>([0.5, 'flex'])

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

  const handleGridChange = useCallback((next: NormalizedData) => {
    if (!selectedNodeId || !actions) return
    const patch = gridDataToLayoutPatch(next)
    actions.dispatch(layoutCommands.updateNode(selectedNodeId, patch))
  }, [selectedNodeId, actions])

  const handleCopy = useCallback(async () => {
    if (!store) return
    await navigator.clipboard.writeText(serializeToDefinePage(store))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [store])

  if (registry.size === 0) {
    return (
      <div className={ax({ textStyle: 'caption' })}>
        No definePage detected. This page may be hand-coded outside FlatLayout.
      </div>
    )
  }

  return (
    <div className={ax({ role: 'control-group', surface: 'base', layout: 'stack' })}>
      {instanceIds.length > 1 && (
        <select
          value={activeId ?? ''}
          onChange={(e) => setPreferredId(e.target.value || null)}
          className={ax({ role: 'control', surface: 'input', interactive: 'input', textStyle: 'caption' })}
        >
          {instanceIds.map(id => <option key={id} value={id}>{id}</option>)}
        </select>
      )}
      <SplitPane direction="horizontal" sizes={sizes} onResize={setSizes}>
        <div className={ax({ layout: 'stack' })}>
          {treeData && (
            <TreeView
              data={treeData}
              plugins={[]}
              renderItem={renderInspectorItem}
              onFocusChange={(id) => setSelectedNodeId(id)}
              aria-label="Layout tree"
            />
          )}
        </div>
        <div className={ax({ layout: 'stack' })}>
          {gridData ? (
            <TreeGrid
              data={gridData}
              columns={GRID_COLUMNS}
              enableEditing
              onChange={handleGridChange}
              header
              aria-label="Layout node props"
            />
          ) : (
            <div className={ax({ textStyle: 'caption' })}>Select a node.</div>
          )}
          <button
            className={ax({ role: 'control', surface: 'action', tone: 'accent', interactive: 'button', textStyle: 'caption' })}
            onClick={handleCopy}
            disabled={!store}
          >
            <span className={ax({ layout: 'bar' })}>
              <CopyIndicator copied={copied} />
              {copied ? 'Copied' : 'Copy as definePage'}
            </span>
          </button>
        </div>
      </SplitPane>
    </div>
  )
}
