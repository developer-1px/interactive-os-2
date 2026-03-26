# Visual CMS Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Visual CMS PoC into a production-grade Figma Slides–style content management tool with section sidebar, floating toolbar, viewport preview, and i18n.

**Architecture:** CMS gets its own route (`/`) with a dedicated layout component. The existing showcase (ActivityBar + Sidebar + Content) remains intact for non-CMS routes, accessed via hamburger drawer. All CMS panels (sidebar, canvas, toolbar, i18n sheet) share one store — different `<Aria>` views on the same data. Section templates are factory functions that produce entities + relationships for the store. CMS store state is lifted to module scope (outside React) so it persists across route navigation (CMS ↔ showcase).

**Tech Stack:** React, react-router-dom, interactive-os (behaviors + plugins), CSS custom properties, Lucide icons

**Specs:** `docs/superpowers/prds/2026-03-19-visual-cms-service-prd.md` (main) + 5 sub-PRDs

---

## File Structure

### New files

| File | Responsibility |
|------|---------------|
| `src/pages/cms/CmsLayout.tsx` | CMS root layout: top toolbar + sidebar + canvas + floating toolbar |
| `src/pages/cms/CmsTopToolbar.tsx` | Thin top toolbar: hamburger, locale dropdown, viewport toggle, present button |
| `src/pages/cms/CmsSidebar.tsx` | PPT-style section thumbnail strip with `<Aria>` listbox + CRUD/DnD plugins |
| `src/pages/cms/CmsCanvas.tsx` | Spatial nav canvas (extracted from existing PageVisualCms) |
| `src/pages/cms/CmsFloatingToolbar.tsx` | Bottom-center floating CRUD toolbar, context-reactive |
| `src/pages/cms/CmsViewportWrapper.tsx` | CSS transform viewport container (mobile/tablet/desktop) |
| `src/pages/cms/CmsHamburgerDrawer.tsx` | Overlay drawer with ActivityBar showcase nav |
| `src/pages/cms/CmsI18nSheet.tsx` | Spreadsheet-style translation grid panel |
| `src/pages/cms/CmsPresentMode.tsx` | Fullscreen chrome-free preview |
| `src/pages/cms/CmsTemplatePicker.tsx` | Drop-up popup for section template selection |
| `src/pages/cms/cms-templates.ts` | Template factory functions (6 variants) |
| `src/pages/cms/cms-store.ts` | Migrated CMS store with i18n data model |
| `src/pages/cms/cms-types.ts` | Shared CMS types (Locale, CmsEntityData, etc.) |
| `src/pages/cms/cms-state.ts` | Module-scoped CMS state (store + locale + viewport) — persists across route nav |
| `src/pages/cms/cms-renderers.tsx` | Node content renderers + CSS class mapping (extracted from PageVisualCms) |
| `src/styles/cms.css` | CMS layout styles (top toolbar, sidebar thumbnails, floating toolbar, viewport, i18n sheet) |

### Modified files

| File | Changes |
|------|---------|
| `src/App.tsx` | Add CMS route (`/`), keep showcase routes, redirect `/viewer` to showcase |
| `src/styles/app.css` | Minor: hamburger drawer overlay styles |

---

## Task 1: CMS Types & i18n Data Model

**Files:**
- Create: `src/pages/cms/cms-types.ts`
- Create: `src/pages/cms/cms-store.ts`
- Modify: `src/pages/cms/cms-store.ts` (migrate from `src/pages/cms-store.ts`)

- [ ] **Step 1: Create CMS types**

