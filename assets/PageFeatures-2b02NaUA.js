var e=`// ② feature-mgmt-view-prd.md — /features 라우트 진입점
// @useState-hatch — selectedFeatureId/activeTab/filter/multiSelect: UI 상태, store는 md 파일 SSOT
import { useMemo, useState, useCallback } from 'react'
import { FlatLayout } from '@os/ui/FlatLayout'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { updateEntityData } from '@os/schema'
import { useGlobalTrap, type GlobalTrapKeyMap } from '@os/primitives/useGlobalTrap'
import { FeaturesProvider, type FeaturesTab, type FeaturesFilter, type FeaturesContextValue } from './featuresContext'
import { useFeaturesData } from './featuresStore'
import { featuresLayout } from './featuresDefinePage'
import {
  FeatureBreadcrumb,
  FeatureTreeGrid,
  FeatureDetailHeader,
  FeatureDetailTabs,
  InsightFeed,
} from './featuresWidgets'

const featureWidgets = createWidgetRegistry({
  FeatureBreadcrumb,
  FeatureTreeGrid,
  FeatureDetailHeader,
  FeatureDetailTabs,
  InsightFeed,
})

export default function PageFeatures() {
  const { store, insightsByFeatureId, errors } = useFeaturesData()

  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<FeaturesTab>('insights')
  const [filter, setFilter] = useState<FeaturesFilter>({})
  const [multiSelect, setMultiSelect] = useState<string[]>([])

  const layoutData = useMemo(
    () => updateEntityData(featuresLayout, 'detail', { hidden: selectedFeatureId == null }),
    [selectedFeatureId],
  )

  const handleEscape = useCallback(() => {
    setSelectedFeatureId(null)
    setActiveTab('insights')
  }, [])

  const escapeKeyMap = useMemo<GlobalTrapKeyMap>(
    () => ({ Escape: handleEscape }),
    [handleEscape],
  )
  useGlobalTrap(selectedFeatureId != null, escapeKeyMap, { trap: false })

  const ctx = useMemo<FeaturesContextValue>(
    () => ({
      store,
      insightsByFeatureId,
      selectedFeatureId,
      setSelectedFeatureId,
      activeTab,
      setActiveTab,
      filter,
      setFilter,
      multiSelect,
      setMultiSelect,
      errors,
    }),
    [store, insightsByFeatureId, selectedFeatureId, activeTab, filter, multiSelect, errors],
  )

  return (
    <FeaturesProvider value={ctx}>
      <FlatLayout data={layoutData} registry={featureWidgets} aria-label="Features" />
    </FeaturesProvider>
  )
}
`;export{e as default};