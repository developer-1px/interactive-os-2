// BaselineFinderApp — defineApp 런타임 조립체 (os-compliant MVP).
//
// 깡통 = TreeView + Preview. Feature 기여 중 dataSource / viewMode 를 이 단계에서 소비.
// Settings 토글로 Feature를 런타임 install/uninstall — 마켓플레이스 UX 증명.

import { useEffect, useMemo, useState } from 'react'
import { Settings } from 'lucide-react'
import type { AppDefinition, ViewModeContribution } from '@os/feature/defineFeature'
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

export function BaselineFinderApp({ app }: { app: AppDefinition }) {
  // @useState-hatch — install/uninstall 토글. 마켓플레이스 상태, 축 부재.
  const [enabled, setEnabled] = useState<Set<string>>(() => new Set(app.features.map(f => f.id)))
  // @useState-hatch — 설정 패널 열림 상태. dismiss 축 후보.
  const [showSettings, setShowSettings] = useState(false)

  const activeFeatures = useMemo(
    () => app.features.filter(f => enabled.has(f.id)),
    [app, enabled],
  )
  const registry = useMemo(() => buildRegistry({ ...app, features: activeFeatures }), [app, activeFeatures])
  const allViewModes = useMemo(() => [DEFAULT_LIST_MODE, ...registry.viewModes], [registry])
  const viewModesStore = useMemo(() => buildViewModesStore(allViewModes), [allViewModes])
  const featuresStore = useMemo(() => buildFeaturesStore(app, enabled), [app, enabled])

  // @useState-hatch — dataSource 로드 결과. async fetch → UI.
  const [data, setData] = useState<NormalizedData | null>(null)
  // @useState-hatch — 활성 viewMode id. view preference.
  const [viewModeId, setViewModeId] = useState<string>('list')
  // @useState-hatch — SplitPane 비율.
  const [sizes, setSizes] = useState<PaneSize[]>(['flex', 0.3])

  const activeView = allViewModes.find(v => v.id === viewModeId) ?? DEFAULT_LIST_MODE

  useEffect(() => {
    const source = registry.dataSources[0]
    if (!source) { setData(null); return }
    let cancelled = false
    source.load({}).then(d => { if (!cancelled) setData(d) })
    return () => { cancelled = true }
  }, [registry])

  const handleFeaturesChange = (next: NormalizedData) => {
    const nextIds = (next.entities[CHECKED_ID]?.checkedIds as string[] | undefined) ?? []
    setEnabled(new Set(nextIds))
  }

  const hasDataSource = registry.dataSources.length > 0
  const hidePreview = activeView.layout?.hidePreview ?? false
  const focusedId = data ? (data.entities[FOCUS_ID]?.focusedId as string | undefined) : undefined
  const previewPath = data && focusedId && data.entities[focusedId]
    ? ((data.entities[focusedId].data as { path?: string } | undefined)?.path ?? focusedId)
    : undefined

  const ViewRender = activeView.render
  const view = data ? <ViewRender data={data} onChange={setData} /> : null

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

      {!hasDataSource ? (
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
      )}
    </div>
  )
}
