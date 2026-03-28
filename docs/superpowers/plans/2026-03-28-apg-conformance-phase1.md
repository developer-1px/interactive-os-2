# APG Conformance Phase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 16개 pattern/examples/의 APG 적합성을 검증하고, conformance test로 기존 keyboard integration test를 흡수한다.

**Architecture:** APG example 페이지의 aria tree 기준선을 test fixture로 정의하고, serializeAriaNode 기반의 aria tree 스냅샷 + userEvent keyboard 검증을 하나의 conformance test 파일에 통합한다. 기존 `*-keyboard.integration.test.tsx`는 conformance test가 모든 케이스를 커버한 후 삭제한다.

**Tech Stack:** vitest, @testing-library/react, userEvent, serializeAriaNode (devtools/rec에서 추출)

**PRD:** `docs/superpowers/specs/2026-03-28-apg-conformance-prd.md`
**Matrix:** `docs/2-areas/pattern/apgConformanceMatrix.md`

---

### Task 0: Conformance Test Infrastructure

**Files:**
- Create: `src/interactive-os/__tests__/helpers/ariaTreeSnapshot.ts`

이 헬퍼가 모든 conformance test에서 사용된다. devtools/rec의 `serializeAriaNode`를 test 환경에서 쓸 수 있게 순수 함수로 추출한다.

- [ ] **Step 1: Write ariaTreeSnapshot helper**

```typescript
// src/interactive-os/__tests__/helpers/ariaTreeSnapshot.ts

const ARIA_STATE_ATTRS = [
  'aria-selected', 'aria-expanded', 'aria-checked', 'aria-disabled',
  'aria-pressed', 'aria-level', 'aria-activedescendant', 'aria-current',
  'aria-modal', 'aria-multiselectable', 'aria-orientation',
  'aria-valuemin', 'aria-valuemax', 'aria-valuenow', 'aria-valuetext',
  'aria-posinset', 'aria-setsize',
] as const

const IMPLICIT_ROLES: Record<string, string> = {
  button: 'button', a: 'link', input: 'textbox', select: 'combobox',
  textarea: 'textbox', nav: 'navigation', main: 'main', header: 'banner',
  footer: 'contentinfo', aside: 'complementary', ul: 'list', ol: 'list',
  li: 'listitem', table: 'table', tr: 'row', td: 'cell', th: 'columnheader',
  h1: 'heading', h2: 'heading', h3: 'heading', dialog: 'dialog',
}

function implicitRole(el: Element): string | null {
  return IMPLICIT_ROLES[el.tagName.toLowerCase()] ?? null
}

function serializeAriaNode(el: Element, depth: number, activeEl: Element | null): string {
  const indent = '  '.repeat(depth)
  const role = el.getAttribute('role') || implicitRole(el)
  if (!role) return ''

  const name = el.getAttribute('aria-label')
    || (el.children.length === 0 ? el.textContent?.trim().slice(0, 50) : null)
    || ''

  const attrs: string[] = []
  for (const attr of ARIA_STATE_ATTRS) {
    const val = el.getAttribute(attr)
    if (val !== null) {
      const shortName = attr.replace('aria-', '')
      attrs.push(val === 'true' ? shortName : `${shortName}=${val}`)
    }
  }

  if (el === activeEl) attrs.push('focused')

  const tabIdx = el.getAttribute('tabindex')
  if (tabIdx === '0') attrs.push('tabindex=0')
  if (tabIdx === '-1') attrs.push('tabindex=-1')

  const attrStr = attrs.length > 0 ? ` [${attrs.join(', ')}]` : ''
  const nameStr = name ? ` "${name}"` : ''
  const line = `${indent}${role}${nameStr}${attrStr}`

  const childLines: string[] = []
  for (const child of el.children) {
    const childRole = child.getAttribute('role') || implicitRole(child)
    if (childRole) {
      const serialized = serializeAriaNode(child, depth + 1, activeEl)
      if (serialized) childLines.push(serialized)
    } else {
      for (const grandchild of child.children) {
        const serialized = serializeAriaNode(grandchild, depth + 1, activeEl)
        if (serialized) childLines.push(serialized)
      }
    }
  }

  return childLines.length > 0
    ? `${line}\n${childLines.join('\n')}`
    : line
}

/**
 * Captures the aria tree of the first role container in the given element.
 * Returns a human-readable, diffable string.
 */
export function captureAriaTree(container: HTMLElement): string {
  const roleContainer = container.querySelector('[role]')
  if (!roleContainer) return '(no role container found)'
  return serializeAriaNode(roleContainer, 0, container.ownerDocument.activeElement)
}

/**
 * Captures the aria tree and asserts its role hierarchy matches the expected structure.
 * Only checks role names and nesting — ignores states, names, and attribute values.
 */
export function expectRoleHierarchy(container: HTMLElement, expected: string): void {
  const tree = captureAriaTree(container)
  const rolesOnly = tree
    .split('\n')
    .map(line => {
      const indent = line.match(/^(\s*)/)?.[1] ?? ''
      const role = line.trim().split(/[\s"[]/)[0]
      return `${indent}${role}`
    })
    .join('\n')
  expect(rolesOnly).toBe(expected)
}
```

