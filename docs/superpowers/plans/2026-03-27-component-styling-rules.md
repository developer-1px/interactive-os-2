# Component Styling Rules — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redefine surface bundles from depth (6 types) to interaction mode (4 types), enforce module.css 3-block recipe with --_ scoped property pattern, eliminate state styling from module.css files.

**Architecture:** surface.css provides 4 interaction modes (action/input/display/overlay) with border+shadow. interactive.css gains `[data-surface]` selectors for state transitions (:where() wrapped). module.css files follow 3-block recipe: base(.root) → variant(--_ only) → size. All display:flex/grid moves to structure.css atomic classes.

**Tech Stack:** CSS custom properties, CSS :where(), data attributes, Vite CSS modules

**PRD:** `docs/superpowers/specs/2026-03-26-component-styling-rules-prd.md`

---

### Task 1: Add missing atomic class to structure.css

structure.css needs `flex-col-reverse` for Toaster's `column-reverse` layout.

**Files:**
- Modify: `src/styles/structure.css:15`

- [ ] **Step 1: Add flex-col-reverse class**

```css
/* After line 15 (.flex-col) */
.flex-col-reverse { display: flex; flex-direction: column-reverse; }
```

- [ ] **Step 2: Verify build**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/styles/structure.css
git commit -m "feat: add flex-col-reverse atomic class to structure.css"
```

---

### Task 2: Rewrite surface.css — depth → interaction mode

Replace 6 depth levels with 4 interaction modes. No bg — variant --_bg handles depth.

**Files:**
- Modify: `src/styles/surface.css`

- [ ] **Step 1: Rewrite surface.css**

```css
/* ═══════════════════════════════════════════
   L3 Surface — Interaction mode policy
   ═══════════════════════════════════════════
   Changes when: interaction mode policy changes.
   Single responsibility: data-surface attribute → border + shadow bundle + interaction mode declaration.

   4 modes: action (Button, Toggle), input (TextInput, Select), display (Card, Badge), overlay (Dialog).
   bg is NOT provided here — variant --_bg handles depth.
   State transitions are in interactive.css [data-surface] section.

   // ② 2026-03-26-component-styling-rules-prd.md
*/

/* action: no border, no shadow — face itself is the action target */
[data-surface="action"] {
  border: none;
  cursor: pointer;
}

/* input: border defines identity, no shadow */
[data-surface="input"] {
  border: 1px solid var(--_border, var(--border-default));
  outline: none;
}

/* display: no interaction states — border/shadow optional via variant */
/* (intentionally empty — variant handles everything) */

/* overlay: floating layer — border + shadow for depth */
[data-surface="overlay"] {
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-lg);
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/styles/surface.css
git commit -m "feat: redefine surface from depth 6-level to interaction mode 4-type

action/input/display/overlay. bg moves to variant --_bg."
```

---

### Task 3: Extend interactive.css — [data-surface] state transitions

Add state transition rules for action and input surfaces. All :where() wrapped.

**Files:**
- Modify: `src/styles/interactive.css` (append after existing content)

- [ ] **Step 1: Add [data-surface] state transitions section**

Append to end of interactive.css:

```css
/* ═══════════════════════════════════════════
   Standalone component state transitions ([data-surface])
   ═══════════════════════════════════════════
   Complement to [data-aria-container] collection states above.
   Collection items use [data-aria-container], standalone components use [data-surface].
   Never apply both to the same element.

   // ② 2026-03-26-component-styling-rules-prd.md
*/

/* ── Action surface: hover → bg, active → bg, focus → ring, disabled ── */

:where([data-surface="action"]:hover) {
  background: var(--_bg-hover);
}

:where([data-surface="action"]:active) {
  background: var(--_bg-active, var(--_bg-hover));
}

:where([data-surface="action"]:focus-visible) {
  outline: 2px solid var(--focus);
  outline-offset: -2px;
}

:where([data-surface="action"]:disabled),
:where([data-surface="action"][aria-disabled="true"]) {
  opacity: 0.4;
  pointer-events: none;
  cursor: default;
}

/* ── Input surface: focus → border, invalid → border, disabled ── */

:where([data-surface="input"]:focus) {
  border-color: var(--_border-focus, var(--focus));
}

