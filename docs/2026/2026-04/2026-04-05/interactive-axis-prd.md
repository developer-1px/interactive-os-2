---
id: 2-areas/axis/prds/interactive-axis-prd
type: prd
slug: interactiveAxis
title: 'Interactive 축 도입 — PRD'
tags: [aria-level, aria-selected, data-aria-container]
created: 2026-04-05
updated: 2026-04-08
summary: 'Discussion: interactive.css가 ax() 밖에서 role 셀렉터로 상태 시각을 관리 → surface와 competing → interactive 축을 ax()에 추가하여 흡수'
legacy:
  status: active
  kind: prd
  topics: [2-areas, aria-level, aria-selected, data-aria-container]
  relates: []
  supersedes: []
---
# Interactive 축 도입 — PRD

> Discussion: interactive.css가 ax() 밖에서 role 셀렉터로 상태 시각을 관리 → surface와 competing → interactive 축을 ax()에 추가하여 흡수

## ① 동기

### WHY

- **Impact**: interactive.css(373줄)가 `[data-aria-container]` + role 셀렉터로 hover/focus/selected/disabled를 관리. ax()의 surface가 같은 background를 건드려 specificity 전쟁. Item 컴포넌트에 surface 클래스가 없으면 bg 주인이 아예 없어서 override 불가능.
- **Forces**: ARIA 의미론과 시각의 연동(role이 같으면 시각도 같아야) vs ax() 축이 시각의 SSOT(스타일 소유권 단일화). /conflict 결과: surface 클래스가 상태 셀렉터의 스코프가 되면 양립 가능.
- **Decision**: ax()에 interactive 축(item/tab/check/cell/input/button) 추가. interactive.css를 axes.css로 흡수. `[data-aria-container]` → `.ax-interactive` 클래스로 대체. 기각: interactive.css 유지(소유권 분산 해소 안 됨), surface에 모든 상태 번들(role별 시각 차이 표현 불가).
- **Non-Goals**: role 속성 제거(ARIA 필수), 기존 색상 토큰 변경, depth cascade 변경.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | TreeItem에 `interactive: 'item'` | 마우스 hover | bg: var(--bg-hover) — .ia-item:hover 규칙 적용 | |
| S2 | TreeItem에 `interactive: 'item'` | 컨테이너에 포커스 있고 item이 focused | bg: var(--tone-primary-dim) + outline: accent | |
| S3 | TreeItem에 `interactive: 'item'` | 컨테이너에 포커스 없고 item이 focused | bg: var(--focus-idle) — idle 상태 | |
| S4 | TabItem에 `interactive: 'tab'` | tab이 selected | color: bright + border-bottom: bright + font-weight: semi | |
| S5 | ListItem에 `interactive: 'item'` + aria-selected | 아이템 선택됨 | bg: var(--selection) — neutral elevation | |
| S6 | 새 surface(sunken) 안의 item | selected | bg: var(--depth-sunken-sel) — depth cascade 자동 적응 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| ax.ts `Interactive` 타입 | `'item' \| 'tab' \| 'check' \| 'cell' \| 'input' \| 'button'` | |
| ax.ts `Axes.interactive` | 새 축 추가 + prefix `ia` | |
| axes.css `.ia-*` 규칙 | interactive.css의 40+ 셀렉터를 .ia-* 클래스 기반으로 이관 | |
| `.ax-interactive` 컨테이너 클래스 | `[data-aria-container]` 대체. :focus-within 스코프 역할 | |
| aria.tsx 수정 | `data-aria-container=""` → `className` 에 `.ax-interactive` 추가 | |
| useNavList/useTabList 수정 | containerProps에 `.ax-interactive` 클래스 | |
| items/ 컴포넌트 8개 수정 | `interactive: 'item'` 등 축 추가 | |
| indicators.css 수정 | `[data-aria-container]` → `.ax-interactive` 셀렉터 교체 | |
| interactive.css 삭제 | 내용이 axes.css로 이관된 후 제거 | |
| AppShell.tsx 수정 | `import interactive.css` 제거 | |

완성도: 🟢

## ③ 인터페이스

