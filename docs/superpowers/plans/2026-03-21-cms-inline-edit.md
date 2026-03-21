# CMS Inline Edit + Detail Panel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CMS 노드의 텍스트 콘텐츠를 캔버스 인라인(Enter) + 우측 Detail Panel Form 두 경로로 편집 가능하게 한다.

**Architecture:** rename 플러그인을 CMS에 연결하여 undo 일관성을 유지한다. 캔버스에서는 리프 노드 Enter → `Aria.Editable` contenteditable, 우측 패널에서는 `confirmRename` dispatch로 Form 편집. `Aria.Editable`에 placeholder prop을 추가하여 빈 locale 표시를 지원한다.

**Tech Stack:** React, interactive-os (useAriaZone, rename plugin, Aria.Editable), CSS Grid

**PRD:** `docs/superpowers/specs/2026-03-21-cms-inline-edit-prd.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/interactive-os/components/aria.tsx` | `AriaEditable`에 `placeholder` prop 추가 |
| Modify | `src/pages/cms/CmsLayout.tsx` | rename 플러그인 등록 + CmsDetailPanel 배치 |
| Modify | `src/pages/cms/CmsCanvas.tsx` | cmsKeyMap에 Enter 분기 추가 |
| Modify | `src/pages/cms/cms-renderers.tsx` | NodeContent 내 텍스트를 Aria.Editable로 래핑 + 필드 매핑 export |
| Create | `src/pages/cms/CmsDetailPanel.tsx` | 우측 Form 패널 컴포넌트 |
| Modify | `src/styles/cms.css` | 3열 레이아웃 + detail panel + placeholder 스타일 |
| Create | `src/interactive-os/__tests__/editable-placeholder.test.tsx` | Aria.Editable placeholder 테스트 |
| Create | `src/__tests__/cms-inline-edit.test.tsx` | CMS 인라인 편집 통합 테스트 |
| Create | `src/__tests__/cms-detail-panel.test.tsx` | CMS Detail Panel 통합 테스트 |

---

## Task 1: Aria.Editable placeholder prop

`Aria.Editable`에 `placeholder` prop을 추가한다. `data-placeholder` 속성 + CSS `:empty::before`로 표시.

**Files:**
- Modify: `src/interactive-os/components/aria.tsx:130-225` (AriaEditable)
- Create: `src/interactive-os/__tests__/editable-placeholder.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/interactive-os/__tests__/editable-placeholder.test.tsx
import { describe, it, expect } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import { useState } from 'react'
import { Aria } from '../components/aria'
import { listbox } from '../behaviors/listbox'
import { core } from '../plugins/core'
import { rename, renameCommands } from '../plugins/rename'
import { createStore } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'
import type { NodeState } from '../behaviors/types'

const plugins = [core(), rename()]

function TestListBox({ initialData, keyMap }: {
  initialData: NormalizedData
  keyMap?: Record<string, (ctx: import('../behaviors/types').BehaviorContext) => import('../core/types').Command | void>
}) {
  const [data, setData] = useState(initialData)
  return (
    <Aria behavior={listbox} data={data} plugins={plugins} onChange={setData} keyMap={keyMap}>
      <Aria.Item render={(node: Record<string, unknown>, _state: NodeState) => (
        <div data-testid={`item-${node.id}`}>
          <Aria.Editable field="label" placeholder="Enter text...">
            <span>{(node.data as Record<string, unknown>)?.label as string}</span>
          </Aria.Editable>
        </div>
      )} />
    </Aria>
  )
}

describe('Aria.Editable placeholder', () => {
  it('renders data-placeholder attribute when placeholder prop is provided', () => {
    const store = createStore({
      entities: { a: { id: 'a', data: { label: 'Alpha' } } },
      relationships: { [ROOT_ID]: ['a'] },
    })
    const { container } = render(<TestListBox initialData={store} />)
    const wrapper = container.querySelector('[data-node-id="a"] span')
    expect(wrapper?.getAttribute('data-placeholder')).toBe('Enter text...')
  })

  it('does not render data-placeholder when prop is omitted', () => {
    const store = createStore({
      entities: { a: { id: 'a', data: { label: 'Alpha' } } },
      relationships: { [ROOT_ID]: ['a'] },
    })
    // Render without placeholder
    function NoPlaceholder() {
      const [data, setData] = useState(store)
      return (
        <Aria behavior={listbox} data={data} plugins={plugins} onChange={setData}>
          <Aria.Item render={(node: Record<string, unknown>) => (
            <Aria.Editable field="label">
              <span>{(node.data as Record<string, unknown>)?.label as string}</span>
            </Aria.Editable>
          )} />
        </Aria>
      )
    }
    const { container } = render(<NoPlaceholder />)
    const wrapper = container.querySelector('[data-node-id="a"] span')
    expect(wrapper?.hasAttribute('data-placeholder')).toBe(false)
  })

  it('data-placeholder persists on contenteditable span during rename', () => {
    const store = createStore({
      entities: { a: { id: 'a', data: { label: 'Alpha' } } },
      relationships: { [ROOT_ID]: ['a'] },
    })
    const keyMap = {
      F2: (ctx: import('../behaviors/types').BehaviorContext) => renameCommands.startRename(ctx.focused),
    }
    const { container } = render(<TestListBox initialData={store} keyMap={keyMap} />)
    const node = container.querySelector('[data-node-id="a"]')!
    act(() => { fireEvent.keyDown(node, { key: 'F2' }) })

    const editable = container.querySelector('[contenteditable]')
    expect(editable?.getAttribute('data-placeholder')).toBe('Enter text...')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/interactive-os/__tests__/editable-placeholder.test.tsx`
