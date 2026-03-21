# CMS Tab Container Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add tab-group/tab-item/tab-panel node types to CMS, enabling array + conditional rendering + nested content primitives.

**Architecture:** Three new node types form a container hierarchy: tab-group (root-level) → tab-item (tab label with LocaleMap) → tab-panel (section-only container). Active tab is derived from spatial focus — when a tab-item receives focus via spatial nav's `findNearest`, its panel becomes visible. This is view state (React useState), not engine state, because "which panel is visible" is a rendering concern identical to how sidebar highlights the active section from focus. Spatial nav handles ←→ navigation between horizontally-laid-out tab-items naturally (DOM position-based). Existing CRUD/DnD/clipboard operations work unchanged on tab nodes.

**Why not interactive-os tabs behavior?** The CMS uses spatial behavior for its entire canvas. The tabs behavior (select + activate + navigate axes) is designed for standalone tab components. Embedding a second behavior context inside spatial would create event bubbling conflicts. Instead, spatial nav's findNearest already provides correct directional navigation for horizontal tab-items, and active tab tracking is a one-line focus derivation — no engine bypass, just view state.

**Tech Stack:** Zod (schema), React (rendering), interactive-os spatial behavior (navigation), vitest + @testing-library/react + userEvent (testing)

**PRD:** `docs/superpowers/specs/2026-03-22-cms-tab-container-prd.md`

**Out of scope (backlog):** Present mode tab rendering — requires separate CmsPresentMode.tsx changes. File as backlog after this implementation.

---

### Task 1: Schema — Add 3 node types + childRules + getEditableFields

**Files:**
- Modify: `src/pages/cms/cms-schema.ts:26-59` (nodeSchemas + childRules + cmsCanAccept)
- Test: `src/__tests__/cms-tab-schema.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/__tests__/cms-tab-schema.test.ts
import { describe, it, expect } from 'vitest'
import { cmsCanAccept, getEditableFields } from '../pages/cms/cms-schema'

describe('CMS Tab Container Schema', () => {
  // --- canAccept: root level ---
  it('root accepts tab-group', () => {
    expect(cmsCanAccept(undefined, { type: 'tab-group' })).toBe(true)
  })

  it('root still accepts section', () => {
    expect(cmsCanAccept(undefined, { type: 'section', variant: 'hero' })).toBe(true)
  })

  // --- canAccept: tab-group ---
  it('tab-group accepts tab-item', () => {
    expect(cmsCanAccept({ type: 'tab-group' }, { type: 'tab-item', label: { ko: '탭', en: '', ja: '' } })).toBe(true)
  })

  it('tab-group rejects section', () => {
    expect(cmsCanAccept({ type: 'tab-group' }, { type: 'section', variant: 'hero' })).toBe(false)
  })

  // --- canAccept: tab-item ---
  it('tab-item accepts tab-panel', () => {
    expect(cmsCanAccept({ type: 'tab-item', label: { ko: '', en: '', ja: '' } }, { type: 'tab-panel' })).toBe(true)
  })

  it('tab-item rejects text', () => {
    expect(cmsCanAccept({ type: 'tab-item', label: { ko: '', en: '', ja: '' } }, { type: 'text', role: 'title', value: { ko: '', en: '', ja: '' } })).toBe(false)
  })

  // --- canAccept: tab-panel ---
  it('tab-panel accepts section', () => {
    expect(cmsCanAccept({ type: 'tab-panel' }, { type: 'section', variant: 'hero' })).toBe(true)
  })

  it('tab-panel rejects tab-group (no nesting)', () => {
    expect(cmsCanAccept({ type: 'tab-panel' }, { type: 'tab-group' })).toBe(false)
  })

  it('tab-panel rejects card directly', () => {
    expect(cmsCanAccept({ type: 'tab-panel' }, { type: 'card' })).toBe(false)
  })

  // --- getEditableFields ---
  it('tab-item has label as editable field', () => {
    const fields = getEditableFields({ type: 'tab-item', label: { ko: '탭', en: '', ja: '' } })
    expect(fields).toEqual([{ field: 'label', label: 'Label', isLocaleMap: true }])
  })

  it('tab-group has no editable fields', () => {
    expect(getEditableFields({ type: 'tab-group' })).toEqual([])
  })

  it('tab-panel has no editable fields', () => {
    expect(getEditableFields({ type: 'tab-panel' })).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/cms-tab-schema.test.ts`
Expected: FAIL — unknown types, cmsCanAccept returns false

