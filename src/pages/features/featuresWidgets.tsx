// ② feature-mgmt-view-prd.md — FlatLayout widget 집합
import { useCallback, useMemo } from 'react'
import type React from 'react'
import { ax } from '@styles/ax'
import { createStore, ROOT_ID } from '@os/schema'
import type { NormalizedData } from '@os/store/types'
import type { NodeState } from '@os/pattern/types'
import { TreeGrid } from '@os/ui/TreeGrid'
import { TabList } from '@os/ui/TabList'
import { Feed } from '@os/ui/Feed'
import { Breadcrumb } from '@os/ui/Breadcrumb'
import { FilterBar } from '@os/ui/FilterBar'
import { PanelHeader } from '@os/ui/PanelHeader'
import { EmptyState } from '@os/ui/EmptyState'
import { Badge } from '@os/ui/Badge'
import { Card } from '@os/ui/Card'
import { Avatar } from '@os/ui/Avatar'
import { StatusIndicator } from '@os/ui/indicators/StatusIndicator'
import { BadgeCell } from '@os/ui/cells/BadgeCell'
import { useFeatures } from './featuresContext'
import type { FeaturesTab } from './featuresContext'
import type { FeatureEntity, FeatureStatus, FeatureLayer, Insight } from './featuresSchema'

// ── helpers ──

function statusTone(status: FeatureStatus): 'success' | 'warning' | 'info' | 'error' {
  switch (status) {
    case 'operational': return 'success'
    case 'prototype': return 'warning'
    case 'concept': return 'info'
    case 'archived': return 'error'
  }
}

function layerTone(layer: FeatureLayer): 'accent' | 'success' | 'warning' | 'neutral' | 'danger' {
  switch (layer) {
    case 'service': return 'accent'
    case 'engine': return 'success'
    case 'infra': return 'warning'
    case 'process': return 'neutral'
    case 'design': return 'danger'
  }
}

function getFeature(store: NormalizedData, id: string) {
  const e = store.entities[id] as unknown as FeatureEntity | undefined
  return e?.data
}

// ── FeatureBreadcrumb ──

export function FeatureBreadcrumb() {
  return (
    <div className={ax({ layout: 'bar', padding: 'sm', width: 'full', gap: 'sm' })}>
      <Breadcrumb path="docs/1-projects/features" root="docs" />
    </div>
  )
}

// ── FeatureToolbar ──

export function FeatureToolbar() {
  const { filter, setFilter } = useFeatures()

  const chips = useMemo(() => {
    const out: { id: string; label: string; value?: string; onRemove?: () => void }[] = []
    for (const s of filter.status ?? []) {
      out.push({
        id: `status:${s}`,
        label: 'status',
        value: s,
        onRemove: () =>
          setFilter((prev) => ({ ...prev, status: (prev.status ?? []).filter((x) => x !== s) })),
      })
    }
    for (const l of filter.layer ?? []) {
      out.push({
        id: `layer:${l}`,
        label: 'layer',
        value: l,
        onRemove: () =>
          setFilter((prev) => ({ ...prev, layer: (prev.layer ?? []).filter((x) => x !== l) })),
      })
    }
    return out
  }, [filter, setFilter])

  return (
    <div className={ax({ layout: 'bar', padding: 'sm', width: 'full', gap: 'sm' })}>
      <FilterBar filters={chips} />
    </div>
  )
}

// ── FeatureTreeGrid ──

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'status', header: 'Status', width: '110px' },
  { key: 'maturity', header: 'Maturity', width: '120px' },
  { key: 'score', header: 'Score', width: '80px' },
]

function applyFilter(
  store: NormalizedData,
  filter: { status?: string[]; layer?: string[] },
): NormalizedData {
  const statusSet = new Set(filter.status ?? [])
  const layerSet = new Set(filter.layer ?? [])
  if (statusSet.size === 0 && layerSet.size === 0) return store

  const keep = new Set<string>()
  for (const [id, e] of Object.entries(store.entities)) {
    const data = (e as unknown as FeatureEntity).data
    if (!data) continue
    if (statusSet.size > 0 && !statusSet.has(data.status)) continue
    if (layerSet.size > 0 && !layerSet.has(data.layer)) continue
    keep.add(id)
  }

  const entities: Record<string, { id: string; data: Record<string, unknown> }> = {}
  const relationships: Record<string, string[]> = { [ROOT_ID]: [] }
  for (const id of keep) {
    const src = store.entities[id]!
    entities[id] = { id, data: src.data as Record<string, unknown> }
    relationships[ROOT_ID]!.push(id)
  }
  return createStore({ entities, relationships })
}