Expected: FAIL — `data-placeholder` attribute not rendered (AriaEditable doesn't accept placeholder prop yet)

- [ ] **Step 3: Implement placeholder prop in AriaEditable**

In `src/interactive-os/components/aria.tsx`, modify `AriaEditable`:

1. Add `placeholder` to the props interface: `{ field: string; placeholder?: string; children: React.ReactNode }`
2. In the non-renaming branch, add `data-placeholder={placeholder}` to the outer `<span>`
3. In the renaming branch, add `data-placeholder={placeholder}` to the contenteditable `<span>`

```tsx
// Change function signature:
function AriaEditable({ field, placeholder, children }: { field: string; placeholder?: string; children: React.ReactNode }) {

// In non-renaming return (line ~167-176):
  if (!renaming) {
    return (
      <span
        data-placeholder={placeholder}
        onDoubleClick={(e) => { /* existing code */ }}
      >
        {children}
      </span>
    )
  }

// In renaming return (line ~200-224):
  return (
    <span
      ref={editRef}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      // ... rest of existing props
    >
      {children}
    </span>
  )
```

- [ ] **Step 4: Add placeholder CSS**

In `src/styles/cms.css`, add at the end:

```css
/* Editable placeholder — shown when contenteditable is empty */
[data-placeholder]:empty::before {
  content: attr(data-placeholder);
  opacity: 0.4;
  pointer-events: none;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/interactive-os/__tests__/editable-placeholder.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 6: Run existing rename tests to verify no regression**

Run: `npx vitest run src/interactive-os/__tests__/rename-ui.test.tsx`
Expected: All tests PASS

- [ ] **Step 7: Commit**

```bash
git add src/interactive-os/components/aria.tsx src/interactive-os/__tests__/editable-placeholder.test.tsx src/styles/cms.css
git commit -m "feat(editable): Aria.Editable placeholder prop — data-placeholder + CSS :empty::before"
```

---

## Task 2: rename 플러그인 CMS 등록 + Enter keyMap 분기

CmsLayout에 rename 플러그인을 추가하고, CmsCanvas에 Enter 키 분기를 구현한다.

**Files:**
- Modify: `src/pages/cms/CmsLayout.tsx:22` (sharedPlugins)
- Modify: `src/pages/cms/CmsCanvas.tsx:28-45` (cmsKeyMap)
- Create: `src/__tests__/cms-inline-edit.test.tsx`

- [ ] **Step 1: Write the failing test**

CMS에서 리프 노드 Enter → contenteditable 출현, 컨테이너 노드 Enter → 인라인 편집 안 열림을 검증한다.

```tsx
// src/__tests__/cms-inline-edit.test.tsx
import { describe, it, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CmsLayout from '../pages/cms/CmsLayout'

describe('CMS inline edit', () => {
  it('Enter on leaf node starts inline editing', async () => {
    const user = userEvent.setup()
    const { container } = render(<CmsLayout />)

    // Focus a leaf node: hero-badge is a leaf (no children)
    const badge = container.querySelector('[data-cms-id="hero-badge"]')
    expect(badge).not.toBeNull()
    act(() => { (badge as HTMLElement).click() })

    // Enter should start rename → contenteditable appears
    await user.keyboard('{Enter}')
    expect(container.querySelector('[contenteditable]')).not.toBeNull()
  })

  it('Enter on container node does NOT start inline editing', async () => {
    const user = userEvent.setup()
    const { container } = render(<CmsLayout />)

    // Focus a section node: hero is a container (has children)
    const hero = container.querySelector('[data-cms-id="hero"]')
    expect(hero).not.toBeNull()
    act(() => { (hero as HTMLElement).click() })

    // Enter should enterChild, not start rename
    await user.keyboard('{Enter}')
    expect(container.querySelector('[contenteditable]')).toBeNull()
  })

  it('inline edit → type → Enter confirms and updates text', async () => {
    const user = userEvent.setup()
    const { container } = render(<CmsLayout />)

    // Focus hero-badge leaf node
    const badge = container.querySelector('[data-cms-id="hero-badge"]')
    act(() => { (badge as HTMLElement).click() })

    // Enter to start editing
    await user.keyboard('{Enter}')
    const editable = container.querySelector('[contenteditable]') as HTMLElement
    expect(editable).not.toBeNull()

    // Clear and type new value
    editable.textContent = 'New Badge Text'

    // Enter to confirm
    await user.keyboard('{Enter}')
    expect(container.querySelector('[contenteditable]')).toBeNull()
    expect(badge!.textContent).toContain('New Badge Text')
  })

  it('inline edit → Escape cancels and restores original text', async () => {
    const user = userEvent.setup()
    const { container } = render(<CmsLayout />)

    const badge = container.querySelector('[data-cms-id="hero-badge"]')
    const originalText = badge!.textContent
    act(() => { (badge as HTMLElement).click() })

    await user.keyboard('{Enter}')
    const editable = container.querySelector('[contenteditable]') as HTMLElement
    editable.textContent = 'Changed'

    await user.keyboard('{Escape}')
    expect(container.querySelector('[contenteditable]')).toBeNull()
    expect(badge!.textContent).toBe(originalText)
  })
})
```

> **Note:** CmsCanvas에서 `data-cms-id` 속성이 아닌 `data-node-id` 또는 해당 zone의 scope 속성(`data-cms-id`)을 사용하는지 확인 필요. `useAriaZone`에 `scope: 'cms'`를 전달하므로 `data-cms-id` 속성이 렌더링될 것이다. 실제 테스트 실행 시 선택자를 맞춰야 한다.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/cms-inline-edit.test.tsx`
Expected: FAIL — Enter on leaf node does not produce contenteditable (rename plugin not registered, Enter keyMap not wired)

- [ ] **Step 3: Add rename plugin to CmsLayout**

In `src/pages/cms/CmsLayout.tsx`:

```diff
 import { history } from '../../interactive-os/plugins/history'
 import { clipboard } from '../../interactive-os/plugins/clipboard'
+import { rename } from '../../interactive-os/plugins/rename'

-const sharedPlugins: Plugin[] = [history(), clipboard()]
+const sharedPlugins: Plugin[] = [history(), clipboard(), rename()]
```

- [ ] **Step 4: Add Enter key to cmsKeyMap**

In `src/pages/cms/CmsCanvas.tsx`:

```diff
 import { focusCommands } from '../../interactive-os/plugins/core'
 import { crudCommands } from '../../interactive-os/plugins/crud'
 import { dndCommands } from '../../interactive-os/plugins/dnd'
 import { clipboardCommands } from '../../interactive-os/plugins/clipboard'
 import { spatialCommands, getSpatialParentId } from '../../interactive-os/plugins/spatial'
+import { renameCommands } from '../../interactive-os/plugins/rename'

 const cmsKeyMap: Record<string, (ctx: BehaviorContext) => Command | void> = {
+  Enter: (ctx) => {
+    // Leaf node (no children) → start inline editing
+    const children = ctx.getChildren(ctx.focused)
+    if (children.length === 0) {
+      return renameCommands.startRename(ctx.focused)
+    }
+    // Container node → enterChild (spatial depth navigation)
+    return createBatchCommand([
+      spatialCommands.enterChild(ctx.focused),
+      focusCommands.setFocus(children[0]),
+    ])
+  },
+  Escape: (ctx) => {
+    // Exit to parent depth (if not at root)
+    const spatialParent = ctx.getEntity('__spatial_parent__')
+    const parentId = spatialParent?.parentId as string | undefined
+    if (!parentId || parentId === ROOT_ID) return undefined
+    return createBatchCommand([
+      spatialCommands.exitToParent(),
+      focusCommands.setFocus(parentId),
+    ])
+  },
   Delete: (ctx) => {
```

> **Important:** 현재 Enter keyMap이 없으므로 충돌 없음. Escape도 CmsCanvas에 없으므로 추가. `SPATIAL_PARENT_ID` import 필요 시 spatial 플러그인에서 가져온다.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/__tests__/cms-inline-edit.test.tsx`
Expected: PASS (일부는 아직 FAIL 가능 — NodeContent가 Aria.Editable로 래핑되지 않았으므로 contenteditable이 보이지 않을 수 있음. 그 경우 Task 3 완료 후 재검증)

- [ ] **Step 6: Run existing CMS tests for regression**

Run: `npx vitest run src/__tests__/visual-cms.test.tsx`
Expected: All PASS

- [ ] **Step 7: Commit**

```bash
git add src/pages/cms/CmsLayout.tsx src/pages/cms/CmsCanvas.tsx src/__tests__/cms-inline-edit.test.tsx
git commit -m "feat(cms): rename plugin 등록 + Enter/Escape keyMap 분기 (리프→편집, 컨테이너→enterChild)"
```

---

## Task 3: NodeContent에 Aria.Editable 래핑 + 필드 매핑

CMS renderer의 텍스트 노드들을 `Aria.Editable`로 래핑한다. 타입별 편집 가능 필드 매핑을 export한다.

**Files:**
- Modify: `src/pages/cms/cms-renderers.tsx`

CmsCanvas는 `useAriaZone`을 사용하므로 `Aria.Editable`(AriaItemContext 필요)를 직접 사용할 수 없다. CmsCanvas의 렌더러에서는 별도의 인라인 편집 방식이 필요하다.

**핵심 결정:** CmsCanvas는 `<Aria>` 컴포넌트가 아닌 `useAriaZone` hook을 사용한다. `Aria.Editable`는 `AriaItemContext` + `AriaInternalContext`에 의존한다. CmsCanvas에서는 이 컨텍스트가 제공되지 않으므로, CmsCanvas 전용 인라인 편집 컴포넌트가 필요하다.

**접근 방식:** `CmsEditable` — `Aria.Editable`의 로직을 재사용하되, CmsCanvas의 `aria` (useAriaZone return value)를 직접 받는 래퍼. 또는 rename 상태를 store에서 직접 읽어 contenteditable을 렌더링한다.

- [ ] **Step 1: 타입별 필드 매핑 추가**

`src/pages/cms/cms-renderers.tsx`에 편집 가능 필드 매핑을 export:

```tsx
// ── Editable text fields per entity type ──

export interface EditableField {
  field: string
  label: string
  isLocaleMap: boolean
}

export function getEditableFields(data: Record<string, unknown>): EditableField[] {
  switch (data.type) {
    case 'text':
      return [{ field: 'value', label: 'Text', isLocaleMap: true }]
    case 'badge':
      return [{ field: 'value', label: 'Badge', isLocaleMap: true }]
    case 'cta':
      return [
        { field: 'primary', label: 'Primary CTA', isLocaleMap: true },
        { field: 'secondary', label: 'Secondary CTA', isLocaleMap: true },
      ]
    case 'stat':
      return [
        { field: 'value', label: 'Value', isLocaleMap: false },
        { field: 'label', label: 'Label', isLocaleMap: true },
      ]
    case 'step':
      return [
        { field: 'num', label: 'Number', isLocaleMap: false },
        { field: 'title', label: 'Title', isLocaleMap: true },
        { field: 'desc', label: 'Description', isLocaleMap: true },
      ]
    case 'pattern':
      return [{ field: 'name', label: 'Name', isLocaleMap: true }]
    case 'link':
      return [
        { field: 'label', label: 'Label', isLocaleMap: true },
        { field: 'href', label: 'URL', isLocaleMap: false },
      ]
    case 'brand':
      return [
        { field: 'name', label: 'Name', isLocaleMap: false },
        { field: 'license', label: 'License', isLocaleMap: false },
      ]
    case 'section-label':
    case 'section-title':
    case 'section-desc':
      return [{ field: 'value', label: 'Text', isLocaleMap: true }]
    default:
      return []
  }
}
```

- [ ] **Step 2: CmsCanvas에 인라인 편집 렌더링 추가**

CmsCanvas의 `renderNode`에서 rename 상태를 확인하여 leaf 노드에 contenteditable을 렌더링한다. rename 상태는 store의 `RENAME_ID` entity에서 읽는다.

`src/pages/cms/CmsCanvas.tsx`에 추가:

```tsx
import { RENAME_ID, renameCommands } from '../../interactive-os/plugins/rename'
import { getEntity } from '../../interactive-os/core/createStore'
import { localized } from './cms-types'
import { getEditableFields } from './cms-renderers'
```

`renderNode` 함수 내의 leaf 노드 렌더링(line ~184-198)에서 `NodeContent`를 `CmsInlineEditable`로 래핑:

```tsx
// Inside CmsCanvas component, before renderNode:
function CmsInlineEditable({ nodeId, data, locale, dispatch, store }: {
  nodeId: string
  data: Record<string, unknown>
  locale: Locale
  dispatch: (cmd: Command) => void
  store: NormalizedData
}) {
  const editRef = useRef<HTMLSpanElement>(null)
  const originalValueRef = useRef('')
  const composingRef = useRef(false)
  const committedRef = useRef(false)

  const renameEntity = store.entities[RENAME_ID]
  const isRenaming = renameEntity?.active === true && renameEntity?.nodeId === nodeId

  const fields = getEditableFields(data)
  // For inline editing, use the first text field
  const primaryField = fields[0]

  useEffect(() => {
    if (isRenaming && editRef.current) {
      committedRef.current = false
      composingRef.current = false
      const el = editRef.current
      originalValueRef.current = el.textContent ?? ''
      const range = document.createRange()
      range.selectNodeContents(el)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
      el.focus()
    }
  }, [isRenaming])

  if (!isRenaming || !primaryField) {
    return <NodeContent data={data} locale={locale} />
  }

  const rawValue = data[primaryField.field]
  const { text } = localized(rawValue as string | import('./cms-types').LocaleMap, locale)

  const confirm = () => {
    if (committedRef.current) return
    committedRef.current = true
    const newText = editRef.current?.textContent?.trim() ?? ''
    if (newText === '' || newText === originalValueRef.current) {
      if (editRef.current) editRef.current.textContent = originalValueRef.current
      dispatch(renameCommands.cancelRename())
    } else {
      // For LocaleMap fields, update only the current locale
      const newValue = primaryField.isLocaleMap
        ? { ...(rawValue as Record<string, string>), [locale]: newText }
        : newText
      dispatch(renameCommands.confirmRename(nodeId, primaryField.field, newValue))
    }
  }

  const cancel = () => {
    if (committedRef.current) return
    committedRef.current = true
    if (editRef.current) editRef.current.textContent = originalValueRef.current
    dispatch(renameCommands.cancelRename())
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
        if (e.key === 'Enter' && !composingRef.current) { e.preventDefault(); confirm() }
        else if (e.key === 'Escape') { e.preventDefault(); cancel() }
        else if (e.key === 'Tab') { e.preventDefault(); confirm() }
      }}
      onBlur={confirm}
    >
      {text}
    </span>
  )
}
```

Then in `renderNode`'s leaf branch, replace `<NodeContent>` with `<CmsInlineEditable>`:

```tsx
// Leaf / generic nodes (line ~184)
return (
  <Tag ...>
    <CmsInlineEditable
      nodeId={nodeId}
      data={d}
      locale={locale}
      dispatch={aria.dispatch}
      store={currentStore}
    />
    {children.length > 0 && children.map(childId => renderNode(childId))}
  </Tag>
)
```

- [ ] **Step 3: Run inline edit tests**

Run: `npx vitest run src/__tests__/cms-inline-edit.test.tsx`
Expected: PASS (all 4 tests)

- [ ] **Step 4: Run full test suite for regressions**

Run: `npx vitest run src/__tests__/visual-cms.test.tsx src/interactive-os/__tests__/rename-ui.test.tsx`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/cms/cms-renderers.tsx src/pages/cms/CmsCanvas.tsx
git commit -m "feat(cms): NodeContent 인라인 편집 — CmsInlineEditable + getEditableFields 매핑"
```

