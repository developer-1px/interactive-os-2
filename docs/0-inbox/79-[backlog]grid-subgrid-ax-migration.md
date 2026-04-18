# Grid Subgrid → ax() 축 승격 마이그레이션 — 2026-04-16

## 배경

shadcn 매핑 작업 중 PipelineGrid 스크린샷에서 그리드 구조 깨짐 발견. TreeGrid.tsx가 Grid.module.css를 import하지 않아서 subgrid 규칙이 미적용됨. module.css 기반 레이아웃은 import 누락 시 조용히 깨지므로, ax() 축으로 승격하여 타입 시스템으로 보호해야 한다.

## 현황

- `Grid.module.css`에 CSS Grid subgrid 레이아웃이 last-mile로 구현됨
- Grid.tsx는 import하지만 TreeGrid.tsx는 import 안 함 → PipelineGrid 렌더링 깨짐
- `grid-row`, `grid-header`, `grid-col-count` 등 raw CSS 클래스가 module.css 없이 사용됨

## 문제

- subgrid가 module.css에 있으면 import 누락 시 조용히 깨짐
- ax() 축으로 올리면 타입 시스템이 보호

## 제안

- ax() layout 축에 grid subgrid 관련 값 추가 (예: `layout: 'subgrid'`, `layout: 'grid-row'`)
- 또는 별도 축 `grid` 도입
- `--grid-columns`, `--grid-col-count` CSS 변수를 ax.css로 이관
- Grid.module.css → ax.css로 규칙 이관 후 module.css 삭제
- TreeGrid.tsx, Grid.tsx 모두 ax() 축만으로 동작하도록 변환

## 다음 행동

- /discuss로 축 설계 방향 결정 (layout 확장 vs 새 축)
- /do로 마이그레이션 실행