- [ ] **Step 2: Verify helper compiles**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/interactive-os/__tests__/helpers/ariaTreeSnapshot.ts
git commit -m "feat: add ariaTreeSnapshot helper for APG conformance tests"
```

---

### Task 1: Accordion APG Conformance (Exemplar)

**APG Reference:** https://www.w3.org/WAI/ARIA/apg/patterns/accordion/examples/accordion/

**Files:**
- Create: `src/interactive-os/__tests__/accordion-apg.conformance.test.tsx`
- Delete (after): `src/interactive-os/__tests__/accordion-keyboard.integration.test.tsx`

**APG Accordion expected aria tree:**
```
region
  heading [expanded=false, tabindex=0, focused]
  heading [expanded=false, tabindex=-1]
  heading [expanded=false, tabindex=-1]
```

**APG Keyboard Spec:**
- Enter/Space: Toggle expanded state of focused header
- ArrowDown: Move focus to next header (wraps to first if on last — APG optional)
- ArrowUp: Move focus to previous header (wraps to last if on first — APG optional)
- Home: Move focus to first header
- End: Move focus to last header

- [ ] **Step 1: Write conformance test — aria tree structure**

```typescript
// src/interactive-os/__tests__/accordion-apg.conformance.test.tsx
// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Accordion
 * https://www.w3.org/WAI/ARIA/apg/patterns/accordion/examples/accordion/
 *
 * Verifies: role hierarchy, aria-expanded, keyboard interactions.
 * Absorbs: accordion-keyboard.integration.test.tsx
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Accordion } from '../ui/Accordion'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { captureAriaTree } from './helpers/ariaTreeSnapshot'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      section1: { id: 'section1', data: { name: 'Personal Information' } },
      content1: { id: 'content1', data: { name: 'Name, address, phone...' } },
      section2: { id: 'section2', data: { name: 'Billing Address' } },
      content2: { id: 'content2', data: { name: 'Street, city, state...' } },
      section3: { id: 'section3', data: { name: 'Shipping Address' } },
      content3: { id: 'content3', data: { name: 'Same as billing...' } },
    },
    relationships: {
      [ROOT_ID]: ['section1', 'section2', 'section3'],
      section1: ['content1'],
      section2: ['content2'],
      section3: ['content3'],
    },
  })
}

function renderAccordion(data: NormalizedData) {
  return render(
    <Accordion
      data={data}
      plugins={[]}
      renderItem={(props, item, state: NodeState) => (
        <span {...props}>
          {(item.data as Record<string, unknown>)?.name as string}
        </span>
      )}
    />
  )
}

function getNode(container: HTMLElement, id: string): HTMLElement {
  return container.querySelector(`[data-node-id="${id}"]`)!
}

function getFocusedNodeId(container: HTMLElement): string | null {
  return container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id') ?? null
}

function getVisibleNodeIds(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[data-node-id]'))
    .map(n => n.getAttribute('data-node-id')!)
}

