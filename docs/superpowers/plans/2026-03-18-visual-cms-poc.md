# Visual CMS PoC Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Visual CMS PoC page that demonstrates interactive-os as a nested array editing engine on rendered tailwind+HTML blocks.

**Architecture:** Single `<Aria>` instance with `tree` behavior manages a normalized store representing a portal homepage (hero → cards → tabs → footer). The `renderItem` callback renders different tailwind blocks per node type. All plugins (crud, clipboard, dnd, history, rename, focusRecovery) enabled.

**Tech Stack:** React, interactive-os (tree behavior + all plugins), Tailwind CSS, Vitest

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/pages/PageVisualCms.tsx` | PoC page: store data, plugin config, renderItem per node type |
| `src/pages/PageVisualCms.css` | CMS page styles (focus overlay, toolbar, portal-like layout) |
| `src/App.tsx` | Add route to Vision group |
| `src/__tests__/visual-cms.test.tsx` | Store mapping + editing scenario tests |

---

## Chunk 1: Data Model + Page Skeleton

### Task 1: Create initial store data and page component

**Files:**
- Create: `src/pages/PageVisualCms.tsx`
- Create: `src/pages/PageVisualCms.css`

- [ ] **Step 1: Create PageVisualCms with store data**

```tsx
// src/pages/PageVisualCms.tsx
import { useState } from 'react'
import { Aria } from '../interactive-os/components/aria'
import { tree } from '../interactive-os/behaviors/tree'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'
import type { BehaviorContext } from '../interactive-os/behaviors/types'
import type { Command } from '../interactive-os/core/types'
import { core } from '../interactive-os/plugins/core'
import { history, historyCommands } from '../interactive-os/plugins/history'
import { crud, crudCommands } from '../interactive-os/plugins/crud'
import { clipboard, clipboardCommands } from '../interactive-os/plugins/clipboard'
import { rename, renameCommands } from '../interactive-os/plugins/rename'
import { dnd, dndCommands } from '../interactive-os/plugins/dnd'
import { focusRecovery } from '../interactive-os/plugins/focus-recovery'
import './PageVisualCms.css'

// --- CMS Content Types ---
interface HeroData { type: 'hero'; title: string; subtitle: string; cta: string }
interface CardsContainerData { type: 'cards'; heading: string }
interface CardData { type: 'card'; title: string; description: string; icon: string }
interface TabsContainerData { type: 'tabs'; heading: string }
interface TabData { type: 'tab'; label: string }
interface FooterData { type: 'footer'; copyright: string }

type CmsNodeData = HeroData | CardsContainerData | CardData | TabsContainerData | TabData | FooterData

// --- Initial Store ---
const initialStore = createStore({
  entities: {
    hero: { id: 'hero', data: { type: 'hero', title: 'Welcome to Our Platform', subtitle: 'Build something amazing with our tools', cta: 'Get Started' } },
    features: { id: 'features', data: { type: 'cards', heading: 'Features' } },
    'card-1': { id: 'card-1', data: { type: 'card', title: 'Fast', description: 'Lightning-fast performance for all your needs', icon: '⚡' } },
    'card-2': { id: 'card-2', data: { type: 'card', title: 'Secure', description: 'Enterprise-grade security built in', icon: '🔒' } },
    'card-3': { id: 'card-3', data: { type: 'card', title: 'Scalable', description: 'Grows with your business seamlessly', icon: '📈' } },
    'tabs-section': { id: 'tabs-section', data: { type: 'tabs', heading: 'Solutions' } },
    'tab-dev': { id: 'tab-dev', data: { type: 'tab', label: 'Developers' } },
    'tab-item-1': { id: 'tab-item-1', data: { type: 'card', title: 'API Access', description: 'RESTful APIs with comprehensive documentation', icon: '🔧' } },
    'tab-item-2': { id: 'tab-item-2', data: { type: 'card', title: 'SDKs', description: 'Native SDKs for every major platform', icon: '📦' } },
    'tab-biz': { id: 'tab-biz', data: { type: 'tab', label: 'Business' } },
    'tab-item-3': { id: 'tab-item-3', data: { type: 'card', title: 'Analytics', description: 'Real-time insights and reporting dashboards', icon: '📊' } },
    footer: { id: 'footer', data: { type: 'footer', copyright: '© 2026 Platform Inc. All rights reserved.' } },
  },
  relationships: {
    [ROOT_ID]: ['hero', 'features', 'tabs-section', 'footer'],
    features: ['card-1', 'card-2', 'card-3'],
    'tabs-section': ['tab-dev', 'tab-biz'],
    'tab-dev': ['tab-item-1', 'tab-item-2'],
    'tab-biz': ['tab-item-3'],
  },
})