:where([data-surface="input"][aria-invalid="true"]) {
  border-color: var(--_border-invalid, var(--tone-destructive-base));
}

:where([data-surface="input"]:disabled),
:where([data-surface="input"][aria-disabled="true"]) {
  opacity: 0.4;
  pointer-events: none;
  cursor: default;
}

/* ── Overlay surface: enter motion ── */

:where([data-surface="overlay"]) {
  transition: opacity var(--motion-enter-duration) var(--motion-enter-easing);
}
```

- [ ] **Step 2: Verify no selector conflicts**

Run: `pnpm typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/styles/interactive.css
git commit -m "feat: add [data-surface] state transitions to interactive.css

action: hover/active/focus-visible/disabled
input: focus/invalid/disabled
overlay: enter motion"
```

---

### Task 4: Refactor Button — 3-block recipe + data-surface="action"

Convert Button.module.css to 3-block recipe. Add data-surface to TSX.

**Files:**
- Modify: `src/interactive-os/ui/Button.module.css`
- Modify: `src/interactive-os/ui/Button.tsx`

- [ ] **Step 1: Rewrite Button.module.css — 3-block recipe**

```css
/* ── Button — 3-block recipe ──
   // ② 2026-03-26-component-styling-rules-prd.md */

/* ═══ Block 1: base ═══ */
.root {
  border-radius: var(--shape-xl-radius);
  padding: var(--shape-sm-py) var(--shape-sm-px);
  font-size: var(--type-body-size);
  font-weight: var(--type-body-weight);
  transition: background var(--motion-instant-duration) var(--motion-instant-easing),
              transform var(--motion-instant-duration) var(--motion-instant-easing);
  background: var(--_bg);
  color: var(--_fg);
}

/* ═══ Block 2: variant — --_ values only ═══ */
.accent {
  --_bg: var(--tone-primary-base);
  --_bg-hover: var(--tone-primary-hover);
  --_fg: var(--tone-primary-foreground);
  font-weight: var(--weight-semi);
}

.dialog {
  --_bg: var(--surface-default);
  --_bg-hover: var(--bg-hover);
  --_fg: var(--text-secondary);
  border: 1px solid var(--border-default);
  font-weight: var(--weight-medium);
}

.ghost {
  --_bg: transparent;
  --_bg-hover: var(--bg-hover);
  --_fg: var(--text-muted);
  --_fg-hover: var(--text-primary);
  border: 1px solid var(--border-subtle);
  width: 100%;
}

.destructive {
  --_bg: var(--tone-destructive-base);
  --_bg-hover: var(--tone-destructive-hover);
  --_fg: var(--tone-destructive-foreground);
  font-weight: var(--weight-semi);
}

/* ═══ Block 3: size ═══ */
.sm {
  border-radius: var(--shape-xs-radius);
  padding: var(--shape-xs-py) var(--shape-xs-px);
  font-size: var(--type-caption-size);
}

.lg {
  padding: var(--shape-lg-py) var(--shape-lg-px);
  font-size: var(--type-section-size);
}
```

- [ ] **Step 2: Update Button.tsx — add data-surface="action" and .root class**

Find the `<button>` element and add `data-surface="action"` + `styles.root` to its className. Exact change depends on current JSX structure — the variant class should compose with .root:

```tsx
// Before: className={styles[variant]}
// After:  className={`${styles.root} ${styles[variant]}`} data-surface="action"
```

- [ ] **Step 3: Verify visual result**

Run: `pnpm dev` and check Button renders correctly — hover/active should work via interactive.css now.

- [ ] **Step 4: Commit**

```bash
git add src/interactive-os/ui/Button.module.css src/interactive-os/ui/Button.tsx
git commit -m "refactor: Button to 3-block recipe + data-surface=action

Removes :hover/:active from module.css. interactive.css provides state transitions."
```

---

### Task 5: Refactor TextInput — data-surface="input" + --_ pattern

**Files:**
- Modify: `src/interactive-os/ui/TextInput.module.css`
- Modify: `src/interactive-os/ui/TextInput.tsx`

- [ ] **Step 1: Rewrite TextInput.module.css**

```css
/* ── TextInput — 3-block recipe ──
   // ② 2026-03-26-component-styling-rules-prd.md */