describe('Accordion APG Conformance', () => {
  // https://www.w3.org/WAI/ARIA/apg/patterns/accordion/examples/accordion/
  describe('Aria Tree Structure', () => {
    it('renders region > heading hierarchy with aria-expanded', () => {
      const { container } = renderAccordion(fixtureData())
      const tree = captureAriaTree(container)

      // Container role
      expect(tree).toContain('region')

      // All headers have heading role with aria-expanded
      const headingLines = tree.split('\n').filter(l => l.trim().startsWith('heading'))
      expect(headingLines.length).toBe(3)
      headingLines.forEach(line => {
        expect(line).toContain('expanded=false')
      })
    })

    it('first header has tabindex=0, others have tabindex=-1', () => {
      const { container } = renderAccordion(fixtureData())
      const tree = captureAriaTree(container)
      const headingLines = tree.split('\n').filter(l => l.trim().startsWith('heading'))

      expect(headingLines[0]).toContain('tabindex=0')
      expect(headingLines[1]).toContain('tabindex=-1')
      expect(headingLines[2]).toContain('tabindex=-1')
    })

    it('expanded header shows child content in tree', () => {
      const { container } = renderAccordion(fixtureData())

      // Expand first section
      getNode(container, 'section1').focus()
      getNode(container, 'section1').click()

      const tree = captureAriaTree(container)
      const firstHeading = tree.split('\n').find(l => l.trim().startsWith('heading') && l.includes('Personal'))
      expect(firstHeading).toContain('expanded=true')
    })
  })

  describe('Keyboard Interaction', () => {
    it('Enter toggles aria-expanded on focused header', async () => {
      const user = userEvent.setup()
      const { container } = renderAccordion(fixtureData())

      getNode(container, 'section1').focus()
      await user.keyboard('{Enter}')

      expect(getVisibleNodeIds(container)).toContain('content1')

      await user.keyboard('{Enter}')
      expect(getVisibleNodeIds(container)).not.toContain('content1')
    })

    it('Space toggles aria-expanded on focused header', async () => {
      const user = userEvent.setup()
      const { container } = renderAccordion(fixtureData())

      getNode(container, 'section2').focus()
      await user.keyboard('{ }')

      expect(getVisibleNodeIds(container)).toContain('content2')
    })

    it('ArrowDown moves focus to next header', async () => {
      const user = userEvent.setup()
      const { container } = renderAccordion(fixtureData())

      getNode(container, 'section1').focus()
      await user.keyboard('{ArrowDown}')

      expect(getFocusedNodeId(container)).toBe('section2')
    })

    it('ArrowUp moves focus to previous header', async () => {
      const user = userEvent.setup()
      const { container } = renderAccordion(fixtureData())

      getNode(container, 'section2').focus()
      await user.keyboard('{ArrowUp}')

      expect(getFocusedNodeId(container)).toBe('section1')
    })

    it('Home moves focus to first header', async () => {
      const user = userEvent.setup()
      const { container } = renderAccordion(fixtureData())

      getNode(container, 'section3').focus()
      await user.keyboard('{Home}')

      expect(getFocusedNodeId(container)).toBe('section1')
    })

    it('End moves focus to last header', async () => {
      const user = userEvent.setup()
      const { container } = renderAccordion(fixtureData())

      getNode(container, 'section1').focus()
      await user.keyboard('{End}')

      expect(getFocusedNodeId(container)).toBe('section3')
    })

    it('navigation moves through expanded content with ArrowDown', async () => {
      const user = userEvent.setup()
      const { container } = renderAccordion(fixtureData())

      getNode(container, 'section1').focus()
      await user.keyboard('{Enter}')
      await user.keyboard('{ArrowDown}')

      expect(getFocusedNodeId(container)).toBe('content1')

      await user.keyboard('{ArrowDown}')
      expect(getFocusedNodeId(container)).toBe('section2')
    })
  })

  describe('Click Interaction', () => {
    it('click toggles aria-expanded', async () => {
      const user = userEvent.setup()
      const { container } = renderAccordion(fixtureData())

      await user.click(getNode(container, 'section1'))
      expect(getVisibleNodeIds(container)).toContain('content1')

      await user.click(getNode(container, 'section1'))
      expect(getVisibleNodeIds(container)).not.toContain('content1')
    })
  })
})
```

- [ ] **Step 2: Run to verify all tests pass**

Run: `pnpm test -- src/interactive-os/__tests__/accordion-apg.conformance.test.tsx`
Expected: All PASS

- [ ] **Step 3: Verify conformance test covers all cases from old test**

Compare `accordion-apg.conformance.test.tsx` with `accordion-keyboard.integration.test.tsx`:
- ArrowDown ✓, ArrowUp ✓, Home ✓, End ✓
- Enter expand/collapse ✓, Space expand/collapse ✓
- Click expand/collapse ✓
- Navigation through expanded content ✓
- Leaf nodes — check if this is an APG spec requirement or our extension

If leaf node behavior is our extension (not in APG), keep a separate `it` block but mark it as non-APG.

- [ ] **Step 4: Delete old test, run full suite**

```bash
git rm src/interactive-os/__tests__/accordion-keyboard.integration.test.tsx
```

Run: `pnpm test`
Expected: All PASS (no regression)

- [ ] **Step 5: Update matrix**

In `docs/2-areas/pattern/apgConformanceMatrix.md`, update Accordion row:
```
| 1 | Accordion | [example](...) | `pattern/examples/accordion.ts` | 🟢 | — |
```

- [ ] **Step 6: Commit**

```bash
git add src/interactive-os/__tests__/accordion-apg.conformance.test.tsx docs/2-areas/pattern/apgConformanceMatrix.md
git commit -m "feat: accordion APG conformance test — absorbs keyboard integration test"
```

---

### Task 2: Listbox APG Conformance

**APG Reference:** https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-scrollable/

**Files:**
- Create: `src/interactive-os/__tests__/listbox-apg.conformance.test.tsx`
- Delete (after): `src/interactive-os/__tests__/listbox-keyboard.integration.test.tsx`

**APG Listbox expected aria tree:**
```
listbox
  option "Apple" [selected=false, tabindex=0, focused]
  option "Banana" [selected=false, tabindex=-1]
  option "Cherry" [selected=false, tabindex=-1]
