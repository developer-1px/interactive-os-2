---
id: 2-areas/ui/prds/a2ui-composites-prd
title: 'A2UI Composites — PRD'
created: 2026-04-07
updated: 2026-04-08
summary: 'Discussion: LLM이 Row/Column/Card 수준 레이아웃을 직접 설계하면 와이어프레임 수준에 머문다. 의도 수준 컴포넌트(composites)를 ui/ 하위에 추가하여 Pit of Success를 구조적으로 해결한다.'
legacy:
  status: active
  kind: prd
  topics: [2-areas]
  relates: []
  supersedes: []
---
# A2UI Composites — PRD

> Discussion: LLM이 Row/Column/Card 수준 레이아웃을 직접 설계하면 와이어프레임 수준에 머문다. 의도 수준 컴포넌트(composites)를 ui/ 하위에 추가하여 Pit of Success를 구조적으로 해결한다.

## ① 동기

### WHY

- **Impact**: A2UI로 UI를 생성할 때, LLM이 합성 레이아웃(대시보드, 폼+사이드바)을 직접 설계해야 하므로 제품급 결과물이 나오지 않는다. 엔진의 핵심 가치인 "선언하면 제품이 나온다"가 깨진다.
- **Forces**: (1) A2UI 프로토콜의 컴포넌트가 HTML 수준 추상화(Row, Column, Card)에 머물러 있어 LLM에게 너무 많은 디자인 결정을 위임한다. (2) 개별 컴포넌트(TextField, RadioGroup)는 ax() 기본값으로 충분하지만, 합성(카드 그리드, 마스터-디테일)은 기본값이 없다.
- **Decision**: ui/composites/ 하위 그룹으로 의도 수준 컴포넌트를 추가한다. 레이어를 올리지 않고 ui/ 안에 둔다(순환 의존 방지, panels/items/cells/와 동일 레벨). 기각된 대안: (a) 새 L8 레이어 → A2UISurface가 ui/ 안에 있어 순환 의존, (b) LLM 프롬프트 개선 → 구조적 해결이 아님.
- **Non-Goals**: (1) 기존 A2UI 프로토콜 스펙 변경 (composites는 렌더러 측 확장), (2) 범용 페이지 빌더 (조작형 UI 도메인만), (3) npm 패키지 배포 (앱 내부 우선, 추후 tsup entry 추가).

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | LLM이 대시보드 UI를 생성하려 함 | `{ component: "StatGrid", items: [...] }` 선언 | 4개 KPI 카드가 2×2 그리드로, ax() 기본 surface/padding/gap 적용되어 제품급으로 렌더됨 | |
| M2 | LLM이 폼 섹션을 생성하려 함 | `{ component: "FormSection", fields: [...], actions: [...] }` 선언 | Card 안에 필드+Divider+CTA 버튼이 정렬된 완성 폼이 렌더됨 | |
| M3 | LLM이 리스트+상세 레이아웃을 생성하려 함 | `{ component: "MasterDetail", master: "list-id", detail: "detail-id" }` 선언 | 좌측 리스트 + 우측 Card 패널이 적절한 비율로 렌더됨 | |
| M4 | LLM이 단계별 위저드를 생성하려 함 | `{ component: "StepWizard", steps: [...] }` 선언 | 탭+폼 위저드가 렌더됨 | |
| M5 | LLM이 검색 가능 리스트를 생성하려 함 | `{ component: "SearchableList", items: [...] }` 선언 | 검색 입력+필터링 리스트가 렌더됨 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `ui/composites/StatGrid.tsx` | KPI 카드 N개를 자동 그리드 배치하는 컴포넌트. items prop으로 value/label 배열 수용 | |
| `ui/composites/FormSection.tsx` | Card+Column+필드+Divider+CTA 패턴. title?, fields, actions prop | |
| `ui/composites/MasterDetail.tsx` | 좌 콘텐츠(master) + 우 Card 패널(detail) 2분할. master/detail은 children ID 참조 | |
| `ui/composites/StepWizard.tsx` | Tabs 기반 단계별 폼. steps 배열로 각 탭 title + content ID | |
| `ui/composites/SearchableList.tsx` | 검색 TextField + 필터링 List 조합. items 배열 + searchLabel | |
| `ui/composites/index.ts` | re-export만. Record 리터럴 금지 | |
| `A2UISurface.tsx` 수정 | defaultComponentMap에 5개 composite 렌더러 등록 | |
| `a2uiPresets.ts` 수정 | 기존 Dashboard/Onboarding/Booking 프리셋을 composite 버전으로 교체 또는 병행 | |

