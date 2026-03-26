# Surface Token System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure tokens.css to use semantic surface names with `[data-surface]` bundles and separate semantic color tokens (primary/focus/selection/destructive).

**Architecture:** Single-file refactoring of `src/styles/tokens.css`. New semantic variables defined first, then `[data-surface]` selector blocks for bundles, then backward-compatible aliases. No new files created.

**Tech Stack:** CSS custom properties, `data-*` attribute selectors

**PRD:** `docs/superpowers/prds/2026-03-22-surface-tokens-prd.md`

---

### Task 1: Add semantic surface variables + semantic colors (dark)

**Files:**
- Modify: `src/styles/tokens.css:37-85` (`:root` Tier 2 semantic block)

- [ ] **Step 1: Replace surface-0~4 with semantic names**

Replace the existing surface block:
```css
/* ── Surface: elevation via palette steps ── */
--surface-0: var(--zinc-950);
--surface-1: var(--zinc-900);
--surface-2: var(--zinc-850);
--surface-3: var(--zinc-800);
--surface-4: var(--zinc-700);
```

With:
```css
/* ── Surface: semantic elevation names ── */
--surface-base:     var(--zinc-950);
--surface-sunken:   var(--zinc-900);
--surface-default:  var(--zinc-850);
--surface-raised:   var(--zinc-800);
--surface-overlay:  var(--zinc-700);
--surface-outlined: transparent;
```

- [ ] **Step 2: Replace accent/interactive block with semantic colors**

Replace:
```css
/* ── Interactive: solid tints ── */
--bg-hover:  var(--zinc-800);
--bg-active: var(--zinc-700);
--bg-focus:  #252550;
--bg-select: #1A3A2A;
--bg-press:  #2D2D6B;

/* ── Accent ── */
--accent:       var(--indigo-500);
--accent-hover: var(--indigo-400);
--accent-dim:   #1E1E3A;
--accent-mid:   #252550;
--accent-bright: #2D2D6B;

/* ── Status ── */
--red:    var(--red-500);
--green:  var(--green-500);
--amber:  var(--amber-500);
```

With:
```css
/* ── Primary: brand/CTA ── */
--primary:            var(--indigo-500);
--primary-hover:      var(--indigo-400);
--primary-foreground: var(--zinc-0);
--primary-dim:        #1E1E3A;
--primary-mid:        #252550;
--primary-bright:     #2D2D6B;

/* ── Focus: keyboard focus (same hue as primary, independent control) ── */
--focus: var(--primary);

/* ── Selection: selected state (independent of primary) ── */
--selection: #1A3A2A;

/* ── Destructive: danger/delete ── */
--destructive:            var(--red-500);
--destructive-foreground: var(--zinc-0);

/* ── Status ── */
--green: var(--green-500);
--amber: var(--amber-500);

/* ── Interactive: solid tints ── */
--bg-hover:  var(--zinc-800);
--bg-active: var(--zinc-700);
```

- [ ] **Step 3: Add backward-compatible aliases at end of `:root`**

Before the closing `}` of `:root`, add:
```css
/* ══ Backward-compat aliases — migrate away, then remove ══ */
--surface-0: var(--surface-base);
--surface-1: var(--surface-sunken);
--surface-2: var(--surface-default);
--surface-3: var(--surface-raised);
--surface-4: var(--surface-overlay);
--accent:       var(--primary);
--accent-hover: var(--primary-hover);
--accent-dim:   var(--primary-dim);
--accent-mid:   var(--primary-mid);
--accent-bright: var(--primary-bright);
--bg-focus:  var(--primary-dim);
--bg-select: var(--selection);
--bg-press:  var(--primary-bright);
--red:       var(--destructive);
```

- [ ] **Step 4: Verify no duplicate variable definitions in `:root`**

Ensure each variable is defined exactly once as a new name, and once as an alias. No orphans.

---

### Task 2: Update light theme block

**Files:**
- Modify: `src/styles/tokens.css:111-147` (`[data-theme="light"]` block)