/* ═══ Block 1: base ═══ */
.input {
  font-size: var(--type-caption-size);
  color: var(--text-primary);
  background: var(--_bg, var(--surface-base));
  height: var(--input-height);
  border-radius: var(--shape-md-radius);
  padding: var(--shape-md-py) var(--shape-md-px);
  transition: border-color var(--motion-instant-duration) var(--motion-instant-easing);
}
/* :focus → data-surface="input" provides via interactive.css */

.input::placeholder {
  color: var(--text-muted);
}
```

- [ ] **Step 2: Add data-surface="input" to TextInput.tsx**

```tsx
// Add data-surface="input" to the <input> element
```

- [ ] **Step 3: Commit**

```bash
git add src/interactive-os/ui/TextInput.module.css src/interactive-os/ui/TextInput.tsx
git commit -m "refactor: TextInput to data-surface=input + --_ pattern

Removes :focus from module.css. interactive.css provides border-color transition."
```

---

### Task 6: Refactor Combobox — input + overlay surfaces

**Files:**
- Modify: `src/interactive-os/ui/Combobox.module.css`
- Modify: `src/interactive-os/ui/Combobox.tsx`

- [ ] **Step 1: Rewrite Combobox.module.css — remove :focus, use --_ pattern**

```css
/* ── Combobox ──
   // ② 2026-03-26-component-styling-rules-prd.md */

.comboItem {
  padding: var(--space-sm) var(--space-md);
  font-size: var(--type-body-size);
}

.comboItemFocused {
  background: var(--tone-primary-dim);
  color: var(--text-bright);
}

.comboItemSelected {
  background: var(--selection);
  font-weight: var(--weight-semi);
}

/* ═══ Input ═══ */
.comboInput {
  width: 100%;
  height: var(--input-height);
  padding: var(--shape-sm-py) var(--shape-sm-px);
  font-size: var(--type-body-size);
  color: var(--text-primary);
  background: var(--_bg, var(--surface-default));
  border-radius: var(--shape-xl-radius);
  transition: border-color var(--motion-instant-duration) var(--motion-instant-easing);
  --_border-focus: var(--tone-primary-base);
}
/* :focus → data-surface="input" */

.comboInput::placeholder {
  color: var(--text-muted);
}

/* ═══ Dropdown ═══ */
.comboDropdown {
  border-radius: var(--shape-xl-radius);
  margin-top: var(--space-xs);
}
/* bg/border/shadow → data-surface="overlay" */
```

- [ ] **Step 2: Add data-surface="input" to comboInput, data-surface="overlay" to comboDropdown in TSX**

- [ ] **Step 3: Commit**

```bash
git add src/interactive-os/ui/Combobox.module.css src/interactive-os/ui/Combobox.tsx
git commit -m "refactor: Combobox to data-surface=input/overlay + --_ pattern"
```

---

### Task 7: Refactor Spinbutton — action surface for buttons, remove pseudo-selectors

**Files:**
- Modify: `src/interactive-os/ui/Spinbutton.module.css`
- Modify: `src/interactive-os/ui/Spinbutton.tsx`

- [ ] **Step 1: Rewrite Spinbutton.module.css — remove :hover/:active/:focus, use --_**

Key changes:
- `.spinbuttonBtn:hover` and `:active` → remove, add data-surface="action" to buttons in TSX
- `.spinbuttonInput:focus` → remove, use data-surface="input" pattern
- `.spinbuttonBtn` gets `--_bg` and `--_bg-hover` declarations
- Keep `[data-focused]` and `[data-invalid]` (attribute selectors, not pseudo-selectors)

```css
.spinbuttonBtn {
  width: var(--_btn-w);
  border: none;
  font-size: var(--type-page-size);
  font-weight: var(--weight-regular);
  transition: background var(--motion-instant-duration) var(--motion-instant-easing);
  -webkit-user-select: none;
  user-select: none;
  --_bg: var(--bg-hover);
  --_bg-hover: var(--bg-active);
  background: var(--_bg);
  color: var(--text-primary);
}
/* :hover/:active → data-surface="action" */
```

- [ ] **Step 2: Add data-surface="action" to buttons and data-surface="input" to input in TSX**

- [ ] **Step 3: Commit**

```bash
git add src/interactive-os/ui/Spinbutton.module.css src/interactive-os/ui/Spinbutton.tsx
git commit -m "refactor: Spinbutton to data-surface=action/input + --_ pattern"
```

---

### Task 8: Refactor TabGroup — move display to className, remove :hover

**Files:**
- Modify: `src/interactive-os/ui/TabGroup.module.css`
- Modify: `src/interactive-os/ui/TabGroup.tsx`

- [ ] **Step 1: Rewrite TabGroup.module.css**

Key changes:
- Remove `display: flex; flex-direction: column;` from `.tabGroup` → className `flex-col` in TSX
- Remove `display: flex; flex-shrink: 0;` from `.tabBar` → className `flex-row shrink-0` in TSX
- Remove `display: flex;` from `.tab` → className `inline-flex` in TSX
- Remove `display: flex;` from `.tabClose` → className `flex-row items-center justify-center` in TSX
- `.tab:hover` → remove, add `data-surface="action"` with `--_bg-hover`
- `.tab[aria-selected="true"]` → keep as variant (not a pseudo-selector state)
- `.tabClose:hover` → remove, use data-surface="action"

```css
/* ── TabGroup — JetBrains Islands style ──
   // ② 2026-03-26-component-styling-rules-prd.md */

