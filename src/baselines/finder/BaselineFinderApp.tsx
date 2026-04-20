// BaselineFinderApp — defineApp 런타임 조립체 (os-compliant MVP).
//
// 깡통 = TreeView + Preview. 소비하는 기여: dataSource / viewMode / sidebar.
// Settings 토글로 Feature를 런타임 install/uninstall — 마켓플레이스 UX.

import { useEffect, useMemo, useState } from 'react'
import { Settings } from 'lucide-react'
import type { AppDefinition, ViewModeContribution, SidebarContribution } from '@os/feature/defineFeature'
import { buildRegistry } from '@os/feature/featureRegistry'
import type { NormalizedData, Entity } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'
import { createStore } from '@os/store/createStore'
import { CHECKED_ID } from '@os/axis/checked'
import { FileTreeTable } from '@entities/file/ui/FileTreeTable'
import { FilePanel } from '../../pages/finder/widgets/FilePanel'
import { FOCUS_ID } from '@os/core'
import { TabList } from '@os/ui/TabList'
import { Checkbox } from '@os/ui/Checkbox'
import { NavList } from '@os/ui/NavList'
import { SplitPane } from '@os/ui/SplitPane'
import type { PaneSize } from '@os/ui/SplitPane'
import { ax } from '@styles/ax'

const DEFAULT_LIST_MODE: ViewModeContribution = {
  id: 'list',
  label: 'List',
  render: ({ data, onChange }) => <FileTreeTable data={data} onChange={onChange} />,
  layout: {},
}

function buildViewModesStore(viewModes: ViewModeContribution[]): NormalizedData {
  const entities: Record<string, Entity> = {}
  const ids: string[] = []
  for (const v of viewModes) {
    entities[v.id] = { id: v.id, data: { label: v.label, type: 'tab' } }
    ids.push(v.id)
  }
  return createStore({ entities, relationships: { [ROOT_ID]: ids } })
}

function buildFeaturesStore(app: AppDefinition, enabled: Set<string>): NormalizedData {
  const entities: Record<string, Entity> = {}
  const ids: string[] = []
  for (const f of app.features) {
    entities[f.id] = { id: f.id, data: { label: f.name } }
    ids.push(f.id)
  }
  entities[CHECKED_ID] = { id: CHECKED_ID, checkedIds: Array.from(enabled) }
  return createStore({ entities, relationships: { [ROOT_ID]: ids } })
}

// 사이드바: 각 기여(section)는 group node + 하위 item들
function buildSidebarStore(sidebars: SidebarContribution[]): { store: NormalizedData; idToPath: Map<string, string> } {
  const entities: Record<string, Entity> = {}
  const rootIds: string[] = []
  const idToPath = new Map<string, string>()
  const sortedSections = [...sidebars].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  for (const section of sortedSections) {
    const groupId = `group:${section.id}`
    entities[groupId] = { id: groupId, data: { label: section.section, type: 'group' } }
    rootIds.push(groupId)
    const childIds: string[] = []
    for (const item of section.items) {
      entities[item.id] = { id: item.id, data: { label: item.label, icon: item.icon } }
      childIds.push(item.id)
      idToPath.set(item.id, item.rootPath)
    }
    entities[groupId] = { ...entities[groupId], data: { ...(entities[groupId].data as object), type: 'group' } }
    // relationships below
  }
  const relationships: Record<string, string[]> = { [ROOT_ID]: rootIds }
  for (const section of sortedSections) {
    relationships[`group:${section.id}`] = section.items.map(i => i.id)
  }
  return { store: createStore({ entities, relationships }), idToPath }
}

