# CSS Modules Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 바닐라 CSS를 유지하면서 dead code 제거 + CSS Modules 전환으로 구조적 dead code 방지 체계 확립

**Architecture:** 전역(tokens.css, components.css, layout.css, app.css) + 모듈(컴포넌트별 .module.css) 2계층. ARIA 속성 셀렉터는 전역 유지, 컴포넌트 구조 스타일만 모듈화.

**Tech Stack:** CSS Modules (Vite 네이티브), git mv

**주의사항:**
- **macOS case-insensitive FS**: git index에 `combobox.tsx`/`Combobox.tsx`, `grid.tsx`/`Grid.tsx`, `radiogroup.tsx`/`RadioGroup.tsx` 중복 엔트리 존재. rename 전 `git rm --cached <lowercase>` 로 phantom 엔트리 제거 필수.
- **조건부 className**: BEM modifier 패턴 (`combo-item${focused ? ' combo-item--focused' : ''}`) → 모듈 전환 시 `${styles.comboItem} ${focused ? styles.comboItemFocused : ''}` 형태로 변환.
- **전역+모듈 혼합 className**: `className="card toolbar-card"` → `className={\`card ${styles.toolbarCard}\`}` (전역 클래스는 문자열 유지).
- **@keyframes**: CSS Modules가 자동 스코핑하므로 같은 모듈 파일 내 `animation:` 참조는 정상 동작.

---

## File Structure

### 전역 CSS (유지/분리)
- `src/styles/tokens.css` — 디자인 토큰 + 리셋 (변경 없음)
- `src/styles/components.css` — ARIA 속성 셀렉터 (변경 없음)
- `src/styles/layout.css` — **신규**: app.css에서 추출 (page grid, sidebar, activity bar)
- `src/styles/app.css` — **축소**: 공유 UI primitives (page-header, kbd, card, demo 등)
- `src/styles/cms.css` — CMS 레이아웃 (변경 없음)

### 삭제
- `src/index.css` — tokens.css와 중복, `p { margin: 0 }` → tokens.css로 이동

### 컴포넌트 CSS → .module.css 전환
- `src/interactive-os/ui/*.css` → `*.module.css` (17개)
- `src/pages/PageViewer.css` → `PageViewer.module.css`
- `src/pages/PageVisualCms.css` → `PageVisualCms.module.css`

### 파일명 통일 (git mv, CSS + TSX 동시)
| 현재 | 변경 후 | 이유 |
|------|---------|------|
| `accordion.css` | `Accordion.module.css` | export = `Accordion` |
| `combobox.css` | `Combobox.module.css` | export = `Combobox` |
| `radiogroup.css` | `RadioGroup.module.css` | export = `RadioGroup` |
| `radiogroup.tsx` | `RadioGroup.tsx` | export = `RadioGroup` |
| `grid.css` | `Grid.module.css` | export = `Grid` |
| `grid.tsx` | `Grid.tsx` | export = `Grid` |
| `slider.css` | `Slider.module.css` | export = `Slider` |
| `spinbutton.css` | `Spinbutton.module.css` | export = `Spinbutton` |
| `kanban.css` | `Kanban.module.css` | export = `Kanban` |

---

## Task 1: Dead Code 제거 + index.css 정리

**Files:**
- Modify: `src/styles/app.css`
- Modify: `src/styles/tokens.css`
- Delete: `src/index.css`
- Modify: `src/main.tsx` (index.css import 제거)

- [ ] **Step 1: app.css에서 dead code 제거**

다음 섹션 삭제 (미사용 확인됨):
- `.log-entry`, `.log-entry__type`, `.log-entry__detail` (lines 463-484)
- `.store-json` (lines 488-499)
- `.pipeline-step`, `.pipeline-step__num`, `.pipeline-step__label`, `.pipeline-step__desc` (lines 503-529)
- `.mermaid-diagram`, `.mermaid-diagram svg` (lines 533-545) — MermaidBlock.tsx는 inline SVG 렌더링, 이 클래스 미사용
- `.coverage-table`, `.coverage-table th`, `.coverage-table td` (lines 549-577)
- `.activity-bar__spacer` (lines 34-36)

