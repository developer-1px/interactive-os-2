# CSS Architecture Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** app.css를 3-Layer CSS 아키텍처로 분해하고, UI 컴포넌트의 inline style을 className으로 전환한다.

**Architecture:** Layer 1(tokens) + Layer 2(ARIA state, `components.css` — 이번에 수정 안 함) + Layer 3(component CSS). 각 UI 컴포넌트가 자기 CSS를 import. flat className, nesting 금지.

**Tech Stack:** CSS (vanilla), React, Vite

**PRD:** `docs/superpowers/prds/2026-03-19-ui-primitives-prd.md`

---

**Critical constraints:**
- 페이지들이 UI 컴포넌트를 import하지 않고 className을 직접 사용하는 경우가 있음 → 해당 페이지에 CSS import 추가 필요
- 페이지가 UI 컴포넌트를 이미 import하면 → 컴포넌트가 CSS를 import하므로 추가 import 불필요 (transitive)
- `.card`는 25+ 페이지에서 직접 사용 → app.css에 잔류 (Phase 2에서 Card 컴포넌트 생성 시 이동)
- `components.css` (Layer 2)는 이번에 수정하지 않음

## File Structure

### 새로 생성할 파일 (13개 — Card.css 제외)

```
src/interactive-os/ui/Accordion.css
src/interactive-os/ui/Button.css
src/interactive-os/ui/combobox.css          ← 소문자 (combobox.tsx와 일치)
src/interactive-os/ui/Dialog.css
src/interactive-os/ui/DisclosureGroup.css
src/interactive-os/ui/Grid.css
src/interactive-os/ui/ListBox.css
src/interactive-os/ui/MenuList.css
src/interactive-os/ui/RadioGroup.css
src/interactive-os/ui/SwitchGroup.css
src/interactive-os/ui/TabList.css
src/interactive-os/ui/Toolbar.css
src/interactive-os/ui/TreeView.css
```

### 수정할 파일

```
src/styles/tokens.css              — spacing + transition 토큰 추가
src/styles/app.css                 — 분해된 스타일 제거 (.card는 잔류)
src/interactive-os/ui/Accordion.tsx — CSS import + inline style → className
src/interactive-os/ui/combobox.tsx  — CSS import 추가
src/interactive-os/ui/DisclosureGroup.tsx — CSS import + inline style → className
src/interactive-os/ui/Grid.tsx      — CSS import + inline style → className
src/interactive-os/ui/ListBox.tsx   — CSS import 추가
src/interactive-os/ui/MenuList.tsx  — CSS import + inline style → className
src/interactive-os/ui/RadioGroup.tsx — CSS import + inline style → className
src/interactive-os/ui/SwitchGroup.tsx — CSS import + inline style → className
src/interactive-os/ui/TabList.tsx   — CSS import 추가
src/interactive-os/ui/TreeGrid.tsx  — CSS import + inline style → className (TreeView.css 공유)
src/interactive-os/ui/TreeView.tsx  — CSS import + inline style → className
src/pages/PageAlertDialog.tsx      — Button.css, Dialog.css import
src/pages/PageDialog.tsx           — Button.css, Dialog.css import
src/pages/PageToolbar.tsx          — Toolbar.css import
```

---

### Task 1: tokens.css에 spacing + transition 토큰 추가

**Files:**
- Modify: `src/styles/tokens.css`

- [ ] **Step 1: 토큰 추가**

`tokens.css`의 `:root` 블록 끝에 (Layout 섹션 아래) 추가:

