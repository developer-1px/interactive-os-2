// MillerFeature — TreeView 대체 렌더러. 깡통의 viewMode 레지스트리에 'columns'를 등록한다.
//
// 자동 노출: viewMode를 register하면 깡통 toolbar의 viewMode switcher에 버튼이 뜸.
// 별도 toolbar 기여 불필요 — 'auto_derivation_is_system' 원칙.

import { Columns3 } from 'lucide-react'
import { createElement } from 'react'
import { defineFeature } from '@os/feature/defineFeature'
import { FinderMillerWidget } from '../../pages/finder/finderWidgets'

export const MillerFeature = defineFeature({
  id: 'miller',
  name: 'Miller Columns',
  version: '0.1.0',
  description: '컬럼형 계층 브라우저 (macOS Finder columns view)',

  viewMode: {
    id: 'columns',
    label: 'Columns',
    icon: createElement(Columns3, { size: 14 }),
    render: FinderMillerWidget as never, // 임시: FinderMillerWidget은 context 사용, 추후 props 기반으로 변환
    layout: {
      hidePreview: true, // Miller는 마지막 컬럼이 프리뷰 역할 → 깡통 preview 숨김
    },
  },
})
