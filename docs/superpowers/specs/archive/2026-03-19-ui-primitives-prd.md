# UI Primitives — PRD

> Discussion: LLM이 CSS를 못하는 근본 원인 → 표준 컴포넌트 세트를 만들어서 해결. "디자인"이 아니라 "당연한 것"을 전부 갖추는 것. interactive-os의 "OS" 완성.

## 0. CSS 아키텍처 규칙

### 3-Layer 구조

| Layer | 파일 | 역할 | 셀렉터 종류 |
|-------|------|------|------------|
| 1. Tokens | `styles/tokens.css` | CSS 변수만 정의 | `:root`, `[data-theme]` |
| 2. ARIA State | `styles/components.css` | ARIA 속성 기반 상태 스타일 | `[aria-*]`, `[data-focused]`, `:hover`, `:focus` |
| 3. Component | `ui/{Component}.css` | 컴포넌트 자체 레이아웃/외형 | `.btn`, `.card` 등 flat class |

### className 규칙

| # | 규칙 | 예시 ○ | 예시 ✗ |
|---|------|--------|--------|
| 1 | **flat 네이밍** — nesting 금지 | `.card-header { }` | `.card .card-header { }` |
| 2 | **하이픈 연결** — variant/element 모두 | `.btn-primary`, `.card-header` | `.btn--primary` (BEM), `.btnPrimary` |
| 3 | **컴포넌트 = 1 CSS 파일** | `Button.tsx` → `import './Button.css'` | app.css에 모아놓기 |
| 4 | **inline style 금지** (dynamic 값 제외) | `className="btn-primary"` | `style={{ padding: 6 }}` |
| 5 | **토큰만 참조** | `color: var(--text-primary)` | `color: #fff` |
| 6 | **ARIA 상태 건드리지 않음** | Layer 2가 hover/focus/selected 담당 | `.btn:hover { }` 컴포넌트 CSS에 작성 |
| 7 | **외부 margin 금지** | 부모가 `gap`으로 간격 제어 | `.btn { margin-bottom: 8px }` |

### Size 체계

| 접미사 | 용도 | 예시 |
|--------|------|------|
| `-sm` | 밀도 높은 UI (toolbar, sidebar) | `.btn-sm` |
| (기본, 생략) | 일반 UI | `.btn` |
| `-lg` | 강조, 랜딩 | `.btn-lg` |

### 추가할 토큰 (tokens.css)

```css
/* Spacing scale */
--space-xs: 4px;
--space-sm: 8px;
--space-md: 12px;
--space-lg: 16px;
--space-xl: 24px;
--space-2xl: 32px;

/* Transition */
--transition-fast: 0.08s;
--transition-normal: 0.15s;
```

상태: 🟡

## 1. 유저 스토리

| # | Given | When | Then |
|---|-------|------|------|
| US1 | 개발자가 페이지를 조립할 때 | `<Button>`, `<Card>`, `<ScrollArea>` 등을 import하면 | CSS 작성 없이 표준적인 UI가 렌더됨 |
| US2 | LLM이 페이지를 생성할 때 | 표준 프리미티브를 조합하면 | raw CSS 없이 레이아웃이 정확함 (스크롤, flex, 크기) |
| US3 | variant를 바꿀 때 | `<Button variant="ghost">` prop만 변경하면 | className이 자동 전환되어 해당 스타일 적용 |
| US4 | 기존 app.css 분해 후 | 모든 페이지를 렌더하면 | 시각적 변화 없음 (regression 0) |
| US5 | 기존 UI 컴포넌트의 inline style 제거 후 | 모든 데모 페이지가 동일하게 렌더됨 | 기능·외형 변화 없음 |

상태: 🟡

## 2. 화면 구조

### Phase 1: 기존 분해 (이 PRD 범위)

**app.css (1008줄) → 분해:**