---

## Task 4: CmsDetailPanel — 우측 Form 패널

포커스된 노드의 텍스트 필드를 Form으로 표시하고, blur 시 confirmRename으로 커밋한다.

**Files:**
- Create: `src/pages/cms/CmsDetailPanel.tsx`
- Modify: `src/pages/cms/CmsLayout.tsx` (패널 배치)
- Modify: `src/styles/cms.css` (3열 레이아웃 + 패널 스타일)
- Create: `src/__tests__/cms-detail-panel.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/cms-detail-panel.test.tsx
import { describe, it, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CmsLayout from '../pages/cms/CmsLayout'

describe('CMS Detail Panel', () => {
  it('shows editable fields when a node is focused', async () => {
    const user = userEvent.setup()
    const { container } = render(<CmsLayout />)

    // Click on hero-badge to focus it
    const badge = container.querySelector('[data-cms-id="hero-badge"]')
    act(() => { (badge as HTMLElement).click() })

    // Detail panel should show the badge's field
    const panel = container.querySelector('.cms-detail-panel')
    expect(panel).not.toBeNull()
    const inputs = panel!.querySelectorAll('input')
    expect(inputs.length).toBeGreaterThan(0)
  })

  it('shows empty state when no node is focused', () => {
    const { container } = render(<CmsLayout />)
    const panel = container.querySelector('.cms-detail-panel')
    expect(panel).not.toBeNull()
    expect(panel!.querySelectorAll('input')).toHaveLength(0)
  })

  it('form edit → blur updates canvas text', async () => {
    const user = userEvent.setup()
    const { container } = render(<CmsLayout />)

    // Focus hero-badge
    const badge = container.querySelector('[data-cms-id="hero-badge"]')
    act(() => { (badge as HTMLElement).click() })

    // Find the input in detail panel
    const panel = container.querySelector('.cms-detail-panel')!
    const input = panel.querySelector('input')!

    // Clear and type new value
    await user.clear(input)
    await user.type(input, 'Updated Badge')

    // Blur to commit
    await user.tab()

    // Canvas should reflect the change
    expect(badge!.textContent).toContain('Updated Badge')
  })

  it('updates panel content when canvas focus changes', async () => {
    const user = userEvent.setup()
    const { container } = render(<CmsLayout />)

    // Focus hero-badge
    const badge = container.querySelector('[data-cms-id="hero-badge"]')
    act(() => { (badge as HTMLElement).click() })

    const panel = container.querySelector('.cms-detail-panel')!
    const firstInput = panel.querySelector('input')
    const firstValue = firstInput?.value

    // Focus a different node (hero-title)
    const title = container.querySelector('[data-cms-id="hero-title"]')
    act(() => { (title as HTMLElement).click() })

    // Panel input should now show title's value, not badge's
    const updatedInput = panel.querySelector('input')
    expect(updatedInput?.value).not.toBe(firstValue)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/cms-detail-panel.test.tsx`
