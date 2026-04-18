---
id: 2-areas/layout/prds/flatlayout-nav-catalog-prd
type: prd
slug: flatlayoutNavCatalog
title: 'FlatLayout NavNode + 카탈로그 통합 + 시각 개선 — PRD'
tags: [untagged]
created: 2026-04-11
updated: 2026-04-11
summary: 'Discussion: FlatLayout을 범용 페이지 구조 엔진으로 확장하고, theme/catalog/showcase 3개 페이지를 사이드 Nav + 콘텐츠 구조로 통합하며, 그 과정에서 ax() 축/불변량 충분성을 검증한다.'
legacy:
  status: active
  kind: prd
  topics: [2-areas]
  relates: []
  supersedes: []
---
# FlatLayout NavNode + 카탈로그 통합 + 시각 개선 — PRD

> Discussion: FlatLayout을 범용 페이지 구조 엔진으로 확장하고, theme/catalog/showcase 3개 페이지를 사이드 Nav + 콘텐츠 구조로 통합하며, 그 과정에서 ax() 축/불변량 충분성을 검증한다.

## ① 동기

### WHY

- **Impact**: 카탈로그에 139개 컴포넌트가 flat 나열되어 탐색 불가. 3개 페이지(theme/catalog/showcase)가 각자 네비게이션을 직접 구현해서 중복 + 일관성 부재. FlatLayout이 공간 배치만 담당하여 "페이지 구조"를 선언적으로 표현할 수 없다.
- **Forces**: FlatLayout은 OCP 구조(renderer 맵)로 확장 용이하나, 네비게이션/뷰 전환 개념이 없음. ax() pit of success 불변량은 도입됐지만 실제 컴포넌트에 적용 안 됨.
- **Assets**: NavList, TabList, PanelHeader, GroupHeader 이미 존재. widgetRegistry. pit of success 불변량 3종 (페어링/레벨/시드). definePage 팩토리.
- **Decision**: FlatLayout에 NavNode 추가 → 카탈로그를 Nav 기반으로 전환 → 시각 개선. 기각: 별도 페이지 프레임워크 도입 (FlatLayout이 이미 OCP 확장 가능하므로 불필요).
- **Non-Goals**: 라우트 레벨 통합 (3 라우트를 1개로 합치는 것은 이번 범위 아님). showcaseRegistry 삭제 (테스트 인프라로 유지).

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | /catalog 페이지가 열림 | 사용자가 좌측 Nav에서 카테고리를 선택 | 우측에 해당 카테고리의 컴포넌트 그리드만 표시 | |
| S2 | /catalog에서 특정 카테고리 선택됨 | 사용자가 개별 컴포넌트를 클릭 | 해당 컴포넌트의 상세 데모 페이지 표시 | |
| S3 | FlatLayout 선언에 NavNode 사용 | 페이지 렌더링 | 사이드바(NavList) + 콘텐츠 영역이 split 형태로 나타남 | |
| S4 | 컴포넌트 데모 카드 | 카탈로그에 표시됨 | surface/tone이 ax() 불변량에 따라 적용되어 시각적 위계가 있음 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `NavNode` (flatLayout.ts) | 새 노드 타입. sidebarWidth, children[0]=nav, children[1]=content | |
| `nav` 렌더러 (FlatLayout.tsx) | NavNode → split(sidebar NavList + content area) 렌더링 | |
| `TabNode` (flatLayout.ts) | 새 노드 타입. children=탭 패널들. 선택된 탭의 자식만 렌더 | |
| `tab` 렌더러 (FlatLayout.tsx) | TabNode → TabList + 패널 렌더링 | |
| `SectionNode` (flatLayout.ts) | 제목 + 콘텐츠 묶음. 기존 stack+header 패턴을 전용 노드로 | |
| `section` 렌더러 (FlatLayout.tsx) | SectionNode → GroupHeader + children 렌더링 | |
| catalogLayout.ts 리팩토링 | buildCatalogLayout → NavNode 기반 카테고리 네비게이션 | |
| 데모 카드 시각 개선 | PageCatalog의 데모 카드 래퍼에 surface/tone ax() 적용 | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| NavNode 선언 `{ type: 'nav', sidebarWidth: 0.2 }` | 초기 렌더 | FlatLayout이 nav 렌더러 호출 | children[0]이 nav 영역, 나머지가 content 영역으로 매핑 | split 레이아웃: 좌=NavList, 우=선택된 콘텐츠 | |
| Nav에서 항목 activate | 카테고리 A 선택됨 | NavList의 onActivate 콜백 → content 영역에 해당 자식 렌더 | nav 렌더러가 active 상태를 추적하여 대응 content children 중 매칭되는 것만 표시 | 카테고리 B의 컴포넌트 그리드 표시 | |
| TabNode 선언 `{ type: 'tab' }` | 초기 렌더 | tab 렌더러가 첫 번째 탭 활성 | children이 각각 탭 패널 — data.label이 탭 제목 | 첫 탭 활성, 해당 패널 콘텐츠 표시 | |
| SectionNode 선언 `{ type: 'section', title: 'Components', count: 85 }` | 렌더 | section 렌더러가 GroupHeader + children 표시 | 반복되는 header+stack 패턴을 단일 노드로 추상화 | GroupHeader(제목+카운트) + 자식 콘텐츠 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| NavNode children이 0개 | 빈 nav | 빈 사이드바라도 레이아웃 유지 | 빈 NavList + 빈 content 표시 | 깨지지 않음 | |
| NavNode children이 1개 (nav만, content 없음) | nav만 있음 | nav 없이 content만 있는 것도 유효할 수 있음 | nav 영역만 표시, content 빈 영역 | 레이아웃 유지 | |
| 카테고리에 컴포넌트 100개+ | 대량 컴포넌트 | 스크롤 가능해야 content 영역 overflow 방지 | content 영역 독립 스크롤 | nav 고정, content 스크롤 | |
| 브라우저 뒤로가기 | nav에서 카테고리 변경 후 | URL 상태와 nav 상태 동기화 | urlSync 플러그인이 active 상태를 URL에 반영 | 이전 카테고리로 복귀 | |
| NavNode 안에 NavNode 중첩 | 중첩 nav | 단순 구현에서는 허용하되, 실용적 사용은 없음 | 외부 nav의 content에 내부 nav 렌더 | 중첩 사이드바 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 선언적 OCP — 파일/함수 단위 분리 (feedback_declarative_ocp) | ② 렌더러 추가 | ✅ 준수 | layoutRenderers 맵에 `nav`/`tab`/`section` 키 추가만으로 확장 | |
| 2 | OCP ≠ 거대 Record 맵 (feedback_ocp_not_record_map) | ② 렌더러 맵 | ⚠️ 주의 | 현재 layoutRenderers가 1파일. 렌더러가 9개로 늘면 파일 분리 검토 | |
| 3 | ax()만 사용, style={} 금지 (feedback_style_is_hatch) | ② 모든 렌더러 | ✅ 준수 | split 렌더러의 기존 style={}(splitPane CSS var)은 module.css last-mile | |
| 4 | Surface last-mile 금지 (feedback_surface_no_lastmile) | ② 데모 카드 | ✅ 준수 | surface는 ax()로만 | |
| 5 | UI 컴포넌트 우선 (feedback_ui_over_primitives) | ② nav 렌더러 | ✅ 준수 | nav 렌더러가 NavList ui 컴포넌트 사용 | |
| 6 | Padding은 layout 유형 (feedback_padding_by_layout_type) | ② nav/content 영역 | ✅ 준수 | nav=bar(xs/sm), content=콘텐츠(md/lg) | |
| 7 | OS 컴포넌트 Aria 자동 참여 (feedback_os_components_aria_aware) | ② FlatLayout | ✅ 준수 | FlatLayout이 이미 useAria 사용 | |
| 8 | CSS @layer 잠금 (feedback_css_layer_lock) | ② 새 CSS | ✅ 준수 | 새 CSS는 @layer component 래핑 | |
| 9 | FlatLayout Phase1=pages, Phase2=ui (project_flat_layout_engine) | ② 전체 | ✅ 준수 | 카탈로그=pages 레이어 | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | flatLayout.ts LayoutNode 유니온 | NavNode/TabNode/SectionNode 추가로 타입 확장 | 낮 | 유니온 추가는 기존 코드에 영향 없음 (OCP) | |
| 2 | catalogLayout.ts buildCatalogLayout | 함수 시그니처/반환값은 동일(NormalizedData), 내부 구조만 변경 | 중 | PageCatalog가 반환값만 소비하므로 호환 | |
| 3 | PageBookViewer.tsx | FlatLayout 사용 중 — 새 렌더러 추가는 기존 렌더에 영향 없음 | 낮 | OCP 보장 | |
| 4 | FlatLayout.module.css | nav 렌더러용 CSS 추가 필요 (사이드바 고정, content 스크롤) | 낮 | @layer component 래핑 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | nav 렌더러에서 useAria/useAriaZone 직접 사용 | ⑤ #5 UI 우선 | NavList 컴포넌트를 사용해야 함 | |
| 2 | nav 렌더러에 style={} 인라인 스타일 | ⑤ #3 ax() 전용 | ax() + module.css last-mile만 | |
| 3 | surface 속성을 module.css에서 재지정 | ⑤ #4 surface last-mile 금지 | surface는 ax()로만 | |
| 4 | 기존 라우트(/catalog, /ui/*, /internals/theme) 삭제 | ① Non-Goals | 라우트 통합은 이번 범위 아님 | |
| 5 | showcaseRegistry 삭제 | ① Non-Goals | 테스트 인프라로 유지 | |
| 6 | layoutRenderers를 별도 파일로 분리 (이번 단계) | ⑤ #2 | 9개까지는 1파일 유지. 추후 검토 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | ①S1 | /catalog 접속 → Nav에서 'Composites' 클릭 | 우측에 Composites 카테고리 컴포넌트만 표시 | |
| V2 | ①S3 | definePage에 NavNode 포함 → FlatLayout 렌더 | 사이드바 + 콘텐츠 split 구조 표시 | |
| V3 | ①S4 | 데모 카드가 렌더됨 | surface: 'display', border-radius, tone 적용됨 | |
| V4 | ④ | NavNode children 0개 | 빈 사이드바 + 빈 content, 에러 없음 | |
| V5 | ④ | content에 100개 위젯 | content 영역 독립 스크롤, nav 고정 | |
| V6 | ④ | 브라우저 뒤로가기 | URL → nav 상태 복원 | |
| V7 | ①S3 | TabNode 포함 선언 → FlatLayout 렌더 | TabList + 첫 탭 패널 표시 | |
| V8 | ②  | SectionNode 선언 → 렌더 | GroupHeader(제목+카운트) + children 표시 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

## 교차 검증

1. **동기 ↔ 검증**: S1→V1, S3→V2, S4→V3 ✅ 모든 동기 커버
2. **인터페이스 ↔ 산출물**: NavNode/TabNode/SectionNode 인터페이스가 산출물과 1:1 ✅
3. **경계 ↔ 검증**: 빈 children→V4, 대량→V5, 뒤로가기→V6 ✅
4. **금지 ↔ 출처**: 6개 금지 모두 ⑤/⑥/① 출처 명시 ✅
5. **원칙 대조 ↔ 전체**: #2(거대 맵 주의)는 ⑦#6에서 대응 ✅

#kind/prd #topic/layout