- [ ] **Step 2: tokens.css에 `p { margin: 0 }` 추가**

```css
/* tokens.css body 리셋 블록 뒤에 추가 */
p {
  margin: 0;
}
```

- [ ] **Step 3: index.css 삭제 + main.tsx import 제거**

```bash
git rm src/index.css
```

`src/main.tsx`에서 `import './index.css'` 제거

- [ ] **Step 4: 빌드 확인**

Run: `pnpm tsc --noEmit && pnpm vitest run --reporter=verbose 2>&1 | tail -5`
Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add src/styles/app.css src/styles/tokens.css src/main.tsx
git commit -m "chore: remove dead CSS + deduplicate index.css resets"
```

---

## Task 2: app.css 분해 + Vite CSS Modules 설정

**Files:**
- Create: `src/styles/layout.css`
- Modify: `src/styles/app.css`
- Modify: `src/App.tsx` (import 추가)
- Modify: `vite.config.ts` (CSS modules localsConvention)

- [ ] **Step 1: layout.css 추출**

app.css에서 다음 섹션을 `src/styles/layout.css`로 이동:
- Activity Bar 전체 (`.activity-bar`, `.activity-bar__logo`, `.activity-bar__logo .logo-mark`, `.activity-bar__theme-toggle`, `.activity-bar__item`, `.activity-bar__item:hover`, `.activity-bar__item--active`, `.activity-bar__item--active::before`)
- Layout 전체 (`.page`, `.sidebar`, `.sidebar-header`, `.sidebar-header .logo`, `.sidebar-section-title`, `.sidebar-nav`, `.sidebar-link`, `.sidebar-link:hover`, `.badge-wip`, `.content`, `.content:nth-child(2)`)

app.css에 남는 것: Logo, Page header, kbd, card, demo-section, key-table, apg-table, area-viewer

- [ ] **Step 2: App.tsx에 layout.css import 추가**

```tsx
import './styles/tokens.css'
import './styles/components.css'
import './styles/layout.css'   // 추가
import './styles/app.css'
```

- [ ] **Step 3: Vite CSS Modules 설정**

`vite.config.ts`에 CSS modules localsConvention 추가:

```ts
export default defineConfig(({ command }) => {
  const isDev = command === 'serve'
  return {
    css: {
      modules: {
        localsConvention: 'camelCaseOnly',
      },
    },
    plugins: [ /* 기존 유지 */ ],
  }
})
```

- [ ] **Step 4: 빌드 확인**

Run: `pnpm tsc --noEmit && pnpm vitest run --reporter=verbose 2>&1 | tail -5`
Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add src/styles/layout.css src/styles/app.css src/App.tsx vite.config.ts
git commit -m "refactor: extract layout.css from app.css + configure CSS Modules"
```

---

## Task 3: 컴포넌트 CSS → Module 전환 — Batch A (단순 컴포넌트)

대상: TreeView, TabList, ListBox, Grid, Tooltip, Toolbar

**변환 패턴** (모든 컴포넌트에 동일 적용):
1. `git mv X.css X.module.css` (파일명 불일치 시 동시 수정)
2. TSX에서 `import './X.css'` → `import styles from './X.module.css'`
3. TSX에서 `className="foo-bar"` → `className={styles.fooBar}`

**Files:**
- Rename: `TreeView.css` → `TreeView.module.css`
- Modify: `TreeView.tsx`, `TreeGrid.tsx` (TreeView.css 공유)
- Rename+case: `grid.css` → `Grid.module.css`
- Rename: `grid.tsx` → `Grid.tsx` (export = Grid)
- Modify: `Grid.tsx`, `src/pages/PageCell.tsx` (grid.css 공유)
- Rename: `TabList.css` → `TabList.module.css`
- Modify: `TabList.tsx`
- Rename: `ListBox.css` → `ListBox.module.css`
- Modify: `ListBox.tsx`, `src/pages/PageAriaComponent.tsx` (ListBox.css 공유)
- Rename: `Tooltip.css` → `Tooltip.module.css`
- Modify: `Tooltip.tsx`
- Rename: `Toolbar.css` → `Toolbar.module.css`
- Modify: `src/pages/PageToolbar.tsx`

