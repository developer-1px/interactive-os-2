---
id: 2-areas/design/prds/css-layer-lock-prd
type: prd
slug: cssLayerLock
title: 'CSS @layer 구조/상태 잠금 — PRD'
tags: [data-focused]
created: 2026-04-08
updated: 2026-04-08
summary: 'Discussion: os 부품으로 조립해도 디자인 일관성이 없음 → recipe/interactive가 convention으로만 잠기고 CSS cascade에서 강제되지 않음 → @layer 도입으로 물리적 잠금'
legacy:
  status: active
  kind: prd
  topics: [2-areas, data-focused]
  relates: []
  supersedes: []
---
# CSS @layer 구조/상태 잠금 — PRD

> Discussion: os 부품으로 조립해도 디자인 일관성이 없음 → recipe/interactive가 convention으로만 잠기고 CSS cascade에서 강제되지 않음 → @layer 도입으로 물리적 잠금

## ① 동기

### WHY

- **Impact**: 모든 ui/ 완성품이 같은 패밀리로 보여야 하는데, component CSS가 recipe/interactive 속성을 자유롭게 덮어써서 시각적 불일관이 발생한다. 테마를 바꿔도 깨지지 않는 구조/상태 잠금이 없다.
- **Forces**: recipe(구조)와 interactive(상태)가 `@layer ax`에 있고 나머지 CSS는 unlayered → CSS cascade 규칙상 **unlayered가 항상 layered를 이긴다.** 현재는 잠금이 아니라 역잠금 구조. 훅이 사후 검증하지만 CSS 자체가 허용하는 구조.
- **Decision**: CSS `@layer` 순서 선언으로 recipe/interactive를 component보다 높은 레이어에 배치. DESIGN.md의 논리적 6레이어 스택을 CSS 엔진 수준으로 구현. 대안: (1) specificity 높이기 — 취약하고 관리 어려움 (2) !important — 안티패턴 (3) 훅만 — 사후 검증, 구조적 잠금 아님
- **Non-Goals**: 색상/톤 일관성 (별도 영역), recipe 속성 세트 변경 (이미 적절), 새 축 추가

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | ui/ 컴포넌트가 recipe: 'item' 사용 | component CSS에서 min-height 재정의 | recipe 값이 유지됨 (component CSS가 무시됨) | |
| M2 | ui/ 컴포넌트가 interactive: 'item' 사용 | component CSS에서 hover background 재정의 | interactive 값이 유지됨 | |
| M3 | component CSS에서 축에 없는 속성 (::before, 트랙 등) 사용 | @layer 적용 | 정상 동작 (component 레이어에서 자유롭게 사용) | |
| M4 | 테마를 dark↔light 전환 | recipe/interactive 속성 확인 | 구조(높이/패딩/radius)는 불변, 색상만 변경 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `src/styles/layers.css` | `@layer` 순서 선언 파일. 모든 CSS보다 먼저 import | |
| `src/styles/ax.css` 수정 | `@layer ax` → `@layer recipe, state`로 분리. recipe 섹션은 `@layer recipe`, interactive/surface/tone 섹션은 `@layer state` | |
| `src/styles/reset.css` 수정 | `@layer reset { }` 래핑 | |
| `src/styles/tokens.css` 수정 | `@layer tokens { }` 래핑 | |
| `src/styles/structure.css` 수정 | `@layer base { }` 래핑 | |
| `src/styles/interactive.css` 수정 | `@layer state { }` 래핑 | |
| `src/interactive-os/ui/*.css` 수정 | `@layer component { }` 래핑 | |
| `src/styles/layout.css` 수정 | `@layer component { }` 래핑 | |
| `src/styles/app.css` 수정 | `@layer component { }` 래핑 | |
| leak 정리 | 진짜 leak → recipe 소비로 전환 또는 recipe variant 추가 | |

완성도: 🟢

## ③ 인터페이스

### @layer 순서 선언