> interactive 축은 CSS-only — JS 인터랙션 없음, ax()로 클래스 생성만

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `ax({ interactive: 'item' })` | — | `.ia-item` 클래스 생성 | ax() prefix 매핑: interactive→ia | HTML class="ia-item" | |
| `.ia-item` + `:hover` | idle | bg: var(--bg-hover) | APG: hover는 subtle feedback (neutral) | bg 변경 | |
| `.ax-interactive:focus-within .ia-item:focus` | container focused | bg: var(--tone-primary-dim) + outline: accent | APG: active focus = strong visual | accent highlight | |
| `.ax-interactive:not(:focus-within) .ia-item:focus` | container not focused | bg: var(--focus-idle) | APG: idle focus = cursor position only | gray bg | |
| `.ia-item[aria-selected="true"]` | — | bg: var(--selection) | accent budget: selected=neutral | neutral elevation | |
| `.ia-item:active` | press | bg: var(--tone-primary-bright) | accent budget: activation=accent bright | press feedback | |
| `.ia-item[aria-disabled="true"]` | — | opacity: 0.4, pointer-events: none | disabled는 시각적 약화 | dimmed | |
| `ax({ interactive: 'tab' })` | — | `.ia-tab` 클래스 생성 | tab은 bg hover 없음, border-bottom으로 표현 | | |
| `.ia-tab:hover` | idle | color: var(--text-secondary) | tab은 text 변화만 (bg hover 없음) | text 변경 | |
| `.ia-tab[aria-selected="true"]` | — | color: bright + border-bottom + weight: semi | tab selected는 하단 보더 | | |
| `ax({ interactive: 'check' })` | — | `.ia-check` 클래스 | radio/switch/checkbox용 | | |
| `.ia-check[aria-checked="true"]` | — | bg: var(--selection) | checked = selected와 동일 시각 | | |
| `ax({ interactive: 'cell' })` | — | `.ia-cell` 클래스 | gridcell용 | | |
| `.ia-cell[tabindex="0"]` | cell focused | outline + bg: var(--tone-primary-dim) | 셀 커서 = outline 강조 | | |

