# Design System — ARIA Attr 기반 최소 className 통일 — PRD

> Discussion: `<Aria>` headless 컴포넌트에 ARIA attribute 기반 CSS 디자인 시스템 구축. className 최소화, 순수 CSS, dark-first, 점진적 마이그레이션.

## 1. 유저 스토리

| # | Given | When | Then |
|---|-------|------|------|
| S1 | 개발자가 `<Aria behavior={listbox}>` 사용 | `<Aria.Item>`에 render 함수만 제공 | ARIA attr 기반 CSS가 자동 적용되어 포커스/선택/확장 상태가 시각화됨 |
| S2 | 개발자가 테마를 전환 | `data-theme="light"` 토글 | 모든 컴포넌트가 라이트 테마로 일관 전환 |
| S3 | 개발자가 스타일 커스터마이즈 | CSS 변수를 오버라이드하거나 자체 CSS 작성 | inline style 없으므로 specificity 충돌 없이 오버라이드 가능 |
| S4 | 기존 데모 페이지 유지 | 마이그레이션 완료 후 | 기존과 동일한 시각적 결과 (regression 없음) |

상태: 🟢

## 2. 화면 구조

이 PRD는 특정 화면이 아닌 **컴포넌트 스타일링 인프라**를 다룸. 구조는 CSS 파일 아키텍처:

```
src/
├── styles/
│   ├── tokens.css          ← Tier 1+2: primitives + semantic tokens + light override
│   ├── components.css      ← ARIA attr 기반 컴포넌트 스타일 (11개)
│   └── app.css             ← App Shell 레이아웃 (activity-bar, sidebar, content, page-*)
├── pages/
│   ├── PageViewer.css      ← (유지)
│   └── PageVisualCms.css   ← (유지)
└── App.css                 ← 삭제 (3파일로 분리)
```

### 역PRD: 산출물 매핑

| 산출물 | 역PRD |
|--------|-------|
| `tokens.css` | ✅ `src/styles/tokens.css` |
| `components.css` | ✅ `src/styles/components.css` |
| `app.css` | ✅ `src/styles/app.css` |
| `data-focused` attr | ✅ `hooks/useAriaView.ts` (line: `if (state.focused) baseProps['data-focused'] = ''`) |

### 대상 컴포넌트 (11개)

| 컴포넌트 | container role | item role | 핵심 상태 |
|----------|---------------|-----------|----------|
| ListBox | listbox | option | focused, selected |
| TreeView | tree | treeitem | focused, selected, expanded, level |
| TreeGrid | treegrid | row | focused, selected, expanded, level |
| TabList | tablist | tab | focused, selected |
| MenuList | menu | menuitem | focused, expanded |
| Accordion | region | heading | focused, expanded |
| DisclosureGroup | group | button | focused, expanded |
| SwitchGroup | switch | switch | focused, checked |
| RadioGroup | radiogroup | radio | focused, checked |
| Grid | grid | row/gridcell | focused, selected |
| Combobox | — (input+listbox) | option | focused, selected |

상태: 🟢

## 3. 인터랙션 맵

이 PRD는 인터랙션을 변경하지 않음 — **기존 behavior keyMap 유지**. CSS만 교체.

유일한 인터랙션 변경점:

| 입력 | 현재 상태 | 결과 |
|------|----------|------|
| 테마 토글 | 어떤 테마든 | 모든 컴포넌트가 새 테마 토큰으로 전환 (기존과 동일) |

상태: 🟢 (기존 behavior 그대로)

## 4. 상태 전이

CSS가 커버해야 하는 시각적 상태:

| 상태 | CSS 셀렉터 | 진입 조건 | 비고 |
|------|-----------|----------|------|
| **default** | `[role="option"]` 등 | 초기 | 기본 스타일 |
| **hover** | `:hover` | 마우스 오버 | |
| **focused** | `:focus` | 키보드/클릭으로 포커스 | roving-tabindex 컴포넌트 |
| **focused (activedescendant)** | `[data-focused]` | 논리적 포커스 | combobox 전용 — 코어에 추가 필요 |
| **selected** | `[aria-selected="true"]` | Space/클릭 | listbox, tree, tabs, grid |
| **checked** | `[aria-checked="true"]` | Space/클릭 | radio, switch |
| **expanded** | `[aria-expanded="true"]` | Enter/클릭/ArrowRight | tree, menu, accordion, disclosure |
| **collapsed** | `[aria-expanded="false"]` | Enter/클릭/ArrowLeft | |
| **focused + selected** | `:focus[aria-selected="true"]` | 복합 | 포커스 + 선택 동시 |
| **disabled** | `[aria-disabled="true"]` | — | 현재 미사용, 확장성 |

상태: 🟢

## 5. 시각적 피드백

기존 App.css 토큰을 기반으로 통일:

| 상태 | 시각적 표현 |
|------|-----------|
| **default** | `background: transparent`, `color: var(--text-primary)` |
| **hover** | `background: var(--bg-hover)` |
| **focused** | `background: var(--bg-focus)` |
| **selected / checked** | `background: var(--bg-select)` |
| **focused + selected** | `background: var(--bg-focus)` (포커스 우선) |
| **expanded** | chevron 회전 (`transform: rotate(90deg)`) |
| **focus-visible** | `outline: 1.5px solid var(--accent)` (기존 전역 규칙 유지) |
| **tree depth** | `padding-left: calc((level - 1) * 16px)` — `[aria-level]` 셀렉터로 유한 규칙 (1~10) |

### 공통 아이템 기본 스타일

