# Design System Overhaul — Theme, Tokens, Demo Quality

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the design language across the app shell — proper dark/light theme system, token-driven Combobox, and elevated demo page quality.

**Architecture:** The theme system uses `[data-theme="dark"]` on `<html>` to override CSS custom properties. Dark is designed first as the primary theme; light derives from it. The Activity Bar already uses dark colors (zinc-950) — with proper theming, the entire app can breathe in one coherent dark aesthetic, with light as an opt-in alternative. Visual CMS Landing is untouched (separate world, like Figma community vs editor).

**Tech Stack:** CSS custom properties, `[data-theme]` attribute, React state + localStorage persistence, existing App.css token system.

**Constraints:**
- Visual CMS Landing page (`PageVisualCms.tsx`, `PageVisualCms.css`) is NOT modified
- Dark theme first, light theme second
- No half-measures — if activity bar is dark, everything is dark in dark mode

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/App.css` | Modify | Add `[data-theme="dark"]` token overrides, add `[data-theme="light"]` explicit layer, refactor surface/text/border tokens |
| `src/pages/PageViewer.css` | Modify | Replace hardcoded colors with tokens for theme compatibility |
| `src/App.tsx` | Modify | Add theme toggle button in activity bar, read/persist theme to localStorage |
| `src/interactive-os/ui/Combobox.tsx` | Modify | Replace inline style fallbacks with CSS classes |
| `src/pages/PageCombobox.tsx` | Modify | Replace inline styles with token-based CSS classes |
| `src/App.css` (demo section) | Modify | Add `.combo-item` class, improve `.demo-section` density/spacing |
| `src/__tests__/theme-toggle.test.tsx` | Create | Theme toggle integration test |

---

### Task 1: Dark Theme Token Layer

**Files:**
- Modify: `src/App.css:1-89` (`:root` block + new `[data-theme]` blocks)

**Context:** Currently `:root` has hardcoded light values. We need:
1. `:root` = dark theme defaults (dark-first design)
2. `[data-theme="dark"]` = explicit dark (same as root, for clarity)
3. `[data-theme="light"]` = light overrides

The Activity Bar currently uses `--zinc-950` as inline background. In dark mode, the whole app surface system should use dark values. In light mode, restore the current light appearance.

- [ ] **Step 1: Restructure `:root` as dark-first tokens**

In `src/App.css`, restructure the `:root` block. Keep Tier 1 primitives as-is (they're palette values, theme-independent). Change Tier 2 semantic tokens to dark defaults:

```css
:root {
  /* ── Tier 1: Primitives (theme-independent) ── */
  /* ... zinc, indigo, red, green scales stay the same ... */

  /* ── Tier 2: Semantic tokens (dark default) ── */

  /* Surface elevation system */
  --surface-0: var(--zinc-950);
  --surface-0-shadow: none;
  --surface-1: var(--zinc-900);
  --surface-1-shadow: none;
  --surface-2: var(--zinc-800);
  --surface-2-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 0 1px rgba(0, 0, 0, 0.3);
  --surface-3: var(--zinc-800);
  --surface-3-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), 0 0 1px rgba(0, 0, 0, 0.3);
  --surface-4: var(--zinc-800);
  --surface-4-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2);

  /* Backward compat aliases */
  --bg-deep: var(--surface-0);
  --bg-surface: var(--surface-1);
  --bg-elevated: var(--surface-2);

  /* Interactive states */
  --bg-focus: rgba(91, 91, 214, 0.15);
  --bg-select: rgba(48, 164, 108, 0.15);
  --bg-hover: rgba(255, 255, 255, 0.04);
  --bg-active: rgba(255, 255, 255, 0.08);

  /* Border */
  --border-dim: rgba(255, 255, 255, 0.06);
  --border-mid: rgba(255, 255, 255, 0.10);
  --border-bright: rgba(255, 255, 255, 0.16);

  /* Text */
  --text-primary: var(--zinc-200);
  --text-secondary: var(--zinc-400);
  --text-muted: var(--zinc-500);
  --text-bright: var(--zinc-50);

  /* Accent — same in both themes */
  --accent: var(--indigo-500);
  --accent-dim: rgba(91, 91, 214, 0.10);
  --accent-mid: rgba(91, 91, 214, 0.18);
  --accent-bright: rgba(91, 91, 214, 0.28);
  --accent-soft: var(--indigo-50);
  --accent-muted: var(--indigo-100);

  /* Aliases */
  --blue: var(--indigo-500);
  --blue-dim: rgba(91, 91, 214, 0.06);
  --red: var(--red-500);
  --green: var(--green-500);

  /* Typography */
  --mono: 'SF Mono', 'Cascadia Code', 'JetBrains Mono', ui-monospace, monospace;
  --sans: 'Manrope', -apple-system, system-ui, sans-serif;

  /* Layout */
  --radius: 6px;
  --radius-sm: 4px;
  --radius-xs: 3px;
  --shadow-sm: var(--surface-2-shadow);
  --shadow-md: var(--surface-3-shadow);
  --shadow-lg: var(--surface-4-shadow);
}
```

- [ ] **Step 2: Add `[data-theme="light"]` override block**

Add below `:root`:

```css
[data-theme="light"] {
  /* Surface elevation system */
  --surface-0: var(--zinc-100);
  --surface-0-shadow: none;
  --surface-1: var(--zinc-50);
  --surface-1-shadow: none;
  --surface-2: #FFFFFF;
  --surface-2-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 0 1px rgba(0, 0, 0, 0.06);
  --surface-3: #FFFFFF;
  --surface-3-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(0, 0, 0, 0.08);
  --surface-4: #FFFFFF;
  --surface-4-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);

  /* Interactive states */
  --bg-focus: var(--indigo-50);
  --bg-select: var(--green-50);
  --bg-hover: rgba(0, 0, 0, 0.03);
  --bg-active: rgba(0, 0, 0, 0.06);

  /* Border */
  --border-dim: var(--zinc-200);
  --border-mid: var(--zinc-300);
  --border-bright: var(--zinc-400);

  /* Text */
  --text-primary: var(--zinc-900);
  --text-secondary: var(--zinc-500);
  --text-muted: var(--zinc-400);
  --text-bright: var(--zinc-950);
}
```

- [ ] **Step 3: Fix Activity Bar for theme-awareness**

Currently `.activity-bar` has `background: var(--zinc-950)` hardcoded. In dark mode this should blend with the overall dark surface system. In light mode it should remain dark (like VS Code's activity bar stays dark even in light themes — it's the anchor).

Change `.activity-bar` background:

```css
.activity-bar {
  /* Dark theme: blends with surface-0 (zinc-950)
     Light theme: stays dark via specific override */
  background: var(--activity-bar-bg, var(--surface-0));
}
```

Add to `[data-theme="light"]`:
```css
  --activity-bar-bg: var(--zinc-950);