완성도: 🟢

## ③ 인터페이스

A2UI JSON → 렌더러 함수 인터페이스. 각 composite는 `A2UIComponentRenderer = (ctx: A2UIRenderContext) => ReactNode` 시그니처.

### StatGrid

| 입력 (JSON) | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------------|----------|------|-------------------|----------|-------|
| `{ component: "StatGrid", items: [{ id, value, label }...] }` | 빈 화면 | items 배열을 순회하여 Card > Column [Text h2, Text caption] 생성 | StatGrid 렌더러가 ax({ layout: 'row', gap: 'md' }) + 각 카드에 ax({ surface: 'display', padding: 'md' }) 기본값 소유 | N개 KPI 카드가 균등 배치된 그리드 | |
| `{ component: "StatGrid", children: { path: "/stats" } }` | dataModel에 stats 배열 | path에서 데이터 resolve → items와 동일 처리 | A2UI 데이터 바인딩 (resolveValue) 재사용 | 데이터 바인딩된 StatGrid | |

### FormSection

| 입력 (JSON) | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------------|----------|------|-------------------|----------|-------|
| `{ component: "FormSection", title?: string, fields: [childId...], actions?: [{ label, variant? }] }` | 빈 화면 | fields의 각 childId를 renderNode로 위임, actions는 Button으로 렌더 | FormSection이 Card+Column+Divider+CTA Row 레이아웃 소유. fields는 기존 A2UI 컴포넌트(TextField, ChoicePicker 등)를 재사용 | Card 안에 폼 필드 + 구분선 + 액션 버튼이 정렬됨 | |

### MasterDetail

| 입력 (JSON) | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------------|----------|------|-------------------|----------|-------|
| `{ component: "MasterDetail", master: "childId", detail: "childId" }` | 빈 화면 | master를 좌측 Column으로, detail을 우측 Card로 렌더 | MasterDetail이 ax({ layout: 'row', gap: 'lg' }) + detail에 Card 래핑 소유 | 좌 콘텐츠 + 우 Card 패널 2분할 레이아웃 | |

### StepWizard

| 입력 (JSON) | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------------|----------|------|-------------------|----------|-------|
| `{ component: "StepWizard", title?, subtitle?, steps: [{ title, content: "childId" }] }` | 빈 화면 | 헤더 렌더 + Tabs 컴포넌트 생성, 각 탭에 content childId 위임 | StepWizard가 헤더 Column + Tabs 구조 소유. 각 탭 content는 renderNode로 위임 | 탭 네비게이션 가능한 단계별 위저드 | |

### SearchableList

