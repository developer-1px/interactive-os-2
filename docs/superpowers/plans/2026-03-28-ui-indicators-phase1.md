# UI Indicators Phase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract 5 existing indicator implementations into `ui/indicators/` module, replace 10 existing components atomically, and add `/ui/indicators` showcase route.

**Architecture:** Non-interactive visual components extracted from UI finished products into a shared `indicators/` sub-module. Each indicator is a pure React component (props → JSX). CSS extracted from `interactive.css` into `indicators.css` with `:where()` specificity 0 preserved.

**Tech Stack:** React, lucide-react, CSS (design tokens)

---

### Task 1: Create indicators.css — extract CSS from interactive.css

**Files:**
- Create: `src/interactive-os/ui/indicators/indicators.css`
- Modify: `src/styles/interactive.css:426-550`

- [ ] **Step 1: Create `src/interactive-os/ui/indicators/indicators.css`**

```css
/* ── Indicator: shared visual elements for UI finished products ──
   Non-interactive, state-driven via ARIA attributes on parent.
   All values are design tokens — no raw numbers.
   :where() wrapping for specificity 0 (overridable by module.css).
*/

/* ── Chevron (expand/collapse) ── */

:where([data-aria-container] .item-chevron) {
  color: var(--text-muted);
  font-size: var(--type-body-size);
  opacity: 0.5;
}

:where([data-aria-container] .item-chevron--expand) {
  width: var(--icon-xs);
  flex-shrink: 0;
  text-align: center;
}

:where([data-aria-container] .item-chevron--tree) {
  width: var(--icon-sm);
  flex-shrink: 0;
}

/* ── Checkbox indicator (square) ── */

:where([data-aria-container] .item-indicator--checkbox) {
  flex-shrink: 0;
  width: var(--icon-md);
  height: var(--icon-md);
  border: 1px solid var(--border-default);
  border-radius: var(--shape-xs-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  transition: background var(--motion-instant-duration), border-color var(--motion-instant-duration);
}

:where([data-aria-container] [aria-selected="true"] .item-indicator--checkbox) {
  border-color: var(--tone-primary-base);
  background: var(--tone-primary-base);
}

:where([data-aria-container] .item-indicator--checkbox-icon) {
  width: var(--icon-sm);
  height: var(--icon-sm);
  color: var(--tone-primary-foreground);
}

/* ── Radio indicator (circle + dot) ── */

:where([data-aria-container] .item-indicator--radio) {
  flex-shrink: 0;
  width: var(--icon-md);
  height: var(--icon-md);
  border: 1px solid var(--border-default);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color var(--motion-instant-duration);
}

:where([data-aria-container] [aria-checked="true"] .item-indicator--radio) {
  border-color: var(--tone-primary-base);
}

:where([data-aria-container] .item-indicator--radio-dot) {
  width: var(--space-sm);
  height: var(--space-sm);
  border-radius: 50%;
  background: var(--tone-primary-base);
}

/* ── Switch indicator (track + thumb) ── */

:where([data-aria-container] .item-indicator--switch) {
  flex-shrink: 0;
  width: var(--switch-width);
  height: var(--switch-height);
  border-radius: var(--shape-pill-radius);
  background: var(--surface-overlay);
  border: 1px solid var(--border-default);
  position: relative;
  transition: background var(--motion-normal-duration) var(--motion-normal-easing),
              border-color var(--motion-normal-duration) var(--motion-normal-easing);
}

:where([data-aria-container] [aria-checked="true"] .item-indicator--switch) {
  background: var(--tone-primary-base);
  border-color: var(--tone-primary-base);
}

:where([data-aria-container] .item-indicator--switch-thumb) {
  position: absolute;
  top: 2px;
  left: 2px;
  width: var(--icon-sm);
  height: var(--icon-sm);
  border-radius: 50%;
  background: var(--text-secondary);
  box-shadow: var(--shadow-sm);
  transition: transform var(--motion-normal-duration) var(--motion-normal-easing),
              background var(--motion-normal-duration) var(--motion-normal-easing);
}

:where([data-aria-container] [aria-checked="true"] .item-indicator--switch-thumb) {
  background: var(--tone-primary-foreground);
  transform: translateX(var(--space-lg));
}

/* ── Toggle text indicator (On/Off) ── */

:where([data-aria-container] .item-indicator--toggle) {
  color: var(--text-muted);
  font-size: var(--type-body-size);
}

:where([data-aria-container] [aria-checked="true"] .item-indicator--toggle) {
  color: var(--tone-success-base);
}

/* ── ToggleGroup text indicator ── */

:where([data-aria-container] .item-indicator--toggle-group) {
  color: var(--text-muted);
}

:where([data-aria-container] [aria-selected="true"] .item-indicator--toggle-group) {
  color: var(--tone-primary-base);
}

/* ── Separator indicator ── */

:where(.item-indicator--separator) {
  flex-shrink: 0;
  background: var(--border-subtle);
}

:where(.item-indicator--separator[aria-orientation="horizontal"]),
:where(.item-indicator--separator:not([aria-orientation])) {
  height: 1px;
  width: 100%;
}

:where(.item-indicator--separator[aria-orientation="vertical"]) {
  width: 1px;
  align-self: stretch;
}
```