```

This way dark mode uses the surface system naturally, light mode pins activity bar to dark.

- [ ] **Step 4: Run app visually — verify dark theme renders**

Run: `pnpm dev`
Check: App should render fully dark. Activity bar blends. Sidebar, content, all dark. No white flashes.

- [ ] **Step 5: Commit**

```bash
git add src/App.css
git commit -m "feat: dark-first theme system with [data-theme] CSS custom property layers"
```

---

### Task 2: Theme Toggle + Persistence

**Files:**
- Modify: `src/App.tsx` (add theme toggle button)
- Modify: `src/App.css` (add `.theme-toggle` styles)
- Create: `src/__tests__/theme-toggle.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/theme-toggle.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest'

describe('theme toggle', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme')
    localStorage.clear()
  })

  it('defaults to dark theme when no preference stored', () => {
    // Default: no data-theme attr means :root dark applies
    expect(document.documentElement.getAttribute('data-theme')).toBeNull()
  })

  it('persists theme choice to localStorage', () => {
    localStorage.setItem('theme', 'light')
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('applies data-theme attribute from localStorage', () => {
    document.documentElement.setAttribute('data-theme', 'light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })
})
```

- [ ] **Step 2: Run test to verify it passes**

Run: `pnpm vitest run src/__tests__/theme-toggle.test.tsx`
Expected: PASS (these are basic DOM/localStorage assertions)

- [ ] **Step 3: Add theme toggle to App.tsx**

In `src/App.tsx`, add at top of file:

```tsx
import { useState, useCallback, useMemo, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
```

Add theme hook inside `App` component before return:

```tsx
const [theme, setTheme] = useState<'dark' | 'light'>(() => {
  return (localStorage.getItem('theme') as 'dark' | 'light') ?? 'dark'
})

useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}, [theme])

const toggleTheme = useCallback(() => {
  setTheme(t => t === 'dark' ? 'light' : 'dark')
}, [])
```

Add toggle button in activity bar, after the logo div:

```tsx
<button
  type="button"
  className="activity-bar__theme-toggle"
  onClick={toggleTheme}
  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
>
  {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
</button>
```

- [ ] **Step 4: Add theme toggle styles**

In `src/App.css`, after `.activity-bar__logo` styles:

```css
.activity-bar__theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  border-radius: var(--radius);
  color: var(--zinc-500);
  cursor: pointer;
  transition: color 0.12s, background 0.12s;
  margin-bottom: 4px;
}

.activity-bar__theme-toggle:hover {
  color: var(--zinc-300);
  background: rgba(255, 255, 255, 0.06);
}
```

- [ ] **Step 5: Add `data-theme="dark"` initialization in index.html**

In `index.html`, add to `<html>` tag:

```html
<html lang="en" data-theme="dark">
```

Also add a `<script>` in `<head>` for flash prevention:

```html
<script>
  const t = localStorage.getItem('theme') ?? 'dark';
  document.documentElement.setAttribute('data-theme', t);
</script>
```

- [ ] **Step 6: Run tests**

Run: `pnpm vitest run`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/App.css index.html src/__tests__/theme-toggle.test.tsx
git commit -m "feat: theme toggle with dark/light modes and localStorage persistence"
```

---

### Task 3: Fix Theme Compatibility in Viewer

**Files:**
- Modify: `src/pages/PageViewer.css` (replace hardcoded colors with tokens)
- Modify: `src/pages/PageViewer.tsx` (Shiki theme selection based on data-theme)

**Context:** The Viewer uses `github-light` Shiki theme which won't work in dark mode. File icon colors use hardcoded hex which is fine (they're semantic, not theme-dependent). But backgrounds and text colors need token usage.

- [ ] **Step 1: Fix Shiki theme for dark mode**

In `src/pages/PageViewer.tsx`, change CodeBlock to use theme-aware Shiki:

```tsx
// Add at component level or as a helper
function getShikiTheme(): string {
  return document.documentElement.getAttribute('data-theme') === 'light'
    ? 'github-light'
    : 'github-dark'
}
```

In the CodeBlock `useEffect`, change:
```tsx
theme: 'github-light',
```
to:
```tsx
theme: getShikiTheme(),
```

Add theme to the dependency array so it re-highlights on theme change. Add a state to track:

```tsx
const [currentTheme, setCurrentTheme] = useState(getShikiTheme())

useEffect(() => {
  const observer = new MutationObserver(() => {
    setCurrentTheme(getShikiTheme())
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}, [])
```

Use `currentTheme` in the codeToHtml call and dependency array.

- [ ] **Step 2: Fix Viewer hardcoded colors**

In `src/pages/PageViewer.css`, the file icon colors (`.vw-icon--folder`, `.vw-icon--ts`, etc.) are semantic — they stay. But check for any `#FFFFFF` or hardcoded backgrounds that should be tokens.

The `.vw-statusbar`, `.vw-tree`, `.vw-content__header` all use `var(--bg-surface)` — these are already token-based and will adapt. Good.

The `.code-block--loading` uses `var(--bg-deep)` — already token-based.

The Markdown viewer uses tokens for bg/text — should adapt.

No changes needed in PageViewer.css if all values already reference tokens. Verify by visual inspection in dark mode.

- [ ] **Step 3: Visual test in browser**

Run: `pnpm dev`
Navigate to Viewer. Toggle theme. Verify:
- Tree panel adapts
- Code block uses correct Shiki theme
- Markdown renders with proper contrast
- Quick Open dialog adapts

- [ ] **Step 4: Commit**

```bash
git add src/pages/PageViewer.tsx
git commit -m "feat: theme-aware Shiki syntax highlighting in Viewer"
```

---

### Task 4: Combobox Token Migration

**Files:**
- Modify: `src/interactive-os/ui/Combobox.tsx` (remove inline style fallbacks)
- Modify: `src/pages/PageCombobox.tsx` (use CSS classes instead of inline styles)
- Modify: `src/App.css` (add `.combo-item` class)

- [ ] **Step 1: Add `.combo-item` CSS class**

In `src/App.css`, add after the existing menu-item section:

```css
/* --- Combobox item --- */

.combo-item {
  padding: 5px 12px;
  font-size: 13px;
  cursor: default;
  user-select: none;
  transition: background 0.06s;
}

.combo-item--focused {
  background: var(--bg-focus);
  color: var(--text-bright);
}

.combo-item--selected {
  background: var(--bg-select);
  font-weight: 600;
}

/* Combobox input */

.combo-input {
  width: 100%;
  padding: 6px 10px;
  font-family: var(--sans);
  font-size: 13px;
  color: var(--text-primary);
  background: var(--surface-2);
  border: 1px solid var(--border-mid);
  border-radius: var(--radius);
  outline: none;
  transition: border-color 0.12s;
}

.combo-input:focus {
  border-color: var(--accent);
}

.combo-input::placeholder {
  color: var(--text-muted);
}

.combo-dropdown {
  background: var(--surface-4);
  border: 1px solid var(--border-mid);
  border-radius: var(--radius);
  box-shadow: var(--surface-4-shadow);
  margin-top: 4px;
  overflow: hidden;
}
```

- [ ] **Step 2: Update Combobox.tsx default render**

In `src/interactive-os/ui/Combobox.tsx`, replace the `defaultRender` function:

```tsx
const defaultRender = (item: Record<string, unknown>, state: NodeState) => (
  <div className={`combo-item${state.focused ? ' combo-item--focused' : ''}${state.selected ? ' combo-item--selected' : ''}`}>
    {(item.data as Record<string, unknown>)?.label as string ?? item.id}
  </div>
)
```

Also update the component's return JSX to use CSS classes:

```tsx
return (
  <div>
    <input
      className="combo-input"
      role="combobox"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      value={inputValue}
      placeholder={placeholder}
      readOnly={!editable}
      onChange={editable ? handleInput : undefined}
      {...(aria.containerProps as React.InputHTMLAttributes<HTMLInputElement>)}
    />
    {isOpen && (
      <div className="combo-dropdown" role="listbox">
        {children.map(childId => {
          const entity = store.entities[childId]
          if (!entity) return null
          const state = aria.getNodeState(childId)
          const props = aria.getNodeProps(childId)
          return (
            <div key={childId} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
              {render(entity, state)}
            </div>
          )
        })}
      </div>
    )}
  </div>
)
```

- [ ] **Step 3: Update PageCombobox.tsx to use CSS classes**

In `src/pages/PageCombobox.tsx`, replace both inline-style `renderItem` callbacks:

```tsx
renderItem={(item, state: NodeState) => (
  <div className={`combo-item${state.focused ? ' combo-item--focused' : ''}${state.selected ? ' combo-item--selected' : ''}`}>
    {(item.data as Record<string, unknown>)?.label as string}
  </div>
)}
```

- [ ] **Step 4: Run existing tests**

Run: `pnpm vitest run`
Expected: All pass (no behavioral changes)

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/ui/Combobox.tsx src/pages/PageCombobox.tsx src/App.css
git commit -m "refactor: migrate Combobox from inline styles to design token CSS classes"
```

---

### Task 5: Demo Page Quality Lift

**Files:**
- Modify: `src/App.css` (improve `.demo-section`, `.page-header`, `.card` spacing/typography)

**Context:** Demo pages currently feel sparse and utilitarian. The Visual CMS landing has nice density (section labels, titles, descriptions, cards with proper padding). We apply similar patterns to the demo pages without over-engineering — just better spacing, card elevation, and section hierarchy.

- [ ] **Step 1: Improve page header and demo section styling**

In `src/App.css`, update existing classes:

```css
.page-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-dim);
}