Expected: FAIL — `.cms-detail-panel` not found

- [ ] **Step 3: Create CmsDetailPanel component**

```tsx
// src/pages/cms/CmsDetailPanel.tsx
import { useRef, useEffect, useCallback } from 'react'
import type { NormalizedData } from '../../interactive-os/core/types'
import type { CommandEngine } from '../../interactive-os/core/createCommandEngine'
import { renameCommands } from '../../interactive-os/plugins/rename'
import { getEditableFields } from './cms-renderers'
import { localized } from './cms-types'
import type { Locale, LocaleMap } from './cms-types'

interface CmsDetailPanelProps {
  engine: CommandEngine
  store: NormalizedData
  focusedNodeId: string
  locale: Locale
}

export default function CmsDetailPanel({ engine, store, focusedNodeId, locale }: CmsDetailPanelProps) {
  const entity = focusedNodeId ? store.entities[focusedNodeId] : null
  const data = (entity?.data ?? {}) as Record<string, unknown>
  const fields = entity ? getEditableFields(data) : []

  if (!entity || fields.length === 0) {
    return (
      <div className="cms-detail-panel">
        <div className="cms-detail-panel__empty">
          {focusedNodeId ? 'No editable fields' : 'Select a node'}
        </div>
      </div>
    )
  }

  return (
    <div className="cms-detail-panel">
      <div className="cms-detail-panel__header">
        <span className="cms-detail-panel__type">{data.type as string}</span>
      </div>
      <div className="cms-detail-panel__fields">
        {fields.map((f) => (
          <DetailField
            key={`${focusedNodeId}-${f.field}`}
            nodeId={focusedNodeId}
            field={f.field}
            label={f.label}
            isLocaleMap={f.isLocaleMap}
            rawValue={data[f.field]}
            locale={locale}
            engine={engine}
          />
        ))}
      </div>
    </div>
  )
}

function DetailField({ nodeId, field, label, isLocaleMap, rawValue, locale, engine }: {
  nodeId: string
  field: string
  label: string
  isLocaleMap: boolean
  rawValue: unknown
  locale: Locale
  engine: CommandEngine
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const snapshotRef = useRef<string>('')

  const displayValue = isLocaleMap
    ? localized(rawValue as string | LocaleMap, locale).text
    : (rawValue as string) ?? ''

  // Sync input with store value (undo/redo, external changes)
  useEffect(() => {
    if (inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.value = displayValue
      snapshotRef.current = displayValue
    }
  }, [displayValue])

  // Set initial snapshot on focus
  const handleFocus = useCallback(() => {
    snapshotRef.current = inputRef.current?.value ?? ''
  }, [])

  const handleCommit = useCallback(() => {
    const newText = inputRef.current?.value.trim() ?? ''
    if (newText === snapshotRef.current || newText === '') return

    const newValue = isLocaleMap
      ? { ...(rawValue as Record<string, string>), [locale]: newText }
      : newText
    engine.dispatch(renameCommands.confirmRename(nodeId, field, newValue))
    snapshotRef.current = newText
  }, [nodeId, field, isLocaleMap, rawValue, locale, engine])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCommit()
    }
  }, [handleCommit])

  return (
    <div className="cms-detail-field">
      <label className="cms-detail-field__label">{label}</label>
      <input
        ref={inputRef}
        className="cms-detail-field__input"
        type="text"
        defaultValue={displayValue}
        onFocus={handleFocus}
        onBlur={handleCommit}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}
```