const plugins = [core(), crud(), clipboard(), rename(), dnd(), history(), focusRecovery()]

const editingKeyMap: Record<string, (ctx: BehaviorContext) => Command | void> = {
  'Mod+C': (ctx) => clipboardCommands.copy(ctx.selected.length > 0 ? ctx.selected : [ctx.focused]),
  'Mod+X': (ctx) => clipboardCommands.cut(ctx.selected.length > 0 ? ctx.selected : [ctx.focused]),
  'Mod+V': (ctx) => clipboardCommands.paste(ctx.focused),
  'Delete': (ctx) => crudCommands.remove(ctx.focused),
  'Mod+Z': () => historyCommands.undo(),
  'Mod+Shift+Z': () => historyCommands.redo(),
  'F2': (ctx) => renameCommands.startRename(ctx.focused),
  'Alt+ArrowUp': (ctx) => dndCommands.moveUp(ctx.focused),
  'Alt+ArrowDown': (ctx) => dndCommands.moveDown(ctx.focused),
}

export default function PageVisualCms() {
  const [data, setData] = useState<NormalizedData>(initialStore)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Visual CMS</h2>
        <p className="page-desc">Edit rendered page content with keyboard — nested sections, tabs, cards</p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>→←</kbd> <span className="key-hint">expand/collapse</span>{' '}
        <kbd>F2</kbd> <span className="key-hint">edit</span>{' '}
        <kbd>⌘C</kbd> <span className="key-hint">copy</span>{' '}
        <kbd>⌘V</kbd> <span className="key-hint">paste</span>{' '}
        <kbd>Del</kbd> <span className="key-hint">delete</span>{' '}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>{' '}
        <kbd>Alt↑↓</kbd> <span className="key-hint">reorder</span>
      </div>
      <div className="cms-preview">
        <Aria
          behavior={tree}
          data={data}
          plugins={plugins}
          onChange={setData}
          keyMap={editingKeyMap}
          aria-label="Page content editor"
        >
          <Aria.Node render={(node, state) => (
            <CmsNode node={node} state={state} store={data} />
          )} />
        </Aria>
      </div>
    </div>
  )
}
```

The `CmsNode` component will be implemented in Task 2.

- [ ] **Step 2: Create minimal CmsNode + CSS stub**

```tsx
// Add to PageVisualCms.tsx, below imports

function CmsNode({ node, state, store }: {
  node: Record<string, unknown>
  state: NodeState
  store: NormalizedData
}) {
  const d = node.data as CmsNodeData
  const focused = state.focused
  const selected = state.selected

  const wrapperClass = [
    'cms-node',
    focused && 'cms-node--focused',
    selected && !focused && 'cms-node--selected',
  ].filter(Boolean).join(' ')

  return (
    <div className={wrapperClass} data-type={d.type}>
      {renderByType(d, state, store)}
    </div>
  )
}

function renderByType(d: CmsNodeData, state: NodeState, _store: NormalizedData) {
  switch (d.type) {
    case 'hero':
      return (
        <section className="cms-hero">
          <h1 className="cms-hero__title">{d.title}</h1>
          <p className="cms-hero__subtitle">{d.subtitle}</p>
          <button className="cms-hero__cta">{d.cta}</button>
        </section>
      )
    case 'cards':
      return (
        <section className="cms-cards">
          <h2 className="cms-cards__heading">{d.heading}</h2>
        </section>
      )
    case 'card':
      return (
        <div className="cms-card">
          <span className="cms-card__icon">{d.icon}</span>
          <h3 className="cms-card__title">{d.title}</h3>
          <p className="cms-card__desc">{d.description}</p>
        </div>
      )
    case 'tabs':
      return (
        <section className="cms-tabs">
          <h2 className="cms-tabs__heading">{d.heading}</h2>
        </section>
      )
    case 'tab':
      return (
        <div className="cms-tab">
          <span className="cms-tab__label">{d.label}</span>
        </div>
      )
    case 'footer':
      return (
        <footer className="cms-footer">
          <p>{d.copyright}</p>
        </footer>
      )
  }
}
```

- [ ] **Step 3: Create PageVisualCms.css**

```css
/* src/pages/PageVisualCms.css */
.cms-preview {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--bg-secondary, #fafafa);
}