- [ ] **Step 1: git index 중복 정리 + CSS 파일 rename**

grid.tsx/Grid.tsx 중복 엔트리 해결 후 rename:
```bash
cd src/interactive-os/ui
# 1) phantom PascalCase 엔트리 제거 (디스크 파일은 lowercase)
git rm --cached Grid.tsx 2>/dev/null
# 2) CSS rename (case change → tmp 경유)
git mv grid.css tmp.css && git mv tmp.css Grid.module.css
# 3) TSX rename (case change → tmp 경유)
git mv grid.tsx tmp.tsx && git mv tmp.tsx Grid.tsx
# 4) 나머지 CSS rename (case 동일 → 직접)
git mv TreeView.css TreeView.module.css
git mv TabList.css TabList.module.css
git mv ListBox.css ListBox.module.css
git mv Tooltip.css Tooltip.module.css
git mv Toolbar.css Toolbar.module.css
```

- [ ] **Step 2: 각 TSX 파일에서 import 변경**

각 파일에서:
```tsx
// Before
import './TreeView.css'
// After
import styles from './TreeView.module.css'
```

- [ ] **Step 3: className 문자열 → styles 객체 바인딩**

각 TSX 파일에서 className="xxx" 를 className={styles.xxx}로 변환.
CSS 클래스명에 하이픈이 있으면 camelCase로 변환 (Vite localsConvention: 'camelCaseOnly').

예시:
```tsx
// 단순 className
className="tree-inner"  →  className={styles.treeInner}

// 전역 + 모듈 혼합 (전역 클래스는 문자열 유지)
className="card toolbar-card"  →  className={`card ${styles.toolbarCard}`}
```

**PageCell.tsx**: `grid-row`, `grid-header` 등 grid.css 클래스도 모듈 바인딩으로 변환 필수.

- [ ] **Step 4: grid.tsx → Grid.tsx 파일명 변경에 따른 import 경로 업데이트**

grid.tsx를 import하는 모든 파일에서 경로 수정:
```tsx
// Before
import { Grid } from '../interactive-os/ui/grid'
// After
import { Grid } from '../interactive-os/ui/Grid'
```

- [ ] **Step 5: 빌드 확인**

Run: `pnpm tsc --noEmit && pnpm vitest run --reporter=verbose 2>&1 | tail -5`
Expected: 에러 없음

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "refactor: convert simple component CSS to modules (TreeView, TabList, ListBox, Grid, Tooltip, Toolbar)"
```

---

## Task 4: 컴포넌트 CSS → Module 전환 — Batch B (중간 컴포넌트)

대상: MenuList, Accordion, DisclosureGroup, RadioGroup, Slider, Spinbutton, SwitchGroup

**Files:**
- Rename+case: `accordion.css` → `Accordion.module.css`
- Modify: `Accordion.tsx`
- Rename+case: `radiogroup.css` → `RadioGroup.module.css`
- Rename: `radiogroup.tsx` → `RadioGroup.tsx` (export = RadioGroup)
- Modify: `RadioGroup.tsx`
- Rename+case: `slider.css` → `Slider.module.css`
- Modify: `Slider.tsx`
- Rename+case: `spinbutton.css` → `Spinbutton.module.css`
- Modify: `Spinbutton.tsx`
- Rename: `MenuList.css` → `MenuList.module.css`
- Modify: `MenuList.tsx`
- Rename: `DisclosureGroup.css` → `DisclosureGroup.module.css`
- Modify: `DisclosureGroup.tsx`
- Rename: `SwitchGroup.css` → `SwitchGroup.module.css`
- Modify: `SwitchGroup.tsx`

- [ ] **Step 1: git index 중복 정리 + CSS 파일 rename**

radiogroup.tsx/RadioGroup.tsx 중복 엔트리 해결 후 rename:
```bash
cd src/interactive-os/ui
# 1) phantom PascalCase 엔트리 제거
git rm --cached RadioGroup.tsx 2>/dev/null
# 2) case changes (tmp 경유)
git mv accordion.css tmp.css && git mv tmp.css Accordion.module.css
git mv radiogroup.css tmp.css && git mv tmp.css RadioGroup.module.css
git mv radiogroup.tsx tmp.tsx && git mv tmp.tsx RadioGroup.tsx
git mv slider.css tmp.css && git mv tmp.css Slider.module.css
git mv spinbutton.css tmp.css && git mv tmp.css Spinbutton.module.css
# 3) 직접 rename
git mv MenuList.css MenuList.module.css
git mv DisclosureGroup.css DisclosureGroup.module.css
git mv SwitchGroup.css SwitchGroup.module.css
```

- [ ] **Step 2: 각 TSX에서 import 변경 + className 바인딩**

동일 패턴: `import styles from './X.module.css'` + `className={styles.xxx}`

- [ ] **Step 3: radiogroup.tsx → RadioGroup.tsx import 경로 업데이트**

RadioGroup을 import하는 모든 파일에서 경로 수정

- [ ] **Step 4: 빌드 확인**

Run: `pnpm tsc --noEmit && pnpm vitest run --reporter=verbose 2>&1 | tail -5`

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "refactor: convert medium component CSS to modules (MenuList, Accordion, DisclosureGroup, RadioGroup, Slider, Spinbutton, SwitchGroup)"
```