```

**APG Keyboard Spec (multi-select, recommended model):**
- ArrowDown: Move focus to next option
- ArrowUp: Move focus to previous option
- Home: Move focus to first option
- End: Move focus to last option
- Space: Toggle selection of focused option
- Shift+ArrowDown: Move focus and toggle selection of next option
- Shift+ArrowUp: Move focus and toggle selection of previous option

- [ ] **Step 1: Write conformance test**

```typescript
// src/interactive-os/__tests__/listbox-apg.conformance.test.tsx
// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Listbox (Scrollable)
 * https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-scrollable/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ListBox } from '../ui/ListBox'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { captureAriaTree } from './helpers/ariaTreeSnapshot'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      apple: { id: 'apple', data: { name: 'Apple' } },
      banana: { id: 'banana', data: { name: 'Banana' } },
      cherry: { id: 'cherry', data: { name: 'Cherry' } },
      date: { id: 'date', data: { name: 'Date' } },
    },
    relationships: {
      [ROOT_ID]: ['apple', 'banana', 'cherry', 'date'],
    },
  })
}

function renderListBox(data: NormalizedData) {
  return render(
    <ListBox
      data={data}
      plugins={[]}
      renderItem={(props, item, state: NodeState) => (
        <span {...props}>
          {(item.data as Record<string, unknown>)?.name as string}
        </span>
      )}
    />
  )
}

function getNode(container: HTMLElement, id: string): HTMLElement {
  return container.querySelector(`[data-node-id="${id}"]`)!
}

function getFocusedNodeId(container: HTMLElement): string | null {
  return container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id') ?? null
}

function isSelected(container: HTMLElement, id: string): boolean {
  return getNode(container, id).getAttribute('aria-selected') === 'true'
}

