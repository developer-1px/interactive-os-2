// ② feature-mgmt-view-prd.md — FlatLayout definePage 선언
import { definePage } from '@os/layout/flatLayout'

export const featuresLayout = definePage({
  entities: {
    root: {
      data: { type: 'split', direction: 'vertical', sizes: [0.06, 'flex'], resizable: false },
      children: ['breadcrumb', 'body'],
    },
    breadcrumb: {
      data: { type: 'widget', widget: 'FeatureBreadcrumb' },
    },
    body: {
      data: { type: 'split', direction: 'horizontal', sizes: ['flex', 0.42], resizable: true },
      children: ['master', 'detail'],
    },
    master: {
      data: { type: 'widget', widget: 'FeatureTreeGrid' },
    },
    detail: {
      data: { type: 'stack', hidden: false },
      children: ['detailHeader', 'detailTabs', 'insightFeed'],
    },
    detailHeader: {
      data: { type: 'widget', widget: 'FeatureDetailHeader' },
    },
    detailTabs: {
      data: { type: 'widget', widget: 'FeatureDetailTabs' },
    },
    insightFeed: {
      data: { type: 'widget', widget: 'InsightFeed' },
    },
  },
})