- [ ] **Step 2: Remove the extracted CSS from `src/styles/interactive.css`**

Remove lines 426-550 (from `/* ── Item part classes */` through the ToggleGroup indicator block). The comment `/* ═══════════════════════════════════════════` block about standalone component state transitions on line 552 stays.

Replace the removed block with an import comment:

```css
/* ── Item part classes: moved to ui/indicators/indicators.css ── */
```

- [ ] **Step 3: Import indicators.css in the app entry**

Find where `interactive.css` is imported (likely `src/styles/app.css` or the main entry). Add `indicators.css` import right after it:

```css
@import '../interactive-os/ui/indicators/indicators.css';
```

- [ ] **Step 4: Verify styles still work**

Run: `pnpm dev` and visually verify any existing component page (e.g. `/ui/checkbox`) renders the same.

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/ui/indicators/indicators.css src/styles/interactive.css src/styles/app.css
git commit -m "refactor: extract indicator CSS from interactive.css to indicators.css"
```

---

### Task 2: Create 5 indicator components + barrel export

**Files:**
- Create: `src/interactive-os/ui/indicators/ExpandIndicator.tsx`
- Create: `src/interactive-os/ui/indicators/CheckIndicator.tsx`
- Create: `src/interactive-os/ui/indicators/RadioIndicator.tsx`
- Create: `src/interactive-os/ui/indicators/SwitchIndicator.tsx`
- Create: `src/interactive-os/ui/indicators/SeparatorIndicator.tsx`
- Create: `src/interactive-os/ui/indicators/index.ts`

- [ ] **Step 1: Create `ExpandIndicator.tsx`**

```tsx
// ② 2026-03-28-ui-indicators-prd.md
import { ChevronDown, ChevronRight } from 'lucide-react'

interface ExpandIndicatorProps {
  expanded?: boolean
  hasChildren?: boolean
  /** CSS variant: 'expand' (default) | 'tree' */
  variant?: 'expand' | 'tree'
  className?: string
}

export function ExpandIndicator({
  expanded,
  hasChildren = true,
  variant = 'expand',
  className,
}: ExpandIndicatorProps) {
  const variantClass = variant === 'tree' ? 'item-chevron--tree' : 'item-chevron--expand'
  const classes = ['item-chevron', variantClass, className].filter(Boolean).join(' ')

  return (
    <span className={classes}>
      {hasChildren
        ? (expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)
        : ''}
    </span>
  )
}
```

- [ ] **Step 2: Create `CheckIndicator.tsx`**

```tsx
// ② 2026-03-28-ui-indicators-prd.md
interface CheckIndicatorProps {
  checked?: boolean
  className?: string
}

