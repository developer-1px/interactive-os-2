---
id: 2-areas/ui/prds/menubar-refactor-prd
type: prd
slug: menubarRefactor
title: 'MenuBar 리팩토링 — PRD'
tags: [aria-expanded, data-focused]
created: 2026-04-06
updated: 2026-04-08
summary: 'Discussion: MenuBar가 ax() + 부품 분리 원칙을 위반. levelMap + CSS Anchor + interactive CSS로 재설계.'
legacy:
  status: active
  kind: prd
  topics: [2-areas, aria-expanded, data-focused]
  relates: []
  supersedes: []
---
# MenuBar 리팩토링 — PRD

> Discussion: MenuBar가 ax() + 부품 분리 원칙을 위반. levelMap + CSS Anchor + interactive CSS로 재설계.

## ① 동기

### WHY

- **Impact**: MenuBar의 renderItem이 구조·스타일·상태를 직접 조립하여, 후발 도입된 부품 분리 원칙(Panel/Item/Indicator)과 interactive 축 원칙이 적용되지 않음. 같은 문제가 submenu를 가진 다른 패턴(Combobox popup, context menu)에도 반복될 수 있음.
- **Forces**: (a) pattern은 behavior만 소유해야 하나(의존 방향: pattern → ui 금지), 시각 배치 정보가 pattern에도 ui에도 정리되지 않음. (b) CSS Anchor Positioning이 Tooltip에서 검증되었으나 submenu에 연결되지 않음. (c) interactive 축이 `[aria-expanded]` CSS를 이미 소유하나 Menubar가 JS 삼항으로 우회.
- **Decision**: ui 레이어가 levelMap으로 레벨별 부품 조합을 선언한다. positioning은 CSS Anchor. 상태 시각은 interactive CSS. 기각 대안: pattern이 레벨별 meta 소유 → 의존 방향 위반으로 기각.
- **Non-Goals**: pattern/menubar.ts 변경 없음. 새 axis 추가 없음. MenuBar의 키보드 동작 변경 없음.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | MenuBar에 3레벨 데이터(bar→submenu→nested) | 렌더링 | root는 bar 레이아웃, submenu는 overlay surface, nested도 overlay. 각 레벨에 맞는 Indicator(root: Expand, sub: Direction) | ✅ 일치 |
| M2 | menuitem에 포커스 | ArrowDown으로 submenu 열기 | submenu가 CSS Anchor로 트리거 아래에 배치 (position-area: block-end) | ✅ 일치 |
| M3 | nested submenu 열기 | ArrowRight | nested submenu가 트리거 오른쪽에 배치 (position-area: inline-end) | ✅ 일치 |
| M4 | submenu 열린 상태에서 viewport 하단 근접 | 렌더링 | position-try-fallbacks로 상단에 자동 재배치 | ✅ 일치 |
| M5 | 어떤 menuitem에 focus | 시각 확인 | JS 삼항 없이 interactive CSS만으로 focused 텍스트 색상 변경 | ✅ 일치 |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `ui/Menubar.tsx` (수정) | levelMap 기반 부품 조합. defaultRenderItem 제거 → MenuItem + SubmenuPanel 부품 사용 | ✅ `Menubar.tsx::Menubar, defaultRenderItem` |
| `ui/panels/SubmenuPanel.tsx` (신규) | submenu 컨테이너. CSS Anchor Positioning + surface: overlay + popover API | 🔀 `SubmenuPanel.tsx::SubmenuPanel` — popover API 미사용, data-hidden+display:none 방식 |
| `ui/items/MenubarItem.tsx` (신규) | menubar root 레벨 아이템. layout: bar, ExpandIndicator | ✅ `MenubarItem.tsx::MenubarItem` |
| `ui/Menubar.css` (수정) | positioning 하드코딩 제거. CSS Anchor 관련 position-area 규칙만 유지 | ✅ position-area는 SubmenuPanel.css로 이동 |
| `pattern/examples/MenubarNavigation.tsx` (수정) | 새 Menubar API에 맞게 업데이트 | ❌ 미수정 �� API 호환이므로 수정 불필요했음 |

완성도: 🟢

## ③ 인터페이스