| 입력 (JSON) | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------------|----------|------|-------------------|----------|-------|
| `{ component: "SearchableList", items: [{ id, label, sublabel? }], searchLabel?, "aria-label"? }` | 빈 화면 | 검색 TextField + 필터링 로직 + List 렌더 | SearchableList가 Column[TextField, Divider, List] 레이아웃 + 클라이언트 필터링 소유 | 검색 입력에 따라 실시간 필터링되는 리스트 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| StatGrid items가 0개 | 빈 StatGrid | 빈 그리드는 레이아웃을 깨트리지 않아야 함 | 빈 Row 렌더 (높이 0, 공간 차지 않음) | 다른 컴포넌트에 영향 없음 | |
| StatGrid items가 7개 | 4개 이상 | 줄바꿈으로 자연스럽게 배치되어야 함 | flex-wrap으로 다음 줄에 배치 | 2행 이상 그리드 | |
| FormSection fields가 빈 배열 | 필드 없음 | 빈 폼이라도 Card 컨테이너는 유지해야 일관성 | Card만 렌더, Divider/actions 숨김 | 빈 Card | |
| FormSection actions 생략 | actions prop 없음 | 액션 없는 정보 표시용 섹션도 유효 | Divider와 CTA Row 미렌더 | 필드만 있는 Card | |
| MasterDetail detail 생략 | detail childId 없음 | 단일 패널 모드도 지원해야 함 | master만 전체 너비로 렌더 | 단일 Column | |
| StepWizard steps가 1개 | 탭 1개 | 탭이 1개면 탭 바 불필요 | 탭 바 숨기고 content만 렌더 | 단일 폼 | |
| SearchableList items가 100개+ | 대량 | 가상화 없이도 검색 필터링으로 표시량 감소 | 필터링 후 최대 50개 표시 (?) | 스크롤 가능 리스트 | |
| 중첩 composite | MasterDetail > FormSection | 렌더러가 renderNode로 위임하므로 중첩 자연스럽게 동작 | 재귀 렌더링 | 중첩된 composite 정상 렌더 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | Composite = ui/ 조합 (feedback_composite_is_ui_combination) | ② 전체 | ✅ 준수 | — composites 내부에서 ui/ 완성품만 import. primitives(useAria, Aria.Item) 직접 사용 금지 | |
| 2 | LLM은 UI 컴포넌트만 (feedback_ui_over_primitives) | ③ 인터페이스 | ✅ 준수 | — composites가 추상화 수준을 올려서 LLM이 더 적은 결정으로 더 좋은 결과를 얻음 | |
| 3 | OCP = 파일/함수 단위 분리 (feedback_ocp_not_record_map) | ② composites/index.ts | ⚠️ 주의 | index.ts는 re-export만. defaultComponentMap에 등록은 개별 import | |
| 4 | 파일명 = 주 export (CLAUDE.md) | ② 전체 | ✅ 준수 | StatGrid.tsx → export function StatGrid 또는 export statGridRenderer | |
| 5 | ax()만 사용, style={} 금지 (CLAUDE.md + feedback_style_is_hatch) | ③ 렌더러 구현 | ✅ 준수 | 모든 레이아웃/시각을 ax() 축으로 표현 | |
| 6 | surface 소유 속성에 last-mile 금지 (feedback_surface_no_lastmile) | ③ Card 사용 | ✅ 준수 | Card의 border/shadow/bg는 surface 축이 소유. module.css 재지정 금지 | |
| 7 | interactive 축 필수 (CLAUDE.md) | ③ SearchableList | ✅ 준수 | List 아이템에 interactive: 'item' 적용 (기존 List 컴포넌트가 소유) | |
| 8 | DOM 배치가 컴포넌트의 이유 (feedback_dom_placement_is_component_reason) | ② 5개 분리 | ✅ 준수 | StatGrid(그리드 배치), FormSection(카드 폼), MasterDetail(좌우 분할) — DOM 구조가 다름 | |
| 9 | 선언적 OCP (feedback_declarative_ocp) | ② componentMap 등록 | ✅ 준수 | 새 composite = 파일 추가 + componentMap에 키 추가. 기존 코드 수정 최소화 | |
| 10 | render function is slot (feedback_render_function_is_slot) | ③ children 위임 | ✅ 준수 | composites는 renderNode/renderChildren으로 자식 렌더를 위임 | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | A2UISurface defaultComponentMap | Chat 모듈(A2UIBlock)이 동일 componentMap을 사용하므로, 서버가 composite 타입을 보내면 즉시 렌더됨 | 낮음 | 의도된 동작. Chat에서도 composites가 렌더되는 것은 이점 | |
| 2 | a2uiPresets.ts | 기존 프리셋을 composite 버전으로 교체하면 Playground 표시가 달라짐 | 낮음 | composite 프리셋을 새 카테고리로 추가하여 병행. 기존 프리셋 유지 | |
| 3 | A2UISurface.tsx import 증가 | composite 렌더러가 ui/ 완성품을 import → 번들 크기 증가 가능 | 낮음 | composites는 동적 import 또는 lazy 검토. 초기에는 직접 import으로 시작 | |
| 4 | A2UI 테스트 부재 | 기존 A2UI 테스트가 없어 regression 감지 불가 | 중간 | composites에 대한 기본 렌더 테스트 작성 필수 | |