- [ ] **Step 4: Add CmsDetailPanel to CmsLayout**

In `src/pages/cms/CmsLayout.tsx`, import and add the panel:

```diff
+import CmsDetailPanel from './CmsDetailPanel'

 // In the return JSX, inside cms-body, after cms-canvas-area:
       <div className="cms-body">
         <CmsSidebar ... />
         <div className="cms-canvas-area">
           ...
         </div>
+        <CmsDetailPanel
+          engine={engine}
+          store={store}
+          focusedNodeId={canvasFocusedId}
+          locale={locale}
+        />
       </div>
```

- [ ] **Step 5: Add CSS for 3-column layout and detail panel**

In `src/styles/cms.css`:

```css
/* Detail panel — right side */
.cms-detail-panel {
  width: 240px; flex-shrink: 0;
  background: var(--surface-1);
  border-left: 1px solid var(--border-dim);
  display: flex; flex-direction: column;
  overflow-y: auto;
}
.cms-detail-panel__empty {
  padding: 16px;
  font-family: var(--sans); font-size: 12px;
  color: var(--text-muted); text-align: center;
}
.cms-detail-panel__header {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-dim);
}
.cms-detail-panel__type {
  font-family: var(--mono); font-size: 11px; font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
}
.cms-detail-panel__fields {
  padding: 8px 12px;
  display: flex; flex-direction: column; gap: 8px;
}
.cms-detail-field {
  display: flex; flex-direction: column; gap: 2px;
}
.cms-detail-field__label {
  font-family: var(--sans); font-size: 10px; font-weight: 600;
  color: var(--text-muted); text-transform: uppercase;
}
.cms-detail-field__input {
  width: 100%;
  padding: 4px 8px;
  font-family: var(--sans); font-size: 13px;
  color: var(--text-primary);
  background: var(--surface-0);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
  outline: none;
  transition: border-color var(--transition-fast);
}
.cms-detail-field__input:focus {
  border-color: var(--accent);
}
```