키보드 인터랙션은 pattern/menubar.ts가 그대로 소유 — 변경 없음. 여기서는 **렌더링 인터페이스**만 명세.

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `state.level === 1` | root 레벨 아이템 | MenubarItem 렌더 (layout: bar, ExpandIndicator) | levelMap[1]이 MenubarItem을 지정. root는 수평 bar의 일부이므로 bar 레이아웃 | bar 내 수평 아이템 | ✅ 일치 |
| `state.level >= 2` + children 있음 | submenu 부모 아이템 | MenuItem 렌더 (DirectionIndicator) + SubmenuPanel 감싸기 | levelMap[2+]가 MenuItem + SubmenuPanel을 지정. submenu 부모는 하위 메뉴가 있음을 Direction으로 표시 | overlay 안 수직 아이템 + 자식 패널 | ✅ 일치 |
| `state.level >= 2` + children 없음 | submenu 리프 아이템 | MenuItem 렌더 (indicator 없음) | 리프는 자식이 없으므로 indicator 불필요 | overlay 안 수직 아이템 | ✅ 일치 |
| `state.expanded === true` | submenu 열림 | SubmenuPanel visible (popover show) | pattern이 aria-expanded=true 설정 → CSS/popover가 반응 | anchor 기준 배치된 overlay 표시 | 🔀 popover API 미사용, data-hidden 방식 |
| `state.expanded === false` | submenu 닫힘 | SubmenuPanel hidden (popover hide) | pattern이 aria-expanded=false → popover 숨김 | overlay 비표시 | 🔀 data-hidden+display:none 방식 |
| `state.focused === true` | 아이템 포커스 | interactive CSS가 text bright 적용 | `.ia-item:focus` 또는 `[data-focused]` CSS 규칙이 소유 | 시각적 강조 — JS 분기 없음 | ✅ 일치 |

