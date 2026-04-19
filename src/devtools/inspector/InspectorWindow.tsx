// ② 2026-04-04-inspector-redesign-prd.md  ② inspectorDefinePagePanelPrd.md
// @useState-hatch — devtools: inspector UI owns local view state (selection, tabs, pick-mode)
// Inspector 쉘 전체 조립을 defineLayout에 귀속. 구조형 레이아웃(split/stack)은 defineLayout
// 소유, 위젯은 표시 내용만. scroll 오너십도 defineLayout 노드의 scroll 필드.
import React, { useEffect, useRef, useState, useMemo, useCallback, useContext } from 'react'
import type { InspectResult } from '@os/engine/types'
import type { AriaActions } from '@os/primitives/ariaRegistry'
import type { NormalizedData } from '@os/store/types'
import type { Plugin } from '@os/plugins/types'
import { getAllAriaActions } from '@os/primitives/ariaRegistry'
import { TreeView } from '@os/ui/TreeView'
import { FlatLayout } from '@os/ui/FlatLayout'
import { defineLayout } from '@os/layout/flatLayout'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { AppInspector } from './AppInspector'
import { copyAriaTree } from './inspectToAscii'
import { registryToUnifiedTree, findInstanceId } from './inspectorStore'
import type { InstanceMeta } from './inspectorStore'
import { InspectorLogTab } from './InspectorLogTab'
import { InspectorPageTab } from './InspectorPageTab'
import { ax } from '@styles/ax'
import './InspectorWindow.css'

type UnifiedTree = ReturnType<typeof registryToUnifiedTree>['tree']

// ── Shared context — 모든 widget이 상태/핸들러 pull ──
interface InspectorShellCtx {
  actionsMap: Map<string, AriaActions>
  tree: UnifiedTree
  metas: Map<string, InstanceMeta>
  selectedId: string
  activeTab: DetailTab
  setActiveTab: (tab: DetailTab) => void
  picking: boolean
  setPicking: React.Dispatch<React.SetStateAction<boolean>>
  inspectResult: InspectResult | undefined
  prevState: NormalizedData | undefined
  handleActivate: (nodeId: string) => void
}

const InspectorShellContext = React.createContext<InspectorShellCtx | null>(null)

function useInspectorShell(): InspectorShellCtx {
  const ctx = useContext(InspectorShellContext)
  if (!ctx) throw new Error('InspectorShellContext missing')
  return ctx
}

const emptyPlugins: Plugin[] = []

type DetailTab = 'page' | 'interaction' | 'aria' | 'state' | 'log'