```css
/* layers.css — 전역 cascade 순서. 뒤가 이긴다. */
@layer reset, tokens, base, component, recipe, state;
```

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| component CSS에 `min-height: 40px` | recipe에 `min-height: 36px` | component 레이어 < recipe 레이어 | @layer 순서상 recipe가 component보다 뒤 → recipe 승리 | min-height: 36px 유지 | |
| component CSS에 `background: red` on hover | state에 hover bg 규칙 | component < state | @layer 순서상 state가 최상위 | state의 hover bg 유지 | |
| component CSS에 `&::before { content }` | recipe/state에 해당 규칙 없음 | 충돌 없음 | recipe/state가 커버하지 않는 속성은 component가 자유 | ::before 정상 적용 | |
| component CSS에 축에 없는 속성 (transform, clip-path 등) | recipe/state 무관 | 충돌 없음 | recipe/state가 선언하지 않은 속성은 cascade 무관 | 정상 적용 | |

### ax.css 분리

| 현재 ax.css 섹션 | 목표 레이어 | 이유 |
|-----------------|-----------|------|
| Surface (11-148) | `state` | 상태 정책 (cursor/border/bg/hover) 소유 |
| Recipe (149-245) | `recipe` | 구조 잠금 (높이/패딩/font/gap/radius) |
| Control Size (246-270) | `recipe` | 레거시이지만 구조 |
| Text Style (271-341) | `recipe` | 타이포 번들 = 구조 |
| Tone (342-425) | `state` | 색상 번들 = 상태 응답 |
| Text Color (426-434) | `state` | 색상 |
| Weight (435-444) | `recipe` | 타이포 오버라이드 = 구조 |
| State (445-453) | `state` | 상태 확장 |
| Opacity (454-462) | `state` | 시각적 약화 |
| Padding~Layout (463-531) | `recipe` | 구조 |
| Border~Shape (555-581) | `recipe` | 구조 |
| Interactive (582-642) | `state` | 상태 정책 |
| Scroll~Position (643-749) | `recipe` | 구조 |
| Remaining axes (750-1029) | `recipe` | 구조 |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| component가 recipe와 같은 요소에 같은 속성 작성 | recipe + component 충돌 | recipe 레이어가 뒤 → 항상 recipe 승리. 이것이 잠금의 정의 | recipe 값 유지, component 무시 | 구조 일관성 보장 | |
| Kanban compact가 container-sm의 padding을 줄여야 함 | `rc-container-sm` padding:16px vs compact padding:xs | recipe variant가 없으면 잠금이 정당한 override도 막음 | `rc-container-compact` 또는 `rc-container-xs` variant 추가로 해결 | 새 variant가 잠금 안에서 제공 | |
| Spinbutton 버튼이 control-sm의 width를 고정해야 함 | `rc-control-sm` + component width override | 특수 컨트롤의 구조 변형. recipe가 커버 못 하면 recipe를 확장 | Spinbutton 버튼에 recipe 대신 last-mile CSS 사용 (recipe 미적용 요소) | recipe 안 쓰는 요소는 component 자유 | |
| `@import` 순서가 @layer 순서를 깨뜨릴 수 있음 | Vite가 CSS import를 번들링 | layers.css를 최상단에서 import하면 @layer 순서 선언이 전역 적용 | Vite 번들링 후에도 순서 유지 | 검증 필요 (빌드 테스트) | |
| CSS Modules (.module.css)의 @layer 동작 | Progress.module.css만 존재 | CSS Modules는 scoped class를 생성하지만 @layer와 독립 | `@layer component` 안에서 정상 동작 | CSS Modules도 component 레이어 | |
| 3rd-party CSS (shiki 등)가 unlayered로 들어올 때 | shiki가 inline style 또는 unlayered CSS 주입 | unlayered > layered이므로 3rd-party가 이길 수 있음 | CodeBlock.css의 `!important` 유지 (genuine last-mile) | 3rd-party 격리는 별도 문제 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | ax()만 사용, style={} 금지 (CLAUDE.md) | 전체 | ✅ 정합 — @layer는 ax() 강제를 구조적으로 뒷받침 | — | |
| 2 | module.css는 last-mile만 (CLAUDE.md) | ②③ | ✅ 정합 — component 레이어가 recipe/state보다 낮으므로, 축 소유 속성을 module.css에 써도 자동 무시 | — | |
| 3 | surface 소유 속성에 module.css 금지 (feedback_surface_no_lastmile) | ③ | ✅ 정합 — state 레이어가 component를 이기므로 구조적 강제 | — | |
| 4 | 닫힌 체계, escape hatch 없음 (feedback_design_css_principles) | ②③ | ✅ 정합 — @layer가 체계를 더 닫히게 함 | — | |
| 5 | DESIGN.md 6레이어 스택 | ③ | ✅ 정합 — 논리적 스택을 CSS @layer로 구현 | — | |
| 6 | interactive.css의 `:where()` specificity 전략 | ③ | ⚠️ 재검토 필요 — @layer가 우선순위를 보장하므로 `:where()` 불필요해짐. 제거하면 코드 단순화 가능하나, 단 state 레이어 내부에서의 specificity 충돌 가능성 확인 필요 | 1단계에서는 유지, 안정화 후 제거 검토 | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | **Kanban compact variant** (4건) | container-sm의 padding/radius/align을 덮어쓰는 component CSS가 무시됨 → compact 레이아웃 깨짐 | 높음 | `rc-container-compact` recipe variant 추가 (padding:xs, radius:xs, gap:xs) | |
| 2 | **Kanban data attributes** (weight/hub/highlight 5건) | weight hint, hub indicator, highlight fade가 state에 의해 무시됨 | 높음 | weight/hub는 tone 축으로 이관, highlight opacity는 state 축에 variant 추가 | |
| 3 | **Spinbutton 버튼** (width/font-weight 2건) | control-sm의 기본값으로 복원 | 중간 | spinbutton-btn에서 recipe 제거, 독립 CSS로 전환 (recipe 미적용 요소) | |
| 4 | **CalendarGrid selected** (1건) | `tone-primary-base` 대신 ia의 `--selection` 적용 → 색상 변경 | 낮음 | CalendarGrid가 ia-cell을 사용하도록 통일. selected 색 = stone ladder | |
| 5 | **Composer suggestion** (hover/selected 2건) | ia 미사용 시 hover/selected 스타일 소실 | 낮음 | ia-item 적용으로 해결 | |
| 6 | **PatternDemo** (4건) | 데모 전용, 사용자 미노출 | 최소 | ia-item 적용으로 통일 | |
| 7 | **ax.css import 위치** | 현재 개별 페이지에서 import → 전역 layer 순서와 충돌 가능 | 중간 | AppShell.tsx에서 통합 import | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | component 레이어에서 recipe 소유 속성 작성 | ⑤#2 last-mile 원칙 | @layer가 무시하므로 죽은 코드. 혼란만 유발 | |
| 2 | component 레이어에서 state 소유 속성(hover/focus/selected bg, outline) 작성 | ⑤#3 surface_no_lastmile | 동상 | |
| 3 | `!important`로 @layer 우회 | ⑤#4 닫힌 체계 | !important는 @layer를 무시함. 3rd-party 격리 외 금지 | |
| 4 | ax.css를 개별 페이지에서 import | ⑥#7 import 위치 | layer 순서 보장을 위해 AppShell 통합 import 필수 | |
| 5 | unlayered CSS 추가 | ⑤#4 닫힌 체계 | unlayered는 모든 @layer를 이기므로 잠금 무력화 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | M1 | NavList.css에 `min-height: 999px` 추가 → 빌드 → NavList 아이템 높이 확인 | 36px 유지 (recipe 승리) | |
| V2 | M2 | CalendarGrid.css에 `background: red` on `[data-focused]` → 빌드 → hover 확인 | state의 hover bg 유지 | |
| V3 | M3 | Slider.css의 `.slider-track` border-radius → 빌드 → 트랙 모양 확인 | 정상 (recipe 미적용 요소) | |
| V4 | M4 | dark↔light 전환 → 모든 ui/ 데모 확인 | 구조 불변, 색상만 변경 | |
| V5 | ④#4 | `pnpm build` → 번들 내 @layer 순서 확인 | layers.css 순서 선언이 최상단 | |
| V6 | ⑥#1 | Kanban compact 모드 → 레이아웃 확인 | rc-container-compact variant 적용, 정상 렌더링 | |
| V7 | ⑥#3 | Spinbutton → 버튼 크기/weight 확인 | recipe 미적용 요소로 전환, 정상 | |
| V8 | ⑦#3 | component CSS에 !important 추가 시 | lint/훅에서 차단 | |
| V9 | ⑦#5 | unlayered CSS 파일 추가 시 | lint/훅에서 차단 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

#kind/prd #topic/design