```typescript
// src/pages/cms/cms-types.ts
export type Locale = 'ko' | 'en' | 'ja'
export const LOCALES: Locale[] = ['ko', 'en', 'ja']
export const DEFAULT_LOCALE: Locale = 'ko'

export type LocaleMap = Record<Locale, string>

// Helper: create a locale map with a default value for ko, empty for others
export function localeMap(ko: string): LocaleMap {
  return { ko, en: '', ja: '' }
}

// Helper: get localized value with fallback
export function localized(value: string | LocaleMap, locale: Locale): { text: string; isFallback: boolean } {
  if (typeof value === 'string') return { text: value, isFallback: false }
  const text = value[locale]
  if (text) return { text, isFallback: false }
  const fallback = value[DEFAULT_LOCALE]
  return { text: fallback, isFallback: true }
}
```

- [ ] **Step 2: Write tests for locale helpers**

```typescript
// src/pages/cms/__tests__/cms-types.test.ts
import { describe, it, expect } from 'vitest'
import { localeMap, localized } from '../cms-types'

describe('localeMap', () => {
  it('creates map with ko value, empty en/ja', () => {
    const m = localeMap('제목')
    expect(m).toEqual({ ko: '제목', en: '', ja: '' })
  })
})

describe('localized', () => {
  it('returns locale value when present', () => {
    const m = { ko: '제목', en: 'Title', ja: '' }
    expect(localized(m, 'en')).toEqual({ text: 'Title', isFallback: false })
  })
  it('falls back to ko when locale is empty', () => {
    const m = { ko: '제목', en: '', ja: '' }
    expect(localized(m, 'ja')).toEqual({ text: '제목', isFallback: true })
  })
  it('handles plain string (non-localized)', () => {
    expect(localized('14', 'en')).toEqual({ text: '14', isFallback: false })
  })
})
```

- [ ] **Step 3: Run tests**

Run: `pnpm test src/pages/cms/__tests__/cms-types.test.ts`
Expected: PASS

- [ ] **Step 4: Migrate cms-store with i18n data model**

Create `src/pages/cms/cms-store.ts` — same structure as existing `src/pages/cms-store.ts` but text values use `localeMap()`. Non-text values (icons, types, numbers) stay as plain strings.

Key changes:
- `value: 'Open Source'` → `value: localeMap('Open Source')`
- `value: '14'` stays as `value: '14'` (number, locale-independent)
- `label: 'APG Patterns'` → `label: localeMap('APG Patterns')`
- `title: 'Define Store'` → `title: localeMap('Define Store')`
- `desc: '...'` → `desc: localeMap('...')`
- `name: 'interactive-os'` stays as `name: 'interactive-os'` (brand, locale-independent)

- [ ] **Step 5: Commit**

```bash
git add src/pages/cms/cms-types.ts src/pages/cms/cms-store.ts src/pages/cms/__tests__/cms-types.test.ts
git commit -m "feat(cms): add i18n data model — LocaleMap type, localeMap/localized helpers, migrated store"
```

---

## Task 2: Section Template Factories

**Files:**
- Create: `src/pages/cms/cms-templates.ts`
- Test: `src/pages/cms/__tests__/cms-templates.test.ts`

- [ ] **Step 1: Write tests for template factories**