function BoundKeyTable({ inspectResult }: { inspectResult: InspectResult }) {
  const keyEntries = Object.entries(inspectResult.keyMap)
  const clickEntries = Object.entries(inspectResult.clickMap ?? {})

  if (keyEntries.length === 0 && clickEntries.length === 0) {
    return <div className={ax({ textStyle: 'caption' })}>No bindings</div>
  }
  return (
    <table className={`${ax({ textStyle: 'caption', width: 'full' })} inspector-table`}>
      <thead>
        <tr>
          <th className={`text-left ${ax({ })} inspector-th`}>Input</th>
          <th className={`text-left ${ax({ })} inspector-th`}>Command</th>
          <th className={`text-left ${ax({ })} inspector-th`}>Owner</th>
        </tr>
      </thead>
      <tbody>
        {keyEntries.map(([k, entry]) => (
          <tr key={k}>
            <td className={`${ax({ role: 'item', tone: 'success' })} inspector-td-key`}>{k}</td>
            <td className={`${ax({ role: 'item', tone: 'accent' })} inspector-td-command`}>{entry.command ?? '—'}</td>
            <td className={`${ax({ })} inspector-td-owner`}>{entry.owner}</td>
          </tr>
        ))}
        {clickEntries.map(([input, commands]) => (
          <tr key={`click:${input}`}>
            <td className={`${ax({ role: 'item', tone: 'success' })} inspector-td-key`}>{input}</td>
            <td className={`${ax({ role: 'item', tone: 'accent' })} inspector-td-command`}>{commands.join(', ')}</td>
            <td className={`${ax({ })} inspector-td-owner`}>pattern</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function CopyButton({ inspectResult }: { inspectResult: InspectResult }) {
  // @useState-hatch — devtools clipboard transient feedback
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(async () => {
    await copyAriaTree(inspectResult)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [inspectResult])

  return (
    <button
      className={`cursor-pointer ${ax({ textStyle: 'caption' })} inspector-copy-button`}
      onClick={handleCopy}
    >
      {copied ? '✓ Copied' : 'Copy ASCII'}
    </button>
  )
}

function readDomAriaProps(element: HTMLElement): Record<string, string> {
  const props: Record<string, string> = {}
  const role = element.getAttribute('role')
  if (role) props.role = role
  for (const attr of element.attributes) {
    if (attr.name.startsWith('aria-')) {
      props[attr.name] = attr.value
    }
  }
  return props
}

function AriaDiffTable({ osProps, domProps }: { osProps: Record<string, string>; domProps: Record<string, string> | null }) {
  const allKeys = [...new Set([...Object.keys(osProps), ...Object.keys(domProps ?? {})])].filter(k => k !== 'role').sort()
  if (allKeys.length === 0) {
    return <div className={ax({ textStyle: 'caption' })}>No ARIA props</div>
  }
  return (
    <table className={`${ax({ textStyle: 'caption', width: 'full' })} inspector-table`}>
      <thead>
        <tr>
          <th className={`text-left ${ax({ })} inspector-th`}>Attribute</th>
          <th className={`text-left ${ax({ })} inspector-th`}>OS Intent</th>
          {domProps && <th className={`text-left ${ax({ })} inspector-th`}>DOM Actual</th>}
        </tr>
      </thead>
      <tbody>
        {allKeys.map(k => {
          const os = osProps[k]
          const dom = domProps?.[k]
          const mismatch = domProps && os !== dom
          return (
            <tr key={k}>
              <td className={`${ax({ role: 'item', tone: 'success' })} inspector-td-key`}>{k}</td>
              <td className={`${ax({ role: 'item', tone: 'accent' })} inspector-td-command`}>{os ?? '—'}</td>
              {domProps && (
                <td className={mismatch ? `${ax({ role: 'item', tone: 'danger-dim' })} inspector-td-mismatch` : `${ax({ role: 'item', tone: 'accent' })} inspector-td-command`}>{dom ?? '—'}</td>
              )}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

interface AriaTabContentProps {
  selectedId: string
  inspectResult: InspectResult
  actionsMap: Map<string, AriaActions>
  metas: Map<string, InstanceMeta>
}

function AriaTabContent({ selectedId, inspectResult, actionsMap, metas }: AriaTabContentProps) {
  const sep = selectedId.indexOf('::')
  const nodeId = sep !== -1 ? selectedId.slice(sep + 2) : undefined
  const np = nodeId && inspectResult.computeNodeProps ? inspectResult.computeNodeProps(nodeId) : undefined
  const role = np?.role ?? inspectResult.role ?? ''

  // Find DOM element for diff
  const instId = findInstanceId(selectedId)
  const instMeta = metas.get(instId)
  const container = instMeta ? actionsMap.get(instMeta.registryKey)?.getElement() ?? null : null
  const actions = instMeta ? actionsMap.get(instMeta.registryKey) : undefined
  const domElement = nodeId
    ? (actions?.getNodeElement?.(nodeId) ?? container?.querySelector<HTMLElement>(`[data-node-id="${nodeId}"]`) ?? container)
    : container
  const domProps = domElement ? readDomAriaProps(domElement) : null

  return (
    <div className={ax({ layout: 'stack' })}>
      <div className={ax({ textStyle: 'caption' })}>
        {nodeId ? `Node: ${nodeId}` : 'Instance root'} — role: {role}
      </div>
      {np ? (
        <AriaDiffTable osProps={np} domProps={domProps} />
      ) : (
        <div className={ax({ textStyle: 'caption' })}>
          {nodeId ? 'No ARIA props' : 'Select a node for ARIA details'}
        </div>
      )}
    </div>
  )
}

const TAB_LIST: { id: DetailTab; label: string }[] = [
  { id: 'page', label: 'Page' },
  { id: 'interaction', label: 'Interaction' },
  { id: 'aria', label: 'ARIA' },
  { id: 'state', label: 'State' },
  { id: 'log', label: 'Log' },
]

function TabBar({ active, onChange }: { active: DetailTab; onChange: (tab: DetailTab) => void }) {
  return (
    <div className={`${ax({ role: 'control-group', layout: 'row', surface: 'overlay' })} inspector-tab-bar`}>
      {TAB_LIST.map(t => (
        <button
          key={t.id}
          className={`border-none ${ax({ textStyle: 'caption' })} inspector-tab ${active === t.id ? 'inspector-tab-active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ── Widgets (defineLayout 조립 단위) — 표시만. 구조 조립은 defineLayout이. ──

function InspectorTopBar() {
  const { actionsMap, picking, setPicking } = useInspectorShell()
  return (
    <div className={`${ax({ role: 'control-group', layout: 'spread', surface: 'overlay' })} ${ax({ textStyle: 'caption' })}`}>
      <div className={ax({ layout: 'row' })}>
        <span>Aria Inspector</span>
        <button
          className={`border-none cursor-pointer ${ax({ textStyle: 'caption' })} inspector-tab ${picking ? 'inspector-tab-active' : ''}`}
          onClick={() => setPicking(p => !p)}
        >
          {picking ? 'Picking…' : 'Pick'}
        </button>
      </div>
      <span>{actionsMap.size} instances</span>
    </div>
  )
}

function InspectorInstanceTree() {
  const { actionsMap, tree, handleActivate } = useInspectorShell()
  if (actionsMap.size === 0) {
    return <div className={ax({ textStyle: 'caption' })}>등록된 인스턴스 없음</div>
  }
  return (
    <TreeView
      data={tree}
      plugins={emptyPlugins}
      onActivate={handleActivate}
      selectionFollowsFocus
      activateOnClick
    />
  )
}

function InspectorTabBar() {
  const { activeTab, setActiveTab } = useInspectorShell()
  return <TabBar active={activeTab} onChange={setActiveTab} />
}

function InspectorTabContent() {
  const { activeTab, inspectResult, prevState, actionsMap, selectedId, metas } = useInspectorShell()
  if (activeTab === 'page') return <InspectorPageTab />
  if (activeTab === 'log') return <InspectorLogTab actionsMap={actionsMap} />
  if (!inspectResult) {
    return <div className={ax({ textStyle: 'caption' })}>선택된 인스턴스 없음</div>
  }
  if (activeTab === 'interaction') {
    return (
      <div className={ax({ layout: 'stack' })}>
        <div className={ax({ layout: 'spread', textStyle: 'caption' })}>
          <span>Bindings ({Object.keys(inspectResult.keyMap).length + Object.keys(inspectResult.clickMap ?? {}).length})</span>
          <CopyButton inspectResult={inspectResult} />
        </div>
        <BoundKeyTable inspectResult={inspectResult} />
      </div>
    )
  }
  if (activeTab === 'aria') {
    return <AriaTabContent selectedId={selectedId} inspectResult={inspectResult} actionsMap={actionsMap} metas={metas} />
  }
  if (activeTab === 'state') {
    return (
      <div className={ax({ layout: 'stack' })}>
        <div className={ax({ textStyle: 'caption' })}>
          State ({Object.keys(inspectResult.state.entities).length} entities)
        </div>
        <AppInspector inspectResult={inspectResult} prevState={prevState} />
      </div>
    )
  }
  return null
}

// ── defineLayout SSOT — scroll 오너는 tree, tab-content 노드 ──

const inspectorShellLayout = defineLayout({
  entities: {
    root: {
      data: { type: 'split', direction: 'vertical', sizes: ['auto', 'flex'], resizable: false },
      children: ['topbar', 'body'],
    },
    topbar: { data: { type: 'widget', widget: 'InspectorTopBar' } },
    body: {
      data: { type: 'split', direction: 'horizontal', sizes: [0.3, 'flex'], resizable: true },
      children: ['tree', 'detail'],
    },
    tree: { data: { type: 'widget', widget: 'InspectorInstanceTree', scroll: 'y' } },
    detail: {
      data: { type: 'split', direction: 'vertical', sizes: ['auto', 'flex'], resizable: false },
      children: ['tabbar', 'tab-content'],
    },
    tabbar: { data: { type: 'widget', widget: 'InspectorTabBar' } },
    'tab-content': { data: { type: 'widget', widget: 'InspectorTabContent', scroll: 'y' } },
  },
})

const inspectorShellRegistry = createWidgetRegistry({
  InspectorTopBar,
  InspectorInstanceTree,
  InspectorTabBar,
  InspectorTabContent,
})

export function InspectorWindow() {
  // @useState-hatch — devtools: registry snapshot polling mirror
  const [actionsMap, setActionsMap] = useState<Map<string, AriaActions>>(new Map())
  // @useState-hatch — devtools: local inspector selection
  const [selectedId, setSelectedId] = useState('')
  // @useState-hatch — devtools: local tab selection (첫 진입은 Page — defineLayout SSOT 우선)
  const [activeTab, setActiveTab] = useState<DetailTab>('page')
  // @useState-hatch — devtools: pick-mode toggle
  const [picking, setPicking] = useState(false)
  const prevSnapshotRef = useRef('')
  const prevStateRef = useRef<Map<string, NormalizedData>>(new Map())

  useEffect(() => {
    const update = () => {
      const all = getAllAriaActions()
      const snapshot = [...all.keys()].sort().join(',')
      if (snapshot === prevSnapshotRef.current) return
      prevSnapshotRef.current = snapshot

      setActionsMap(new Map(all))
      setSelectedId(prev => {
        if (prev && all.has(findInstanceId(prev).replace('__inst__', ''))) return prev
        if (all.size > 0) return `__inst__${all.keys().next().value!}`
        return ''
      })
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  // Pick mode: click on main window → select in inspector
  useEffect(() => {
    if (!picking) return
    const mainWindow = window.opener ?? window
    const handler = (event: Event) => {
      const e = event as MouseEvent
      e.preventDefault()
      e.stopPropagation()

      const target = e.target as HTMLElement
      const nodeEl = target.closest<HTMLElement>('[data-node-id]')
      const containerEl = target.closest<HTMLElement>('.ax-interactive')
      if (!containerEl) return

      // Find registryKey by matching container element
      const all = getAllAriaActions()
      let matchedKey: string | undefined
      for (const [key, actions] of all) {
        if (actions.getElement() === containerEl) {
          matchedKey = key
          break
        }
      }
      if (!matchedKey) return

      const nodeId = nodeEl?.getAttribute('data-node-id')
      const inspectorId = nodeId
        ? `__inst__${matchedKey}::${nodeId}`
        : `__inst__${matchedKey}`
      setSelectedId(inspectorId)
      setPicking(false)
    }
    mainWindow.addEventListener('click', handler, true)
    return () => mainWindow.removeEventListener('click', handler, true)
  }, [picking])

  const { tree, metas } = useMemo(
    () => registryToUnifiedTree(actionsMap),
    [actionsMap],
  )

  const instanceId = findInstanceId(selectedId)
  const meta: InstanceMeta | undefined = metas.get(instanceId)
  const inspectResult = meta?.inspectResult

  // Track previous state for diff flash
  // eslint-disable-next-line react-hooks/refs
  const prevState = prevStateRef.current.get(instanceId)
  useMemo(() => {
    if (inspectResult) {
      // eslint-disable-next-line react-hooks/refs
      prevStateRef.current.set(instanceId, inspectResult.state)
    }
  }, [instanceId, inspectResult])

  const handleActivate = useCallback((nodeId: string) => {
    setSelectedId(nodeId)
    // Highlight selected node's element in the main window
    const instId = findInstanceId(nodeId)
    const instMeta = metas.get(instId)
    if (instMeta) {
      const actions = actionsMap.get(instMeta.registryKey)
      const container = actions?.getElement() ?? null
      let element: HTMLElement | null = null

      // If selecting a child node (not the instance root), find its DOM element
      const sep = nodeId.indexOf('::')
      if (sep !== -1) {
        const childNodeId = nodeId.slice(sep + 2)
        element = actions?.getNodeElement?.(childNodeId) ?? container?.querySelector<HTMLElement>(`[data-node-id="${childNodeId}"]`) ?? null
      }
      // Fallback to instance container
      if (!element) element = container

      const mainWindow = window.opener ?? window
      mainWindow.dispatchEvent(
        new CustomEvent('inspector:highlight-element', { detail: { element } }),
      )
    }
  }, [metas, actionsMap])

  const ctx = useMemo<InspectorShellCtx>(() => ({
    actionsMap, tree, metas,
    selectedId, activeTab, setActiveTab,
    picking, setPicking,
    inspectResult, prevState, handleActivate,
  }), [actionsMap, tree, metas, selectedId, activeTab, picking, inspectResult, prevState, handleActivate])

  return (
    <InspectorShellContext.Provider value={ctx}>
      <FlatLayout
        id="inspector-shell"
        data={inspectorShellLayout}
        registry={inspectorShellRegistry}
        aria-label="Aria Inspector"
      />
    </InspectorShellContext.Provider>
  )
}