describe('Listbox APG Conformance (Scrollable)', () => {
  describe('Aria Tree Structure', () => {
    it('renders listbox > option hierarchy', () => {
      const { container } = renderListBox(fixtureData())
      const tree = captureAriaTree(container)

      expect(tree).toMatch(/^listbox/)
      const optionLines = tree.split('\n').filter(l => l.trim().startsWith('option'))
      expect(optionLines.length).toBe(4)
    })

    it('options have aria-selected and aria-posinset/aria-setsize', () => {
      const { container } = renderListBox(fixtureData())
      const tree = captureAriaTree(container)

      expect(tree).toContain('selected=false')
      expect(tree).toContain('posinset=1')
      expect(tree).toContain('setsize=4')
    })

    it('first option has tabindex=0', () => {
      const { container } = renderListBox(fixtureData())
      const tree = captureAriaTree(container)
      const optionLines = tree.split('\n').filter(l => l.trim().startsWith('option'))

      expect(optionLines[0]).toContain('tabindex=0')
      expect(optionLines[1]).toContain('tabindex=-1')
    })
  })

  describe('Keyboard Interaction', () => {
    it('ArrowDown moves focus to next option', async () => {
      const user = userEvent.setup()
      const { container } = renderListBox(fixtureData())

      getNode(container, 'apple').focus()
      await user.keyboard('{ArrowDown}')

      expect(getFocusedNodeId(container)).toBe('banana')
    })

    it('ArrowUp moves focus to previous option', async () => {
      const user = userEvent.setup()
      const { container } = renderListBox(fixtureData())

      getNode(container, 'banana').focus()
      await user.keyboard('{ArrowUp}')

      expect(getFocusedNodeId(container)).toBe('apple')
    })

    it('Home moves focus to first option', async () => {
      const user = userEvent.setup()
      const { container } = renderListBox(fixtureData())

      getNode(container, 'date').focus()
      await user.keyboard('{Home}')

      expect(getFocusedNodeId(container)).toBe('apple')
    })

    it('End moves focus to last option', async () => {
      const user = userEvent.setup()
      const { container } = renderListBox(fixtureData())

      getNode(container, 'apple').focus()
      await user.keyboard('{End}')

      expect(getFocusedNodeId(container)).toBe('date')
    })

    it('Space toggles selection of focused option', async () => {
      const user = userEvent.setup()
      const { container } = renderListBox(fixtureData())

      getNode(container, 'apple').focus()
      expect(isSelected(container, 'apple')).toBe(false)

      await user.keyboard('{ }')
      expect(isSelected(container, 'apple')).toBe(true)

      await user.keyboard('{ }')
      expect(isSelected(container, 'apple')).toBe(false)
    })

    it('Shift+ArrowDown extends selection to next option', async () => {
      const user = userEvent.setup()
      const { container } = renderListBox(fixtureData())

      getNode(container, 'apple').focus()
      await user.keyboard('{ }') // select apple
      await user.keyboard('{Shift>}{ArrowDown}{/Shift}')

      expect(getFocusedNodeId(container)).toBe('banana')
      expect(isSelected(container, 'banana')).toBe(true)
    })

    it('Shift+ArrowUp extends selection to previous option', async () => {
      const user = userEvent.setup()
      const { container } = renderListBox(fixtureData())

      getNode(container, 'banana').focus()
      await user.keyboard('{ }') // select banana
      await user.keyboard('{Shift>}{ArrowUp}{/Shift}')

      expect(getFocusedNodeId(container)).toBe('apple')
      expect(isSelected(container, 'apple')).toBe(true)
    })
  })

  describe('Click Interaction', () => {
    it('click selects option', async () => {
      const user = userEvent.setup()
      const { container } = renderListBox(fixtureData())

      await user.click(getNode(container, 'banana'))
      expect(isSelected(container, 'banana')).toBe(true)
    })
  })
})
```

- [ ] **Step 2: Run to verify all tests pass**

Run: `pnpm test -- src/interactive-os/__tests__/listbox-apg.conformance.test.tsx`
Expected: All PASS

- [ ] **Step 3: Delete old test, run full suite**

```bash
git rm src/interactive-os/__tests__/listbox-keyboard.integration.test.tsx
```

Run: `pnpm test`
Expected: All PASS

- [ ] **Step 4: Update matrix, commit**

Matrix: `| 36 | Scrollable Listbox | ... | 🟢 | — |`

```bash
git add src/interactive-os/__tests__/listbox-apg.conformance.test.tsx docs/2-areas/pattern/apgConformanceMatrix.md
git commit -m "feat: listbox APG conformance test — absorbs keyboard integration test"
```

---

### Task 3–15: Remaining 14 Patterns

각 패턴은 Task 1–2와 동일한 구조를 따른다. 아래에 패턴별 핵심 차이점만 기록한다.

**공통 워크플로우 (패턴당):**
1. APG example 페이지에서 aria tree 기준선 + keyboard spec 확인
2. conformance test 작성 (aria tree + keyboard + click)
3. 기존 keyboard test 케이스가 전부 포함되는지 확인
4. 기존 keyboard test 삭제
5. matrix 갱신
6. commit

---

#### Task 3: AlertDialog

**APG:** https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/examples/alertdialog/
**Our pattern:** `alertdialog.ts` — role=alertdialog, dismiss axis
**Key checks:** aria-modal=true, Escape closes, focus trap
**Old test:** `alertdialog-keyboard.integration.test.tsx`

---

#### Task 4: Combobox (Select-Only)

**APG:** https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/
**Our pattern:** `combobox.ts` — role=combobox, aria-activedescendant
**Key checks:** aria-activedescendant changes on arrow, aria-selected on options, aria-expanded on open/close
**Old test:** `combobox-keyboard.integration.test.tsx`
**Note:** focusStrategy=aria-activedescendant — tree snapshot must show activedescendant instead of tabindex

---

#### Task 5: Dialog (Modal)

**APG:** https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/dialog/
**Our pattern:** `dialog.ts` — role=dialog, dismiss axis
**Key checks:** Escape closes, Tab cycles within dialog (focus trap)
**Old test:** `dialog-keyboard.integration.test.tsx`

---

#### Task 6: Disclosure

**APG:** https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-card/
**Our pattern:** `disclosure.ts` — role=group, childRole=button, activate axis
**Key checks:** aria-expanded on button, Enter/Space toggles
**Old test:** `disclosure-keyboard.integration.test.tsx`

---

#### Task 7: Grid (Data Grid)

**APG:** https://www.w3.org/WAI/ARIA/apg/patterns/grid/examples/data-grids/
**Our pattern:** `grid.ts` — role=grid, childRole=row, navigate(grid), select
**Key checks:** Arrow keys for 2D navigation, aria-rowindex, aria-selected, Home/End within row, Ctrl+Home/End across rows
**Old test:** `grid-keyboard.integration.test.tsx`

---

#### Task 8: Menu (Actions Menu Button)

**APG:** https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/examples/menu-button-actions/
**Our pattern:** `menu.ts` — role=menu, childRole=menuitem, activate+expand+navigate
**Key checks:** ArrowDown/Up navigation, ArrowRight expands submenu, ArrowLeft collapses, Enter activates
**Old test:** `menu-keyboard.integration.test.tsx`

---

#### Task 9: RadioGroup (Roving tabindex)

**APG:** https://www.w3.org/WAI/ARIA/apg/patterns/radio/examples/radio/
**Our pattern:** `radiogroup.ts` — role=radiogroup, childRole=radio, select(single)+navigate(both, wrap)
**Key checks:** aria-checked, Arrow keys move and select (followFocus-like), wrapping
**Old test:** `radiogroup-keyboard.integration.test.tsx`

---

#### Task 10: Slider (Color Viewer)

**APG:** https://www.w3.org/WAI/ARIA/apg/patterns/slider/examples/slider-color-viewer/
**Our pattern:** `slider.ts` — childRole=slider, value axis
**Key checks:** aria-valuenow/min/max, ArrowRight/Up increments, ArrowLeft/Down decrements, Home/End min/max, PageUp/PageDown big step
**Old test:** `slider-keyboard.integration.test.tsx`

---

#### Task 11: Spinbutton (Quantity)

**APG:** https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/examples/quantity-spinbutton/
**Our pattern:** `spinbutton.ts` — childRole=spinbutton, value axis (vertical)
**Key checks:** aria-valuenow/min/max, ArrowUp/Down increments/decrements, PageUp/PageDown big step
**Old test:** `spinbutton-keyboard.integration.test.tsx`

---

#### Task 12: Switch

**APG:** https://www.w3.org/WAI/ARIA/apg/patterns/switch/examples/switch/
**Our pattern:** `switch.ts` — role=switch, activate axis
**Key checks:** aria-checked, Enter/Space toggles, click toggles
**Old test:** `switch-keyboard.integration.test.tsx`

---

#### Task 13: Tabs (Automatic Activation)

**APG:** https://www.w3.org/WAI/ARIA/apg/patterns/tabs/examples/tabs-automatic/
**Our pattern:** `tabs.ts` — role=tablist, childRole=tab, select(single)+navigate(horizontal)
**Key checks:** aria-selected, ArrowRight/Left moves + selects (followFocus), Home/End
**Old test:** `tabs-keyboard.integration.test.tsx`

---

#### Task 14: Toolbar

**APG:** https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/examples/toolbar/
**Our pattern:** `toolbar.ts` — role=toolbar, childRole=button, activate+navigate(horizontal)
**Key checks:** aria-pressed, ArrowRight/Left navigation, Home/End
**Old test:** `toolbar-keyboard.integration.test.tsx`

---

#### Task 15: Tree View (File Directory)

**APG:** https://www.w3.org/WAI/ARIA/apg/patterns/treeview/examples/treeview-1a/
**Our pattern:** `tree.ts` — role=tree, childRole=treeitem, select+activate+expand+navigate
**Key checks:** aria-expanded, aria-level, aria-selected, ArrowRight expands/enters, ArrowLeft collapses/parent, Home/End
**Old test:** `treeview.integration.test.tsx`

---

#### Task 16: TreeGrid (Email Inbox)

**APG:** https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/examples/treegrid-1/
**Our pattern:** `treegrid.ts` — role=treegrid, childRole=row, select+activate+expand+navigate
**Key checks:** aria-expanded, aria-level, aria-selected, same as tree + grid column navigation
**Old test:** `treegrid-keyboard.integration.test.tsx`

---

### Task 17: Final Matrix Update + Gap Report

**Files:**
- Modify: `docs/2-areas/pattern/apgConformanceMatrix.md`

- [ ] **Step 1: Update all 16 rows in matrix with final status**

Each row gets 🟢 (all checks pass), 🟡 (partial), or ⛔ (os gap found).

- [ ] **Step 2: Fill gap registry if any gaps were found**

In the `os 갭 레지스트리` section, add rows for any keyboard interactions or aria attributes that APG specifies but our composePattern couldn't express.

- [ ] **Step 3: Run full test suite**

Run: `pnpm test`
Expected: All PASS, no deleted test regressions

- [ ] **Step 4: Commit**

```bash
git add docs/2-areas/pattern/apgConformanceMatrix.md
git commit -m "feat: APG conformance Phase 1 complete — 16 patterns verified"
```

---

## Summary

| Task | Pattern | APG Example | Complexity |
|------|---------|-------------|------------|
| 0 | (infra) | — | Low |
| 1 | Accordion | Accordion | Low |
| 2 | Listbox | Scrollable Listbox | Medium |
| 3 | AlertDialog | Alert Dialog | Low |
| 4 | Combobox | Select-Only | High |
| 5 | Dialog | Modal Dialog | Low |
| 6 | Disclosure | Show/Hide Card | Low |
| 7 | Grid | Data Grid | High |
| 8 | Menu | Actions Menu Button | Medium |
| 9 | RadioGroup | Roving tabindex | Medium |
| 10 | Slider | Color Viewer | Medium |
| 11 | Spinbutton | Quantity | Medium |
| 12 | Switch | Switch | Low |
| 13 | Tabs | Automatic Activation | Medium |
| 14 | Toolbar | Toolbar | Low |
| 15 | Tree | File Directory (Computed) | High |
| 16 | TreeGrid | Email Inbox | High |
| 17 | (matrix) | — | Low |
