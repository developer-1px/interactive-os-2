# Slot Children 시각적 렌더링 + Auto-drill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CMS의 multi-field 노드(cta, value-item, quote 등)의 slot children을 sr-only 대신 시각적으로 렌더링하여 개별 선택·편집 가능하게 하고, slot 부모의 auto-drill 동작을 구현한다.

**Architecture:** slot 부모의 `render`는 컨테이너 역할만 담당하고, 새로운 `slotRender`가 슬롯별 시각적 콘텐츠를 제공한다. `CmsSlotEditable` 컴포넌트가 slot child의 인라인 편집을 처리하되, rename 대상은 항상 부모 entity의 해당 필드다. CmsCanvas의 sr-only 렌더를 slotRender 기반 시각적 렌더로 교체한다.

**Tech Stack:** React, Vitest, Testing Library, userEvent

**Critical sync design:** Slot children은 `expandAllSlots`에 의해 부모 데이터의 복사본으로 생성된 파생 entity다. 인라인 편집 시 `confirmRename`은 반드시 **부모 entity**를 대상으로 해야 한다 (slot child entity 직접 수정 금지). 시각적 렌더도 부모 데이터를 읽는다.

---

### Task 1: `isSlotParent` + `getSlotName` 유틸리티

**Files:**
- Modify: `src/pages/cms/cmsSchema.ts` (add `isSlotParent`)
- Modify: `src/interactive-os/store/createStore.ts` (add `getSlotName`)
- Create: `src/__tests__/cms-slot-utils.test.ts`

- [ ] **Step 1: Write failing tests for `isSlotParent`**

```ts
// src/__tests__/cms-slot-utils.test.ts
import { describe, it, expect } from 'vitest'
import { isSlotParent } from '../pages/cms/cmsSchema'
import { getSlotName } from '@os/store/createStore'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'

describe('isSlotParent', () => {
  it('returns true for cta (2 inline fields: primary, secondary)', () => {
    expect(isSlotParent({ type: 'cta', primary: {}, secondary: {} })).toBe(true)
  })

  it('returns true for value-item (2 inline fields: title, desc)', () => {
    expect(isSlotParent({ type: 'value-item', icon: 'x', title: {}, desc: {} })).toBe(true)
  })

  it('returns true for quote (2 inline fields: text, attribution)', () => {
    expect(isSlotParent({ type: 'quote', text: {}, attribution: {} })).toBe(true)
  })

  it('returns true for article (2 inline fields: title, category)', () => {
    expect(isSlotParent({ type: 'article', image: '', icon: '', title: {}, category: {}, readTime: '' })).toBe(true)
  })

  it('returns true for showcase-item (2 inline fields: label, desc)', () => {
    expect(isSlotParent({ type: 'showcase-item', icon: '', label: {}, desc: {} })).toBe(true)
  })

  it('returns true for stat-card (3 inline fields: value, label, desc)', () => {
    expect(isSlotParent({ type: 'stat-card', value: '', label: {}, desc: {} })).toBe(true)
  })

  it('returns false for text (1 inline field)', () => {
    expect(isSlotParent({ type: 'text', role: 'title', value: {} })).toBe(false)
  })

  it('returns false for badge (1 inline field)', () => {
    expect(isSlotParent({ type: 'badge', value: {} })).toBe(false)
  })

  it('returns false for section (0 fields)', () => {
    expect(isSlotParent({ type: 'section', variant: 'hero' })).toBe(false)
  })

  it('returns false for icon (icon is form-only)', () => {
    expect(isSlotParent({ type: 'icon', value: '' })).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- src/__tests__/cms-slot-utils.test.ts`
Expected: FAIL — `isSlotParent` is not exported from cmsSchema

- [ ] **Step 3: Implement `isSlotParent` in cmsSchema.ts**

Add after the existing `getInlineEditableFields` function (around line 159):

```ts
/** Does this node have 2+ inline-editable fields, making it a slot parent?
 *  Slot parents auto-drill to their slot children; they are not directly selectable. */
export function isSlotParent(data: Record<string, unknown>): boolean {
  const type = data.type as string | undefined
  if (!type) return false
  const fields = fieldsOf(type)
  const inlineFields = fields.filter(f => !FORM_ONLY_FIELD_TYPES.has(f.fieldType))
  return inlineFields.length >= 2
}
```

- [ ] **Step 4: Run tests to verify `isSlotParent` passes**

Run: `pnpm test -- src/__tests__/cms-slot-utils.test.ts`
Expected: `isSlotParent` tests PASS, `getSlotName` tests FAIL

- [ ] **Step 5: Write failing tests for `getSlotName`**

Add to the same test file:

```ts
describe('getSlotName', () => {
  it('returns slot name for a valid slot child', () => {
    const store = createStore({
      entities: {
        parent: { id: 'parent', data: { type: 'cta', primary: {}, secondary: {} } },
      },
      relationships: { [ROOT_ID]: ['parent'] },
      slots: { parent: { primary: 'parent-primary', secondary: 'parent-secondary' } },
    })
    expect(getSlotName(store, 'parent', 'parent-primary')).toBe('primary')
    expect(getSlotName(store, 'parent', 'parent-secondary')).toBe('secondary')
  })

  it('returns undefined for non-slot child', () => {
    const store = createStore({
      entities: { parent: { id: 'parent' } },
      relationships: { [ROOT_ID]: ['parent'] },
    })
    expect(getSlotName(store, 'parent', 'nonexistent')).toBeUndefined()
  })
})
```

