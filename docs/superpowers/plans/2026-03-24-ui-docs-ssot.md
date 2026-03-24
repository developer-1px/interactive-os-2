# UI 공식 문서 SSOT 통합 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/ui/*` 페이지를 Area MD SSOT 기반으로 전환하고, 사이드바를 5개 범주(Navigation/Selection/Data/Input/Feedback)로 재구성하며, `/internals/pattern`과 `/internals/collection`을 삭제한다.

**Architecture:** PageUiShowcase의 ComponentDemo 영역을 MdPage 렌더러로 교체. ShowcaseDemo 컴포넌트가 showcaseRegistry에서 slug로 데모를 가져와 MD 안에 임베드. 사이드바는 uiCategories.ts에서 범주 정의를 읽어 그룹 렌더링. 23종 Area MD는 빈 뼈대(6개 섹션 헤딩)로 생성하고 내용은 점진 채움.

**Tech Stack:** React, react-markdown, MdPage, showcaseRegistry, ApgKeyboardTable

**Spec:** `docs/superpowers/specs/2026-03-24-ui-docs-ssot-prd.md`

---

## File Structure

| 파일 | 변경 | 책임 |
|------|------|------|
| `src/pages/uiCategories.ts` | **Create** | slug→category 매핑, 사이드바 순서 정의 |
| `src/pages/ShowcaseDemo.tsx` | **Create** | showcaseRegistry slug 조회 → TestRunnerPanel or LiveDemo 렌더 |
| `src/pages/mdComponents.ts` | **Modify** | ShowcaseDemo, ApgKeyboardTable 등록 |
| `src/pages/PageUiShowcase.tsx` | **Modify** | ComponentDemo → MdPage, 사이드바 범주 그룹 |
| `src/pages/ApgKeyboardTable.tsx` | **Modify** | slug 기반 조회 모드 추가 (기존 props 직접 전달도 유지) |
| `src/routeConfig.ts` | **Modify** | pattern/collection 그룹 삭제 |
| `src/AppShell.tsx` | **Modify** | externalNavItems에서 pattern/collection 관련 정리 |
| `docs/2-areas/ui/*.md` × 23 | **Create/Modify** | 15개 기존 마이그레이션 + 8개 신규 생성 |

---

### Task 1: uiCategories — 범주 정의

**Files:**
- Create: `src/pages/uiCategories.ts`

- [ ] **Step 1: Create uiCategories.ts**

```ts
// src/pages/uiCategories.ts
export interface UiCategory {
  label: string
  slugs: string[]
}

export const uiCategories: UiCategory[] = [
  {
    label: 'Navigation',
    slugs: ['navlist', 'tab-list', 'menu-list', 'toolbar', 'accordion', 'disclosure-group'],
  },
  {
    label: 'Selection',
    slugs: ['listbox', 'combobox', 'radio-group', 'checkbox', 'switch-group', 'toggle', 'toggle-group'],
  },
  {
    label: 'Data',
    slugs: ['tree-grid', 'grid', 'tree-view', 'kanban'],
  },
  {
    label: 'Input',
    slugs: ['slider', 'spinbutton'],
  },
  {
    label: 'Feedback',
    slugs: ['dialog', 'alert-dialog', 'toaster', 'tooltip'],
  },
]

/** slug → MD 파일명 매핑 (파일명은 PascalCase export 이름) */
export const slugToMdFile: Record<string, string> = {
  'accordion': 'Accordion',
  'alert-dialog': 'AlertDialog',
  'checkbox': 'Checkbox',
  'combobox': 'Combobox',
  'dialog': 'Dialog',
  'disclosure-group': 'DisclosureGroup',
  'grid': 'Grid',
  'kanban': 'Kanban',
  'listbox': 'ListBox',
  'menu-list': 'MenuList',
  'navlist': 'NavList',
  'radio-group': 'RadioGroup',
  'slider': 'Slider',
  'spinbutton': 'Spinbutton',
  'switch-group': 'SwitchGroup',
  'tab-list': 'TabList',
  'toaster': 'Toaster',
  'toggle': 'Toggle',
  'toggle-group': 'ToggleGroup',
  'toolbar': 'Toolbar',
  'tooltip': 'Tooltip',
  'tree-grid': 'TreeGrid',
  'tree-view': 'TreeView',
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/uiCategories.ts
git commit -m "feat: add uiCategories — slug→category mapping for UI docs sidebar"
```