```typescript
// src/pages/cms/__tests__/cms-templates.test.ts
import { describe, it, expect } from 'vitest'
import { createSection, TEMPLATE_VARIANTS } from '../cms-templates'
import type { Locale } from '../cms-types'

describe('createSection', () => {
  it('creates hero section with 4 children', () => {
    const { entities, relationships, rootId } = createSection('hero')
    expect(entities[rootId].data.type).toBe('section')
    expect(entities[rootId].data.variant).toBe('hero')
    expect(relationships[rootId].length).toBe(4) // badge, title, subtitle, cta
  })

  it('generates unique IDs each call', () => {
    const a = createSection('hero')
    const b = createSection('hero')
    expect(a.rootId).not.toBe(b.rootId)
  })

  it('creates stats section with 4 stat children', () => {
    const { relationships, rootId } = createSection('stats')
    expect(relationships[rootId].length).toBe(4)
  })

  it('all text values are LocaleMap', () => {
    const { entities } = createSection('hero')
    const titleEntity = Object.values(entities).find(
      e => (e.data as Record<string, unknown>).type === 'text'
    )
    const data = titleEntity!.data as Record<string, unknown>
    expect(data.value).toHaveProperty('ko')
    expect(data.value).toHaveProperty('en')
  })

  it('has all 6 variants', () => {
    expect(TEMPLATE_VARIANTS).toHaveLength(6)
    for (const v of TEMPLATE_VARIANTS) {
      const result = createSection(v.id)
      expect(result.entities[result.rootId]).toBeDefined()
    }
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/pages/cms/__tests__/cms-templates.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement template factories**

`src/pages/cms/cms-templates.ts` — Extract patterns from cms-store.ts into factory functions. Each factory:
1. Generates unique IDs with a counter (e.g., `hero-${counter++}`)
2. Returns `{ entities, relationships, rootId }`
3. Text values use `localeMap()`
4. Export `TEMPLATE_VARIANTS` array with `{ id, label, icon }` for the picker UI

```typescript
export type SectionVariant = 'hero' | 'stats' | 'features' | 'workflow' | 'patterns' | 'footer'

export interface TemplateVariant {
  id: SectionVariant
  label: string
  icon: string
}

export const TEMPLATE_VARIANTS: TemplateVariant[] = [
  { id: 'hero', label: 'Hero', icon: 'star' },
  { id: 'stats', label: 'Stats', icon: 'bar-chart' },
  { id: 'features', label: 'Features', icon: 'grid' },
  { id: 'workflow', label: 'Workflow', icon: 'git-branch' },
  { id: 'patterns', label: 'Patterns', icon: 'puzzle' },
  { id: 'footer', label: 'Footer', icon: 'minus' },
]

export interface SectionTemplate {
  entities: Record<string, { id: string; data: Record<string, unknown> }>
  relationships: Record<string, string[]>
  rootId: string
}

let counter = 0
function uid(prefix: string): string {
  return `${prefix}-${++counter}`
}