- [ ] **Step 3: Implement schema changes**

In `src/pages/cms/cms-schema.ts`:

Add to `nodeSchemas` (after `section` line 43):
```typescript
'tab-group':  z.object({ type: z.literal('tab-group') }),
'tab-item':   z.object({ type: z.literal('tab-item'),  label: localeMapSchema.describe('Label') }),
'tab-panel':  z.object({ type: z.literal('tab-panel') }),
```

Add to `childRules` (after `links` line 58):
```typescript
'tab-group': z.discriminatedUnion('type', [nodeSchemas['tab-item']]),
'tab-item':  z.discriminatedUnion('type', [nodeSchemas['tab-panel']]),
'tab-panel': z.discriminatedUnion('type', [nodeSchemas.section]),
```

Update `cmsCanAccept` root branch (line 65):
```typescript
if (!parentData?.type) {
  return nodeSchemas.section.safeParse(childData).success
    || nodeSchemas['tab-group'].safeParse(childData).success
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/cms-tab-schema.test.ts`
Expected: PASS — all 12 assertions green

- [ ] **Step 5: Run existing tests for regression**

Run: `npx vitest run src/__tests__/cms-detail-panel.test.tsx src/__tests__/cms-inline-edit.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/pages/cms/cms-schema.ts src/__tests__/cms-tab-schema.test.ts
git commit -m "feat(cms): add tab-group/tab-item/tab-panel to schema + childRules"
```

---

### Task 2: Renderers — tag, className, NodeContent for tab types

**Files:**
- Modify: `src/pages/cms/cms-renderers.tsx`

- [ ] **Step 1: Add tag/class/content mappings**

In `cms-renderers.tsx`:

`getNodeTag` — add cases:
```typescript
case 'tab-group': return 'div'
case 'tab-item': return 'button'
case 'tab-panel': return 'div'
```

`getNodeClassName` — add cases:
```typescript
case 'tab-group': return `cms-tab-group${focusClass}`
case 'tab-item': return `cms-tab-item${focusClass}`
case 'tab-panel': return `cms-tab-panel${focusClass}`
```

`NodeContent` — add tab-item case:
```typescript
case 'tab-item':
  return <LocalizedText value={data.label as LocaleMap} locale={locale} />
```

- [ ] **Step 2: Run existing tests for regression**

Run: `npx vitest run src/__tests__/cms-detail-panel.test.tsx src/__tests__/cms-inline-edit.test.tsx`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/pages/cms/cms-renderers.tsx
git commit -m "feat(cms): add renderer mappings for tab-group/tab-item/tab-panel"
```

---

### Task 3: Template — createTabGroup factory

**Files:**
- Modify: `src/pages/cms/cms-templates.ts`

- [ ] **Step 1: Widen SectionVariant to TemplateType**

Current `SectionVariant` type only covers section variants. Tab-group is a node type, not a section variant. Rename to `TemplateType` (or add `'tab-group'` as a separate discriminator):

```typescript
// Before: type SectionVariant = 'hero' | 'stats' | ...
// After:
type TemplateType = 'hero' | 'stats' | 'features' | 'workflow' | 'patterns' | 'footer' | 'tab-group'
```

Update all references from `SectionVariant` to `TemplateType`.

- [ ] **Step 2: Add createTabGroup template factory**

```typescript
function createTabGroup(): SectionTemplate {
  const rootId = uid('tab-group')
  const entities: Record<string, { id: string; data: Record<string, unknown> }> = {}
  const relationships: Record<string, string[]> = {}

  entities[rootId] = { id: rootId, data: { type: 'tab-group' } }
  relationships[rootId] = []

  for (let i = 0; i < 2; i++) {
    const tabId = uid('tab-item')
    const panelId = uid('tab-panel')
    const sectionId = uid('section')

    entities[tabId] = { id: tabId, data: { type: 'tab-item', label: localeMap(`Tab ${i + 1}`) } }
    entities[panelId] = { id: panelId, data: { type: 'tab-panel' } }
    entities[sectionId] = { id: sectionId, data: { type: 'section', variant: 'features' } }

    relationships[rootId].push(tabId)
    relationships[tabId] = [panelId]
    relationships[panelId] = [sectionId]
    relationships[sectionId] = []
  }

  return { rootId, entities, relationships }
}
```

- [ ] **Step 3: Add to TEMPLATE_VARIANTS and templateToCommand**

Add to `TEMPLATE_VARIANTS`:
```typescript
{ variant: 'tab-group', label: 'Tabs', icon: LayoutPanelTop }
```

Add to `templateToCommand` switch/lookup:
```typescript
case 'tab-group': template = createTabGroup(); break
```

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/cms/cms-templates.ts
git commit -m "feat(cms): add createTabGroup template factory"
```