/* --- Focus/selection overlay --- */
.cms-node {
  position: relative;
  transition: box-shadow 0.15s ease;
}

.cms-node--focused {
  box-shadow: inset 0 0 0 2px var(--accent, #3b82f6);
  border-radius: 4px;
  z-index: 1;
}

.cms-node--selected {
  box-shadow: inset 0 0 0 1px var(--accent, #3b82f6);
  opacity: 0.9;
}

/* --- Hero --- */
.cms-hero {
  text-align: center;
  padding: 48px 24px;
  background: linear-gradient(135deg, #1e293b, #334155);
  color: #f8fafc;
}

.cms-hero__title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px;
  line-height: 1.2;
}

.cms-hero__subtitle {
  font-size: 15px;
  color: #94a3b8;
  margin: 0 0 20px;
}

.cms-hero__cta {
  background: #3b82f6;
  color: #fff;
  border: none;
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

/* --- Cards section --- */
.cms-cards {
  padding: 24px;
}

.cms-cards__heading {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--text-primary, #1e293b);
}

/* Card items rendered as children by tree — use grid on parent via .cms-node nesting */
.cms-node[data-type="cards"] > .cms-cards + * {
  /* children handled by tree, not CSS grid */
}

.cms-card {
  padding: 16px;
  background: var(--bg-primary, #fff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 8px;
  margin: 4px 24px;
}

.cms-card__icon {
  font-size: 20px;
  display: block;
  margin-bottom: 8px;
}

.cms-card__title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 4px;
  color: var(--text-primary, #1e293b);
}

.cms-card__desc {
  font-size: 12px;
  color: var(--text-secondary, #64748b);
  margin: 0;
  line-height: 1.5;
}

/* --- Tabs section --- */
.cms-tabs {
  padding: 24px;
  border-top: 1px solid var(--border, #e2e8f0);
}

.cms-tabs__heading {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--text-primary, #1e293b);
}

.cms-tab {
  padding: 8px 16px;
  margin: 0 24px;
  border-left: 2px solid var(--accent, #3b82f6);
  background: var(--bg-primary, #fff);
}

.cms-tab__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent, #3b82f6);
}

/* --- Footer --- */
.cms-footer {
  padding: 20px 24px;
  border-top: 1px solid var(--border, #e2e8f0);
  text-align: center;
}

.cms-footer p {
  font-size: 12px;
  color: var(--text-secondary, #64748b);
  margin: 0;
}
```

- [ ] **Step 4: Verify file renders without errors**

Run: `pnpm dev` and check console for errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/PageVisualCms.tsx src/pages/PageVisualCms.css
git commit -m "feat: add Visual CMS PoC page skeleton with store data"
```

### Task 2: Add route to App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Import PageVisualCms and add to vision route group**

Add import:
```tsx
import PageVisualCms from './pages/PageVisualCms'
```

Add to vision group items (after architecture):
```tsx
{ path: 'visual-cms', label: 'Visual CMS', status: 'ready', component: PageVisualCms },
```

- [ ] **Step 2: Verify route works**

Run: `pnpm dev`, navigate to `/vision/visual-cms`.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add Visual CMS route to Vision group"
```

## Chunk 2: Tests

### Task 3: Write tests for store mapping and editing scenarios

**Files:**
- Create: `src/__tests__/visual-cms.test.tsx`

- [ ] **Step 1: Write store structure test**

```tsx
import { describe, it, expect } from 'vitest'
import { createStore, getChildren, getEntity } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'

describe('Visual CMS store mapping', () => {
  const store = createStore({
    entities: {
      hero: { id: 'hero', data: { type: 'hero', title: 'Title', subtitle: 'Sub', cta: 'CTA' } },
      features: { id: 'features', data: { type: 'cards', heading: 'Features' } },
      'card-1': { id: 'card-1', data: { type: 'card', title: 'Card 1', description: 'Desc', icon: '⚡' } },
      'card-2': { id: 'card-2', data: { type: 'card', title: 'Card 2', description: 'Desc', icon: '🔒' } },
      tabs: { id: 'tabs', data: { type: 'tabs', heading: 'Tabs' } },
      'tab-1': { id: 'tab-1', data: { type: 'tab', label: 'Tab 1' } },
      'tab-item-1': { id: 'tab-item-1', data: { type: 'card', title: 'Item', description: 'Desc', icon: '🔧' } },
      footer: { id: 'footer', data: { type: 'footer', copyright: '© 2026' } },
    },
    relationships: {
      [ROOT_ID]: ['hero', 'features', 'tabs', 'footer'],
      features: ['card-1', 'card-2'],
      tabs: ['tab-1'],
      'tab-1': ['tab-item-1'],
    },
  })

  it('has 4 root-level sections', () => {
    expect(getChildren(store, ROOT_ID)).toEqual(['hero', 'features', 'tabs', 'footer'])
  })

  it('features has nested cards', () => {
    expect(getChildren(store, 'features')).toEqual(['card-1', 'card-2'])
  })

  it('tabs → tab → items (3 levels deep)', () => {
    expect(getChildren(store, 'tabs')).toEqual(['tab-1'])
    expect(getChildren(store, 'tab-1')).toEqual(['tab-item-1'])
  })

  it('preserves entity data types', () => {
    const hero = getEntity(store, 'hero')
    expect(hero?.data?.type).toBe('hero')
    expect(hero?.data?.title).toBe('Title')

    const card = getEntity(store, 'card-1')
    expect(card?.data?.type).toBe('card')
  })
})
```

- [ ] **Step 2: Run tests**

Run: `pnpm test -- src/__tests__/visual-cms.test.tsx`
Expected: PASS

- [ ] **Step 3: Write CRUD scenario tests**

```tsx
// Add to same file
import { addEntity, removeEntity, moveNode } from '../interactive-os/core/createStore'

describe('Visual CMS CRUD operations', () => {
  const store = createStore({
    entities: {
      features: { id: 'features', data: { type: 'cards', heading: 'Features' } },
      'card-1': { id: 'card-1', data: { type: 'card', title: 'Card 1', description: 'Desc', icon: '⚡' } },
      'card-2': { id: 'card-2', data: { type: 'card', title: 'Card 2', description: 'Desc', icon: '🔒' } },
    },
    relationships: {
      [ROOT_ID]: ['features'],
      features: ['card-1', 'card-2'],
    },
  })

  it('adds a new card to features section', () => {
    const newCard = { id: 'card-3', data: { type: 'card', title: 'New', description: '', icon: '🆕' } }
    const result = addEntity(store, newCard, 'features')
    expect(getChildren(result, 'features')).toEqual(['card-1', 'card-2', 'card-3'])
  })

  it('removes a card — sibling order preserved', () => {
    const result = removeEntity(store, 'card-1')
    expect(getChildren(result, 'features')).toEqual(['card-2'])
  })

  it('reorders cards within section', () => {
    const result = moveNode(store, 'card-2', 'features', 0)
    expect(getChildren(result, 'features')).toEqual(['card-2', 'card-1'])
  })
})
```

- [ ] **Step 4: Run all tests**

Run: `pnpm test -- src/__tests__/visual-cms.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/__tests__/visual-cms.test.tsx
git commit -m "test: add Visual CMS store mapping and CRUD tests"
```

## Chunk 3: Verification

### Task 4: Full verification

- [ ] **Step 1: TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: 0 errors

- [ ] **Step 3: Full test suite**

Run: `pnpm test`
Expected: all pass

- [ ] **Step 4: Update PROGRESS.md**

Add under Vision group in App Shell section:
```
- [x] Visual CMS PoC — nested array 편집 엔진 검증 (tree behavior + all plugins)
```

- [ ] **Step 5: Commit**

```bash
git add docs/PROGRESS.md
git commit -m "docs: add Visual CMS PoC to progress tracker"
```