| 현재 className | 이동할 곳 | 컴포넌트 | 역PRD |
|---------------|----------|---------|-------|
| `.card` | `ui/Card.css` → 신규 `Card.tsx` | Card | (module.css 미생성 — app.css 잔류 추정) |
| `.tree-node*` | `ui/TreeView.css` | TreeView (기존) | `ui/TreeView.module.css` |
| `.tab*`, `.tab-content` | `ui/TabList.css` | TabList (기존) | `ui/TabList.module.css` |
| `.list-item*` | `ui/ListBox.css` | ListBox (기존) | `ui/ListBox.module.css` |
| `.menu-item*` | `ui/MenuList.css` | MenuList (기존) | `ui/MenuList.module.css` |
| `.combo-*` | `ui/Combobox.css` | Combobox (기존) | `ui/Combobox.module.css` |
| `.accordion-*` | `ui/Accordion.css` | Accordion (기존) | `ui/Accordion.module.css` |
| `.disclosure-*` | `ui/DisclosureGroup.css` | DisclosureGroup (기존) | `ui/DisclosureGroup.module.css` |
| `.dialog-*` | `ui/Dialog.css` → 신규 `Dialog.tsx` (?) | Dialog | `ui/Dialog.module.css`, `ui/Dialog.tsx` |
| `.btn-accent`, `.btn-dialog` | `ui/Button.css` → 신규 `Button.tsx` | Button | `ui/Button.module.css`, `ui/Button.tsx` |
| `.toolbar-*` | `ui/Toolbar.css` (기존 Toolbar 없음) | Toolbar (?) | `ui/Toolbar.module.css`, `ui/Toolbar.tsx` |
| `.switch-item*` | `ui/SwitchGroup.css` | SwitchGroup (기존) | `ui/SwitchGroup.module.css` |
| `.radio-item*` | `ui/RadioGroup.css` | RadioGroup (기존) | `ui/RadioGroup.module.css` |
| `.grid-cell` | `ui/Grid.css` | Grid (기존) | `ui/Grid.tsx` (module.css 미생성) |

**app.css에 잔류:**

| className | 이유 |
|-----------|------|
| `.activity-bar*` | App Shell 레이아웃 |
| `.page`, `.sidebar*`, `.content` | App Shell 레이아웃 |
| `.logo*`, `.version` | App Shell 브랜딩 |
| `.page-header`, `.page-title`, `.page-desc`, `.page-keys` | 페이지 공통 헤더 |
| `.wip-placeholder` | 유틸 |
| `kbd`, `.key-hint` | 글로벌 유틸 |
| `.demo-section*` | 데모 전용 |
| `.apg-*`, `.key-table*`, `.coverage-table*` | 문서 테이블 |
| `.log-*`, `.store-*`, `.pipeline-*`, `.mermaid-*` | 데모 전용 |
| `.badge-wip` | 유틸 |

**UI 컴포넌트 inline style 제거:**

| 컴포넌트 | 현재 inline style | 이동할 className |
|----------|-------------------|-----------------|
| Accordion | `display: inline-flex, alignItems, justifyContent, width: 100%` + chevron `opacity: 0.5` | `.accordion-header-inner`, `.accordion-chevron` |
| DisclosureGroup | `display: inline-flex, alignItems, gap: 8` + chevron `opacity: 0.5` | `.disclosure-inner`, `.disclosure-chevron` |
| TreeView | `display: inline-flex, alignItems` + chevron `width: 16, opacity: 0.5, flexShrink: 0` | `.tree-inner`, `.tree-chevron` |
| TreeGrid | `display: inline-flex, alignItems` + chevron `width: 16, opacity: 0.5, flexShrink: 0` | `.treegrid-inner`, `.treegrid-chevron` |
| MenuList | `display: inline-flex, alignItems, justifyContent, width: 100%` + chevron `opacity: 0.5, fontSize: 12` | `.menu-inner`, `.menu-chevron` |
| RadioGroup | `display: inline-flex, alignItems, gap: 8` + indicator `fontSize: 16` | `.radio-inner`, `.radio-indicator` |
| SwitchGroup | `display: inline-flex, alignItems, justifyContent, width: 100%, gap: 8` + label `fontWeight, color` | `.switch-inner`, `.switch-label` |
| Grid | `display: flex` (row) | `.grid-row` |