.tabGroup {
  height: 100%;
  overflow: hidden;
}

.tabBar {
  gap: var(--space-2xs);
  padding: var(--space-2xs) var(--space-sm);
  background: var(--surface-sunken);
  overflow-x: auto;
}

/* ── Tab ── */
.tab {
  gap: var(--space-xs);
  padding: var(--shape-xs-py) var(--shape-sm-px);
  border-radius: var(--shape-sm-radius);
  white-space: nowrap;
  transition:
    background var(--motion-instant-duration) var(--motion-instant-easing),
    color var(--motion-instant-duration) var(--motion-instant-easing);
  --_bg: transparent;
  --_bg-hover: var(--surface-default);
  --_fg: var(--text-muted);
  background: var(--_bg);
  color: var(--_fg);
}
/* :hover → data-surface="action" */

.tab[aria-selected="true"] {
  --_bg: var(--surface-raised);
  --_fg: var(--text-primary);
}

.tabPreview {
  font-style: italic;
}

/* ── Close button ── */
.tabClose {
  border-radius: var(--shape-xs-radius);
  padding: var(--space-2xs);
  opacity: 0;
  color: var(--text-muted);
  transition: opacity var(--motion-instant-duration) var(--motion-instant-easing);
  --_bg: transparent;
  --_bg-hover: var(--surface-overlay);
}

.tab:hover .tabClose,
.tab[aria-selected="true"] .tabClose {
  opacity: 0.6;
}