export function createSection(variant: SectionVariant): SectionTemplate { ... }
```

- [ ] **Step 4: Run tests**

Run: `pnpm test src/pages/cms/__tests__/cms-templates.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/cms/cms-templates.ts src/pages/cms/__tests__/cms-templates.test.ts
git commit -m "feat(cms): section template factories — 6 variants with i18n-ready data"
```

---

## Task 3: Extract Canvas & Renderers from PageVisualCms

**Files:**
- Create: `src/pages/cms/cms-renderers.tsx`
- Create: `src/pages/cms/CmsCanvas.tsx`

- [ ] **Step 1: Extract renderers**

Move from `src/pages/PageVisualCms.tsx` to `src/pages/cms/cms-renderers.tsx`:
- `NodeContent` component (update to read localized text via `localized()` helper)
- `getSectionClassName`, `getNodeClassName`, `getChildrenContainerClassName`, `getNodeTag`
- `HEADER_TYPES`
- Icon lookup maps (`featureIcons`, `patternIcons`)

Add `locale` prop to `NodeContent`:
```typescript
function NodeContent({ data, locale }: { data: Record<string, unknown>; locale: Locale }) {
  // For text values that are LocaleMap, use localized(value, locale)
  // For plain strings, use as-is
}
```

- [ ] **Step 2: Create CmsCanvas component**

Extract the rendering logic from `PageVisualCms` into `CmsCanvas.tsx`:
```typescript
interface CmsCanvasProps {
  locale: Locale
}
```
- Uses `useAria` + `spatial` behavior + `useSpatialNav`
- Receives locale for text rendering
- Exposes store to parent via shared state (parent owns the store state)

- [ ] **Step 3: Verify existing PageVisualCms still works**

Update `src/pages/PageVisualCms.tsx` to import from the extracted modules. Keep it working for showcase route.

Run: `pnpm dev` and verify `/vision/visual-cms` still renders correctly.

- [ ] **Step 4: Commit**

```bash
git add src/pages/cms/cms-renderers.tsx src/pages/cms/CmsCanvas.tsx src/pages/PageVisualCms.tsx
git commit -m "refactor(cms): extract canvas renderers and CmsCanvas component from PageVisualCms"
```

---

## Task 4: CMS Layout Shell + Routing

**Files:**
- Create: `src/pages/cms/CmsLayout.tsx`
- Create: `src/pages/cms/CmsTopToolbar.tsx`
- Create: `src/pages/cms/CmsHamburgerDrawer.tsx`
- Create: `src/styles/cms.css`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create CMS layout CSS**

`src/styles/cms.css` — Layout grid for CMS:
```css
.cms-layout { display: flex; flex-direction: column; height: 100svh; }
.cms-top-toolbar { height: 40px; display: flex; align-items: center; padding: 0 12px; ... }
.cms-body { display: flex; flex: 1; min-height: 0; }
.cms-sidebar { width: 120px; flex-shrink: 0; overflow-y: auto; ... }
.cms-canvas-area { flex: 1; position: relative; overflow-y: auto; }
.cms-floating-toolbar { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); ... }
.cms-drawer-overlay { position: fixed; inset: 0; z-index: 200; ... }
.cms-drawer { width: 240px; height: 100%; background: var(--surface-1); ... }
```

- [ ] **Step 2: Create CmsTopToolbar (skeleton)**

```typescript
// src/pages/cms/CmsTopToolbar.tsx
interface CmsTopToolbarProps {
  onHamburgerClick: () => void
  locale: Locale
  onLocaleChange: (locale: Locale) => void
  viewport: ViewportSize
  onViewportChange: (viewport: ViewportSize) => void
  onPresent: () => void
}
```

Renders: `[≡] [ko ▾] — spacer — [📱 💻 🖥️] [▶]`

- [ ] **Step 3: Create CmsHamburgerDrawer**

```typescript
// src/pages/cms/CmsHamburgerDrawer.tsx
interface CmsHamburgerDrawerProps {
  open: boolean
  onClose: () => void
}
```

Uses existing `navItems` and `routeConfig` from App.tsx (extract to shared module).
Renders overlay + drawer with ActivityBar items as a listbox.
**Focus management:**
- Escape → close drawer, restore focus to hamburger button (via `ref`)
- Overlay click → close drawer, restore focus to canvas

- [ ] **Step 4: Create module-scoped CMS state**

```typescript
// src/pages/cms/cms-state.ts
// Module-scoped state — persists across React route navigation (CMS ↔ showcase)
// This ensures PRD V5: "이전 편집 상태(포커스 위치, 스크롤, 선택) 유지"

import { cmsStore } from './cms-store'
import type { NormalizedData } from '../../interactive-os/core/types'
import type { Locale, ViewportSize } from './cms-types'

let _data: NormalizedData = cmsStore
let _listeners: Set<() => void> = new Set()