---

### Task 4: Integration test — write failing tests BEFORE canvas implementation

**Files:**
- Create: `src/__tests__/cms-tab-container.test.tsx`
- Modify: `src/pages/cms/cms-store.ts` (add tab-group fixture data)

Tests are written first (TDD). They will fail until Task 5 (canvas rendering) is implemented.

- [ ] **Step 1: Add tab-group to initial store as fixture data**

In `src/pages/cms/cms-store.ts`, add a tab-group between existing sections (e.g., after features, before workflow). 3 tabs for testing:

```typescript
// Tab Group with 3 tabs
'tab-group-1': { id: 'tab-group-1', data: { type: 'tab-group' } },
'tab-1': { id: 'tab-1', data: { type: 'tab-item', label: localeMap('Overview') } },
'tab-1-panel': { id: 'tab-1-panel', data: { type: 'tab-panel' } },
'tab-1-section': { id: 'tab-1-section', data: { type: 'section', variant: 'features' } },
'tab-1-text': { id: 'tab-1-text', data: { type: 'text', role: 'tab-1-title', value: localeMap('Tab 1 Content') } },
'tab-2': { id: 'tab-2', data: { type: 'tab-item', label: localeMap('Details') } },
'tab-2-panel': { id: 'tab-2-panel', data: { type: 'tab-panel' } },
'tab-2-section': { id: 'tab-2-section', data: { type: 'section', variant: 'stats' } },
'tab-2-text': { id: 'tab-2-text', data: { type: 'text', role: 'tab-2-title', value: localeMap('Tab 2 Content') } },
'tab-3': { id: 'tab-3', data: { type: 'tab-item', label: localeMap('More') } },
'tab-3-panel': { id: 'tab-3-panel', data: { type: 'tab-panel' } },
'tab-3-section': { id: 'tab-3-section', data: { type: 'section', variant: 'hero' } },
'tab-3-text': { id: 'tab-3-text', data: { type: 'text', role: 'tab-3-title', value: localeMap('Tab 3 Content') } },

// relationships:
'tab-group-1': ['tab-1', 'tab-2', 'tab-3'],
'tab-1': ['tab-1-panel'],
'tab-1-panel': ['tab-1-section'],
'tab-1-section': ['tab-1-text'],
'tab-1-text': [],  // (or omit — existing pattern)
'tab-2': ['tab-2-panel'],
'tab-2-panel': ['tab-2-section'],
'tab-2-section': ['tab-2-text'],
'tab-3': ['tab-3-panel'],
'tab-3-panel': ['tab-3-section'],
'tab-3-section': ['tab-3-text'],

// Add 'tab-group-1' to ROOT_ID children (between features and workflow)
```

- [ ] **Step 2: Write integration test**

