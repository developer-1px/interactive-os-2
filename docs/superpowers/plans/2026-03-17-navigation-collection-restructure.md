# Navigation/Collection ActivityBar Restructure — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure ActivityBar from Plugins/Behaviors groups to Navigation/Collection groups, reflecting the ARIA conceptual layer order.

**Architecture:** Replace `plugins` and `behaviors` route groups in `routeConfig` with `navigation` (9 widgets) and `collection` (4 widgets + 5 plugin demos). Update icon imports and PROGRESS.md.

**Tech Stack:** React, React Router, lucide-react

**Spec:** `docs/superpowers/specs/2026-03-17-navigation-collection-restructure-design.md`

---

## Chunk 1: Restructure routeConfig and update docs

### Task 1: Update routeConfig in App.tsx

**Files:**
- Modify: `src/App.tsx:1-4` (icon imports)
- Modify: `src/App.tsx:76-140` (routeConfig array)

- [ ] **Step 1: Replace icon imports**

Change line 3 from:
```tsx
import { Database, Cog, Plug, Keyboard, Eye, Map } from 'lucide-react'
```
to:
```tsx
import { Database, Cog, Compass, Layers, Eye, Map } from 'lucide-react'
```

- [ ] **Step 2: Replace `plugins` and `behaviors` groups with `navigation` and `collection`**

Replace the `plugins` group (lines 97-109) and `behaviors` group (lines 110-130) with:

```tsx
  {
    id: 'navigation',
    label: 'Navigation',
    icon: Compass,
    basePath: '/navigation/accordion',
    items: [
      { path: 'accordion', label: 'Accordion', status: 'ready', component: PageAccordion },
      { path: 'disclosure', label: 'Disclosure', status: 'ready', component: PageDisclosure },
      { path: 'switch', label: 'Switch', status: 'ready', component: PageSwitch },
      { path: 'tabs', label: 'Tabs', status: 'ready', component: PageTabs },
      { path: 'radiogroup', label: 'RadioGroup', status: 'ready', component: PageRadioGroup },
      { path: 'menu', label: 'Menu', status: 'ready', component: PageMenu },
      { path: 'toolbar', label: 'Toolbar', status: 'ready', component: PageToolbar },
      { path: 'dialog', label: 'Dialog', status: 'ready', component: PageDialog },
      { path: 'alertdialog', label: 'AlertDialog', status: 'ready', component: PageAlertDialog },
    ],
  },
  {
    id: 'collection',
    label: 'Collection',
    icon: Layers,
    basePath: '/collection/treegrid',
    items: [
      { path: 'treegrid', label: 'TreeGrid', status: 'ready', component: PageTreeGrid },
      { path: 'listbox', label: 'Listbox', status: 'ready', component: PageListbox },
      { path: 'grid', label: 'Grid', status: 'ready', component: PageGrid },
      { path: 'combobox', label: 'Combobox', status: 'wip', component: PageCombobox },
      { path: 'crud', label: 'CRUD', status: 'placeholder', component: null },
      { path: 'clipboard', label: 'Clipboard', status: 'placeholder', component: null },
      { path: 'history', label: 'History', status: 'placeholder', component: null },
      { path: 'dnd', label: 'DnD', status: 'placeholder', component: null },
      { path: 'rename', label: 'Rename', status: 'placeholder', component: null },
    ],
  },
```

- [ ] **Step 3: Verify dev server starts**

Run: `cd /Users/user/Desktop/aria && pnpm dev`
Expected: No compilation errors, app loads at localhost

- [ ] **Step 4: Verify routes work**

Open browser, navigate to:
- `/navigation/accordion` — should show Accordion page
- `/collection/treegrid` — should show TreeGrid page
- `/navigation/dialog` — should show Dialog page
- `/collection/listbox` — should show Listbox page

- [ ] **Step 5: Run existing tests**

Run: `cd /Users/user/Desktop/aria && pnpm test`
Expected: All tests pass (tests don't depend on route paths)

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: restructure ActivityBar — Plugins/Behaviors → Navigation/Collection"
```

### Task 2: Update PROGRESS.md

**Files:**
- Modify: `docs/PROGRESS.md:134` (ActivityBar description)

- [ ] **Step 1: Update ActivityBar line**

Change:
```
- [x] ActivityBar — 6 레이어 그룹 (Store, Engine, Plugins, Behaviors, Components, Vision)
```
to:
```
- [x] ActivityBar — 6 레이어 그룹 (Store, Engine, Navigation, Collection, Components, Vision)
```

- [ ] **Step 2: Commit**

```bash
git add docs/PROGRESS.md
git commit -m "docs: update PROGRESS.md with Navigation/Collection group names"
```