**변경 없는 컴포넌트:** ListBox, TabList (inline style 없음), Combobox (이미 className 사용)

### Phase 2: 새 프리미티브 (별도 PRD)

> 전체 카탈로그 → [2026-03-19-ui-primitives-catalog.md] (별도 문서)

| # | 컴포넌트 | behavior 필요 | 우선순위 (?) |
|---|----------|--------------|-------------|
| 1 | Button | — | P0 |
| 2 | Input | — | P0 |
| 3 | Textarea | — | P1 |
| 4 | Label | — | P0 |
| 5 | Select | listbox (?) | P1 |
| 6 | Checkbox | — | P0 |
| 7 | Toggle | — | P1 |
| 8 | Card | — | P0 |
| 9 | Separator | — | P0 |
| 10 | ScrollArea | — | P0 |
| 11 | Popover | — | P1 |
| 12 | Sheet | — | P1 |
| 13 | Collapsible | disclosure (?) | P1 |
| 14 | Table | — | P1 |
| 15 | Badge | — | P1 |
| 16 | Alert | — | P1 |
| 17 | Progress | — | P1 |
| 18 | Skeleton | — | P1 |
| 19 | AspectRatio | — | P2 |
| 20 | Avatar | — | P2 |
| 21 | Tooltip | — | P1 |
| 22 | Breadcrumb | — | P2 |
| 23 | Pagination | — | P2 |
| 24 | ToggleGroup | — | P1 |
| 25 | Slider | slider behavior (P2) | P2 |
| 26 | Form | — | P1 |
| 27 | ContextMenu | menu (?) | P1 |
| 28 | DropdownMenu | menu (?) | P1 |
| 29 | HoverCard | — | P2 |
| 30 | NavigationMenu | — | P2 |
| 31 | Resizable | — | P2 |
| 32 | Toast | — | P1 |
| 33 | Carousel | — | P2 |
| 34 | Drawer | — | P2 |

상태: 🟡

## 3. 인터랙션 맵

> 이 PRD는 UI 기능 추가가 아니라 **CSS 아키텍처 마이그레이션**. 인터랙션 변화 없음이 목표.

| 조건 | 기대 결과 |
|------|----------|
| 마이그레이션 전후 모든 키보드 인터랙션 | 동일 (behavior 레이어 변경 없음) |
| 마이그레이션 전후 모든 마우스 인터랙션 | 동일 |
| 마이그레이션 전후 hover/focus/selected 시각 피드백 | 동일 (Layer 2 변경 없음) |

상태: 🟡

## 4. 상태 전이

> 마이그레이션은 상태 전이를 변경하지 않음. 참고용으로 공통 상태만 정리.

| 상태 | 스타일 출처 | 토큰 |
|------|-----------|------|
| default | Layer 3 (Component CSS) | `--text-primary`, `--surface-*` |
| hover | Layer 2 (components.css) | `--bg-hover` |
| focus (roving) | Layer 2 | `--accent-dim`, `--text-bright` |
| focus (activedescendant) | Layer 2 | `[data-focused]` → `--accent-dim` |
| selected | Layer 2 | `--bg-select` |
| checked | Layer 2 | `--bg-select` |
| disabled | Layer 3 (?) | `opacity: 0.5`, `pointer-events: none` |
| expanded | Layer 2 | `.chevron` rotate(90deg) |

상태: 🟡

## 5. 시각적 피드백

> 마이그레이션 목표: **시각적 변화 0**.

| 항목 | 기대 |
|------|------|
| 모든 데모 페이지 렌더링 | 분해 전후 pixel-identical |
| inline style → className 전환 | 동일 외형 (동일 CSS 속성값) |
| 토큰 추가 (spacing, transition) | 기존 코드에 영향 없음 (새 변수 추가만) |