```typescript
// src/__tests__/cms-tab-container.test.tsx
import { describe, it, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CmsLayout from '../pages/cms/CmsLayout'

function getFocused(container: HTMLElement): string {
  return container.querySelector('[tabindex="0"][data-cms-id]')?.getAttribute('data-cms-id') ?? ''
}

describe('CMS Tab Container', () => {
  describe('navigation', () => {
    it('Enter on tab-group focuses first tab-item', async () => {
      const user = userEvent.setup()
      const { container } = render(<CmsLayout />)

      const tabGroup = container.querySelector('[data-cms-id="tab-group-1"]') as HTMLElement
      tabGroup.focus()
      await user.keyboard('{Enter}')

      expect(getFocused(container)).toBe('tab-1')
    })

    it('Arrow Right moves to next tab and switches panel', async () => {
      const user = userEvent.setup()
      const { container } = render(<CmsLayout />)

      const tabGroup = container.querySelector('[data-cms-id="tab-group-1"]') as HTMLElement
      tabGroup.focus()
      await user.keyboard('{Enter}')
      expect(getFocused(container)).toBe('tab-1')

      await user.keyboard('{ArrowRight}')
      expect(getFocused(container)).toBe('tab-2')

      // Tab 2's panel should now be visible (role="tabpanel" containing tab-2-section)
      const visiblePanel = container.querySelector('[role="tabpanel"]') as HTMLElement
      expect(visiblePanel).not.toBeNull()
      expect(visiblePanel.querySelector('[data-cms-id="tab-2-section"]')).not.toBeNull()
    })

    it('Arrow Left moves to previous tab', async () => {
      const user = userEvent.setup()
      const { container } = render(<CmsLayout />)

      const tabGroup = container.querySelector('[data-cms-id="tab-group-1"]') as HTMLElement
      tabGroup.focus()
      await user.keyboard('{Enter}')
      await user.keyboard('{ArrowRight}')
      expect(getFocused(container)).toBe('tab-2')

      await user.keyboard('{ArrowLeft}')
      expect(getFocused(container)).toBe('tab-1')
    })

    it('Enter on tab-item enters its panel first section', async () => {
      const user = userEvent.setup()
      const { container } = render(<CmsLayout />)

      const tabGroup = container.querySelector('[data-cms-id="tab-group-1"]') as HTMLElement
      tabGroup.focus()
      await user.keyboard('{Enter}')  // → tab-1
      await user.keyboard('{Enter}')  // → tab-1-panel → tab-1-section

      expect(getFocused(container)).toBe('tab-1-section')
    })

    it('Escape from panel section returns to tab-item', async () => {
      const user = userEvent.setup()
      const { container } = render(<CmsLayout />)

      const tabGroup = container.querySelector('[data-cms-id="tab-group-1"]') as HTMLElement
      tabGroup.focus()
      await user.keyboard('{Enter}')  // → tab-1
      await user.keyboard('{Enter}')  // → tab-1-section

      await user.keyboard('{Escape}') // → back to tab-1
      expect(getFocused(container)).toBe('tab-1')
    })

    it('Escape from tab-item returns to tab-group', async () => {
      const user = userEvent.setup()
      const { container } = render(<CmsLayout />)

      const tabGroup = container.querySelector('[data-cms-id="tab-group-1"]') as HTMLElement
      tabGroup.focus()
      await user.keyboard('{Enter}')
      expect(getFocused(container)).toBe('tab-1')

      await user.keyboard('{Escape}')
      expect(getFocused(container)).toBe('tab-group-1')
    })
  })

  describe('tab selection', () => {
    it('only active tab panel content is rendered', async () => {
      const user = userEvent.setup()
      const { container } = render(<CmsLayout />)

      const tabGroup = container.querySelector('[data-cms-id="tab-group-1"]') as HTMLElement
      tabGroup.focus()
      await user.keyboard('{Enter}')

      // Tab 1 is active by default — its panel sections visible
      expect(container.querySelector('[data-cms-id="tab-1-section"]')).not.toBeNull()
      // Tab 2 panel sections NOT rendered (conditional rendering)
      expect(container.querySelector('[data-cms-id="tab-2-section"]')).toBeNull()
    })

    it('clicking tab switches panel', async () => {
      const { container } = render(<CmsLayout />)

      const tab2 = container.querySelector('[data-cms-id="tab-2"]') as HTMLElement
      act(() => { tab2.click() })

      // Tab 2 panel now visible
      expect(container.querySelector('[data-cms-id="tab-2-section"]')).not.toBeNull()
      // Tab 1 panel hidden
      expect(container.querySelector('[data-cms-id="tab-1-section"]')).toBeNull()
    })

    it('aria-selected reflects active tab', async () => {
      const user = userEvent.setup()
      const { container } = render(<CmsLayout />)

      const tabGroup = container.querySelector('[data-cms-id="tab-group-1"]') as HTMLElement
      tabGroup.focus()
      await user.keyboard('{Enter}')

      const tab1 = container.querySelector('[data-cms-id="tab-1"]') as HTMLElement
      const tab2 = container.querySelector('[data-cms-id="tab-2"]') as HTMLElement
      expect(tab1.getAttribute('aria-selected')).toBe('true')
      expect(tab2.getAttribute('aria-selected')).toBe('false')

      await user.keyboard('{ArrowRight}')
      expect(tab1.getAttribute('aria-selected')).toBe('false')
      expect(tab2.getAttribute('aria-selected')).toBe('true')
    })
  })

  describe('CRUD', () => {
    it('Delete on tab-item removes tab (min 1 guard)', async () => {
      const user = userEvent.setup()
      const { container } = render(<CmsLayout />)

      const tabGroup = container.querySelector('[data-cms-id="tab-group-1"]') as HTMLElement
      tabGroup.focus()
      await user.keyboard('{Enter}')

      // 3 tabs initially
      const tabs = container.querySelectorAll('[role="tab"]')
      expect(tabs.length).toBe(3)

      // Delete tab-1
      await user.keyboard('{Delete}')
      expect(container.querySelectorAll('[role="tab"]').length).toBe(2)

      // Delete again
      await user.keyboard('{Delete}')
      expect(container.querySelectorAll('[role="tab"]').length).toBe(1)

      // Last tab — Delete should be ignored
      await user.keyboard('{Delete}')
      expect(container.querySelectorAll('[role="tab"]').length).toBe(1)
    })

    it('Mod+ArrowDown reorders tab', async () => {
      const user = userEvent.setup()
      const { container } = render(<CmsLayout />)

      const tabGroup = container.querySelector('[data-cms-id="tab-group-1"]') as HTMLElement
      tabGroup.focus()
      await user.keyboard('{Enter}')
      expect(getFocused(container)).toBe('tab-1')

      // Move tab-1 to the right (Mod+ArrowDown = move down in sibling order)
      await user.keyboard('{Control>}{ArrowDown}{/Control}')

      // tab-1 should now be second, tab-2 first
      const tabButtons = container.querySelectorAll('[role="tab"]')
      expect(tabButtons[0].getAttribute('data-cms-id')).toBe('tab-2')
      expect(tabButtons[1].getAttribute('data-cms-id')).toBe('tab-1')
    })
  })

  describe('inline edit', () => {
    it('F2 on tab-item starts label inline editing', async () => {
      const user = userEvent.setup()
      const { container } = render(<CmsLayout />)

      const tabGroup = container.querySelector('[data-cms-id="tab-group-1"]') as HTMLElement
      tabGroup.focus()
      await user.keyboard('{Enter}')
      expect(getFocused(container)).toBe('tab-1')

      await user.keyboard('{F2}')
      expect(container.querySelector('[contenteditable]')).not.toBeNull()
    })
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/cms-tab-container.test.tsx`
Expected: FAIL — tab-group rendering not yet implemented