export function BaselineFinderApp({ app }: { app: AppDefinition }) {
  // @useState-hatch — install/uninstall 토글.
  const [enabled, setEnabled] = useState<Set<string>>(() => new Set(app.features.map(f => f.id)))
  // @useState-hatch — 설정 패널 열림.
  const [showSettings, setShowSettings] = useState(false)
  // @useState-hatch — 현재 rootPath. 사이드바 활성화로 변경.
  const [rootPath, setRootPath] = useState<string | undefined>(undefined)

  const activeFeatures = useMemo(
    () => app.features.filter(f => enabled.has(f.id)),
    [app, enabled],
  )
  const registry = useMemo(() => buildRegistry({ ...app, features: activeFeatures }), [app, activeFeatures])
  const allViewModes = useMemo(() => [DEFAULT_LIST_MODE, ...registry.viewModes], [registry])
  const viewModesStore = useMemo(() => buildViewModesStore(allViewModes), [allViewModes])
  const featuresStore = useMemo(() => buildFeaturesStore(app, enabled), [app, enabled])
  const { store: sidebarStore, idToPath } = useMemo(() => buildSidebarStore(registry.sidebars), [registry])
  const hasSidebar = registry.sidebars.length > 0

  // @useState-hatch — dataSource 로드 결과.
  const [data, setData] = useState<NormalizedData | null>(null)
  // @useState-hatch — 활성 viewMode id.
  const [viewModeId, setViewModeId] = useState<string>('list')
  // @useState-hatch — SplitPane 비율.
  const [sizes, setSizes] = useState<PaneSize[]>(['flex', 0.3])

  const activeView = allViewModes.find(v => v.id === viewModeId) ?? DEFAULT_LIST_MODE

  useEffect(() => {
    const source = registry.dataSources[0]
    if (!source) return
    let cancelled = false
    source.load({ rootPath }).then(d => { if (!cancelled) setData(d) })
    return () => { cancelled = true }
  }, [registry, rootPath])

  const handleFeaturesChange = (next: NormalizedData) => {
    const nextIds = (next.entities[CHECKED_ID]?.checkedIds as string[] | undefined) ?? []
    setEnabled(new Set(nextIds))
  }

  const handleSidebarActivate = (id: string) => {
    const path = idToPath.get(id)
    if (path) setRootPath(path)
  }

  const hasDataSource = registry.dataSources.length > 0
  const hideSidebar = activeView.layout?.hideSidebar ?? false
  const hidePreview = activeView.layout?.hidePreview ?? false
  const focusedId = data ? (data.entities[FOCUS_ID]?.focusedId as string | undefined) : undefined
  const previewPath = data && focusedId && data.entities[focusedId]
    ? ((data.entities[focusedId].data as { path?: string } | undefined)?.path ?? focusedId)
    : undefined

  const ViewRender = activeView.render
  const view = data ? <ViewRender data={data} onChange={setData} /> : null

  const mainArea = !hasDataSource ? (
    <div className={ax({ role: 'control-group', surface: 'sunken', layout: 'stack' })}>
      <div className={ax({ textStyle: 'section' })}>No data source installed</div>
      <div className={ax({ textStyle: 'caption' })}>Open Settings and enable a dataSource feature (e.g. File System).</div>
    </div>
  ) : !data ? (
    <div className={ax({ layout: 'stack' })}>Loading…</div>
  ) : hidePreview || !previewPath ? (
    view
  ) : (
    <SplitPane direction="horizontal" sizes={sizes} onResize={setSizes}>
      <div className={ax({ layout: 'stack', flex: '1' })}>{view}</div>
      <div className={ax({ role: 'control-group', surface: 'sunken', layout: 'stack' })}>
        <FilePanel path={previewPath} />
      </div>
    </SplitPane>
  )

  return (
    <div className={ax({ layout: 'stack', flex: '1' })}>
      <div className={ax({ role: 'control-group', surface: 'base', layout: 'row' })}>
        <div className={ax({ flex: '1' })}>
          <TabList
            data={viewModesStore}
            onActivate={(id) => setViewModeId(id)}
            aria-label="View mode"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowSettings(v => !v)}
          className={ax({ role: 'control', surface: showSettings ? 'action' : 'ghost' })}
          title="Settings"
        >
          <Settings size={14} />
        </button>
      </div>

      {showSettings && (
        <div className={ax({ role: 'control-group', surface: 'raised', layout: 'stack' })}>
          <div className={ax({ textStyle: 'label' })}>Installed features</div>
          <Checkbox data={featuresStore} onChange={handleFeaturesChange} aria-label="Installed features" />
        </div>
      )}

      {hasSidebar && !hideSidebar ? (
        <div className={ax({ layout: 'row', flex: '1' })}>
          <div className={ax({ role: 'control-group', surface: 'sunken', layout: 'stack' })}>
            <NavList data={sidebarStore} onActivate={handleSidebarActivate} aria-label="Sidebar" />
          </div>
          <div className={ax({ layout: 'stack', flex: '1' })}>{mainArea}</div>
        </div>
      ) : (
        mainArea
      )}
    </div>
  )
}