**마이그레이션 시 주의:**
- `.chevron` 클래스는 Layer 2에서 `rotate(90deg)` 참조 → 클래스명 유지 필수
- `.combo-item--focused` 등 combobox 전용 클래스는 ARIA 패턴과 다른 방식 → 장기적으로 Layer 2로 통합 검토, 이번에는 유지

상태: 🟡

## 6. 데이터 모델

> 이 PRD(Phase 1)는 CSS 분해만. store 변경 없음.

Phase 2 새 프리미티브의 store 연결 패턴 (참고):

```
기존 패턴: Entity<T> → Command → Plugin → Behavior → Component
```

| 프리미티브 유형 | store 연결 수준 |
|---------------|---------------|
| 순수 레이아웃 (Card, Separator, ScrollArea) | entity 불필요 — 순수 CSS 컴포넌트 |
| form 요소 (Button, Input, Checkbox) | entity의 `data` 필드와 연결 가능 |
| 복합 위젯 (Select, ContextMenu) | behavior + plugin 필요 |

상태: 🟡

## 7. 경계 조건

| 조건 | 예상 동작 |
|------|----------|
| CSS 파일 분해 시 import 순서 | Vite가 import 순서대로 번들 → 기존 app.css 순서와 동일하게 유지 |
| 같은 className이 두 파일에 존재 | 금지 — flat 네이밍이므로 전역 유일해야 함 |
| 기존 페이지에서 app.css의 컴포넌트 클래스 직접 참조 | 컴포넌트 CSS로 이동 후에도 동작해야 함 → 페이지에서 해당 컴포넌트를 import하면 CSS가 따라옴 |
| 페이지가 컴포넌트를 import하지 않고 className만 쓰는 경우 | CSS가 로드 안 됨 → **발견 시 컴포넌트 import 추가 또는 해당 스타일을 app.css에 유지** |
| 윈도우 리사이즈 / viewport 변경 | 영향 없음 (CSS 값 변경 아님) |
| 이벤트 버블링 (중첩 구조) | 영향 없음 (CSS만 이동, JS 변경 없음) |

상태: 🟡

## 8. 접근성

> CSS 마이그레이션은 접근성에 영향 없음. 확인 항목만 정리.

- **ARIA role:** 변경 없음. Layer 2가 `[role]` 셀렉터로 스타일링, 그대로 유지
- **키보드 패턴:** 변경 없음. behavior 레이어 미접촉
- **스크린리더:** 변경 없음. DOM 구조 미변경
- **focus-visible:** 변경 없음. tokens.css의 `*:focus-visible` 유지
- **prefers-reduced-motion:** 변경 없음. tokens.css에 이미 존재

상태: 🟡

## 9. 검증 기준