- [ ] **Step 1: Replace surface variables with semantic names**

Replace:
```css
--surface-0: var(--zinc-100);
--surface-1: var(--zinc-50);
--surface-2: var(--zinc-0);
--surface-3: var(--zinc-0);
--surface-4: var(--zinc-0);
```

With:
```css
/* ── Surface ── */
--surface-base:    var(--zinc-100);
--surface-sunken:  var(--zinc-50);
--surface-default: var(--zinc-0);
--surface-raised:  var(--zinc-0);
--surface-overlay: var(--zinc-0);
--surface-outlined: transparent;
```

- [ ] **Step 2: Replace accent/interactive with semantic colors**

Replace:
```css
--bg-hover:  var(--zinc-100);
--bg-active: var(--zinc-200);
--bg-focus:  var(--indigo-50);
--bg-select: #E8F5E9;
--bg-press:  var(--indigo-100);

--accent-dim:    var(--indigo-50);
--accent-mid:    var(--indigo-100);
--accent-bright: var(--indigo-200);
```

With:
```css
/* ── Primary ── */
--primary:       var(--indigo-600);
--primary-hover: var(--indigo-700);
--primary-dim:   var(--indigo-50);
--primary-mid:   var(--indigo-100);
--primary-bright: var(--indigo-200);

/* ── Selection ── */
--selection: #E8F5E9;

/* ── Interactive ── */
--bg-hover:  var(--zinc-100);
--bg-active: var(--zinc-200);
```

Note: `--focus`, `--destructive`, `--destructive-foreground`, `--primary-foreground` inherit from `:root` (same value in both themes) so they don't need to be redefined in light.

---

### Task 3: Add `[data-surface]` selector blocks

**Files:**
- Modify: `src/styles/tokens.css` (add after light theme block, before global resets)

- [ ] **Step 1: Add `[data-surface]` selectors**

Insert between the light theme block and `/* ══ Global resets ══ */`:

```css
/* ══ Surface bundles ══
   data-surface attribute applies bg + border + shadow as a unit.
   base/sunken/default: bg only.
   raised/overlay: bg + border + shadow.
   outlined: transparent bg + border (inherits parent bg). */

[data-surface="base"] {
  background: var(--surface-base);
}

[data-surface="sunken"] {
  background: var(--surface-sunken);
}

[data-surface="default"] {
  background: var(--surface-default);
}

[data-surface="raised"] {
  background: var(--surface-raised);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-md);
}

[data-surface="overlay"] {
  background: var(--surface-overlay);
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-lg);
}

[data-surface="outlined"] {
  background: transparent;
  border: 1px solid var(--border-default);
}
```

---

### Task 4: Update `*:focus-visible` to use `--focus`

**Files:**
- Modify: `src/styles/tokens.css:181-184`

- [ ] **Step 1: Change focus-visible to use `--focus` instead of `--accent`**

Replace:
```css
*:focus-visible {
  outline: 1.5px solid var(--accent);
  outline-offset: -1.5px;
}
```

With:
```css
*:focus-visible {
  outline: 1.5px solid var(--focus);
  outline-offset: -1.5px;
}
```

This is critical — using the alias `--accent` would defeat the purpose of separating focus from primary (PRD F2).

---

### Task 5: Verify build + visual regression

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors (CSS-only change, no TS impact)

- [ ] **Step 2: Run linter**

Run: `npx eslint src/styles/tokens.css`
Expected: No errors

- [ ] **Step 3: Run all tests**

Run: `npx vitest run`
Expected: All pass (CSS-only change, tests should not be affected)

- [ ] **Step 4: Run dev server and visually verify**

Run: `npm run dev`
Verify:
- Dark theme: all surfaces render correctly (no color changes)
- Light theme toggle: all surfaces switch correctly
- Focus ring: visible on keyboard navigation
- Alias backward compat: existing components render identically

- [ ] **Step 5: Commit**

```bash
git add src/styles/tokens.css
git commit -m "refactor(tokens): semantic surface names + data-surface bundles + primary/focus/selection/destructive split"
```