```css
  /* Spacing */
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

- [ ] **Step 2: 빌드 확인**

Run: `pnpm build:lib`
Expected: SUCCESS (새 변수 추가만, 기존 코드 영향 없음)

- [ ] **Step 3: Commit**

```bash
git add src/styles/tokens.css
git commit -m "feat: add spacing and transition tokens"
```

---

### Task 2: 13개 컴포넌트 CSS 파일 생성 + app.css 정리

**Files:**
- Create: 13개 CSS 파일 (위 목록)
- Modify: `src/styles/app.css` — 추출된 스타일 제거

각 컴포넌트 CSS 파일은 app.css에서 해당 className 블록을 **그대로** 복사. 아래 예외만 수정:
- `.btn-accent { margin-bottom: 8px }` → 제거 (외부 margin 금지)
- `.btn-dialog { margin-right: 4px }` → 제거 (외부 margin 금지)
- `.btn-accent { color: #fff }` → `color: var(--zinc-50)` (토큰만 참조 규칙)

- [ ] **Step 1: TreeView.css 생성**

`src/interactive-os/ui/TreeView.css` — app.css에서 `.tree-node`, `.tree-node__chevron`, `.tree-node__icon`, `.tree-node__name`, `.tree-node__ext` 블록을 복사. inline style 대체 클래스 추가:

```css
/* app.css에서 이동 */
.tree-node { ... }
.tree-node__chevron { ... }
.tree-node__icon { ... }
.tree-node__name { ... }
.tree-node__ext { ... }

/* inline style 대체 (TreeView + TreeGrid 공유) */
.tree-inner {
  display: inline-flex;
  align-items: center;
}

.tree-chevron {
  width: 16px;
  opacity: 0.5;
  flex-shrink: 0;
}
```

- [ ] **Step 2: TabList.css 생성**

app.css에서 `.tab`, `.tab-content` 블록 복사.

- [ ] **Step 3: ListBox.css 생성**

app.css에서 `.list-item`, `.list-item__label`, `.list-item__desc` 블록 복사.

- [ ] **Step 4: MenuList.css 생성**

app.css에서 `.menu-item`, `.menu-item__label`, `.menu-item__arrow` 블록 복사. 추가:

```css
.menu-inner {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.menu-chevron {
  opacity: 0.5;
  font-size: 12px;
}
```

- [ ] **Step 5: combobox.css 생성**

app.css에서 `.combo-item`, `.combo-item--focused`, `.combo-item--selected`, `.combo-input`, `.combo-input:focus`, `.combo-input::placeholder`, `.combo-dropdown` 블록 복사.

- [ ] **Step 6: Accordion.css 생성**

app.css에서 `.accordion-header`, `.accordion-header__label`, `.accordion-header__icon`, `.accordion-panel` 블록 복사. 추가:

```css
.accordion-inner {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.accordion-chevron {
  opacity: 0.5;
}
```

- [ ] **Step 7: DisclosureGroup.css 생성**

app.css에서 `.disclosure-trigger`, `.disclosure-trigger__icon`, `.disclosure-trigger__label`, `.disclosure-panel` 블록 복사. 추가:

```css
.disclosure-inner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.disclosure-chevron {
  opacity: 0.5;
}
```

- [ ] **Step 8: Dialog.css 생성**

app.css에서 `.dialog-backdrop`, `.dialog-box`, `.dialog-header`, `.dialog-body`, `.dialog-footer` 블록 복사.

- [ ] **Step 9: Button.css 생성**

app.css에서 `.btn-accent`, `.btn-accent:hover`, `.btn-accent:active`, `.btn-dialog` 블록 복사. 수정:
- `.btn-accent`: `margin-bottom: 8px` 제거, `color: #fff` → `color: var(--zinc-50)`
- `.btn-dialog`: `margin-right: 4px` 제거

- [ ] **Step 10: Toolbar.css 생성**

app.css에서 `.toolbar-card`, `.toolbar-btn` 블록 복사.

- [ ] **Step 11: SwitchGroup.css 생성**

app.css에서 `.switch-item`, `.switch-item__label`, `.switch-item__toggle`, `.switch-item__toggle--on`, `::after` 블록 복사. 추가:

```css
.switch-inner {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
}

.switch-label {
  font-weight: 600;
  color: var(--text-muted);
}

.switch-label-on {
  font-weight: 600;
  color: var(--accent);
}
```

- [ ] **Step 12: RadioGroup.css 생성**

app.css에서 `.radio-item`, `.radio-item__dot`, `.radio-item__dot--checked`, `::after`, `.radio-item__label` 블록 복사. 추가:

```css
.radio-inner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.radio-indicator {
  font-size: 16px;
}
```

- [ ] **Step 13: Grid.css 생성**

app.css에서 `.grid-cell` 블록 복사. 추가:

```css
.grid-row {
  display: flex;
}
```

- [ ] **Step 14: app.css에서 추출된 스타일 제거**

app.css에서 위 13개 컴포넌트의 스타일 블록을 전부 삭제. `.card`는 잔류.

잔류할 것: `.card`, activity-bar, logo, page/sidebar/content, page-header, kbd, demo-section, tables, log/store/pipeline, mermaid, wip-placeholder, badge-wip.

- [ ] **Step 15: Commit**

```bash
git add src/interactive-os/ui/*.css src/styles/app.css
git commit -m "refactor: extract component CSS from app.css into per-component files"
```

---

### Task 3: UI 컴포넌트에 CSS import 추가 + inline style → className 전환

**Files:**
- Modify: 11개 UI 컴포넌트 TSX 파일

- [ ] **Step 1: Accordion.tsx**

1. 상단에 `import './Accordion.css'` 추가
2. `<span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>` → `<span className="accordion-inner">`
3. chevron의 `style={{ opacity: 0.5 }}` → `className="chevron accordion-chevron"`

- [ ] **Step 2: DisclosureGroup.tsx**

1. `import './DisclosureGroup.css'` 추가
2. `<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>` → `<span className="disclosure-inner">`
3. chevron `style={{ opacity: 0.5 }}` → `className="chevron disclosure-chevron"`

- [ ] **Step 3: TreeView.tsx**

1. `import './TreeView.css'` 추가
2. `<span style={{ display: 'inline-flex', alignItems: 'center' }}>` → `<span className="tree-inner">`
3. chevron `className="chevron" style={{ width: 16, opacity: 0.5, flexShrink: 0 }}` → `className="chevron tree-chevron"`

- [ ] **Step 4: TreeGrid.tsx**

1. `import './TreeView.css'` 추가 (TreeView와 공유 — `.tree-inner`, `.tree-chevron` 클래스 공유)
2. `<span style={{ display: 'inline-flex', alignItems: 'center' }}>` → `<span className="tree-inner">`
3. chevron `className="chevron" style={{ width: 16, opacity: 0.5, flexShrink: 0 }}` → `className="chevron tree-chevron"`

- [ ] **Step 5: MenuList.tsx**

1. `import './MenuList.css'` 추가
2. `<span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>` → `<span className="menu-inner">`
3. chevron `style={{ opacity: 0.5, fontSize: 12 }}` → `className="chevron menu-chevron"`

- [ ] **Step 6: RadioGroup.tsx**

1. `import './RadioGroup.css'` 추가
2. `<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>` → `<span className="radio-inner">`
3. indicator `style={{ fontSize: 16 }}` → `className="radio-indicator"`

- [ ] **Step 7: SwitchGroup.tsx**

1. `import './SwitchGroup.css'` 추가
2. `<span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>` → `<span className="switch-inner">`
3. label `style={{ fontWeight: 600, color: checked ? 'var(--accent)' : 'var(--text-muted)' }}` → `className={checked ? 'switch-label-on' : 'switch-label'}`

- [ ] **Step 8: Grid.tsx**

1. `import './Grid.css'` 추가
2. row `<div style={{ display: 'flex' }}>` → `<div className="grid-row">`

- [ ] **Step 9: combobox.tsx**

1. `import './combobox.css'` 추가 (이미 className 사용 중, import만 추가)

- [ ] **Step 10: ListBox.tsx**

1. `import './ListBox.css'` 추가 (inline style 없음, import만)

- [ ] **Step 11: TabList.tsx**

1. `import './TabList.css'` 추가 (inline style 없음, import만)

- [ ] **Step 12: 테스트 실행**

Run: `pnpm test`
Expected: 전체 통과 (CSS 변경은 jsdom 테스트에 영향 없음)

- [ ] **Step 13: Commit**

```bash
git add src/interactive-os/ui/*.tsx
git commit -m "refactor: add CSS imports and replace inline styles with className"
```

---

### Task 4: 페이지에 CSS import 추가

**Files:**
- Modify: 3개 페이지 파일 (UI 컴포넌트를 import하지 않고 className만 직접 사용하는 페이지)

대부분의 페이지는 이미 UI 컴포넌트를 import하므로 transitive하게 CSS가 로드됨. UI 컴포넌트를 import하지 않는 페이지만 명시적 CSS import 필요:

| 페이지 | 사용하는 className | 필요한 CSS import |
|--------|-------------------|-----------------|
| PageAlertDialog | `.btn-accent`, `.btn-dialog`, `.dialog-*` | Button.css, Dialog.css |
| PageDialog | `.btn-accent`, `.btn-dialog`, `.dialog-*` | Button.css, Dialog.css |
| PageToolbar | `.toolbar-card`, `.toolbar-btn` | Toolbar.css |

나머지 페이지는 `<Aria>` + UI 컴포넌트 조합으로 사용 중이며, UI 컴포넌트의 CSS import를 통해 transitive 로딩됨. 단, **이 가정이 맞는지 Task 5에서 dev 서버로 검증**.

- [ ] **Step 1: PageAlertDialog.tsx 수정**

```tsx
import '../interactive-os/ui/Button.css'
import '../interactive-os/ui/Dialog.css'
```

- [ ] **Step 2: PageDialog.tsx 수정**

```tsx
import '../interactive-os/ui/Button.css'
import '../interactive-os/ui/Dialog.css'
```

- [ ] **Step 3: PageToolbar.tsx 수정**

```tsx
import '../interactive-os/ui/Toolbar.css'
```

- [ ] **Step 4: 테스트**

Run: `pnpm test && pnpm lint`
Expected: 전체 통과

- [ ] **Step 5: Commit**

```bash
git add src/pages/PageAlertDialog.tsx src/pages/PageDialog.tsx src/pages/PageToolbar.tsx
git commit -m "refactor: add explicit CSS imports to pages without component imports"
```

---

### Task 5: 최종 검증

- [ ] **Step 1: 빌드 검증**

```bash
pnpm test && pnpm lint && pnpm build:lib
```
Expected: 전부 통과

- [ ] **Step 2: dev 서버에서 전체 페이지 순회**

```bash
pnpm dev
```
모든 페이지를 순회하여 CSS가 누락된 곳이 없는지 확인. 특히:
- 페이지가 UI 컴포넌트를 import하지 않고 className만 직접 쓰는 경우
- transitive CSS 로딩이 실제로 동작하는지

**시각적 regression 발견 시:** 해당 페이지에 CSS import 추가.

- [ ] **Step 3: app.css에 컴포넌트 클래스 잔류 확인**

app.css에서 추출 대상 클래스가 남아있지 않은지 grep. `.card`만 의도적 잔류.

```bash
grep -E '^\.(tree-node|tab\b|list-item|menu-item|combo-|accordion-|disclosure-|dialog-|btn-accent|btn-dialog|toolbar-|switch-item|radio-item|grid-cell)' src/styles/app.css
```
Expected: 0 matches

- [ ] **Step 4: UI 컴포넌트 inline style 확인**

```bash
grep -n 'style={{' src/interactive-os/ui/*.tsx
```
Expected: dynamic 값만 잔류 (SwitchGroup의 `checked` 조건 등은 className으로 전환 완료)

- [ ] **Step 5: CSS import 확인**

모든 `ui/*.tsx`가 자기 CSS를 import하는지 확인:

```bash
for f in src/interactive-os/ui/*.tsx; do grep -l "import './" "$f" || echo "MISSING: $f"; done
```