---

### Task 2: ShowcaseDemo — registry slug 래퍼

**Files:**
- Create: `src/pages/ShowcaseDemo.tsx`
- Modify: `src/pages/mdComponents.ts`

- [ ] **Step 1: Create ShowcaseDemo.tsx**

```tsx
// src/pages/ShowcaseDemo.tsx
import { useState, useCallback } from 'react'
import type { NormalizedData } from '../interactive-os/core/types'
import { components } from './showcaseRegistry'
import { TestRunnerPanel } from '../testRunner/TestRunnerPanel'

export function ShowcaseDemo({ slug }: { slug?: string }) {
  const entry = components.find((c) => c.slug === slug)

  if (!entry) {
    return <div style={{ color: 'var(--destructive)', padding: '8px' }}>Unknown component: {slug}</div>
  }

  if (entry.testPath) {
    return <TestRunnerPanel testPath={entry.testPath} autoRun />
  }

  return <LiveDemo entry={entry} />
}

function LiveDemo({ entry }: { entry: typeof components[number] }) {
  const [data, setData] = useState(() => entry.makeData())
  const onChange = useCallback((next: NormalizedData) => setData(next), [])
  return <>{entry.render(data, onChange)}</>
}
```

- [ ] **Step 2: Register ShowcaseDemo + ApgKeyboardTable in mdComponents**

In `src/pages/mdComponents.ts`, add:

```ts
import { ShowcaseDemo } from './ShowcaseDemo'
import { ApgKeyboardTable } from './ApgKeyboardTable'

// Add to mdComponents record:
ShowcaseDemo,
ApgKeyboardTable,
```

- [ ] **Step 3: Update ApgKeyboardTable for slug-based lookup**

In `src/pages/ApgKeyboardTable.tsx`, add slug-based lookup mode. The component currently takes `ApgPatternData` props directly. Add an optional `slug` prop that looks up from showcaseRegistry:

```tsx
import { components } from './showcaseRegistry'

// Change signature to accept slug OR direct props:
export function ApgKeyboardTable(props: ApgPatternData | { slug: string }) {
  if ('slug' in props) {
    const entry = components.find((c) => c.slug === props.slug)
    if (!entry?.apg) return null  // no APG data = render nothing
    return <ApgKeyboardTable {...entry.apg} />
  }
  // existing implementation with direct props
  const { pattern, url, entries } = props
  // ... rest unchanged
}
```

