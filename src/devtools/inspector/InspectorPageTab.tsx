// ② inspectorDefinePagePanelPrd.md
// @useState-hatch — devtools: inspector UI owns local view state (selection, copy flag)
// Inspector Page 탭 = selector + defineLayout raw 소스 + copy 버튼.
// 소스가 SSOT이므로 tree/grid 위젯은 중복 — 제거.
import React, { useState, useMemo, useCallback, useSyncExternalStore, useContext } from 'react'
import { CodePreview } from '@os/ui/CodePreview'
import { CopyIndicator } from '@os/ui/indicators/CopyIndicator'
import type { NormalizedData } from '@os/store/types'
import {
  getAllFlatLayouts,
  subscribeFlatLayoutRegistry,
  type FlatLayoutActions,
} from '@os/primitives/flatLayoutRegistry'
import { defineLayout } from '@os/layout/flatLayout'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { FlatLayout } from '@os/ui/FlatLayout'
import { serializeToDefineLayout } from './serializeToDefineLayout'
import { ax } from '@styles/ax'

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

// ── Widgets ──

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

// ── defineLayout SSOT — scroll 오너는 code 노드 ──

const inspectorPageLayout = defineLayout({
  entities: {
    root: {
      data: { type: 'split', direction: 'vertical', sizes: ['auto', 'flex', 'auto'], resizable: false },
      children: ['selector', 'code', 'bar'],
    },
    selector: { data: { type: 'widget', widget: 'InstanceSelector' } },
    code: { data: { type: 'widget', widget: 'DefineLayoutSource', scroll: 'y' } },
    bar: { data: { type: 'widget', widget: 'CopyBar' } },
  },
})

const inspectorPageRegistry = createWidgetRegistry({
  InstanceSelector,
  DefineLayoutSource,
  CopyBar,
})

// ── Entry ──

export function InspectorPageTab() {
  const registry = useRegistrySnapshot()
  const instanceIds = useMemo(() => [...registry.keys()], [registry])
  // @useState-hatch — devtools UI local selection (user-picked id; null = fall back to first)
  const [preferredId, setPreferredId] = useState<string | null>(null)
  // @useState-hatch — clipboard feedback transient flag
  const [copied, setCopied] = useState(false)

  // Derived: 유효한 preferredId면 그것을, 아니면 첫 번째 instance. setState in effect 회피.
  const activeId = useMemo(() => {
    if (preferredId && registry.has(preferredId)) return preferredId
    return instanceIds[0] ?? null
  }, [preferredId, registry, instanceIds])

  const actions = activeId ? registry.get(activeId) : undefined
  const store = useStoreSnapshot(actions)

  const rawSource = useMemo(() => store ? serializeToDefineLayout(store) : '', [store])

  // Live Wireframe Overlay: activeId의 FlatLayout 노드 경계를 main window에 그림.
  // 탭 언마운트 시 null 발행으로 overlay 꺼짐.
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('flatlayout:overlay-activate', { detail: { instanceId: activeId } }))
    return () => {
      window.dispatchEvent(new CustomEvent('flatlayout:overlay-activate', { detail: { instanceId: null } }))
    }
  }, [activeId])

  const handleCopy = useCallback(async () => {
    if (!store) return
    await navigator.clipboard.writeText(serializeToDefineLayout(store))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [store])

  const ctx = useMemo<InspectorPageCtx>(() => ({
    instanceIds, activeId, setPreferredId,
    store, rawSource, handleCopy, copied,
  }), [instanceIds, activeId, store, rawSource, handleCopy, copied])

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