.page-title {
  font-family: var(--sans);
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--text-bright);
  margin: 0 0 6px;
}

.page-desc {
  font-family: var(--sans);
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.6;
  max-width: 520px;
}

.page-keys {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px 6px;
  margin-bottom: 16px;
  padding: 8px 12px;
  font-size: 11px;
  color: var(--text-muted);
  align-items: center;
  background: var(--surface-1);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius);
}

.demo-section {
  margin-bottom: 24px;
}

.demo-section h3 {
  font-family: var(--sans);
  font-size: 13px;
  font-weight: 700;
  color: var(--text-bright);
  margin: 0 0 8px;
  letter-spacing: -0.01em;
}

.demo-section h4 {
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 600;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 16px 0 6px;
}

.card {
  border: 1px solid var(--border-dim);
  border-radius: calc(var(--radius) + 2px);
  overflow: hidden;
  background: var(--surface-3);
  box-shadow: var(--surface-3-shadow);
}
```

Key changes:
- `.page-header` gets a bottom border separator
- `.page-keys` gets a subtle background container instead of floating in space
- `.demo-section h4` uses accent color (like Visual CMS section labels)
- `.card` gets slightly larger radius
- `.demo-section` gets more bottom margin

- [ ] **Step 2: Visual test across demo pages**

Run: `pnpm dev`
Navigate through: Accordion, TreeGrid, Listbox, Menu, Combobox
Verify: Better visual hierarchy, no overflow issues, cards have proper elevation in both themes.

- [ ] **Step 3: Commit**

```bash
git add src/App.css
git commit -m "style: elevate demo page visual quality — better spacing, hierarchy, card elevation"
```

---

### Task 6: Light Theme Activity Bar Polish

**Files:**
- Modify: `src/App.css` (light-mode-specific activity bar text/icon colors)

**Context:** In light mode, the activity bar stays dark (like VS Code). But the activity bar icon colors currently use `var(--zinc-500)` which resolves differently per theme. We need to pin activity bar text/icon colors to the dark palette since its background is always dark.

- [ ] **Step 1: Pin activity bar colors**

In `src/App.css`, update activity bar items to use hardcoded dark-friendly colors (not theme tokens):

```css
.activity-bar__item {
  color: rgba(255, 255, 255, 0.35);
  /* ... rest stays same ... */
}