export const cmsState = {
  getData: () => _data,
  setData: (next: NormalizedData) => { _data = next; _listeners.forEach(fn => fn()) },
  subscribe: (fn: () => void) => { _listeners.add(fn); return () => _listeners.delete(fn) },
}
// Use via useSyncExternalStore in components
```

- [ ] **Step 5: Create CmsLayout**

```typescript
// src/pages/cms/CmsLayout.tsx
export default function CmsLayout() {
  // Store from module-scoped state (persists across route nav)
  const data = useSyncExternalStore(cmsState.subscribe, cmsState.getData)
  const [locale, setLocale] = useState<Locale>('ko')
  const [viewport, setViewport] = useState<ViewportSize>('desktop')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [presenting, setPresenting] = useState(false)
  ...
}
```

Composes: CmsTopToolbar + CmsSidebar (placeholder) + CmsCanvas + CmsFloatingToolbar (placeholder)

- [ ] **Step 6: Wire routing in App.tsx**

```typescript
// In App.tsx Routes:
<Route path="/" element={<CmsLayout />} />
// Existing showcase routes stay at their paths
// Redirect /viewer to /viewer (stays as-is)
```

The CMS is now the landing page. Showcase is accessed via hamburger drawer → navigate to `/store/explorer` etc.

- [ ] **Step 7: Run dev server and verify**

Run: `pnpm dev`
- `/` shows CMS layout with top toolbar + canvas
- `[≡]` opens drawer with showcase nav
- Clicking a showcase item navigates to existing layout
- Existing showcase routes still work

- [ ] **Step 8: Commit**

```bash
git add src/pages/cms/CmsLayout.tsx src/pages/cms/CmsTopToolbar.tsx src/pages/cms/CmsHamburgerDrawer.tsx src/pages/cms/cms-state.ts src/styles/cms.css src/App.tsx
git commit -m "feat(cms): Figma Slides layout shell — top toolbar, hamburger drawer, CMS route"
```

---

## Task 5: Section Sidebar

**Files:**
- Create: `src/pages/cms/CmsSidebar.tsx`
- Create: `src/pages/cms/CmsTemplatePicker.tsx`

- [ ] **Step 1: Create CmsSidebar**

```typescript
// src/pages/cms/CmsSidebar.tsx
interface CmsSidebarProps {
  data: NormalizedData
  onDataChange: (data: NormalizedData) => void
  selectedSectionId: string | null
  onSectionSelect: (sectionId: string) => void
}
```

- `<Aria>` with `listbox` behavior + `core()`, `history()`, `crud()`, `clipboard()`, `dnd()` plugins
- Renders ROOT_ID children as thumbnail previews
- Thumbnails use CSS `transform: scale(0.15)` on actual section renderers inside small containers
- `[+]` button at bottom triggers template picker
- `onChange` syncs selection with canvas scroll

- [ ] **Step 2: Create CmsTemplatePicker**

```typescript
// src/pages/cms/CmsTemplatePicker.tsx
interface CmsTemplatePickerProps {
  open: boolean
  onClose: () => void
  onSelect: (variant: SectionVariant) => void
}
```

- Drop-up popup from `[+]` button
- `<Aria>` with `listbox` behavior (read-only)
- Shows 6 template variants with label + icon
- Enter/click selects → calls `onSelect` → closes

- [ ] **Step 3: Wire sidebar into CmsLayout**

- Sidebar selection syncs with canvas scroll via `scrollIntoView`
- Canvas spatial nav section change syncs back to sidebar selection
- `[+]` → template picker → `createSection()` → insert after currently selected section (not append)
- `createSection` result is added via `BatchCommand` so `history()` can undo atomically
- Minimum 1 section guard: disable delete when only 1 section remains
- Sidebar thumbnail auto-scrolls to selected item via `scrollIntoView({ block: 'nearest' })`

**Focus management (Enter/Escape between sidebar ↔ canvas):**
- Enter on sidebar thumbnail → transfer focus to canvas's corresponding section element (`document.querySelector` + `.focus()`)
- Escape in sidebar → transfer focus to canvas
- These are custom handlers layered on top of listbox behavior's `keyMap`

- [ ] **Step 4: CSS for sidebar thumbnails**

```css
.cms-sidebar__thumb { width: 100px; height: 60px; overflow: hidden; pointer-events: none; }
.cms-sidebar__thumb-inner { transform: scale(0.15); transform-origin: top left; width: 667px; }
.cms-sidebar__add-btn { ... }
.cms-template-picker { position: absolute; bottom: 100%; ... }
```

- [ ] **Step 5: Test sidebar interactions manually**

Run: `pnpm dev`
- Thumbnails visible in sidebar
- ↑↓ moves focus between sections
- Enter jumps canvas to that section
- Cmd+↑↓ reorders sections
- Delete removes section (blocked if only 1)
- [+] opens template picker
- Selecting template adds section

- [ ] **Step 6: Commit**

```bash
git add src/pages/cms/CmsSidebar.tsx src/pages/cms/CmsTemplatePicker.tsx src/styles/cms.css
git commit -m "feat(cms): section sidebar — PPT-style thumbnails, CRUD, reorder, template picker"
```

---

## Task 6: Floating Toolbar

**Files:**
- Create: `src/pages/cms/CmsFloatingToolbar.tsx`

- [ ] **Step 1: Create CmsFloatingToolbar**

```typescript
// src/pages/cms/CmsFloatingToolbar.tsx
interface CmsFloatingToolbarProps {
  data: NormalizedData
  onDispatch: (command: Command) => void
  disabled: boolean  // true during rename/present
}
```

- Reads `__spatial_parent__` and `__focus__` from store to determine depth
- Root depth → `[복제] [삭제] [↑] [↓]`
- Collection depth → `[+ 추가] [복제] [삭제] [↑] [↓]`
- Fields/Edit depth → all buttons disabled
- No focus / disabled → all buttons disabled
- `<Aria>` with `toolbar` behavior
- Buttons dispatch commands to the shared store
- **Click handler**: after dispatching, immediately restore focus to canvas element (prevent toolbar focus theft)
- **Escape handler**: transfer focus back to canvas
- **Tab order**: toolbar is next tab stop after canvas (natural DOM order)
- **Rename guard**: when `__rename__` entity exists in store, disable all buttons (prevent event leakage)

- [ ] **Step 2: Depth detection helper**

```typescript
function getToolbarContext(data: NormalizedData): 'root' | 'collection' | 'fields' | 'none' {
  const spatialParent = getSpatialParentId(data)
  const focusedId = data.entities['__focus__']?.focusedId
  if (!focusedId) return 'none'
  if (spatialParent === ROOT_ID || !spatialParent) return 'root'
  // Check if focused entity's parent is ROOT_ID child → collection
  // Otherwise → fields
  ...
}
```

- [ ] **Step 3: CSS for floating toolbar**

```css
.cms-floating-toolbar {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 2px;
  padding: 4px;
  background: var(--surface-3);
  border: 1px solid var(--border-mid);
  border-radius: var(--radius);
  box-shadow: var(--surface-4-shadow);
  z-index: 100;
}
```

- [ ] **Step 4: Wire into CmsLayout**

- Receives shared store data + dispatch function
- Hidden during present mode

- [ ] **Step 5: Test manually**

Run: `pnpm dev`
- Toolbar shows at bottom center
- Focus on section → 복제/삭제/↑/↓ buttons
- Enter into collection → + 추가 appears
- Enter into fields → all disabled
- Click 삭제 → section removed, focusRecovery kicks in

- [ ] **Step 6: Commit**

```bash
git add src/pages/cms/CmsFloatingToolbar.tsx src/styles/cms.css
git commit -m "feat(cms): floating toolbar — depth-reactive CRUD buttons, toolbar behavior"
```

---

## Task 7: Viewport Preview

**Files:**
- Create: `src/pages/cms/CmsViewportWrapper.tsx`

- [ ] **Step 1: Create CmsViewportWrapper**

```typescript
// src/pages/cms/CmsViewportWrapper.tsx
export type ViewportSize = 'mobile' | 'tablet' | 'desktop'