- [ ] **Step 6: Implement `getSlotName` in createStore.ts**

Add after the existing `getSlots` function (after line 29):

```ts
/** Reverse lookup: given a parent and child ID, return the slot name. */
export function getSlotName(store: NormalizedData, parentId: string, childId: string): string | undefined {
  const slotMap = store.slots?.[parentId]
  if (!slotMap) return undefined
  for (const [name, id] of Object.entries(slotMap)) {
    if (id === childId) return name
  }
  return undefined
}
```

- [ ] **Step 7: Run all tests to verify they pass**

Run: `pnpm test -- src/__tests__/cms-slot-utils.test.ts`
Expected: ALL PASS

- [ ] **Step 8: Commit**

```bash
git add src/pages/cms/cmsSchema.ts src/interactive-os/store/createStore.ts src/__tests__/cms-slot-utils.test.ts
git commit -m "feat(cms): add isSlotParent and getSlotName utilities"
```

---

### Task 2: `CmsSlotEditable` 컴포넌트

**Files:**
- Create: `src/pages/cms/CmsSlotEditable.tsx`
- Create: `src/__tests__/cms-slot-edit.test.tsx`

**Key difference from CmsInlineEditable:** CmsSlotEditable targets the **parent entity** for rename, reads from parent data, and uses the slotField name as the rename field. The rename is activated by `renameEntity.nodeId === slotChildId` (the slot child is the focus/rename target) but confirmRename dispatches `confirmRename(parentId, slotField, newValue)`.

- [ ] **Step 1: Write failing integration test for slot inline editing**

```tsx
// src/__tests__/cms-slot-edit.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PageCms from '../pages/cms/PageCms'
import { resetCmsData } from '../pages/cms/cmsState'

function getFocused(): string {
  return document.activeElement?.getAttribute('data-cms-id') ?? ''
}

describe('CMS slot child editing', () => {
  beforeEach(() => { resetCmsData() })

  it('Enter on slot parent drills into first slot child', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageCms />)

    // Navigate: hero → Enter → hero-badge → ArrowDown to hero-cta
    const hero = container.querySelector('[data-cms-id="hero"]') as HTMLElement
    hero.focus()
    await user.keyboard('{Enter}')
    // hero-cta is a slot parent — drilldown should reach its slot children
    const heroCta = container.querySelector('[data-cms-id="hero-cta"]') as HTMLElement
    act(() => { heroCta.click() })
    await user.keyboard('{Enter}')

    // Should be focused on first slot child (hero-cta-primary)
    expect(getFocused()).toBe('hero-cta-primary')
  })

  it('slot child is visually rendered (not sr-only)', async () => {
    const { container } = render(<PageCms />)
    const slotChild = container.querySelector('[data-cms-id="hero-cta-primary"]') as HTMLElement
    expect(slotChild).not.toBeNull()
    // Should not have sr-only class
    expect(slotChild.classList.contains('sr-only')).toBe(false)
    // Should have visible dimensions
    expect(slotChild.offsetWidth).toBeGreaterThan(0)
  })

  it('F2 on slot child starts inline editing', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageCms />)

    // Drill into hero-cta slot children
    const hero = container.querySelector('[data-cms-id="hero"]') as HTMLElement
    hero.focus()
    await user.keyboard('{Enter}')
    const heroCta = container.querySelector('[data-cms-id="hero-cta"]') as HTMLElement
    act(() => { heroCta.click() })
    await user.keyboard('{Enter}')
    expect(getFocused()).toBe('hero-cta-primary')

    // F2 to start editing
    await user.keyboard('{F2}')
    expect(container.querySelector('[data-renaming]')).not.toBeNull()
  })

  it('slot child inline edit → Enter confirms and updates parent entity text', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageCms />)

    // Navigate to hero-cta-primary
    const hero = container.querySelector('[data-cms-id="hero"]') as HTMLElement
    hero.focus()
    await user.keyboard('{Enter}')
    const heroCta = container.querySelector('[data-cms-id="hero-cta"]') as HTMLElement
    act(() => { heroCta.click() })
    await user.keyboard('{Enter}')
    await user.keyboard('{F2}')

    const editable = container.querySelector('[data-renaming]') as HTMLElement
    expect(editable).not.toBeNull()
    editable.textContent = 'New CTA Text'
    await user.keyboard('{Enter}')

    // Editing ended
    expect(container.querySelector('[data-renaming]')).toBeNull()
    // Text updated (parent entity was updated, slot re-derives)
    const slotEl = container.querySelector('[data-cms-id="hero-cta-primary"]') as HTMLElement
    expect(slotEl.textContent).toContain('New CTA Text')
  })

  it('Escape from slot child exits to slot parent level', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageCms />)

    // Navigate into slot children
    const hero = container.querySelector('[data-cms-id="hero"]') as HTMLElement
    hero.focus()
    await user.keyboard('{Enter}')
    const heroCta = container.querySelector('[data-cms-id="hero-cta"]') as HTMLElement
    act(() => { heroCta.click() })
    await user.keyboard('{Enter}')
    expect(getFocused()).toBe('hero-cta-primary')

    // Escape → back to slot parent
    await user.keyboard('{Escape}')
    expect(getFocused()).toBe('hero-cta')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- src/__tests__/cms-slot-edit.test.ts`