/* ── Tab panel ── */
.tabPanel {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
```

- [ ] **Step 2: Update TabGroup.tsx**

- `.tabGroup` div → add `className="flex-col ..."`
- `.tabBar` div → add `className="flex-row shrink-0 ..."`
- `.tab` div → add `className="inline-flex items-center ..."` + `data-surface="action"`
- `.tabClose` → add `className="flex-row items-center justify-center ..."` + `data-surface="action"`

- [ ] **Step 3: Commit**

```bash
git add src/interactive-os/ui/TabGroup.module.css src/interactive-os/ui/TabGroup.tsx
git commit -m "refactor: TabGroup to 3-block recipe + data-surface=action

Move display:flex to className. Remove :hover from module.css."
```

---

### Task 9: Refactor SplitPane — move display to className, action surface for separator

**Files:**
- Modify: `src/interactive-os/ui/SplitPane.module.css`
- Modify: `src/interactive-os/ui/SplitPane.tsx`

- [ ] **Step 1: Rewrite SplitPane.module.css**

- Remove `display: flex; flex-direction: row;` from `.splitPane` → className
- Remove `.splitPaneVertical` class → handle via conditional className
- `.separator:hover/:focus-visible` → remove, use data-surface="action"

```css
/* SplitPane — ratio-based resizable split container
   // ② 2026-03-26-component-styling-rules-prd.md */

.splitPane {
  height: 100%;
  overflow: hidden;
}

.pane {
  overflow: hidden;
  min-width: 0;
  min-height: 0;
}

.separator {
  flex-shrink: 0;
  transition: background var(--motion-instant-duration) var(--motion-instant-easing);
  --_bg: var(--border-default);
  --_bg-hover: var(--focus);
  background: var(--_bg);
}
/* :hover/:focus-visible → data-surface="action" */

.separatorH {
  width: var(--space-xs);
  cursor: col-resize;
}

.separatorV {
  height: var(--space-xs);
  cursor: row-resize;
}
```

- [ ] **Step 2: Update SplitPane.tsx**

- Root div: `className={`flex-row ${!isHorizontal ? 'flex-col' : ''} ${styles.splitPane}`}`
- Separator: add `data-surface="action"`

- [ ] **Step 3: Commit**

```bash
git add src/interactive-os/ui/SplitPane.module.css src/interactive-os/ui/SplitPane.tsx
git commit -m "refactor: SplitPane to data-surface=action + move display to className"
```

---

### Task 10: Refactor StreamFeed — move display to className, action surface for FAB

**Files:**
- Modify: `src/interactive-os/ui/StreamFeed.module.css`
- Modify: `src/interactive-os/ui/StreamFeed.tsx`

- [ ] **Step 1: Rewrite StreamFeed.module.css**

- Remove `display: flex; flex-direction: column;` from `.feedWrapper` → className
- Remove `display: flex; flex-direction: column;` from `.feed` → className
- Remove `display: flex;` from `.streaming` → className
- `.scrollFab:hover` → remove, use data-surface="action"
- scrollFab gets `--_bg/--_bg-hover`

- [ ] **Step 2: Update StreamFeed.tsx — add className utilities and data-surface**

- `.feedWrapper` → add `className="flex-col ..."`
- `.feed` → add `className="flex-col ..."`
- `.streaming` → add `className="flex-row items-center ..."`
- `.scrollFab` → add `data-surface="action"`

- [ ] **Step 3: Commit**

```bash
git add src/interactive-os/ui/StreamFeed.module.css src/interactive-os/ui/StreamFeed.tsx
git commit -m "refactor: StreamFeed to data-surface=action + move display to className"
```

---

### Task 11: Refactor Toaster — move display to className, action surface for dismiss

**Files:**
- Modify: `src/interactive-os/ui/Toaster.module.css`
- Modify: `src/interactive-os/ui/Toaster.tsx`

- [ ] **Step 1: Rewrite Toaster.module.css**

- Remove `display: flex; flex-direction: column-reverse;` from `.container` → className `flex-col-reverse`
- `.dismiss:hover` → remove, add data-surface="action" + --_ pattern
- Remove `margin-top` from `.description` → use gap on parent

- [ ] **Step 2: Update Toaster.tsx**

- `.container` → add `className="flex-col-reverse ..."`
- `.dismiss` → add `data-surface="action"`

- [ ] **Step 3: Commit**

```bash
git add src/interactive-os/ui/Toaster.module.css src/interactive-os/ui/Toaster.tsx
git commit -m "refactor: Toaster to data-surface=action + move display to className"
```

---

### Task 12: Refactor FileViewerModal — action surface for close button

**Files:**
- Modify: `src/interactive-os/ui/FileViewerModal.module.css`
- Modify: `src/interactive-os/ui/FileViewerModal.tsx`

- [ ] **Step 1: Rewrite FileViewerModal.module.css**

- `.fvmClose:hover` → remove, use data-surface="action" + --_ pattern
- `.fvmDialog[open] { display: flex; }` → keep (dialog-specific open behavior, not layout)
- `.fvmModal` → add data-surface="overlay" in TSX

- [ ] **Step 2: Update FileViewerModal.tsx**

- `.fvmClose` → add `data-surface="action"` + `--_bg-hover`
- `.fvmModal` → add `data-surface="overlay"`

- [ ] **Step 3: Commit**

```bash
git add src/interactive-os/ui/FileViewerModal.module.css src/interactive-os/ui/FileViewerModal.tsx
git commit -m "refactor: FileViewerModal to data-surface=action/overlay"
```

---

### Task 13: Refactor Workspace — move display to className

**Files:**
- Modify: `src/interactive-os/ui/Workspace.module.css`
- Modify: `src/interactive-os/ui/Workspace.tsx`

- [ ] **Step 1: Rewrite Workspace.module.css**

```css
/* ② 2026-03-26-component-styling-rules-prd.md */

.workspace {
  height: 100%;
}

.workspaceContent {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.empty {
  height: 100%;
  gap: var(--space-sm);
  color: var(--text-muted);
}
```

- [ ] **Step 2: Update Workspace.tsx**

- `.workspace` → add `className="flex-col ..."`
- `.empty` → add `className="flex-row items-center justify-center ..."`

- [ ] **Step 3: Commit**

```bash
git add src/interactive-os/ui/Workspace.module.css src/interactive-os/ui/Workspace.tsx
git commit -m "refactor: Workspace move display to className"
```

---

### Task 14: Refactor Kanban — remove :hover/:focus from collection items

Kanban cards are inside [data-aria-container] → interactive.css handles their states. Remove redundant state styles from module.css.

**Files:**
- Modify: `src/interactive-os/ui/Kanban.module.css`

- [ ] **Step 1: Remove :hover/:focus/:selected pseudo-selectors from Kanban.module.css**

Remove these blocks:
- `.columnHeader:focus` (lines 29-34) — handled by interactive.css [data-aria-container]
- `.card:hover` (lines 55-57) — handled by interactive.css
- `.card:focus` (lines 59-64) — handled by interactive.css
- `.card[aria-selected="true"]` (lines 66-68) — handled by interactive.css
- `.card[aria-selected="true"]:focus` (lines 70-73) — handled by interactive.css

Keep `.card :global([data-renaming])` — renaming is not a standard state.

- [ ] **Step 2: Verify Kanban still looks correct**

Run dev server, check Kanban card hover/focus/selection using interactive.css defaults.

- [ ] **Step 3: Commit**

```bash
git add src/interactive-os/ui/Kanban.module.css
git commit -m "refactor: Kanban remove redundant state styles — interactive.css handles collection items"
```

---

### Task 15: Bundle integrity pass — --space-* padding → --shape-* bundles

Remaining module.css files that weren't rewritten in Tasks 4-14 still use `--space-*` for padding instead of `--shape-*-py/px` bundles.

**Files:**
- Modify: `src/interactive-os/ui/Slider.module.css`
- Modify: `src/interactive-os/ui/AlertDialog.module.css`
- Modify: `src/interactive-os/ui/NavList.module.css`
- Modify: `src/interactive-os/ui/Toolbar.module.css`
- Modify: `src/interactive-os/ui/Tooltip.module.css`
- Modify: `src/interactive-os/ui/Breadcrumb.module.css`
- Modify: `src/interactive-os/ui/ListBox.module.css`
- Modify: `src/interactive-os/ui/Kanban.module.css` (padding only — state already fixed in Task 14)
- Modify: `src/pages/PageUiShowcase.module.css`
- Modify: `src/pages/PageViewer.module.css`
- Modify: `src/pages/PageAgentViewer.module.css`
- Modify: `src/pages/cms/CmsLanding.module.css`

- [ ] **Step 1: Replace --space-* padding with --shape-*-py/px bundles**

For each file, find `padding: var(--space-*)` patterns and replace with the matching shape bundle level:
- `var(--space-xs) var(--space-sm)` → `var(--shape-xs-py) var(--shape-xs-px)` (or appropriate level)
- `var(--space-sm) var(--space-md)` → `var(--shape-sm-py) var(--shape-sm-px)`
- `var(--space-md) var(--space-lg)` → `var(--shape-md-py) var(--shape-md-px)`

Match shape level to the radius already used in each class. If no radius, pick the shape level that matches the padding scale.

- [ ] **Step 2: Verify build**

Run: `pnpm typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/interactive-os/ui/*.module.css src/pages/*.module.css src/pages/**/*.module.css
git commit -m "refactor: replace --space-* padding with --shape-* bundles across all module.css"
```

---

### Task 16: Update PageThemeCreator — new surface showcase

**⚠️ Execution order:** Must run together with Task 2 to avoid broken intermediate state.

**Files:**
- Modify: `src/pages/PageThemeCreator.tsx`

- [ ] **Step 1: Update surface showcase specimens**

Replace 6 depth-level specimens with 4 interaction-mode specimens:
- `data-surface="action"` with `--_bg` and `--_bg-hover` inline styles for demo
- `data-surface="input"` with border demo
- `data-surface="display"` — show Card example: inline `style={{ '--_bg': 'var(--surface-raised)' }}` + module.css shadow (PRD V10)
- `data-surface="overlay"` with shadow demo

Replace all old depth values (`raised`, `sunken`, `default`, `outlined`, `base`) on demo cards — remove data-surface and use inline/className bg, or use new mode values where appropriate.

- [ ] **Step 2: Commit**

```bash
git add src/pages/PageThemeCreator.tsx
git commit -m "refactor: PageThemeCreator surface showcase → 4 interaction modes"
```

---

### Task 17: Update DESIGN.md — new rules

**Files:**
- Modify: `DESIGN.md`

- [ ] **Step 1: Update surface bundle definition**

Replace depth 6-level table with interaction mode 4-type table. Update `## 0. 번들 체계` surface row.

- [ ] **Step 2: Add module.css 3-block recipe section**

Add new section `## 6. module.css 3블록 레시피` with:
- Block 1 (base), Block 2 (variant), Block 3 (size) definitions
- --_ 네이밍 풀 table
- Code examples

- [ ] **Step 3: Update 금지 목록**

Add new prohibitions:
- module.css에 :hover/:focus/:active/:disabled (예외: HTML 기본 요소, syntax highlight)
- variant에 background/color 직접 작성
- data-surface와 data-aria-container 동시 부여
- --_ 풀에 없는 scoped property 무단 추가

- [ ] **Step 4: Update CSS Layers section**

Update L3 surface description from depth to interaction mode. Add L4 [data-surface] description.

- [ ] **Step 5: Commit**

```bash
git add DESIGN.md
git commit -m "docs: update DESIGN.md with surface interaction modes + 3-block recipe + --_ pool"
```

---

### Task 18: Update /design-implement skill

**Files:**
- Modify: `.claude/skills/design-implement/SKILL.md`

- [ ] **Step 1: Rewrite surface section**

Replace depth 6-level table with interaction mode 4-type:

| mode | border | shadow | states (via interactive.css) |
|------|--------|--------|---------------------------|
| action | none | none | hover, active, focus-visible, disabled |
| input | border-default | none | focus, invalid, disabled |
| display | optional | optional | none |
| overlay | border-default | shadow-lg | enter motion |

- [ ] **Step 2: Add module.css recipe section**

Add 3-block recipe with examples + --_ pool + prohibitions.

- [ ] **Step 3: Add bundle compliance checklist**

Add check: "radius를 썼으면 같은 세트의 py/px도?" / "type size를 바꿨으면 weight도?"

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/design-implement/SKILL.md
git commit -m "docs: update design-implement skill with new surface modes + 3-block recipe"
```

---

### Task 19: Final verification

- [ ] **Step 1: Run full verification suite**

```bash
pnpm typecheck && pnpm lint && pnpm test
```

- [ ] **Step 2: Check for remaining pseudo-selector violations**

Search module.css files for any remaining :hover/:focus/:active/:disabled that aren't in the exception list (MarkdownViewer a:hover, CodeBlock :global(.code-token)):

```bash
grep -rn ':[hover|focus|active|disabled]' src/**/*.module.css
```

- [ ] **Step 3: V4 — Verify variant-less action surface safe degradation**

Create a test Button without variant class (only .root + data-surface="action"):
- Should render transparent bg, no hover reaction
- Should not break or throw

- [ ] **Step 4: V10 — Verify display surface Card with variant --_bg**

Check PageThemeCreator's display surface Card specimen:
- `--_bg: var(--surface-raised)` renders correct bg
- shadow from module.css renders correctly
- No state transitions (no hover/focus changes)

- [ ] **Step 5: Visual verification**

Run dev server, check all modified components render correctly.