No CSS grid change needed — `cms-body` already uses `display: flex` and `cms-canvas-area` has `flex: 1`, so adding a fixed-width detail panel will work naturally.

- [ ] **Step 6: Run detail panel tests**

Run: `npx vitest run src/__tests__/cms-detail-panel.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 7: Run all CMS tests for regression**

Run: `npx vitest run src/__tests__/visual-cms.test.tsx src/__tests__/cms-inline-edit.test.tsx`
Expected: All PASS

- [ ] **Step 8: Commit**

```bash
git add src/pages/cms/CmsDetailPanel.tsx src/pages/cms/CmsLayout.tsx src/styles/cms.css src/__tests__/cms-detail-panel.test.tsx
git commit -m "feat(cms): CmsDetailPanel — 우측 Form 패널, blur/Enter 시 confirmRename, 3열 레이아웃"
```

---

## Task 5: 엣지케이스 + 최종 검증

icon 노드 Enter 무시, LocaleMap fallback 초기값, undo 동기 등 경계 조건을 검증한다.

**Files:**
- Modify: `src/__tests__/cms-inline-edit.test.tsx` (추가 테스트)
- Modify: `src/pages/cms/CmsCanvas.tsx` (icon 노드 가드)

- [ ] **Step 1: icon 노드 Enter 가드 테스트 작성**

`src/__tests__/cms-inline-edit.test.tsx`에 추가:

```tsx
it('Enter on icon node (leaf, no editable text fields) does nothing', async () => {
  const user = userEvent.setup()
  const { container } = render(<CmsLayout />)

  // Navigate into features section, then to a card, then to icon
  // Icon nodes have type 'icon' — no text fields
  const icon = container.querySelector('[data-cms-id="card-store-icon"]')
  if (icon) {
    act(() => { (icon as HTMLElement).click() })
    await user.keyboard('{Enter}')
    expect(container.querySelector('[contenteditable]')).toBeNull()
  }
})
```

- [ ] **Step 2: Add icon guard to Enter keyMap**

In `src/pages/cms/CmsCanvas.tsx`, modify the Enter handler:

```tsx
Enter: (ctx) => {
  const children = ctx.getChildren(ctx.focused)
  if (children.length === 0) {
    // Guard: only start rename if node has editable text fields
    const entity = ctx.getEntity(ctx.focused)
    const data = (entity?.data ?? {}) as Record<string, unknown>
    const fields = getEditableFields(data)
    if (fields.length === 0) return
    return renameCommands.startRename(ctx.focused)
  }
  return createBatchCommand([
    spatialCommands.enterChild(ctx.focused),
    focusCommands.setFocus(children[0]),
  ])
},
```

Import `getEditableFields` from `./cms-renderers`.

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/__tests__/cms-inline-edit.test.tsx src/__tests__/cms-detail-panel.test.tsx`
Expected: All PASS

- [ ] **Step 4: Run the full test suite**

Run: `npx vitest run`
Expected: All PASS, no regressions

- [ ] **Step 5: Commit**

```bash
git add src/pages/cms/CmsCanvas.tsx src/__tests__/cms-inline-edit.test.tsx
git commit -m "feat(cms): icon 노드 Enter 가드 + 엣지케이스 검증"
```

---

## Task 6: PROGRESS.md 업데이트

- [ ] **Step 1: Update docs/PROGRESS.md**

CMS inline edit + detail panel 완료 항목을 체크리스트에 추가/업데이트한다.

- [ ] **Step 2: Commit**

```bash
git add docs/PROGRESS.md
git commit -m "docs: PROGRESS.md — CMS inline edit + detail panel 완료"
```