- [ ] **Step 4: Commit test + fixture data**

```bash
git add src/__tests__/cms-tab-container.test.tsx src/pages/cms/cms-store.ts
git commit -m "test(cms): add tab container integration tests (red phase)"
```

---

### Task 5: Canvas rendering — tab-group branch + F2 keyMap + active tab tracking

**Files:**
- Modify: `src/pages/cms/CmsCanvas.tsx`
- Modify: `src/pages/PageViewer.module.css` (tab container CSS)

This task makes the Task 4 tests pass.

- [ ] **Step 1: Add F2 to cmsKeyMap**

Tab-items are containers (have tab-panel children), so Enter drills in. F2 is the explicit rename trigger:

```typescript
// In cmsKeyMap, add:
F2: (ctx) => {
  const entity = ctx.getEntity(ctx.focused)
  const data = (entity?.data ?? {}) as Record<string, unknown>
  const fields = getEditableFields(data)
  if (fields.length === 0) return
  return renameCommands.startRename(ctx.focused)
},
```

- [ ] **Step 2: Add minimum-1-tab guard to Delete**

```typescript
Delete: (ctx) => {
  const rootChildren = ctx.getChildren(ROOT_ID)
  if (rootChildren.includes(ctx.focused) && rootChildren.length <= 1) return

  // Minimum-1-tab guard
  const entity = ctx.getEntity(ctx.focused)
  const data = (entity?.data ?? {}) as Record<string, unknown>
  if (data.type === 'tab-item') {
    const parent = ctx.getParent(ctx.focused)
    if (parent) {
      const siblings = ctx.getChildren(parent)
      if (siblings.length <= 1) return
    }
  }

  return crudCommands.remove(ctx.focused)
},
```

- [ ] **Step 3: Add active tab state and focus tracking**

```typescript
// Inside CmsCanvas component:
const [activeTabMap, setActiveTabMap] = useState<Map<string, string>>(new Map())

function getActiveTabId(tabGroupId: string): string | undefined {
  const active = activeTabMap.get(tabGroupId)
  if (active && currentStore.entities[active]) return active
  const children = getChildren(currentStore, tabGroupId)
  return children[0]
}

// In the useEffect that watches aria.focused:
useEffect(() => {
  onFocusChange?.(aria.focused)
  const entity = currentStore.entities[aria.focused]
  const data = (entity?.data ?? {}) as Record<string, unknown>
  if (data.type === 'tab-item') {
    const parentId = getParent(currentStore, aria.focused)
    if (parentId) {
      setActiveTabMap(prev => {
        const next = new Map(prev)
        next.set(parentId, aria.focused)
        return next
      })
    }
  }
}, [aria.focused, currentStore])
```