Expected: FAIL — slot children are sr-only, CmsSlotEditable doesn't exist

- [ ] **Step 3: Create `CmsSlotEditable` component**

```tsx
// src/pages/cms/CmsSlotEditable.tsx
import { useRef, useEffect, useCallback } from 'react'
import { RENAME_ID, renameCommands } from '@os/plugins/rename'
import type { NormalizedData } from '@os/store/types'
import type { Command } from '@os/engine/types'
import { localized } from './cmsTypes'
import type { Locale, LocaleMap } from './cmsTypes'

interface CmsSlotEditableProps {
  /** The slot child entity ID — used for rename activation detection */
  slotChildId: string
  /** The parent entity ID — rename target */
  parentId: string
  /** The field name on the parent entity (e.g., 'primary', 'title') */
  slotField: string
  /** Whether this field is a localeMap (true) or plain string (false) */
  isLocaleMap: boolean
  /** The parent entity's current data */
  parentData: Record<string, unknown>
  locale: Locale
  dispatch: (cmd: Command) => void
  store: NormalizedData
}

export function CmsSlotEditable({
  slotChildId, parentId, slotField, isLocaleMap, parentData, locale, dispatch, store,
}: CmsSlotEditableProps) {
  const editRef = useRef<HTMLSpanElement>(null)
  const originalValueRef = useRef('')
  const composingRef = useRef(false)
  const committedRef = useRef(false)

  const renameEntity = store.entities[RENAME_ID]
  const isRenaming = renameEntity?.active === true
    && (renameEntity as Record<string, unknown>).nodeId === slotChildId

  useEffect(() => {
    if (isRenaming && editRef.current) {
      committedRef.current = false
      composingRef.current = false
      const el = editRef.current
      originalValueRef.current = el.textContent ?? ''
      const range = document.createRange()
      range.selectNodeContents(el)
      range.collapse(false)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
      el.focus()
    }
  }, [isRenaming])

  const restoreFocus = useCallback(() => {
    requestAnimationFrame(() => {
      const nodeEl = document.querySelector<HTMLElement>(`[data-cms-id="${slotChildId}"]`)
      nodeEl?.focus()
    })
  }, [slotChildId])

  // Read current value from PARENT data (source of truth)
  const rawValue = parentData[slotField]
  const displayText = isLocaleMap
    ? localized(rawValue as string | LocaleMap, locale).text
    : (rawValue as string) ?? ''

  if (!isRenaming) {
    return <>{displayText}</>
  }

  const confirm = (shouldRestoreFocus: boolean) => {
    if (committedRef.current) return
    committedRef.current = true
    const newText = editRef.current?.textContent?.trim() ?? ''
    if (newText === '' || newText === originalValueRef.current) {
      if (editRef.current) editRef.current.textContent = originalValueRef.current
      dispatch(renameCommands.cancelRename())
    } else {
      // Target the PARENT entity with the slot field name
      const newValue = isLocaleMap
        ? { ...(rawValue as Record<string, string>), [locale]: newText }
        : newText
      dispatch(renameCommands.confirmRename(parentId, slotField, newValue))
    }
    if (shouldRestoreFocus) restoreFocus()
  }

  const cancel = () => {
    if (committedRef.current) return
    committedRef.current = true
    if (editRef.current) editRef.current.textContent = originalValueRef.current
    dispatch(renameCommands.cancelRename())
    restoreFocus()
  }

  return (
    <span
      ref={editRef}
      contentEditable
      suppressContentEditableWarning
      data-renaming=""
      onCompositionStart={() => { composingRef.current = true }}
      onCompositionEnd={() => { composingRef.current = false }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !composingRef.current) { e.preventDefault(); confirm(true) }
        else if (e.key === 'Escape') { e.preventDefault(); cancel() }
        else if (e.key === 'Tab') { e.preventDefault(); confirm(true) }
      }}
      onBlur={() => confirm(false)}
    >
      {displayText}
    </span>
  )
}
```

- [ ] **Step 4: Commit CmsSlotEditable (tests still fail — CmsCanvas not yet updated)**

```bash
git add src/pages/cms/CmsSlotEditable.tsx src/__tests__/cms-slot-edit.test.tsx
git commit -m "feat(cms): add CmsSlotEditable component for slot child inline editing"
```

---

### Task 3: `slotRender` on `NodePresentationDesc` for 6 node types

**Files:**
- Modify: `src/pages/cms/cmsNodePresentation.tsx`

- [ ] **Step 1: Add `slotRender` to the `NodePresentationDesc` interface**

In `cmsNodePresentation.tsx`, modify the interface (around line 28):

```ts
export interface NodePresentationDesc {
  tag?: NodeTag | ((data: Record<string, string>) => NodeTag)
  className?: string | ((data: Record<string, string>) => string)
  childrenContainerClassName?: string | ((data: Record<string, string>) => string | undefined)
  render?: (data: Record<string, unknown>, locale: Locale) => ReactNode
  /** Per-slot visual render for slot parents. Returns [tag, className, content]. */
  slotRender?: (slotName: string, data: Record<string, unknown>, locale: Locale) => [NodeTag, string, ReactNode] | null
}
```