키보드 인터랙션: N/A — interactive 축은 CSS-only. 키보드는 axis/pattern이 처리.

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| surface + interactive 동시 적용 | .sf-ghost + .ia-item | surface=정적(cursor/border), interactive=동적(hover/focus/selected) — 소유 분리 | 충돌 없음. surface가 --depth-* 변수 제공, interactive가 참조 | 각자 소유 속성만 제어 | |
| data-aria-container 참조하는 JS (closest()) | aria.tsx, AriaSearch, useAriaView, InspectorWindow | 스크롤 동기화/검색 스코프에 필수 | `.ax-interactive` 클래스로 대체: `closest('.ax-interactive')` | 동일 동작 | |
| :where() specificity 유지 | 현재 interactive.css 전체 :where() | module.css가 override 가능해야 함 | .ia-* 규칙도 전부 :where() 래핑 | specificity (0,0,0) | |
| treeitem expanded redirect | expanded treeitem → :first-child가 시각 담당 | 펼친 트리 노드는 투명 컨테이너, 라벨 행이 hover/focus 받음 | .ia-item[aria-expanded="true"]:has(> [role="treeitem"]) 규칙 유지 | 기존과 동일 | |
| treegrid aria-level 깊이 | aria-level="1"~"10" padding-left | 평탄 DOM에서 깊이 들여쓰기 필수 | [aria-level] 셀렉터 유지 (ARIA 속성 기반이므로 .ia-* 불필요) | padding-left 계산 유지 | |
| grid subgrid 레이아웃 | .grid-table > [data-aria-container] | grid body의 subgrid 설정 | `.grid-table > .ax-interactive` 로 교체 | 동일 동작 | |
| showcase/demo 파일 | 데모에서 data-aria-container 사용 | 데모도 .ax-interactive 사용하게 됨 (자동 — Aria 컴포넌트가 설정) | 변경 불필요 | | |
| indicators.css 스코프 | `[data-aria-container] .item-chevron` 등 | indicator 상태 색상도 컨테이너 스코프 필요 | `.ax-interactive .item-chevron` 로 교체 | 동일 동작 | |
| 테스트에서 data-aria-container 쿼리 | 6개 테스트 파일 | 테스트 셀렉터 유지 필요 | querySelector('.ax-interactive') 또는 data 속성 병행 (?) | 테스트 통과 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | APG 3-Concept: focus/selection/activation 분리 (feedback_apg_three_concepts.md) | ③ hover/focus/selected/active 각각 다른 시각 | ✅ 준수 | — | |
| 2 | Accent Budget: selected=neutral, focus=accent outline (feedback_accent_budget.md) | ③ .ia-item[aria-selected] = --selection(neutral), :focus = accent outline | ✅ 준수 | — | |
| 3 | Chroma Ladder: depth별 selection 계층 (feedback_chroma_ladder.md) | ④ surface가 --depth-* 제공, interactive가 참조 | ✅ 준수 | — | |
| 4 | Surface 소유권: 상태는 surface에 번들 (feedback_surface_no_lastmile.md) | ② surface=정적, interactive=동적으로 분리 | 🔀 변형 — surface가 아닌 interactive가 동적 상태 소유. 단, surface가 depth 토큰을 제공하므로 협력 관계 | — | |
| 5 | Style is Hatch: ax()만 사용 (feedback_style_is_hatch.md) | ② interactive.css → axes.css 흡수 | ✅ 준수 | — | |
| 6 | ax() 의미축: CSS 1:1 아닌 의도 기준 (feedback_ax_semantic_not_css.md) | ② interactive: 'item' (의도) not 'bg-hover' (CSS) | ✅ 준수 | — | |
| 7 | 면으로 구분, 선 최후 (DESIGN.md Rule 1) | ③ tab의 border-bottom 사용 | 🟡 주의 — tab은 업계 표준이 하단 보더. 예외로 허용 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | aria.tsx의 data-aria-container | JS closest() 6곳 교체 필요 | 중 | `.ax-interactive` 클래스로 1:1 교체 | |
| 2 | indicators.css의 [data-aria-container] 스코프 | 셀렉터 교체 필요 | 낮 | `.ax-interactive`로 단순 교체 | |
| 3 | 테스트 6개의 data-aria-container 쿼리 | 테스트 셀렉터 교체 | 중 | `.ax-interactive`로 교체 + 검증 | |
| 4 | CmsCanvas/CmsSidebar의 수동 data-aria-container | 수동 설정 교체 | 낮 | className에 `.ax-interactive` 추가 | |
| 5 | PageBookViewer.css의 [data-aria-container] | CSS 셀렉터 교체 | 낮 | `.ax-interactive`로 교체 | |
| 6 | AppShell.tsx의 interactive.css import | import 제거 | 낮 | axes.css가 이미 import되어 있으므로 제거만 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | .ia-* 규칙에서 :where() 빼기 | ④ specificity | module.css override 불가능해짐 | |
| 2 | interactive 축에서 색상 하드코딩 | ⑤ #3 chroma ladder | depth 토큰(--bg-hover, --selection 등)만 참조해야 surface별 자동 적응 | |
| 3 | module.css에서 :hover/:focus/:active 상태 스타일 작성 | ⑤ #4 surface 소유권 | interactive 축이 소유, last-mile 금지 | |
| 4 | data-aria-container 속성 잔존 | ⑥ 전환 완료 | .ax-interactive로 완전 교체 후 제거 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | ①S1 | TreeItem hover | bg: var(--bg-hover) — .ia-item:hover | |
| V2 | ①S2 | TreeItem active focus | bg: accent dim + outline: accent ring | |
| V3 | ①S3 | TreeItem idle focus | bg: var(--focus-idle) — gray only | |
| V4 | ①S4 | TabItem selected | border-bottom + bright text + semi weight | |
| V5 | ①S5 | ListItem selected | bg: var(--selection) — neutral | |
| V6 | ①S6 | sunken surface 안 item selected | bg: var(--depth-sunken-sel) — depth cascade | |
| V7 | ④ | expanded treeitem hover | :first-child에 bg:hover 적용 | |
| V8 | ④ | aria-level="5" treegrid item | paddingLeft 올바른 값 | |
| V9 | ④ | .ia-item + module.css override | module.css가 이김 (specificity) | |
| V10 | ⑥#1 | aria.tsx closest('.ax-interactive') | 스크롤 동기화 동작 | |
| V11 | ⑥#3 | 테스트 querySelector('.ax-interactive') | 6개 테스트 통과 | |
| V12 | ② | interactive.css 삭제 후 | 모든 상태 시각이 axes.css에서 동일하게 적용 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

#kind/prd #topic/axis