function CheckIcon() {
  return (
    <svg className="item-indicator--checkbox-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export function CheckIndicator({ checked, className }: CheckIndicatorProps) {
  const classes = ['item-indicator--checkbox', className].filter(Boolean).join(' ')
  return (
    <span className={classes}>
      {checked && <CheckIcon />}
    </span>
  )
}
```

- [ ] **Step 3: Create `RadioIndicator.tsx`**

```tsx
// ② 2026-03-28-ui-indicators-prd.md
interface RadioIndicatorProps {
  className?: string
}

export function RadioIndicator({ className }: RadioIndicatorProps) {
  const classes = ['item-indicator--radio', className].filter(Boolean).join(' ')
  return (
    <span className={classes}>
      <span className="item-indicator--radio-dot" />
    </span>
  )
}
```

- [ ] **Step 4: Create `SwitchIndicator.tsx`**

```tsx
// ② 2026-03-28-ui-indicators-prd.md
interface SwitchIndicatorProps {
  className?: string
}

export function SwitchIndicator({ className }: SwitchIndicatorProps) {
  const classes = ['item-indicator--switch', className].filter(Boolean).join(' ')
  return (
    <span className={classes}>
      <span className="item-indicator--switch-thumb" />
    </span>
  )
}
```

- [ ] **Step 5: Create `SeparatorIndicator.tsx`**

```tsx
// ② 2026-03-28-ui-indicators-prd.md
interface SeparatorIndicatorProps {
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function SeparatorIndicator({ orientation = 'horizontal', className }: SeparatorIndicatorProps) {
  const classes = ['item-indicator--separator', className].filter(Boolean).join(' ')
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={classes}
    />
  )
}
```

- [ ] **Step 6: Create barrel `index.ts`**

```ts
// ② 2026-03-28-ui-indicators-prd.md
export { ExpandIndicator } from './ExpandIndicator'
export { CheckIndicator } from './CheckIndicator'
export { RadioIndicator } from './RadioIndicator'
export { SwitchIndicator } from './SwitchIndicator'
export { SeparatorIndicator } from './SeparatorIndicator'
```

- [ ] **Step 7: Typecheck**

Run: `pnpm typecheck`
Expected: PASS — no new errors

- [ ] **Step 8: Commit**

```bash
git add src/interactive-os/ui/indicators/
git commit -m "feat: add 5 indicator components — ExpandIndicator, CheckIndicator, RadioIndicator, SwitchIndicator, SeparatorIndicator"
```

---

### Task 3: Atomic replacement — replace inline indicators in 10 components

**Files:**
- Modify: `src/interactive-os/ui/TreeView.tsx`
- Modify: `src/interactive-os/ui/TreeGrid.tsx`
- Modify: `src/interactive-os/ui/DisclosureGroup.tsx`
- Modify: `src/interactive-os/ui/Accordion.tsx`
- Modify: `src/interactive-os/ui/MenuList.tsx`
- Modify: `src/interactive-os/ui/Breadcrumb.tsx`
- Modify: `src/interactive-os/ui/Checkbox.tsx`
- Modify: `src/interactive-os/ui/RadioGroup.tsx`
- Modify: `src/interactive-os/ui/SwitchGroup.tsx`
- Modify: `src/interactive-os/ui/Toggle.tsx`

All 10 replacements go in one atomic commit. Each file change is small (import swap + JSX swap).

- [ ] **Step 1: Replace TreeView.tsx**

Remove: `import { ChevronDown, ChevronRight } from 'lucide-react'`
Add: `import { ExpandIndicator } from './indicators'`

Replace line 35 chevron JSX:
```tsx
// Before:
<span className="item-chevron item-chevron--tree" {...props.toggleProps}>{hasChildren ? (state.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : ''}</span>

// After:
<span {...props.toggleProps}><ExpandIndicator expanded={state.expanded} hasChildren={hasChildren} variant="tree" /></span>
```

- [ ] **Step 2: Replace TreeGrid.tsx**

Remove: `import { ChevronDown, ChevronRight } from 'lucide-react'`
Add: `import { ExpandIndicator } from './indicators'`

Replace line 28 chevron JSX:
```tsx
// Before:
<span className="item-chevron item-chevron--expand">{hasChildren ? (state.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : ''}</span>

// After:
<ExpandIndicator expanded={state.expanded} hasChildren={hasChildren} />
```

- [ ] **Step 3: Replace DisclosureGroup.tsx**

Remove: `import { ChevronDown, ChevronRight } from 'lucide-react'`
Add: `import { ExpandIndicator } from './indicators'`

Replace line 23 chevron JSX:
```tsx
// Before:
<span className="item-chevron item-chevron--expand">{state.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>

// After:
<ExpandIndicator expanded={state.expanded} />
```

- [ ] **Step 4: Replace Accordion.tsx**

Remove: `import { ChevronRight } from 'lucide-react'`
Add: `import { ExpandIndicator } from './indicators'`

Replace line 28-29 chevron JSX:
```tsx
// Before:
<span className={`${styles.chevron} ${state.expanded ? styles.chevronExpanded : ''}`}>
  <ChevronRight size={16} />
</span>

// After:
<span className={`${styles.chevron} ${state.expanded ? styles.chevronExpanded : ''}`}>
  <ExpandIndicator expanded={state.expanded} />
</span>
```

Note: Accordion keeps its own module.css rotation wrapper. The ExpandIndicator renders the chevron inside; the outer span applies the Accordion-specific rotation animation.

IMPORTANT: Because ExpandIndicator already wraps in `<span className="item-chevron item-chevron--expand">`, and Accordion's `.chevron` class handles rotation separately, we need to strip the ExpandIndicator's own wrapper to avoid double-wrapping. Instead, render the icon directly:

Actually, the cleaner approach is: Accordion's `.chevron` already positions/animates. ExpandIndicator adds its own `item-chevron` wrapper. This double-wrapper is harmless — the outer `.chevron` handles rotation and the inner `item-chevron` handles color/opacity. Keep it as-is.

- [ ] **Step 5: Replace MenuList.tsx**

Remove: `import { ChevronDown, ChevronRight } from 'lucide-react'`
Add: `import { ExpandIndicator } from './indicators'`

Replace lines 24-26 chevron JSX:
```tsx
// Before:
{state.expanded !== undefined && (
  <span className="item-chevron">{state.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
)}

// After:
{state.expanded !== undefined && (
  <ExpandIndicator expanded={state.expanded} />
)}
```

- [ ] **Step 6: Replace Breadcrumb.tsx**

Remove: `import { ChevronRight } from 'lucide-react'`
Add: `import { SeparatorIndicator } from './indicators'`

Replace line 11 separator:
```tsx
// Before:
{i > 0 && <ChevronRight size={12} className={styles.sep} />}

// After:
{i > 0 && <SeparatorIndicator orientation="vertical" className={styles.sep} />}
```

Note: Breadcrumb uses a chevron as a separator (size 12), not as an expand indicator. Replacing with SeparatorIndicator changes the visual from a chevron to a thin line. If the chevron look must be preserved, keep using ExpandIndicator with a `separator` usage.

DECISION: Breadcrumb's chevron is a separator in function. The SeparatorIndicator renders a line, but the original visual was a chevron. Two options:
- A: Use SeparatorIndicator (line) — simpler, standard separator visual
- B: Keep chevron import just for Breadcrumb — defeats extraction purpose

Go with A (SeparatorIndicator). The visual change (chevron → line) is a design improvement — separators should look like separators, not expand indicators. The Breadcrumb.module.css `.sep` class handles spacing.

- [ ] **Step 7: Replace Checkbox.tsx**

Remove the `CheckIcon` function (lines 16-22).
Add: `import { CheckIndicator } from './indicators'`

Replace lines 31-33:
```tsx
// Before:
<span className="item-indicator--checkbox">
  {checked && <CheckIcon />}
</span>

// After:
<CheckIndicator checked={checked} />
```

- [ ] **Step 8: Replace RadioGroup.tsx**

Add: `import { RadioIndicator } from './indicators'`

Replace lines 22-24:
```tsx
// Before:
<span className="item-indicator--radio">
  <span className="item-indicator--radio-dot" />
</span>

// After:
<RadioIndicator />
```

- [ ] **Step 9: Replace SwitchGroup.tsx**

Add: `import { SwitchIndicator } from './indicators'`

Replace lines 23-25:
```tsx
// Before:
<span className="item-indicator--switch">
  <span className="item-indicator--switch-thumb" />
</span>

// After:
<SwitchIndicator />
```

- [ ] **Step 10: Replace Toggle.tsx**

Toggle uses text "On"/"Off" — this is a text-based indicator, not one of the 5 extracted indicators. The Toggle's inline implementation is already a single line (`<span className="item-indicator--toggle">{checked ? 'On' : 'Off'}</span>`). No extraction needed for Phase 1 — Toggle stays as-is.

Skip this file.

- [ ] **Step 11: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS

- [ ] **Step 12: Commit (atomic — all 9 replacements in one commit)**

```bash
git add src/interactive-os/ui/TreeView.tsx src/interactive-os/ui/TreeGrid.tsx src/interactive-os/ui/DisclosureGroup.tsx src/interactive-os/ui/Accordion.tsx src/interactive-os/ui/MenuList.tsx src/interactive-os/ui/Breadcrumb.tsx src/interactive-os/ui/Checkbox.tsx src/interactive-os/ui/RadioGroup.tsx src/interactive-os/ui/SwitchGroup.tsx
git commit -m "refactor: replace inline indicators with shared indicator components"
```

---

### Task 4: Add `/ui/indicators` showcase route + contents

**Files:**
- Modify: `src/pages/uiCategories.ts`
- Create: `contents/ui/Indicators.md`

- [ ] **Step 1: Add 'Indicators' category to `src/pages/uiCategories.ts`**

Add a new category at the end of the `uiCategories` array:

```ts
{
  label: 'Indicators',
  slugs: ['indicators'],
},
```

Add to `slugToMdFile`:

```ts
'indicators': 'Indicators',
```

- [ ] **Step 2: Create `contents/ui/Indicators.md`**

```markdown
# Indicators

> Non-interactive visual elements that visualize state inside UI finished products. Always consumed by a parent component — never used standalone.

## Location

`interactive-os/ui/indicators/`

## ExpandIndicator

Chevron that rotates to show expand/collapse state.

### Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| expanded | boolean | undefined | 확장 상태 |
| hasChildren | boolean | true | 자식 존재 여부. false이면 빈 공간 |
| variant | 'expand' \| 'tree' | 'expand' | CSS 너비 변형 |
| className | string | — | 추가 CSS 클래스 |

### Usage

```tsx
import { ExpandIndicator } from 'interactive-os/ui/indicators'

<ExpandIndicator expanded={true} />
<ExpandIndicator expanded={false} hasChildren={false} />
<ExpandIndicator expanded={true} variant="tree" />
```

### Used by

TreeView, TreeGrid, DisclosureGroup, Accordion, MenuList

---

## CheckIndicator

Checkmark SVG inside a checkbox container.

### Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| checked | boolean | undefined | 체크 상태 |
| className | string | — | 추가 CSS 클래스 |

### Usage

```tsx
import { CheckIndicator } from 'interactive-os/ui/indicators'

<CheckIndicator checked={true} />
<CheckIndicator checked={false} />
```

### Used by

Checkbox

---

## RadioIndicator

Circle with inner dot, driven by ARIA parent state.

### Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| className | string | — | 추가 CSS 클래스 |

### Usage

```tsx
import { RadioIndicator } from 'interactive-os/ui/indicators'

<RadioIndicator />
```

### Used by

RadioGroup

---

## SwitchIndicator

Track with sliding thumb, driven by ARIA parent state.

### Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| className | string | — | 추가 CSS 클래스 |

### Usage

```tsx
import { SwitchIndicator } from 'interactive-os/ui/indicators'

<SwitchIndicator />
```

### Used by

SwitchGroup

---

## SeparatorIndicator

Visual divider line (horizontal or vertical).

### Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| orientation | 'horizontal' \| 'vertical' | 'horizontal' | 방향 |
| className | string | — | 추가 CSS 클래스 |

### Usage

```tsx
import { SeparatorIndicator } from 'interactive-os/ui/indicators'

<SeparatorIndicator />
<SeparatorIndicator orientation="vertical" />
```

### Used by

Breadcrumb, Menu, Toolbar
```

- [ ] **Step 3: Verify showcase**

Run: `pnpm dev` and navigate to `/ui/indicators`.
Expected: Indicators page renders in the sidebar under "Indicators" category, content shows all 5 indicators with props tables.

- [ ] **Step 4: Commit**

```bash
git add src/pages/uiCategories.ts contents/ui/Indicators.md
git commit -m "feat: add /ui/indicators showcase route with documentation"
```

---

### Task 5: Update Area document + PROGRESS.md

**Files:**
- Modify: `docs/2-areas/ui/indicators.md`
- Modify: `docs/PROGRESS.md` (if it tracks UI modules)

- [ ] **Step 1: Update Area indicators.md progress**

Update the Indicator Matrix for Phase 1 items:

| # | Indicator | 진척 |
|---|-----------|------|
| 1 | ExpandIndicator | 🟢 |
| 2 | CheckIndicator | 🟢 |
| 3 | RadioIndicator | 🟢 |
| 4 | SwitchIndicator | 🟢 |
| 14 | SeparatorIndicator | 🟢 |

Update 현황 요약:
```
추출 대상 (기존 중복):  5/6  완료   (Toggle은 Phase 2)
신규 구현:              0/12 완료
총:                     5/18 완료 (28%)
```

- [ ] **Step 2: Update PROGRESS.md**

Add `indicators` module entry under the ui section (if structure permits).

- [ ] **Step 3: Commit**

```bash
git add docs/2-areas/ui/indicators.md docs/PROGRESS.md
git commit -m "docs: update indicators area progress — Phase 1 complete (5/18)"
```