function buildTreeGridData(src: NormalizedData): NormalizedData {
  const entities: Record<string, { id: string; data: Record<string, unknown> }> = {}
  const relationships: Record<string, string[]> = {}
  for (const [id, e] of Object.entries(src.entities)) {
    const data = (e as unknown as FeatureEntity).data
    if (!data) continue
    entities[id] = {
      id,
      data: {
        label: data.name,
        cells: [data.name, data.status, data.maturity, data.score],
        _status: data.status,
        _layer: data.layer,
      },
    }
  }
  for (const [parentId, children] of Object.entries(src.relationships)) {
    relationships[parentId] = [...children]
  }
  return createStore({ entities, relationships })
}

export function FeatureTreeGrid() {
  const { store, filter, setSelectedFeatureId, selectedFeatureId } = useFeatures()

  const filtered = useMemo(() => applyFilter(store, filter), [store, filter])
  const gridData = useMemo(() => buildTreeGridData(filtered), [filtered])

  const handleActivate = useCallback(
    (id: string) => { setSelectedFeatureId(id) },
    [setSelectedFeatureId],
  )

  const renderCell = useCallback(
    (
      props: React.HTMLAttributes<HTMLElement>,
      value: unknown,
      column: { key: string },
      _state: NodeState,
    ): React.ReactElement => {
      if (column.key === 'status') {
        const s = value as FeatureStatus
        return (
          <span {...props} className={ax({ layout: 'bar', gap: 'xs' })}>
            <StatusIndicator tone={statusTone(s)} />
            <span className={ax({ textStyle: 'caption', text: 'muted' })}>{s}</span>
          </span>
        )
      }
      if (column.key === 'maturity') {
        return <span {...props} className={ax({ textStyle: 'caption', text: 'muted' })}>{`${String(value)}/5`}</span>
      }
      if (column.key === 'score') {
        return <span {...props} className={ax({ textStyle: 'caption', text: 'primary' })}>{String(value ?? 0)}</span>
      }
      return <span {...props}>{String(value ?? '')}</span>
    },
    [],
  )

  if (Object.keys(filtered.entities).length === 0) {
    return (
      <EmptyState
        title="feature가 없습니다"
        description="docs/1-projects/features/{slug}.md 를 생성하세요."
      />
    )
  }

  return (
    <div className={ax({ layout: 'fill', scroll: 'y' })}>
      <TreeGrid
        data={gridData}
        columns={columns}
        renderCell={renderCell}
        header
        onActivate={handleActivate}
        onFocusChange={(id) => { if (id) setSelectedFeatureId(id) }}
        aria-label="Features"
        id={selectedFeatureId ?? undefined}
      />
    </div>
  )
}

// ── FeatureDetailHeader ──

export function FeatureDetailHeader() {
  const { store, selectedFeatureId } = useFeatures()
  const feature = selectedFeatureId ? getFeature(store, selectedFeatureId) : undefined

  if (!feature) {
    return (
      <PanelHeader>
        <span>Detail</span>
      </PanelHeader>
    )
  }

  return (
    <PanelHeader axes={{ layout: 'spread' }}>
      <span className={ax({ layout: 'bar', gap: 'sm' })}>
        <StatusIndicator tone={statusTone(feature.status)} />
        <span className={ax({ textStyle: 'section', text: 'primary' })}>{feature.name}</span>
      </span>
      <Badge tone={layerTone(feature.layer)} variant="outline">{feature.layer}</Badge>
    </PanelHeader>
  )
}

// ── FeatureDetailTabs ──

const TABS: { id: FeaturesTab; label: string }[] = [
  { id: 'insights', label: 'Insights' },
  { id: 'details', label: 'Details' },
  { id: 'health', label: 'Health' },
  { id: 'portal', label: 'Portal' },
]

function buildTabsData(): NormalizedData {
  const entities: Record<string, { id: string; data: { label: string } }> = {}
  const ids: string[] = []
  for (const t of TABS) {
    entities[t.id] = { id: t.id, data: { label: t.label } }
    ids.push(t.id)
  }
  return createStore({ entities, relationships: { [ROOT_ID]: ids } })
}

const tabsData = buildTabsData()

