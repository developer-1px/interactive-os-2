// BaselineFinder — TreeView + Preview 두 개만 가진 깡통 Finder.
// Feature들을 조립하기 전의 최소 본체. 실제 render는 후속 단계에서 BaselineFinderApp으로.

import type { BaselineDefinition } from '@os/feature/defineFeature'

export const BaselineFinder: BaselineDefinition = {
  id: 'finder',
  name: 'Finder',
  /** dataSource 없으면 깡통은 빈 TreeView → 1개 이상 필수 */
  required: ['dataSource'],
  /** 깡통이 제공하는 slot 이름들. Feature는 이 slot에만 기여 가능 */
  slots: [
    'sidebar',         // 좌측 사이드바
    'toolbar',         // 상단 툴바
    'mainHeader',      // 메인 영역 상단 (breadcrumb 등)
    'treeContent',     // TreeView 본체 (viewMode가 override)
    'previewContent',  // Preview 본체 (previewRenderer가 파일 타입별 override)
    'overlay',         // QuickOpen 등 전면 오버레이
  ],
}