---

## Task 5: 컴포넌트 CSS → Module 전환 — Batch C (복잡 + 특수)

대상: Combobox, Kanban, Button, Dialog

**주의:**
- `combobox.tsx` / `Combobox.tsx` 중복 파일 확인 필요 (macOS case-insensitive)
- Button.css, Dialog.css는 대응하는 컴포넌트 TSX 없음 — PageDialog.tsx, PageAlertDialog.tsx에서만 사용

**Files:**
- Rename+case: `combobox.css` → `Combobox.module.css`
- Handle: `combobox.tsx` / `Combobox.tsx` 중복 해결
- Modify: `Combobox.tsx`
- Rename+case: `kanban.css` → `Kanban.module.css`
- Modify: `Kanban.tsx`
- Rename: `Button.css` → `Button.module.css`
- Rename: `Dialog.css` → `Dialog.module.css`
- Modify: `src/pages/PageDialog.tsx`, `src/pages/PageAlertDialog.tsx`

- [ ] **Step 1: combobox git index 중복 해결**

git index에 `combobox.tsx`와 `Combobox.tsx` 모두 존재 (macOS case-insensitive FS에서 같은 파일).
phantom lowercase 엔트리 제거:
```bash
cd src/interactive-os/ui
git rm --cached combobox.tsx 2>/dev/null
# 디스크의 Combobox.tsx가 유일한 엔트리로 남음
```

- [ ] **Step 2: 각 CSS 파일 rename (git mv)**

```bash
cd src/interactive-os/ui
git mv combobox.css tmp.css && git mv tmp.css Combobox.module.css
git mv kanban.css tmp.css && git mv tmp.css Kanban.module.css
git mv Button.css Button.module.css
git mv Dialog.css Dialog.module.css
```

- [ ] **Step 3: 각 TSX에서 import 변경 + className 바인딩**

Button.module.css, Dialog.module.css: PageDialog.tsx와 PageAlertDialog.tsx에서 import 변경
```tsx
// Before (in PageDialog.tsx)
import '../interactive-os/ui/Button.css'
import '../interactive-os/ui/Dialog.css'
// After
import buttonStyles from '../interactive-os/ui/Button.module.css'
import dialogStyles from '../interactive-os/ui/Dialog.module.css'
```

Combobox 조건부 className 변환 예시:
```tsx
// Before
className={`combo-item${focused ? ' combo-item--focused' : ''}${selected ? ' combo-item--selected' : ''}`}
// After
className={`${styles.comboItem}${focused ? ` ${styles.comboItemFocused}` : ''}${selected ? ` ${styles.comboItemSelected}` : ''}`}
```

- [ ] **Step 4: 빌드 확인**