**키보드**: 모든 방향키, Enter, Space, Escape, Tab, Home, End → pattern/menubar.ts가 소유. 변경 없음. N/A.

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 3단계 이상 중첩 | level 3+ submenu | CSS Anchor는 각 트리거에 독립 anchor-name 부여하므로 깊이 무관 | 각 레벨이 자기 트리거 기준으로 inline-end 배치 | 정상 중첩 표시 | ✅ anchorName per item |
| 빈 데이터 (root 0개) | menubar role만 존재 | 빈 bar도 유효한 ARIA 구조 | 빈 menubar 렌더 (아이템 없음) | 빈 bar | ✅ Aria가 처리 |
| submenu 아이템 1개만 | 단일 자식 | exclusive open 규칙 무관 (형제 없음) | 정상 열림/닫힘 | 단일 아이템 overlay | ✅ pattern 무변경 |
| viewport 우측 끝에서 nested submenu | overflow 위험 | position-try-fallbacks: flip-inline이 자동으로 왼쪽 배치 | inline-start로 fallback | 좌측 배치 | ✅ CSS 규칙 확인 |
| CSS Anchor 미지원 브라우저 | position-area 무시됨 | progressive enhancement — fallback은 placement 축(`pl-below`) 또는 absolute positioning | 기본 위치에 표시 (완벽하진 않으나 사용 가능) | graceful degradation | ⚠️ fallback 미구현 — position:fixed+inset:unset 상태로 남음 |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | renderItem에 ARIA props 전달 필수 (CLAUDE.md) | ③ 렌더링 | ✅ 준수 — MenubarItem/MenuItem이 props spread | — | ✅ 확인 |
| 2 | interactive 축 필수 (CLAUDE.md) | ③ 렌더링 | ✅ 준수 — `interactive: 'item'` 선언 | — | ✅ 확인 |
| 3 | surface 소유 속성에 last-mile 금지 (feedback_surface_no_lastmile) | ② SubmenuPanel | ✅ 준수 — surface: 'overlay'가 bg/shadow/border 소유 | — | ✅ 확인 |
| 4 | style={} 해치 (feedback_style_is_hatch) | ② Menubar.tsx | ⚠️ CSS Anchor의 `positionAnchor`는 style로 설정 필요 (Tooltip 선례) | Tooltip과 동일 패턴 허용 — anchorName은 동적 값이므로 style 불가피 | ✅ Tooltip 선례 동일 |
| 5 | UI 컴포넌트만 노출, primitives 금지 (feedback_ui_over_primitives) | ② Menubar.tsx | ✅ 준수 — Menubar가 ui/ 완성품 | — | ✅ 확인 |
| 6 | Composite는 ui/ 조합 (feedback_composite_is_ui_combination) | ② 전체 | ✅ 준수 — Menubar가 MenuItem + SubmenuPanel + Indicator 조합 | — | ✅ 확인 |
| 7 | DOM 배치가 컴포넌트 존재 이유 (feedback_dom_placement_is_component_reason) | ② MenubarItem vs MenuItem | ✅ 준수 — bar 내 수평 vs overlay 내 수직 = 다른 DOM 위치 | — | ✅ 확인 |
| 8 | ax() 축은 의미 기준 (feedback_ax_semantic_not_css) | ② SubmenuPanel | ✅ 준수 — surface: 'overlay'는 의도 기반 | — | ✅ 확인 |
| 9 | pattern → ui 의존 금지 (CLAUDE.md 레이어) | 설계 전체 | ✅ 준수 — pattern 무변경, ui가 state.level 읽을 뿐 | — | ✅ 확인 |
| 10 | Slot은 render function (feedback_render_function_is_slot) | ③ 렌더링 | ✅ 준수 — 4-arg render function 유지 | — | ✅ 확인 |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | MenubarNavigation.tsx (예제) | 새 Menubar API에 맞게 수정 필요 | 중 | 예제 동시 업데이트 | ✅ API 호환 — 수정 불필요 |
| 2 | mdComponents.ts (showcase 레지스트리) | import 경로 변경 없으면 영향 없음 | 저 | export명 유지 | ✅ 영향 없음 |
| 3 | MenuItem 부품 | MenubarItem 신규 추가로 items/ 디렉토리 확장 | 저 | index.ts에 export 추가 | ✅ 완료 |
| 4 | panels/ 디렉토리 | SubmenuPanel 신규 추가 | 저 | index.ts에 export 추가 | ✅ 완료 |
| 5 | Popover API 사용 확대 | Tooltip + SubmenuPanel 두 곳에서 popover 사용 | 저 | 허용 — 브라우저 네이티브 | 🔀 Popover API 미사용 |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | pattern/menubar.ts 수정 | ⑤#9 의존 방향 | pattern은 behavior만 소유. 시각 관심사 주입 금지 | ✅ 준수 |
| 2 | renderItem 안에서 `state.focused ? 'bright' : 'primary'` JS 삼항 | ⑤#2 interactive 축 | interactive CSS가 소유하는 상태 시각을 JS로 우회 금지 | ✅ 준수 — 삼항 제거 |
| 3 | Menubar.css에 `top/left/position: absolute` 하드코딩 | discuss 결론 | CSS Anchor가 범용 배치 소유. 하드코딩은 패턴 고유 지식을 last-mile에 유출 | ✅ 준수 — 제거 |
| 4 | SubmenuPanel에서 surface 소유 속성(bg/shadow/border) last-mile | ⑤#3 surface 금지 | surface: 'overlay'가 소유 | ✅ 준수 |
| 5 | pages/에서 Menubar 내부 부품 직접 사용 | ⑤#5 primitives 금지 | `<Menubar>` 완성품만 노출 | ✅ 준수 |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | ①M1 | 3레벨 데이터로 Menubar 렌더 | root=bar 레이아웃, sub=overlay, 레벨별 indicator 정확 | ✅ 코드 구조 확인 |
| V2 | ①M2 | ArrowDown으로 submenu 열기 | submenu가 트리거 아래 배치 (CSS Anchor block-end) | ✅ SubmenuPanel.css::submenu-panel-root |
| V3 | ①M3 | ArrowRight로 nested submenu 열기 | nested가 트리거 오른쪽 배치 (CSS Anchor inline-end) | ✅ SubmenuPanel.css::submenu-panel-nested |
| V4 | ①M4 | viewport 하단 근접 시 submenu | position-try-fallbacks로 상단 재배치 | ✅ SubmenuPanel.css::flip-block |
| V5 | ①M5 | menuitem focus | JS 삼항 없이 interactive CSS로 시각 변경 | ✅ JS 삼항 제거 확인 |
| V6 | ④#1 | 3단계 이상 중첩 | 각 레벨 독립 anchor, 정상 배치 | ✅ anchorName per item |
| V7 | ④#4 | viewport 우측 끝 nested | flip-inline으로 좌측 fallback | ✅ SubmenuPanel.css::flip-inline |
| V8 | 기존 | menubar-apg.conformance.test.tsx 28개 | 전부 통과 (pattern 무변경이므로) | ✅ 테스트 통과 확인 |
| V9 | ⑥#1 | MenubarNavigation 예제 | showcase에서 정상 렌더 | ✅ API 호환 — 수정 불필요 |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