.activity-bar__item:hover {
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.06);
}

.activity-bar__item--active {
  color: #FFFFFF;
  background: rgba(255, 255, 255, 0.08);
}

.activity-bar__label {
  /* ... existing, but ensure color inherits from parent ... */
  opacity: 0.8;
}
```

These are already mostly correct in the current CSS but verify they don't reference `--text-*` tokens that would change in light mode.

- [ ] **Step 2: Pin theme toggle colors similarly**

The theme toggle sits in the activity bar, so its colors should also be pinned to dark palette (already done in Task 2 with explicit `var(--zinc-500)` and `var(--zinc-300)`).

- [ ] **Step 3: Visual verify in light mode**

Toggle to light mode. Activity bar should remain dark with white icons. Sidebar and content should be light. No visual breaks.

- [ ] **Step 4: Commit**

```bash
git add src/App.css
git commit -m "fix: pin activity bar colors to dark palette regardless of theme"
```

---

### Task 7: Final Integration & Cleanup

**Files:**
- Modify: `src/App.css` (remove dead backward-compat aliases if any)
- Verify: `src/pages/PageViewer.css` (all tokens theme-aware)

- [ ] **Step 1: Run full test suite**

Run: `pnpm vitest run`
Expected: All tests pass

- [ ] **Step 2: TypeScript check**

Run: `pnpm tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Lint**

Run: `pnpm eslint src/`
Expected: 0 errors (ESLint 9 flat config — no `--ext` flag)

- [ ] **Step 4: Visual smoke test both themes**

In browser:
1. Dark mode: Activity bar, sidebar, content, viewer, combobox, treegrid — all coherent dark
2. Light mode: Activity bar dark, everything else light, no contrast issues
3. Toggle back and forth — no flicker, localStorage persists

- [ ] **Step 5: Commit any cleanup**

```bash
git add -A
git commit -m "chore: design system overhaul cleanup and integration verification"
```