```css
/* 모든 interactive 아이템 공통 */
[role="option"],
[role="treeitem"],
[role="tab"],
[role="menuitem"],
[role="heading"], /* accordion */
[role="radio"],
[role="switch"],
[role="row"] {
  padding: 4px 10px;
  cursor: default;
  user-select: none;
  font-size: 13px;
  color: var(--text-primary);
  border-radius: var(--radius-sm);
  transition: background 0.08s;
}
```

상태: 🟢

## 6. 데이터 모델

### 코어 변경: `getNodeProps`에 `data-focused` 추가

```ts
// useAria.ts → getNodeProps
const baseProps: Record<string, unknown> = {
  role: behavior.childRole ?? 'row',
  'data-node-id': id,
  'data-focused': state.focused ? '' : undefined,  // ← 추가
  ...ariaAttrs,
  // ...
}
```

- `data-focused` 는 focused일 때 빈 문자열 attribute, 아닐 때 제거
- CSS: `[data-focused]` 셀렉터로 매칭
- ARIA 시맨틱 오염 없음 (data-* namespace)

### CSS 파일 구조

**tokens.css**: `:root` 토큰 전부 + `[data-theme="light"]` override
**components.css**: ARIA attr 기반 셀렉터
**app.css**: `.activity-bar`, `.sidebar`, `.content`, `.page-header` 등 앱 레이아웃

상태: 🟢

## 7. 경계 조건

| 조건 | 예상 동작 |
|------|----------|
| 빈 리스트 (아이템 0개) | 컨테이너만 렌더, 스타일 영향 없음 |
| 아이템 1개 | 정상 포커스/선택 스타일 적용 |
| 깊은 tree (level 10+) | `[aria-level]` 규칙이 10까지만 — 11+는 level 10과 동일 인덴트 |
| role 충돌 (같은 role이 다른 컨텍스트에서 사용) | `[data-aria-container]` 스코핑으로 격리: `[data-aria-container] [role="option"]` |
| inline style 잔존 | 마이그레이션 전 컴포넌트는 기존 inline style 유지, 전환된 것만 CSS 적용 |
| 이벤트 버블링 | CSS 전용 변경이라 해당 없음 |
| 윈도우 리사이즈 | CSS 전용 변경이라 해당 없음 |

상태: 🟢

## 8. 접근성

ARIA role과 attribute는 **기존 behavior가 이미 W3C APG 준수로 구현됨**. 이 PRD는 시각적 레이어만 변경.

확인 사항:
- **focus-visible**: 기존 전역 `*:focus-visible` 규칙 유지
- **색상 대비**: 기존 토큰의 대비 비율 유지 (변경 없음)
- **motion**: `transition: 0.1s`만 사용 — `prefers-reduced-motion` 미디어 쿼리 추가
- **스크린리더**: ARIA attr 기반이므로 스크린리더 호환성 자동 유지

상태: 🟢

## 9. 검증 기준

| # | 시나리오 | 예상 결과 | 우선순위 | 역PRD |
|---|---------|----------|---------|-------|
| V1 | ListBox 데모 페이지 — 포커스 이동 | `var(--bg-focus)` 배경 표시 | P0 | ✅ `listbox-keyboard.integration.test.tsx` (data-focused 검증) |
| V2 | ListBox 데모 페이지 — 아이템 선택 | `var(--bg-select)` 배경 표시 | P0 | ✅ `listbox-keyboard.integration.test.tsx` (aria-selected 검증) |
| V3 | 테마 토글 (dark↔light) | 모든 전환된 컴포넌트가 일관 전환 | P0 | ✅ `theme-toggle.test.tsx::applies data-theme attribute from localStorage` |
| V4 | 기존 데모 페이지 시각적 regression | 마이그레이션 전 컴포넌트는 기존과 동일 | P0 | — (시각 검증) |
| V5 | TreeView — 인덴트 레벨 | aria-level별 padding 적용 | P0 | ✅ `a11y.test.tsx::Tree nodes have required ARIA attributes` |
| V6 | Combobox — activedescendant 포커스 | `[data-focused]` 셀렉터로 하이라이트 | P0 | ✅ `combobox-keyboard.integration.test.tsx::ArrowDown opens dropdown and focuses first option` |
| V7 | CSS specificity — inline style 제거된 컴포넌트 | CSS 오버라이드가 정상 작동 | P0 | — (시각 검증) |
| V8 | prefers-reduced-motion | transition 비활성화 | P1 | — |
| V9 | 11개 컴포넌트 전부 마이그레이션 완료 | 모든 컴포넌트가 ARIA attr CSS 사용 | P1 (점진적) | — |

상태: 🟢

---

**전체 상태: 🟢 9/9**

**교차 검증:**
1. 화면 구조 ↔ 인터랙션 맵: ✅ CSS 전용 변경, 기존 keyMap 유지
2. 상태 전이 ↔ 시각적 피드백: ✅ 모든 상태에 시각적 표현 매핑됨
3. 유저 스토리 ↔ 검증 기준: ✅ S1→V1/V2, S2→V3, S3→V7, S4→V4
4. 데이터 모델 ↔ 경계 조건: ✅ 빈 리스트, 단일 항목, 깊은 트리, role 충돌 커버

**마이그레이션 순서:** ListBox first → 패턴 확립 후 나머지 점진적

| # | 항목 | 상태 |
|---|------|------|
| 1 | 유저 스토리 | 🟢 |
| 2 | 화면 구조 | 🟢 |
| 3 | 인터랙션 맵 | 🟢 |
| 4 | 상태 전이 | 🟢 |
| 5 | 시각적 피드백 | 🟢 |
| 6 | 데이터 모델 | 🟢 |
| 7 | 경계 조건 | 🟢 |
| 8 | 접근성 | 🟢 |
| 9 | 검증 기준 | 🟢 |