export function FeatureDetailTabs() {
  const { activeTab, setActiveTab, selectedFeatureId } = useFeatures()

  const handleActivate = useCallback(
    (id: string) => setActiveTab(id as FeaturesTab),
    [setActiveTab],
  )

  if (!selectedFeatureId) return null

  return (
    <div className={ax({ padding: 'sm' })}>
      <TabList
        data={tabsData}
        onActivate={handleActivate}
        initialFocus={activeTab}
        aria-label="Feature detail tabs"
      />
    </div>
  )
}

// ── InsightCard ──

function insightKindTone(kind?: string): 'accent' | 'success' | 'warning' | 'neutral' {
  if (!kind) return 'neutral'
  if (/결정|decision/i.test(kind)) return 'accent'
  if (/관찰|observ/i.test(kind)) return 'success'
  if (/피드백|feedback/i.test(kind)) return 'warning'
  return 'neutral'
}

function InsightCard({ insight, source }: { insight: Insight; source: string }) {
  return (
    <Card variant="outlined" padding="md">
      <Card.Header>
        <Avatar name={source.charAt(0).toUpperCase() || '·'} size="sm" />
        <span className={ax({ textStyle: 'caption', text: 'muted', flex: '1' })}>{insight.date ?? ''}</span>
        {insight.kind && (
          <BadgeCell tone={insightKindTone(insight.kind)}>{insight.kind}</BadgeCell>
        )}
      </Card.Header>
      <Card.Body>
        <span className={ax({ textStyle: 'body', text: 'primary', clamp: '3' })}>{insight.text}</span>
      </Card.Body>
      {insight.source && (
        <Card.Footer>
          <span className={ax({ textStyle: 'caption', text: 'muted', clamp: '1' })}>출처: {insight.source}</span>
        </Card.Footer>
      )}
    </Card>
  )
}

// ── InsightFeed ──

function buildInsightFeedData(insights: Insight[]): NormalizedData {
  const entities: Record<string, { id: string; data: Record<string, unknown> }> = {}
  const ids: string[] = []
  insights.forEach((ins, i) => {
    const id = `ins-${i}`
    entities[id] = { id, data: { label: ins.text, _insight: ins } }
    ids.push(id)
  })
  return createStore({ entities, relationships: { [ROOT_ID]: ids } })
}

export function InsightFeed() {
  const { activeTab, selectedFeatureId, insightsByFeatureId, store } = useFeatures()

  const insights: Insight[] = selectedFeatureId
    ? insightsByFeatureId[selectedFeatureId] ?? []
    : []

  const feedData = useMemo(() => buildInsightFeedData(insights), [insights])
  const sourceName = useMemo(() => {
    if (!selectedFeatureId) return ''
    const f = getFeature(store, selectedFeatureId)
    return f?.name ?? ''
  }, [store, selectedFeatureId])

  if (!selectedFeatureId) {
    return (
      <div className={ax({ flex: '1', padding: 'md' })}>
        <EmptyState title="feature를 선택하세요" description="왼쪽 TreeGrid에서 row를 선택하면 상세가 표시됩니다." />
      </div>
    )
  }

  if (activeTab !== 'insights') {
    const placeholderLabel =
      activeTab === 'details' ? 'Details 탭은 후속 단계입니다.'
      : activeTab === 'health' ? 'Health 탭은 후속 단계입니다.'
      : 'Portal 탭은 후속 단계입니다.'
    return (
      <div className={ax({ flex: '1', padding: 'md', text: 'muted', textStyle: 'caption' })}>
        {placeholderLabel}
      </div>
    )
  }

  if (insights.length === 0) {
    return (
      <div className={ax({ flex: '1', padding: 'md' })}>
        <EmptyState title="인사이트 없음" description="이 feature의 ## Insights 블록이 비어 있습니다." />
      </div>
    )
  }

  const renderItem = (
    props: React.HTMLAttributes<HTMLElement>,
    node: Record<string, unknown>,
    state: NodeState,
  ): React.ReactElement => {
    const ins = (node.data as { _insight?: Insight } | undefined)?._insight
    return (
      <div {...props} data-focused={state.focused || undefined} className={ax({ padding: 'xs' })}>
        {ins && <InsightCard insight={ins} source={sourceName} />}
      </div>
    )
  }

  return (
    <div className={ax({ flex: '1', scroll: 'y', padding: 'sm', gap: 'sm', layout: 'stack' })}>
      <Feed data={feedData} renderItem={renderItem} aria-label="Insights" />
    </div>
  )
}