The tuple `[tag, className, content]` lets CmsCanvas wrap the slot child with the correct HTML element, styling, and any decorative content (icons, arrows) that surrounds the editable text.

- [ ] **Step 2: Update `cta` — container render + slotRender**

Replace the existing `defineNodePresentation('cta', ...)` with:

```tsx
defineNodePresentation('cta', {
  className: `${s.cmsHeroActions} flex-row items-center`,
  render: () => null,
  slotRender: (slot, data, locale) => {
    if (slot === 'primary') return [
      'button',
      `${s.cmsHeroCta} inline-flex items-center border-none cursor-pointer`,
      <ArrowRight size={16} />,
    ]
    if (slot === 'secondary') return [
      'button',
      `${s.cmsHeroCtaSecondary} inline-flex items-center cursor-pointer`,
      <ChevronRight size={16} />,
    ]
    return null
  },
})
```

- [ ] **Step 3: Update `value-item` — container render + slotRender**

Replace the existing `defineNodePresentation('value-item', ...)`:

```tsx
defineNodePresentation('value-item', {
  tag: 'div',
  className: s.cmsValueItem,
  render: (data) => (
    <div className="hidden"><CmsIcon name={data.icon as string} size={24} /></div>
  ),
  slotRender: (slot) => {
    if (slot === 'title') return ['h3', s.cmsValueItemTitle, null]
    if (slot === 'desc') return ['p', s.cmsValueItemDesc, null]
    return null
  },
})
```

- [ ] **Step 4: Update `quote` — container render + slotRender**

Replace the existing `defineNodePresentation('quote', ...)`:

```tsx
defineNodePresentation('quote', {
  tag: 'div',
  className: `${s.cmsQuote} w-full text-center`,
  render: () => (
    <span className={`${s.cmsQuoteMark} block`}>"</span>
  ),
  slotRender: (slot) => {
    if (slot === 'text') return ['p', s.cmsQuoteText, null]
    if (slot === 'attribution') return ['cite', s.cmsQuoteAttribution, null]
    return null
  },
})
```

- [ ] **Step 5: Update `article` — container render + slotRender**

Replace the existing `defineNodePresentation('article', ...)`:

```tsx
defineNodePresentation('article', {
  tag: 'div',
  className: s.cmsArticle,
  render: (data) => {
    const articleImage = data.image as string
    return articleImage
      ? <img src={articleImage} alt="" className={`${s.cmsArticleImage} object-cover shrink-0`} />
      : <div className={`${s.cmsArticleIcon} flex-row items-center justify-center shrink-0`}><CmsIcon name={data.icon as string} size={20} /></div>
  },
  slotRender: (slot) => {
    if (slot === 'title') return ['h3', s.cmsArticleTitle, null]
    if (slot === 'category') return ['span', s.cmsArticleMeta, null]
    return null
  },
})
```

- [ ] **Step 6: Update `showcase-item` — container render + slotRender**

Replace the existing `defineNodePresentation('showcase-item', ...)`:

```tsx
defineNodePresentation('showcase-item', {
  tag: 'div',
  className: s.cmsShowcaseItem,
  render: (data) => (
    <div className={`${s.cmsShowcaseItemIcon} inline-flex items-center justify-center`}><CmsIcon name={data.icon as string} size={20} /></div>
  ),
  slotRender: (slot) => {
    if (slot === 'label') return ['span', s.cmsShowcaseItemLabel, null]
    if (slot === 'desc') return ['span', s.cmsShowcaseItemDesc, null]
    return null
  },
})
```

- [ ] **Step 7: Update `stat-card` — container render + slotRender**

Replace the existing `defineNodePresentation('stat-card', ...)`:

```tsx
defineNodePresentation('stat-card', {
  tag: 'div',
  className: s.cmsStatCard,
  render: () => null,
  slotRender: (slot) => {
    if (slot === 'value') return ['span', s.cmsStatCardValue, null]
    if (slot === 'label') return ['span', s.cmsStatCardLabel, null]
    if (slot === 'desc') return ['span', s.cmsStatCardDesc, null]
    return null
  },
})
```

- [ ] **Step 8: Commit slotRender definitions**

```bash
git add src/pages/cms/cmsNodePresentation.tsx
git commit -m "feat(cms): add slotRender to 6 multi-field node types"
```

---

### Task 4: CmsCanvas — slot children 시각적 렌더링

**Files:**
- Modify: `src/pages/cms/CmsCanvas.tsx`
- Modify: `src/pages/cms/cmsRenderers.ts` (add `getSlotRender` re-export)

This is the core change: replace sr-only slot rendering with visual slotRender-based rendering.

- [ ] **Step 1: Add `getSlotRender` to cmsRenderers.ts**

Add to `src/pages/cms/cmsRenderers.ts`:

```ts
export function getSlotRender(type: string): NodePresentationDesc['slotRender'] {
  return nodeRegistry.get(type)?.slotRender
}
```

Also add the `slotRender` type to the import:

```ts
import { nodeRegistry, type NodePresentationDesc } from './cmsNodePresentation'
```

(The import already exists; just ensure `NodePresentationDesc` is imported for the return type.)

- [ ] **Step 2: Update CmsCanvas imports**

In `CmsCanvas.tsx`, add the new imports:

```ts
import { getSlotName } from '@os/store/createStore'
import { isSlotParent } from './cmsSchema'
import { getSlotRender } from './cmsRenderers'
import { CmsSlotEditable } from './CmsSlotEditable'
import { getEditableFields } from './cmsSchema'
```

Remove `getInlineEditableFields` from the existing cmsRenderers import since we need `getEditableFields` from cmsSchema directly. The existing import line:

```ts
import { getNodeClassName, getChildrenContainerClassName, getNodeTag, HEADER_TYPES, getInlineEditableFields } from './cmsRenderers'
```

Keep `getInlineEditableFields` in that import (it's still used in the F2 handler). Add `getSlotRender` to it:

```ts
import { getNodeClassName, getChildrenContainerClassName, getNodeTag, HEADER_TYPES, getInlineEditableFields, getSlotRender } from './cmsRenderers'
```

- [ ] **Step 3: Replace sr-only slot rendering with visual slotRender**

In `CmsCanvas.tsx`, find the generic `renderNode` fallback (around lines 417-454). Replace the slot children block:

**Current code (lines 437-452):**
```tsx
{slotKids.length > 0 && slotKids.map(childId => {
  const slotProps = aria.getNodeProps(childId)
  const { onClick: _sc, onKeyDown: skd, onFocus: sf, tabIndex: sti, role: _sr, ...slotRest } = slotProps as Record<string, unknown>
  void _sc; void _sr
  return (
    <div
      key={childId}
      {...(slotRest as React.HTMLAttributes<HTMLDivElement>)}
      tabIndex={sti as number}
      onKeyDown={skd as React.KeyboardEventHandler}
      onFocus={sf as React.FocusEventHandler}
      onClick={(e: React.MouseEvent) => handleNodeClick(childId, e)}
      className="sr-only"
    />
  )
})}
```

**New code:**
```tsx
{slotKids.length > 0 && slotKids.map(childId => {
  const slotProps = aria.getNodeProps(childId)
  const { onClick: _sc, onKeyDown: skd, onFocus: sf, tabIndex: sti, role: _sr, ...slotRest } = slotProps as Record<string, unknown>
  void _sc; void _sr

  const slotFieldName = getSlotName(currentStore, nodeId, childId)
  const slotRenderFn = getSlotRender(d.type as string)
  const slotDef = slotFieldName && slotRenderFn ? slotRenderFn(slotFieldName, d, locale) : null

  if (!slotDef) {
    // Fallback: sr-only for unregistered slots
    return (
      <div
        key={childId}
        {...(slotRest as React.HTMLAttributes<HTMLDivElement>)}
        tabIndex={sti as number}
        onKeyDown={skd as React.KeyboardEventHandler}
        onFocus={sf as React.FocusEventHandler}
        onClick={(e: React.MouseEvent) => handleNodeClick(childId, e)}
        className="sr-only"
      />
    )
  }

  const [SlotTag, slotClassName, slotDecor] = slotDef
  const field = getEditableFields(d)
    .find(f => f.field === slotFieldName && !(['icon', 'image', 'url'] as string[]).includes(f.fieldType))

  return (
    <SlotTag
      key={childId}
      {...(slotRest as React.HTMLAttributes<HTMLElement>)}
      tabIndex={sti as number}
      onKeyDown={skd as React.KeyboardEventHandler}
      onFocus={sf as React.FocusEventHandler}
      onClick={(e: React.MouseEvent) => handleNodeClick(childId, e)}
      className={slotClassName || undefined}
    >
      {field ? (
        <CmsSlotEditable
          slotChildId={childId}
          parentId={nodeId}
          slotField={slotFieldName}
          isLocaleMap={field.isLocaleMap}
          parentData={d}
          locale={locale}
          dispatch={aria.dispatch}
          store={currentStore}
        />
      ) : (
        (d[slotFieldName] as string) ?? ''
      )}
      {slotDecor}
    </SlotTag>
  )
})}
```

- [ ] **Step 4: Also update the parent `CmsInlineEditable` rendering for slot parents**

Slot parents should NOT render `CmsInlineEditable` for their own content (since the slots handle individual fields). The `NodeContent` render for slot parents now just returns the container wrapper (icons, decorative elements).

Find the line `<CmsInlineEditable nodeId={nodeId} ...>` inside the generic renderNode (around line 429-435). The `render` function for slot parents now returns `null` or just decorative content — `CmsInlineEditable` would show nothing meaningful. But `CmsInlineEditable` checks for `primaryField` and if none found, renders `NodeContent`. Since the slot parent's `render` returns decorative content, this should work.

Actually, `CmsInlineEditable` calls `getEditableFields(data)` and `primaryField = fields.find(f => f.fieldType !== 'icon')`. For `cta`, that returns `primary` and `secondary` — it picks `primary`. During non-rename mode it renders `NodeContent` which calls `render()`. For the updated `cta`, `render()` returns `null`, so it renders nothing. The slot children handle the visual content.

But we have a subtlety: when not renaming, `CmsInlineEditable` renders `<NodeContent data={d} locale={locale} />`. For `cta` this now returns `null`. For `value-item` this returns the icon. For `article` this returns the image/icon. Good — these are decorative elements that belong to the parent wrapper.

No change needed to the `CmsInlineEditable` call itself. ✓

- [ ] **Step 5: Run integration tests**

Run: `pnpm test -- src/__tests__/cms-slot-edit.test.ts`
Expected: The "slot child is visually rendered" and "Enter drills into first slot child" tests should now pass. The editing tests may still fail if the slot F2 handler doesn't recognize slot children.

- [ ] **Step 6: Update F2 handler to work with slot children**

The existing F2 handler in `CmsCanvas.tsx`:

```ts
F2: key(['rename:start'], (ctx) => {
  const entity = ctx.getEntity(ctx.focused)
  const data = (entity?.data ?? {}) as Record<string, unknown>
  const inlineFields = getInlineEditableFields(data)
  if (inlineFields.length === 0) return
  return renameCommands.startRename(ctx.focused)
})
```

Slot child entities (created by `expandEntitySlots`) have type `'text'` with a `value` localeMap field — `getInlineEditableFields` returns 1 field. So F2 already works for slot children. ✓

But the Enter handler for leaf nodes:
```ts
if (inlineFields.length !== 1) return
```

Slot children have exactly 1 inline field, so Enter also starts rename. ✓

No changes needed for F2/Enter on slot children.

- [ ] **Step 7: Run full test suite**

Run: `pnpm test -- src/__tests__/cms-slot-edit.test.ts src/__tests__/cms-inline-edit.test.tsx`
Expected: All tests pass

- [ ] **Step 8: Commit visual slot rendering**

```bash
git add src/pages/cms/CmsCanvas.tsx src/pages/cms/cmsRenderers.ts
git commit -m "feat(cms): render slot children visually with slotRender (replaces sr-only)"
```

---

### Task 5: Auto-drill 클릭 + HEADER_TYPES 정리

**Files:**
- Modify: `src/pages/cms/CmsCanvas.tsx` (handleNodeClick)
- Modify: `src/pages/cms/cmsRenderers.ts` (HEADER_TYPES)

When a slot parent is clicked, auto-drill to its first slot child instead of selecting the parent.

- [ ] **Step 1: Update `handleNodeClick` for auto-drill**

In `CmsCanvas.tsx`, replace the `handleNodeClick` callback (around line 247):

```tsx
const handleNodeClick = useCallback((nodeId: string, e: React.MouseEvent) => {
  e.stopPropagation()
  const s = aria.getStore()

  // Auto-drill: slot parents skip directly to first slot child
  const entity = s.entities[nodeId]
  const data = (entity?.data ?? {}) as Record<string, unknown>
  if (isSlotParent(data)) {
    const slotKids = getSlotChildren(s, nodeId)
    if (slotKids.length > 0) {
      const parentId = getParent(s, nodeId) ?? ROOT_ID
      spatialNav.clearCursorsAtDepth(parentId)
      aria.dispatch(createBatchCommand([
        spatialCommands.enterChild(nodeId),
        focusCommands.setFocus(slotKids[0]),
      ]))
      return
    }
  }

  const parentId = getParent(s, nodeId) ?? ROOT_ID
  spatialNav.clearCursorsAtDepth(parentId)
  const cmd = spatialClickNavigate(s, nodeId)
  if (cmd) aria.dispatch(cmd)
}, [aria, spatialNav])
```

Add `getSlotChildren` to the imports from `@os/store/createStore` if not already there (it's already imported at line 13).

- [ ] **Step 2: Remove `cta` from HEADER_TYPES**

In `cmsRenderers.ts`, `HEADER_TYPES` determines which children render before the grid container in sections. `cta` was in `HEADER_TYPES` because it rendered as a header-level action block. Now that `cta` is a slot parent with individually rendered slot children, it should remain in HEADER_TYPES since its visual position hasn't changed — it still appears before grids in sections like hero and cta.

No change needed. ✓

- [ ] **Step 3: Write integration test for auto-drill click**

Add to `src/__tests__/cms-slot-edit.test.tsx`:

```tsx
it('clicking slot parent auto-drills to first slot child', async () => {
  const user = userEvent.setup()
  const { container } = render(<PageCms />)

  // First drill into hero section
  const hero = container.querySelector('[data-cms-id="hero"]') as HTMLElement
  hero.focus()
  await user.keyboard('{Enter}')

  // Click on hero-cta (slot parent)
  const heroCta = container.querySelector('[data-cms-id="hero-cta"]') as HTMLElement
  await user.click(heroCta)

  // Should auto-drill to first slot child
  expect(getFocused()).toBe('hero-cta-primary')
})

it('clicking directly on a slot child selects it', async () => {
  const user = userEvent.setup()
  const { container } = render(<PageCms />)

  // First drill into hero section
  const hero = container.querySelector('[data-cms-id="hero"]') as HTMLElement
  hero.focus()
  await user.keyboard('{Enter}')

  // Drill into hero-cta
  const heroCta = container.querySelector('[data-cms-id="hero-cta"]') as HTMLElement
  await user.click(heroCta)

  // Now click on secondary slot child specifically
  const secondary = container.querySelector('[data-cms-id="hero-cta-secondary"]') as HTMLElement
  await user.click(secondary)
  expect(getFocused()).toBe('hero-cta-secondary')
})
```

- [ ] **Step 4: Run all tests**

Run: `pnpm test -- src/__tests__/cms-slot-edit.test.tsx`
Expected: ALL PASS

- [ ] **Step 5: Commit auto-drill**

```bash
git add src/pages/cms/CmsCanvas.tsx src/__tests__/cms-slot-edit.test.tsx
git commit -m "feat(cms): auto-drill click on slot parents to first slot child"
```

---

### Task 6: Existing test regression check + `quote`/`article` 구조 정합성

**Files:**
- Modify: `src/pages/cms/cmsNodePresentation.tsx` (CSS structure adjustments if needed)
- No new files

The slotRender change splits the parent's render into container + individual slots. This changes the DOM structure. For example, `article` previously rendered as:

```html
<div class="cmsArticle">
  <div class="cmsArticleContent flex-row">
    <img ... />
    <div class="cmsArticleBody flex-col">
      <h3>Title</h3>
      <span>Category · 5 min</span>
    </div>
  </div>
</div>
```

Now with slots, the parent renders decorative content (image) and slots render inside the parent element directly. The DOM structure changes slightly — the nested `cmsArticleContent` and `cmsArticleBody` wrappers from the old `render` need to be preserved by the parent container.

- [ ] **Step 1: Update `article` render to provide the container wrapper**

The parent `render` should return the structural wrapper that contains both the decorative content and the slot children:

```tsx
defineNodePresentation('article', {
  tag: 'div',
  className: `${s.cmsArticle}`,
  render: (data) => {
    const articleImage = data.image as string
    return articleImage
      ? <img src={articleImage} alt="" className={`${s.cmsArticleImage} object-cover shrink-0`} />
      : <div className={`${s.cmsArticleIcon} flex-row items-center justify-center shrink-0`}><CmsIcon name={data.icon as string} size={20} /></div>
  },
  slotRender: (slot) => {
    if (slot === 'title') return ['h3', s.cmsArticleTitle, null]
    if (slot === 'category') return ['span', s.cmsArticleMeta, null]
    return null
  },
})
```

The issue: previously the `article` had wrapper divs `cmsArticleContent` and `cmsArticleBody` inside its render function. Now the parent renders the image and the slots render title/category directly as siblings. We need the parent's className or CmsCanvas to provide the flex-row and flex-col structure.

Update the `article` className to include the content layout:

```tsx
defineNodePresentation('article', {
  tag: 'div',
  className: `${s.cmsArticle} ${s.cmsArticleContent} flex-row items-center`,
  render: (data) => {
    const articleImage = data.image as string
    return articleImage
      ? <img src={articleImage} alt="" className={`${s.cmsArticleImage} object-cover shrink-0`} />
      : <div className={`${s.cmsArticleIcon} flex-row items-center justify-center shrink-0`}><CmsIcon name={data.icon as string} size={20} /></div>
  },
  slotRender: (slot) => {
    if (slot === 'title') return ['h3', s.cmsArticleTitle, null]
    if (slot === 'category') return ['span', s.cmsArticleMeta, null]
    return null
  },
})
```

- [ ] **Step 2: Update `value-item` container structure**

Similarly, `value-item` had a `cmsValueItemContent flex-col` wrapper. Apply to the parent:

```tsx
defineNodePresentation('value-item', {
  tag: 'div',
  className: `${s.cmsValueItem} ${s.cmsValueItemContent} flex-col`,
  render: (data) => (
    <div className="hidden"><CmsIcon name={data.icon as string} size={24} /></div>
  ),
  slotRender: (slot) => {
    if (slot === 'title') return ['h3', s.cmsValueItemTitle, null]
    if (slot === 'desc') return ['p', s.cmsValueItemDesc, null]
    return null
  },
})
```

- [ ] **Step 3: Update `showcase-item` container structure**

`showcase-item` had `cmsShowcaseItemContent flex-col`:

```tsx
defineNodePresentation('showcase-item', {
  tag: 'div',
  className: `${s.cmsShowcaseItem} ${s.cmsShowcaseItemContent} flex-col`,
  render: (data) => (
    <div className={`${s.cmsShowcaseItemIcon} inline-flex items-center justify-center`}><CmsIcon name={data.icon as string} size={20} /></div>
  ),
  slotRender: (slot) => {
    if (slot === 'label') return ['span', s.cmsShowcaseItemLabel, null]
    if (slot === 'desc') return ['span', s.cmsShowcaseItemDesc, null]
    return null
  },
})
```

- [ ] **Step 4: Update `stat-card` container structure**

`stat-card` had `cmsStatCardContent flex-col`:

```tsx
defineNodePresentation('stat-card', {
  tag: 'div',
  className: `${s.cmsStatCard} ${s.cmsStatCardContent} flex-col`,
  render: () => null,
  slotRender: (slot) => {
    if (slot === 'value') return ['span', s.cmsStatCardValue, null]
    if (slot === 'label') return ['span', s.cmsStatCardLabel, null]
    if (slot === 'desc') return ['span', s.cmsStatCardDesc, null]
    return null
  },
})
```

- [ ] **Step 5: Update `quote` container structure**

`quote` had a `blockquote` wrapper inside. Move it to `tag`:

```tsx
defineNodePresentation('quote', {
  tag: 'blockquote',
  className: `${s.cmsQuote} ${s.cmsQuoteContent} w-full text-center border-none`,
  render: () => (
    <span className={`${s.cmsQuoteMark} block`}>"</span>
  ),
  slotRender: (slot) => {
    if (slot === 'text') return ['p', s.cmsQuoteText, null]
    if (slot === 'attribution') return ['cite', s.cmsQuoteAttribution, null]
    return null
  },
})
```

- [ ] **Step 6: Run existing tests**

Run: `pnpm test`
Expected: All existing tests still pass, no regressions

- [ ] **Step 7: Visual check in browser**

Open `http://localhost:5173` and verify:
1. CTA buttons render correctly (primary + secondary visible)
2. Value items show title + description
3. Quotes show text + attribution
4. Articles show title + category
5. Showcase items show label + description
6. Stat cards show value + label + description
7. All layouts look the same as before the change

- [ ] **Step 8: Commit structure adjustments**

```bash
git add src/pages/cms/cmsNodePresentation.tsx
git commit -m "fix(cms): preserve container CSS structure for slotRender node types"
```

---

### Task 7: `getEditableFields` re-export + cmsRenderers 정리

**Files:**
- Modify: `src/pages/cms/cmsRenderers.ts`

- [ ] **Step 1: Add `getSlotRender` and `isSlotParent` re-exports**

Ensure `cmsRenderers.ts` re-exports all CMS presentation utilities needed by CmsCanvas. Add:

```ts
export { getEditableFields, getInlineEditableFields, isSlotParent } from './cmsSchema'
```

Update the existing re-export line. The current line is:
```ts
export { getEditableFields, getInlineEditableFields } from './cmsSchema'
```

Change to:
```ts
export { getEditableFields, getInlineEditableFields, isSlotParent } from './cmsSchema'
```

- [ ] **Step 2: Verify CmsCanvas imports use cmsRenderers (single import point)**

In CmsCanvas.tsx, update imports to prefer cmsRenderers:

```ts
import { getNodeClassName, getChildrenContainerClassName, getNodeTag, HEADER_TYPES, getInlineEditableFields, getSlotRender, getEditableFields, isSlotParent } from './cmsRenderers'
```

Remove separate `import { isSlotParent } from './cmsSchema'` and `import { getEditableFields } from './cmsSchema'` if they were added separately.

- [ ] **Step 3: Run full test suite**

Run: `pnpm test`
Expected: ALL PASS

- [ ] **Step 4: Run typecheck**

Run: `pnpm typecheck`
Expected: No type errors

- [ ] **Step 5: Commit cleanup**

```bash
git add src/pages/cms/cmsRenderers.ts src/pages/cms/CmsCanvas.tsx
git commit -m "refactor(cms): consolidate slot-related re-exports in cmsRenderers"
```

---

### Task 8: 최종 통합 테스트 보완

**Files:**
- Modify: `src/__tests__/cms-slot-edit.test.tsx`

- [ ] **Step 1: Add test for value-item slot editing**

```tsx
it('value-item slots are selectable and editable', async () => {
  const user = userEvent.setup()
  const { container } = render(<PageCms />)

  // manifesto section → Enter
  const manifesto = container.querySelector('[data-cms-id="manifesto"]') as HTMLElement
  manifesto.focus()
  await user.keyboard('{Enter}')

  // manifesto-keyboard is a value-item (slot parent)
  // Click on it → auto-drill to first slot child (title)
  const valueItem = container.querySelector('[data-cms-id="manifesto-keyboard"]') as HTMLElement
  await user.click(valueItem)
  expect(getFocused()).toBe('manifesto-keyboard-title')

  // ArrowDown → desc slot
  await user.keyboard('{ArrowDown}')
  expect(getFocused()).toBe('manifesto-keyboard-desc')
})
```

- [ ] **Step 2: Add test for quote slot editing**

```tsx
it('quote slots are selectable and editable', async () => {
  const user = userEvent.setup()
  const { container } = render(<PageCms />)

  // testimonial section → Enter
  const testimonial = container.querySelector('[data-cms-id="testimonial"]') as HTMLElement
  testimonial.focus()
  await user.keyboard('{Enter}')

  // testimonial-quote is a quote (slot parent)
  const quote = container.querySelector('[data-cms-id="testimonial-quote"]') as HTMLElement
  await user.click(quote)
  expect(getFocused()).toBe('testimonial-quote-text')

  // Navigate to attribution
  await user.keyboard('{ArrowDown}')
  expect(getFocused()).toBe('testimonial-quote-attribution')
})
```

- [ ] **Step 3: Add test for stat-card 3-slot navigation**

```tsx
it('stat-card three slots are navigable', async () => {
  const user = userEvent.setup()
  const { container } = render(<PageCms />)

  // features section → Enter
  const features = container.querySelector('[data-cms-id="features"]') as HTMLElement
  features.focus()
  await user.keyboard('{Enter}')

  // stat-tests is a stat-card (slot parent with 3 slots: value, label, desc)
  const statCard = container.querySelector('[data-cms-id="stat-tests"]') as HTMLElement
  await user.click(statCard)
  expect(getFocused()).toBe('stat-tests-value')

  await user.keyboard('{ArrowDown}')
  expect(getFocused()).toBe('stat-tests-label')

  await user.keyboard('{ArrowDown}')
  expect(getFocused()).toBe('stat-tests-desc')
})
```

- [ ] **Step 4: Run full test suite**

Run: `pnpm test`
Expected: ALL PASS

- [ ] **Step 5: Commit integration tests**

```bash
git add src/__tests__/cms-slot-edit.test.tsx
git commit -m "test(cms): integration tests for slot child selection and navigation"
```