- [ ] **Step 4: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/pages/ShowcaseDemo.tsx src/pages/mdComponents.ts src/pages/ApgKeyboardTable.tsx
git commit -m "feat: add ShowcaseDemo + ApgKeyboardTable slug lookup for MD embedding"
```

---

### Task 3: Area MD 23종 빈 뼈대 생성

**Files:**
- Modify: 15개 기존 `docs/2-areas/ui/*.md` — 기존 내용을 새 템플릿으로 마이그레이션
- Create: 8개 신규 `docs/2-areas/ui/{NavList,Toaster,Toggle,ToggleGroup,Toolbar,AlertDialog,Checkbox,Dialog}.md`

기존 MD 내용(Props, behavior 대응, DOM)은 새 템플릿의 해당 섹션(Props, Internals)으로 이동. 삭제하지 않음.

- [ ] **Step 1: Create 8 new MD files with skeleton template**

Each file follows this pattern (ListBox.md as reference):

```markdown
# {Name}

> {description from showcaseRegistry}

## Demo

```tsx render
<ShowcaseDemo slug="{slug}" />
```

## Usage

```tsx
{usage from showcaseRegistry — copy as-is}
```

## Props

| prop | type | default | description |
|------|------|---------|-------------|

## Keyboard

```tsx render
<ApgKeyboardTable slug="{slug}" />
```

## Accessibility

- **Role**: —
- **Child role**: —

## Internals

- **Behavior**: —
- **DOM**: —
```

Create files for: NavList, Toaster, Toggle, ToggleGroup, Toolbar, AlertDialog, Checkbox, Dialog.

- [ ] **Step 2: Migrate 15 existing MD files to new template**

For each existing file (Accordion, ListBox, MenuList, TabList, RadioGroup, DisclosureGroup, SwitchGroup, TreeView, TreeGrid, Kanban, Tooltip, Spinbutton, Combobox, Grid, Slider):

1. Read current content (Props table, behavior 대응, DOM 구조)
2. Insert Demo and Usage sections at top (from showcaseRegistry)
3. Insert Keyboard section (tsx render ApgKeyboardTable)
4. Move existing Props → Props section
5. Move behavior/DOM → Internals section
6. Add empty Accessibility section

**Keep all existing content — reformat into new sections, never delete.**

- [ ] **Step 3: Verify all 23 MD files have 6 section headings**

```bash
for f in docs/2-areas/ui/*.md; do
  echo "=== $(basename $f) ==="
  grep "^## " "$f"
done
```

Expected: Each file has `## Demo`, `## Usage`, `## Props`, `## Keyboard`, `## Accessibility`, `## Internals`

- [ ] **Step 4: Commit**

```bash
git add docs/2-areas/ui/
git commit -m "feat: 23종 UI Area MD 빈 뼈대 — 6섹션 템플릿 + tsx render placeholder"
```

---

### Task 4: PageUiShowcase — MdPage 렌더러 + 범주 사이드바

**Files:**
- Modify: `src/pages/PageUiShowcase.tsx`

이 Task가 핵심. ComponentDemo를 MdPage로 교체하고, 사이드바를 범주 그룹으로 재구성.

- [ ] **Step 1: Import new dependencies**

```tsx
import MdPage from './MdPage'
import { uiCategories, slugToMdFile } from './uiCategories'
```

- [ ] **Step 2: Replace sidebarStore with category-grouped store**

기존 flat NavList → 범주별 그룹 렌더로 변경:

```tsx
// 기존 sidebarStore (flat) 제거
// 대신 uiCategories를 직접 순회하여 그룹 렌더

// 사이드바 렌더링:
<nav className={styles.uiSidebar}>
  <div className={styles.uiSidebarHeader}>
    <span className={styles.uiSidebarTitle}>UI Components</span>
  </div>
  <div className={styles.uiSidebarBody}>
    {uiCategories.map((cat) => (
      <div key={cat.label} className={styles.uiCategory}>
        <div className={styles.uiCategoryLabel}>{cat.label}</div>
        {cat.slugs.map((slug) => {
          const entry = components.find((c) => c.slug === slug)
          if (!entry) return null
          return (
            <button
              key={slug}
              className={styles.uiNavItem + (slug === activeSlug ? ' ' + styles.uiNavItemActive : '')}
              onClick={() => navigate(`/ui/${slug}`)}
            >
              {entry.name}
            </button>
          )
        })}
      </div>
    ))}
  </div>
</nav>
```

- [ ] **Step 3: Replace ComponentDemo with MdPage**

```tsx
// 기존:
// <ComponentDemo key={activeEntry.slug} entry={activeEntry} />

// 변경:
const mdFile = slugToMdFile[activeSlug]
// ...
<div className={styles.uiContentBody}>
  {mdFile ? (
    <MdPage key={activeSlug} md={`ui/${mdFile}`} />
  ) : (
    <div>Unknown component: {activeSlug}</div>
  )}
</div>
```

- [ ] **Step 4: Remove unused imports**

`LiveDemo`, `ComponentDemo`, `ApgKeyboardTable` (direct), `TestRunnerPanel` (direct) — 이들은 이제 MD를 통해 간접 사용되므로 PageUiShowcase에서 직접 import 불필요.

`createStore`, `ROOT_ID`, `FOCUS_ID`, `NormalizedData`, `NavList` — 사이드바가 범주 렌더로 변경되면서 불필요.

`ComponentEntry` type도 제거 가능 (components array만 name 조회용으로 사용).

- [ ] **Step 5: Add CSS for category sidebar**

In `src/pages/PageUiShowcase.module.css`, add:

```css
.uiSidebarBody {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-sm) 0;
}

.uiCategory {
  margin-bottom: var(--space-md);
}

.uiCategoryLabel {
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: var(--space-xs) var(--space-md);
}

.uiNavItem {
  display: block;
  width: 100%;
  text-align: left;
  padding: var(--space-xs) var(--space-md) var(--space-xs) var(--space-lg);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 0;
}

.uiNavItem:hover {
  color: var(--text-primary);
  background: var(--surface-raised);
}

.uiNavItemActive {
  color: var(--text-bright);
  background: var(--primary-dim);
}
```

- [ ] **Step 6: Verify TypeScript + tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: No errors, all tests pass

- [ ] **Step 7: Commit**

```bash
git add src/pages/PageUiShowcase.tsx src/pages/PageUiShowcase.module.css
git commit -m "feat: PageUiShowcase → MdPage 렌더러 + 범주 사이드바 (5 groups)"
```

---

### Task 5: routeConfig — pattern/collection 그룹 삭제

**Files:**
- Modify: `src/routeConfig.ts`
- Modify: `src/AppShell.tsx`

- [ ] **Step 1: Remove pattern and collection groups from routeConfig**

In `src/routeConfig.ts`, delete the `internals/pattern` and `internals/collection` objects from the `routeConfig` array. Keep all other groups (store, engine, axis, plugin, components, area).

Also remove all Page imports that were only used by pattern/collection:
```
PageAccordion, PageDisclosure, PageSwitch, PageTabs, PageRadioGroup,
PageSlider, PageSpinbutton, PageMenu, PageToolbar, PageDialog,
PageAlertDialog, PageTreeNav, PageListboxNav, PageGrid, PageComboboxNav,
PageTreeGrid, PageListbox, PageGridCollection, PageTabsCrud,
PageCombobox, PageKanban, PageI18nDataTable
```

- [ ] **Step 2: Verify no remaining references to deleted imports**

Run: `npx tsc --noEmit`
Expected: No errors. If errors, fix any remaining references.

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass (tests are component-level, not route-level)

- [ ] **Step 4: Commit**

```bash
git add src/routeConfig.ts src/AppShell.tsx
git commit -m "refactor: remove pattern/collection from routeConfig — absorbed into /ui/*"
```

---

### Task 6: 전체 검증

- [ ] **Step 1: TypeScript**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Lint**

Run: `npx eslint src/pages/uiCategories.ts src/pages/ShowcaseDemo.tsx src/pages/PageUiShowcase.tsx src/pages/mdComponents.ts src/pages/ApgKeyboardTable.tsx src/routeConfig.ts`
Expected: 0 errors

- [ ] **Step 3: Tests**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 4: Dev server spot check**

```bash
npx vite --port 5173 &
```

Verify:
- `/ui/listbox` → MD 렌더: Demo + Usage + Props + Keyboard + Accessibility + Internals
- `/ui/checkbox` → LiveDemo fallback (no testPath), no crash
- `/ui/toaster` → No Keyboard section (no APG), no crash
- Landing `/` → MiniDemo grid still works
- `/internals/pattern/accordion` → redirects to `/`
- Sidebar shows 5 category groups with all 23 components