완성도: 🟡 (테스트 전략은 구현 시 구체화)

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | composite 내부에서 useAria, useAriaZone, Aria.Item 직접 사용 | ⑤-1 (Composite = ui/ 조합) | 레이어 위반. 기존 ui/ 완성품을 통해서만 인터랙션 접근 | |
| 2 | composites/index.ts에 Record<string, Renderer> 거대 맵 | ⑤-3 (OCP = 파일 단위 분리) | switch와 동일한 안티패턴. 개별 파일 export → index re-export | |
| 3 | composite 구현에서 style={} 사용 | ⑤-5 (ax()만 사용) | 해치. ax() 축으로만 시각 표현 | |
| 4 | composite의 Card에 module.css로 border/shadow 재지정 | ⑤-6 (surface last-mile 금지) | surface가 소유하는 속성을 외부에서 덮으면 테마 일관성 파괴 | |
| 5 | 기존 프리셋을 삭제하고 composite 버전으로 대체 | ⑥-2 | before/after 비교가 필요. 새 카테고리로 병행 추가 | |
| 6 | A2UI 프로토콜 타입 변경 | Non-Goal | composites는 렌더러 측 확장. 프로토콜은 그대로 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | ①M1 | StatGrid에 items 4개 전달 | 4개 KPI 카드가 균등 배치, 각 카드에 값(h2)+레이블(caption) | |
| V2 | ①M2 | FormSection에 title + fields 3개 + actions 1개 전달 | Card 안에 제목+필드 3개+Divider+CTA 버튼 | |
| V3 | ①M3 | MasterDetail에 master(리스트) + detail(요약) 전달 | 좌 리스트 + 우 Card 패널 2분할 | |
| V4 | ①M4 | StepWizard에 steps 3개 전달 | 3개 탭 + 각 탭에 폼 컨텐츠 | |
| V5 | ①M5 | SearchableList에 items 5개 전달, 검색어 입력 | 필터링된 결과만 표시 | |
| V6 | ④-1 | StatGrid items 0개 | 빈 Row, 레이아웃 깨지지 않음 | |
| V7 | ④-2 | StatGrid items 7개 | flex-wrap으로 다음 줄 배치 | |
| V8 | ④-5 | MasterDetail detail 생략 | master만 전체 너비 | |
| V9 | ④-7 | StepWizard steps 1개 | 탭 바 없이 content만 | |
| V10 | ④-8 | MasterDetail > FormSection 중첩 | 정상 렌더 | |
| V11 | ⑥-1 | Chat에서 서버가 StatGrid JSON 전송 | A2UIBlock에서 정상 렌더 | |
| V12 | — | 기존 프리셋(Dashboard)이 여전히 동작 | composite 추가가 기존 렌더에 영향 없음 | |
| V13 | — | Playground에서 composite 프리셋 선택 → Simulate Stream | 스트리밍 렌더 정상 동작 | |

완성도: 🟢

---

**전체 완성도:** 🟢 7/8 (⑥만 🟡 — 테스트 전략 구현 시 구체화)

## 교차 검증

1. **동기 ↔ 검증**: M1~M5 동기 → V1~V5 검증으로 1:1 커버 ✅
2. **인터페이스 ↔ 산출물**: 5개 composite의 JSON 입력 형식이 산출물 파일과 1:1 ✅
3. **경계 ↔ 검증**: 8개 경계 → V6~V10으로 주요 엣지케이스 커버 ✅
4. **금지 ↔ 출처**: 6개 금지 모두 ⑤/⑥에서 파생, 출처 유효 ✅
5. **원칙 대조 ↔ 전체**: 위반 없음, 수정 불필요 ✅

#kind/prd #topic/ui