Run: `pnpm tsc --noEmit && pnpm vitest run --reporter=verbose 2>&1 | tail -5`

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "refactor: convert complex component CSS to modules (Combobox, Kanban, Button, Dialog)"
```

---

## Task 6: 페이지 CSS → Module 전환

대상: PageViewer.css, PageVisualCms.css, area-viewer (app.css에서 추출)

**Files:**
- Rename: `src/pages/PageViewer.css` → `PageViewer.module.css`
- Modify: `src/pages/PageViewer.tsx`
- Rename: `src/pages/PageVisualCms.css` → `PageVisualCms.module.css`
- Modify: `src/pages/PageVisualCms.tsx`, `src/pages/cms/CmsPresentMode.tsx`
- Create: `src/pages/AreaViewer.module.css` (app.css에서 .area-viewer 추출)
- Modify: `src/styles/app.css` (.area-viewer 섹션 제거)
- Modify: `src/pages/PageAreaViewer.tsx`

- [ ] **Step 1: area-viewer를 app.css에서 추출**

app.css의 `.area-viewer *` 섹션 (전체) → `src/pages/AreaViewer.module.css`로 이동.
셀렉터를 모듈 호환으로 변환: `.area-viewer h1` → `.areaViewer h1` 등.
단, 자식 셀렉터 (`.area-viewer h1`, `.area-viewer p` 등)는 `:global()` 없이 자식 요소 스타일링이므로 `.areaViewer` 루트 클래스 + nested element selectors 패턴 사용:

```css
/* AreaViewer.module.css */
.root h1 { /* ... */ }
.root h2 { /* ... */ }
.root p { /* ... */ }
/* ... */
```

PageAreaViewer.tsx에서:
```tsx
import styles from './AreaViewer.module.css'
// <div className={styles.root}> (기존 className="area-viewer" 대체)
```

- [ ] **Step 2: PageViewer.css → module**

```bash
cd src/pages
git mv PageViewer.css PageViewer.module.css
```

PageViewer.tsx에서 import + className 변환.
`.vw-` prefix 클래스들 → camelCase (예: `vw-sidebar` → `styles.vwSidebar`)

- [ ] **Step 3: PageVisualCms.css → module**

```bash
cd src/pages
git mv PageVisualCms.css PageVisualCms.module.css
```

PageVisualCms.tsx, CmsPresentMode.tsx에서 import + className 변환.

- [ ] **Step 4: 빌드 확인**

Run: `pnpm tsc --noEmit && pnpm vitest run --reporter=verbose 2>&1 | tail -5`

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "refactor: convert page CSS to modules (PageViewer, PageVisualCms, AreaViewer)"
```

---

## Task 7: CSS Module 타입 선언 + 최종 정리

**Files:**
- Create: `src/types/css.d.ts` (CSS Module 타입 선언)

- [ ] **Step 1: CSS Module 타입 선언 추가**

```ts
// src/types/css.d.ts
declare module '*.module.css' {
  const classes: { readonly [key: string]: string }
  export default classes
}
```

이미 존재하는지 확인 후 추가.
`tsconfig.json`의 `include` 배열이 `src/types` 디렉토리를 포함하는지 확인. 미포함 시 추가.

- [ ] **Step 2: 미사용 CSS import 최종 점검**

전체 `import.*\.css` grep → 모든 CSS import가 전역(tokens/components/layout/app/cms) 또는 모듈(styles from) 형태인지 확인.
side-effect import (`import './X.css'`)가 남아있으면 안 됨 (전역 제외).

- [ ] **Step 3: 빌드 + 테스트 최종 확인**

Run: `pnpm tsc --noEmit && pnpm vitest run --reporter=verbose 2>&1 | tail -5`

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -m "chore: add CSS Module type declaration + final cleanup"
```

---

## Dependency Graph

```
Task 1 (dead code) ──→ Task 2 (app.css 분해) ──→ Task 3~6 (병렬 가능)
                                                    ├─ Task 3 (Batch A)
                                                    ├─ Task 4 (Batch B)
                                                    ├─ Task 5 (Batch C)
                                                    └─ Task 6 (Pages)
                                                         ↓
                                                    Task 7 (최종 정리)
```

Task 3~6은 서로 독립적이므로 병렬 실행 가능.
Task 7은 모든 전환 완료 후 실행.