| # | 시나리오 | 예상 결과 | 우선순위 | 역PRD |
|---|---------|----------|---------|-------|
| V1 | `pnpm dev` → 모든 데모 페이지 순회 | 시각적 변화 없음 | P0 | (시각 검증) |
| V2 | `pnpm test` | 기존 393 tests 전부 통과 | P0 | 전체 테스트 스위트 |
| V3 | `pnpm lint` | 0 errors | P0 | `pnpm lint` |
| V4 | `pnpm build:lib` | 빌드 성공 | P0 | `pnpm build:lib` |
| V5 | app.css에 컴포넌트 클래스 잔류 없음 | grep 결과 0 | P0 | (부분 잔류 — module.css 마이그레이션 진행 중) |
| V6 | 모든 ui/*.tsx에 inline style 없음 (dynamic 제외) | grep 결과 0 (또는 dynamic만) | P0 | `__tests__/ui-components.test.tsx` |
| V7 | 각 ui/*.tsx가 자기 CSS를 import | import 문 존재 확인 | P0 | 각 `ui/*.tsx` → `*.module.css` import |
| V8 | tokens.css에 spacing + transition 토큰 추가됨 | 변수 존재 확인 | P1 | `styles/tokens.css::--space-xs, --transition-fast` |
| V9 | 새 토큰이 기존 코드에 영향 없음 | 기존 코드에서 새 토큰 미사용 → 부작용 0 | P1 | (부작용 없음 확인됨) |

상태: 🟡

---

**전체 상태:** 🟡 9/9 초안 완료 — 사용자 확인 시 🟢 전환

## 부록: app.css 분해 상세

### 분해 후 app.css 잔류 (예상 ~400줄)

```
activity-bar 계열      (~107줄)
logo 계열              (~35줄)
page/sidebar/content   (~80줄)
page-header 계열       (~47줄)
kbd                    (~20줄)
demo-section 계열      (~40줄)
key-table/apg-table    (~70줄)
log/store/pipeline     (~50줄)
mermaid/coverage       (~30줄)
wip-placeholder/badge  (~15줄)
```

### 분해되어 나갈 CSS (예상 ~600줄)

```
ui/Card.css            (.card)                    ~6줄
ui/TreeView.css        (.tree-node*)              ~30줄
ui/TabList.css         (.tab*)                    ~15줄
ui/ListBox.css         (.list-item*)              ~20줄
ui/MenuList.css        (.menu-item*)              ~20줄
ui/Combobox.css        (.combo-*)                 ~45줄
ui/Accordion.css       (.accordion-*)             ~25줄
ui/DisclosureGroup.css (.disclosure-*)            ~25줄
ui/Dialog.css          (.dialog-*)                ~40줄
ui/Button.css          (.btn-*)                   ~35줄
ui/Toolbar.css         (.toolbar-*)               ~15줄
ui/SwitchGroup.css     (.switch-item*)            ~30줄
ui/RadioGroup.css      (.radio-item*)             ~30줄
ui/Grid.css            (.grid-cell)               ~10줄
```

### UI 컴포넌트 inline style → className 매핑

| 컴포넌트 | 현재 inline | 새 className | CSS 속성 |
|----------|------------|-------------|---------|
| Accordion | `display: inline-flex; align-items: center; justify-content: space-between; width: 100%` | `.accordion-inner` | 동일 |
| Accordion | chevron `opacity: 0.5` | `.chevron` (기존 유지) + opacity 추가 | `opacity: 0.5` |
| DisclosureGroup | `display: inline-flex; align-items: center; gap: 8px` | `.disclosure-inner` | 동일 |
| DisclosureGroup | chevron `opacity: 0.5` | `.chevron` 유지 | `opacity: 0.5` |
| TreeView | `display: inline-flex; align-items: center` | `.tree-inner` | 동일 |
| TreeView | chevron `width: 16px; opacity: 0.5; flex-shrink: 0` | `.tree-chevron` | 동일 |
| TreeGrid | `display: inline-flex; align-items: center` | `.treegrid-inner` | 동일 |
| TreeGrid | chevron `width: 16px; opacity: 0.5; flex-shrink: 0` | `.treegrid-chevron` | 동일 |
| MenuList | `display: inline-flex; align-items: center; justify-content: space-between; width: 100%` | `.menu-inner` | 동일 |
| MenuList | chevron `opacity: 0.5; font-size: 12px` | `.menu-chevron` | 동일 |
| RadioGroup | `display: inline-flex; align-items: center; gap: 8px` | `.radio-inner` | 동일 |
| RadioGroup | indicator `font-size: 16px` | `.radio-indicator` | 동일 |
| SwitchGroup | `display: inline-flex; align-items: center; justify-content: space-between; width: 100%; gap: 8px` | `.switch-inner` | 동일 |
| SwitchGroup | label `font-weight: 600; color: var(--accent)/var(--text-muted)` | `.switch-label`, `.switch-label-on` | 동일 (dynamic color은 className 토글) |
| Grid | row `display: flex` | `.grid-row` | 동일 |
