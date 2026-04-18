var e=`import { createDomainContext } from '@os/layout'
import type { NormalizedData } from '@os/store/types'
import type { Insight, FeatureParseError } from './featuresSchema'

export type FeaturesTab = 'insights' | 'details' | 'health' | 'portal'

export interface FeaturesFilter {
  status?: string[]
  layer?: string[]
}

export interface FeaturesContextValue {
  store: NormalizedData
  insightsByFeatureId: Record<string, Insight[]>
  selectedFeatureId: string | null
  setSelectedFeatureId: (id: string | null) => void
  activeTab: FeaturesTab
  setActiveTab: (t: FeaturesTab) => void
  filter: FeaturesFilter
  setFilter: (f: FeaturesFilter | ((prev: FeaturesFilter) => FeaturesFilter)) => void
  multiSelect: string[]
  setMultiSelect: (ids: string[] | ((prev: string[]) => string[])) => void
  errors: FeatureParseError[]
}

export const [FeaturesProvider, useFeatures] = createDomainContext<FeaturesContextValue>('Features')
`;export{e as default};