- [ ] **Step 4: Add tab-group rendering branch in renderNode**

After the section branch, before the card branch:

```typescript
if (d.type === 'tab-group') {
  const tabItems = children
  const activeTabId = getActiveTabId(nodeId)

  return (
    <div
      key={nodeId}
      {...(restProps as React.HTMLAttributes<HTMLDivElement>)}
      role={ariaRole as string}
      tabIndex={tabIndex as number}
      onKeyDown={onKeyDown as React.KeyboardEventHandler}
      onFocus={onFocus as React.FocusEventHandler}
      onClick={(e) => handleNodeClick(nodeId, e)}
      className={className}
    >
      <div className="cms-tablist" role="tablist">
        {tabItems.map(tabId => {
          const tabEntity = currentStore.entities[tabId]
          if (!tabEntity) return null
          const tabState = aria.getNodeState(tabId)
          const tabProps = aria.getNodeProps(tabId)
          const tabData = (tabEntity.data ?? {}) as Record<string, unknown>
          const isActive = tabId === activeTabId
          const { onClick: _, onKeyDown: tkd, onFocus: tf, tabIndex: ti, role: _tr, ...tabRest } = tabProps as Record<string, unknown>

          return (
            <button
              key={tabId}
              {...(tabRest as React.HTMLAttributes<HTMLButtonElement>)}
              role="tab"
              tabIndex={ti as number}
              aria-selected={isActive}
              onKeyDown={tkd as React.KeyboardEventHandler}
              onFocus={tf as React.FocusEventHandler}
              onClick={(e) => handleNodeClick(tabId, e)}
              className={getNodeClassName(tabData, tabState)}
            >
              <CmsInlineEditable
                nodeId={tabId}
                data={tabData}
                locale={locale}
                dispatch={aria.dispatch}
                store={currentStore}
              />
            </button>
          )
        })}
      </div>
      {activeTabId && (() => {
        const panelChildren = getChildren(currentStore, activeTabId)
        const panelId = panelChildren[0]
        if (!panelId) return null
        const panelEntity = currentStore.entities[panelId]
        if (!panelEntity) return null
        const panelState = aria.getNodeState(panelId)
        const panelProps = aria.getNodeProps(panelId)
        const panelData = (panelEntity.data ?? {}) as Record<string, unknown>
        const { onClick: _, onKeyDown: pkd, onFocus: pf, tabIndex: pti, role: _pr, ...panelRest } = panelProps as Record<string, unknown>
        const panelSections = getChildren(currentStore, panelId)

        return (
          <div
            key={panelId}
            {...(panelRest as React.HTMLAttributes<HTMLDivElement>)}
            role="tabpanel"
            tabIndex={pti as number}
            onKeyDown={pkd as React.KeyboardEventHandler}
            onFocus={pf as React.FocusEventHandler}
            onClick={(e) => handleNodeClick(panelId, e)}
            className={getNodeClassName(panelData, panelState)}
          >
            {panelSections.map(sectionId => renderNode(sectionId))}
          </div>
        )
      })()}
    </div>
  )
}
```

- [ ] **Step 5: Add CSS for tab container**

In the CMS CSS file (check imports in CmsCanvas/CmsLayout), add minimal styles:

```css
.cms-tab-group {
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.cms-tablist {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border);
  background: var(--surface-secondary);
}

.cms-tab-item {
  padding: 8px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  font: inherit;
  color: var(--text-secondary);
}

.cms-tab-item[aria-selected="true"] {
  color: var(--text-primary);
  border-bottom: 2px solid var(--accent);
}

.cms-tab-panel {
  padding: 16px;
}
```

- [ ] **Step 6: Run integration tests (should now pass)**

Run: `npx vitest run src/__tests__/cms-tab-container.test.tsx`
Expected: PASS — all tests green

- [ ] **Step 7: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 8: Commit**

```bash
git add src/pages/cms/CmsCanvas.tsx src/pages/PageViewer.module.css
git commit -m "feat(cms): implement tab-group rendering with active tab tracking"
```

---

### Task 6: Final verification

- [ ] **Step 1: TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Lint check**

Run: `npx eslint src/pages/cms/ src/__tests__/cms-tab-*`
Expected: 0 errors

- [ ] **Step 3: Full test suite**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix(cms): tab container cleanup"
```