const VIEWPORT_WIDTHS: Record<ViewportSize, number | null> = {
  mobile: 375,
  tablet: 768,
  desktop: null, // 100%
}

interface CmsViewportWrapperProps {
  viewport: ViewportSize
  children: React.ReactNode
}
```

- Desktop: no wrapper, children render at full width
- Mobile/Tablet: `max-width` + centered + optional scale if container is smaller
- Canvas area's available width determines scale factor

- [ ] **Step 2: CSS for viewport**

```css
.cms-viewport { margin: 0 auto; transition: max-width 0.2s; }
.cms-viewport--mobile { max-width: 375px; }
.cms-viewport--tablet { max-width: 768px; }
```

- [ ] **Step 3: Wire viewport toggle in top toolbar**

The radiogroup-style toggle in `CmsTopToolbar` sets `viewport` state. `CmsViewportWrapper` wraps the canvas.

- [ ] **Step 4: Test manually**

Run: `pnpm dev`
- Click 📱 → canvas shrinks to 375px, centered
- Click 💻 → 768px
- Click 🖥️ → full width
- Spatial nav still works in all viewports

- [ ] **Step 5: Commit**

```bash
git add src/pages/cms/CmsViewportWrapper.tsx src/styles/cms.css
git commit -m "feat(cms): viewport preview — mobile/tablet/desktop toggle with CSS max-width"
```

---

## Task 8: i18n — Language Dropdown + Sheet

**Files:**
- Create: `src/pages/cms/CmsI18nSheet.tsx`
- Modify: `src/pages/cms/CmsTopToolbar.tsx` (language dropdown)

- [ ] **Step 1: Language dropdown in top toolbar**

Simple `<select>` or custom dropdown in `CmsTopToolbar`:
- Shows current locale code (ko/en/ja)
- On change, updates locale state in CmsLayout
- Canvas re-renders all text through `localized(value, locale)`

- [ ] **Step 2: Fallback opacity for untranslated text**

In `cms-renderers.tsx`, when `localized()` returns `isFallback: true`, add `cms-text--fallback` class:
```css
.cms-text--fallback { opacity: 0.4; }
```

- [ ] **Step 3: Create CmsI18nSheet**

```typescript
// src/pages/cms/CmsI18nSheet.tsx
interface CmsI18nSheetProps {
  data: NormalizedData
  onDataChange: (data: NormalizedData) => void
  open: boolean
}
```

- `<Aria>` with `grid` behavior + `core()` + `rename()` plugins
- Rows = all text entities from store (flatten tree, filter entities with LocaleMap values)
- Columns = Key | ko | en | ja
- F2/Enter on a cell → rename plugin for inline edit
- Same store, so edits sync to canvas automatically
- Empty cells (untranslated) get `.cms-i18n-cell--empty` class with visual highlight (dashed border or background tint)

- [ ] **Step 4: i18n sheet toggle button in top toolbar**

Add a sheet icon button next to locale dropdown. Toggles `i18nSheetOpen` state.

- [ ] **Step 5: CSS for i18n sheet panel**

```css
.cms-i18n-sheet { position: absolute; bottom: 0; left: 120px; right: 0; height: 240px; ... }
```

Slides up from bottom of canvas area. Grid layout for cells.

- [ ] **Step 6: Test manually**

Run: `pnpm dev`
- Switch to `en` → texts show English (or fallback ko at 40% opacity)
- Edit hero-title in `en` mode → value saved to en locale
- Open i18n sheet → see all keys with ko/en/ja columns
- Edit a ja cell in sheet → switch to ja in canvas → value shows

- [ ] **Step 7: Commit**

```bash
git add src/pages/cms/CmsI18nSheet.tsx src/pages/cms/CmsTopToolbar.tsx src/pages/cms/cms-renderers.tsx src/styles/cms.css
git commit -m "feat(cms): i18n — language dropdown, fallback opacity, translation sheet panel"
```

---

## Task 9: Present Mode

**Files:**
- Create: `src/pages/cms/CmsPresentMode.tsx`
- Modify: `src/pages/cms/CmsLayout.tsx`

- [ ] **Step 1: Create CmsPresentMode**

```typescript
// src/pages/cms/CmsPresentMode.tsx
interface CmsPresentModeProps {
  data: NormalizedData
  locale: Locale
  onExit: () => void
}
```

- Fullscreen overlay (z-index 300)
- Renders all sections with renderers but NO:
  - Focus rings (no `data-focused` styling)
  - Sidebar, toolbar, top toolbar
  - Keyboard handlers (no spatial nav)
- Escape key → `onExit()`
- Always renders at real browser size (ignores viewport setting)

- [ ] **Step 2: Wire present button in CmsLayout**

```typescript
const [presenting, setPresenting] = useState(false)
// When presenting: render CmsPresentMode on top of everything
// Escape handler exits
```

- [ ] **Step 3: CSS for present mode**

```css
.cms-present { position: fixed; inset: 0; z-index: 300; overflow-y: auto; background: var(--surface-0); }
.cms-present [data-focused] { outline: none; box-shadow: none; }
```

- [ ] **Step 4: Test manually**

Run: `pnpm dev`
- Click [▶] → all chrome disappears, just the landing page
- Escape → back to CMS editor
- Focus rings gone in present mode
- Previous state preserved after exit

- [ ] **Step 5: Commit**

```bash
git add src/pages/cms/CmsPresentMode.tsx src/pages/cms/CmsLayout.tsx src/styles/cms.css
git commit -m "feat(cms): present mode — chrome-free fullscreen preview with Escape to exit"
```

---

## Task 10: Integration & Polish

**Files:**
- Modify: `src/pages/cms/CmsLayout.tsx`
- Modify: `src/pages/cms/CmsSidebar.tsx`
- Modify: `src/styles/cms.css`

- [ ] **Step 1: Sidebar ↔ Canvas bidirectional sync**

- Sidebar click/Enter → canvas scrolls to section via `scrollIntoView`
- Canvas spatial nav enters different section → sidebar selection updates
- Use `onStoreChange` listener or derive from `__spatial_parent__` + `__focus__`

- [ ] **Step 2: Section CRUD via sidebar**

- Delete in sidebar → section removed from store → canvas + sidebar both update
- [+] → template picker → `createSection()` → entities + relationships added to store → appears in both views
- Minimum 1 section guard: if only 1 section, disable delete (via permissions middleware or guard in handler)

- [ ] **Step 3: Edge case: narrow browser**

```css
@media (max-width: 600px) {
  .cms-sidebar { display: none; }
}
```

- [ ] **Step 4: Theme support verification**

Verify all new CMS components use CSS custom properties from tokens.css. Test dark/light toggle.

- [ ] **Step 5: Full walkthrough test**

Run: `pnpm dev` and verify all PRD scenarios:
1. App entry (`/`) → CMS layout (Figma Slides style)
2. [≡] → drawer → Store click → showcase layout → CMS click → **back with state preserved** (V5)
3. [≡] → Escape → drawer closes, **hamburger button gets focus**
4. Sidebar: ↑↓ navigate, **Enter transfers focus to canvas**, Escape back to sidebar
5. Sidebar: Cmd+↑↓ reorder, Delete (blocked at 1), [+] add **after current selection**
6. Floating toolbar: context changes per depth, **buttons disabled at Fields/Edit**
7. Floating toolbar: **click dispatches command, focus stays on canvas**
8. Floating toolbar: **Tab from canvas → toolbar, Escape → back to canvas**
9. Viewport: 📱/💻/🖥️ toggle, spatial nav works in all sizes
10. Language: ko/en/ja switch, **fallback text at 40% opacity**
11. i18n sheet: open, navigate cells, edit, **empty cells highlighted**, sync with canvas
12. Present mode: [▶] → all chrome gone, Escape → back with state preserved
13. Undo/redo across all operations (section add = atomic undo)

- [ ] **Step 6: Run full test suite**

Run: `pnpm test`
Expected: All existing tests pass, new cms-types and cms-templates tests pass

- [ ] **Step 7: Run lint**

Run: `pnpm lint`
Expected: 0 errors

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(cms): integration polish — sidebar sync, edge cases, theme compat"
```
