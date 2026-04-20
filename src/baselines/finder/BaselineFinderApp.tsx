// BaselineFinderApp — defineApp 런타임 조립체 (os-compliant MVP).
//
// 깡통 = TreeView + Preview. Feature 7기여 중 dataSource / viewMode / previewRenderer를
// 이 단계에서 소비. keymap은 각 viewMode 내부 UI(FileTreeTable/MillerColumns/BookSpread)의
// 자체 엔진이 처리; 크로스-viewMode keymap(Book ←/→)은 BookSpread가 자체 dispatch.
// 나머지 기여(sidebar/toolbar/commandPalette)는 후속 단계.

import { useEffect, useMemo, useState } from 'react'
import type { AppDefinition, ViewModeContribution } from '@os/feature/defineFeature'
import { buildRegistry } from '@os/feature/featureRegistry'
import type { NormalizedData, Entity } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'
import { createStore } from '@os/store/createStore'
import { FileTreeTable } from '@entities/file/ui/FileTreeTable'
import { FilePanel } from '../../pages/finder/widgets/FilePanel'
import { FOCUS_ID } from '@os/core'
import { TabList } from '@os/ui/TabList'
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

export function BaselineFinderApp({ app }: { app: AppDefinition }) {
  const registry = useMemo(() => buildRegistry(app), [app])
  const allViewModes = useMemo(() => [DEFAULT_LIST_MODE, ...registry.viewModes], [registry])
  const viewModesStore = useMemo(() => buildViewModesStore(allViewModes), [allViewModes])

  // @useState-hatch — dataSource 로드 결과 보관. async fetch → UI.
  const [data, setData] = useState<NormalizedData | null>(null)
  // @useState-hatch — 활성 viewMode id. view preference (localStorage 후속).
  const [viewModeId, setViewModeId] = useState<string>('list')
  // @useState-hatch — SplitPane 비율. view preference.
  const [sizes, setSizes] = useState<PaneSize[]>(['flex', 0.3])

  const activeView = allViewModes.find(v => v.id === viewModeId) ?? DEFAULT_LIST_MODE

  useEffect(() => {
    const source = registry.dataSources[0]
    if (!source) return
    let cancelled = false
    source.load({}).then(d => { if (!cancelled) setData(d) })
    return () => { cancelled = true }
  }, [registry])

  if (!data) {
    return <div className={ax({ layout: 'stack' })}>Loading…</div>
  }

  const hidePreview = activeView.layout?.hidePreview ?? false
  const focusedId = data.entities[FOCUS_ID]?.focusedId as string | undefined
  const previewPath = focusedId && data.entities[focusedId]
    ? ((data.entities[focusedId].data as { path?: string } | undefined)?.path ?? focusedId)
    : undefined

  const ViewRender = activeView.render
  const view = <ViewRender data={data} onChange={setData} />

  return (
    <div className={ax({ layout: 'stack', flex: '1' })}>
      <TabList
        data={viewModesStore}
        onActivate={(id) => setViewModeId(id)}
        aria-label="View mode"
      />
      {hidePreview || !previewPath ? (
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
