# Nested Aria Bubbling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 중첩 Aria 컨테이너가 DOM 이벤트 버블링으로 합성되도록 가드 로직 변경 + behavior optional + PageViewer QuickOpen을 os로 전환

**Architecture:** 모든 onKeyDown 핸들러에 `if (event.defaultPrevented) return` 가드를 기존 `target !== currentTarget` 가드 앞에 추가. behavior를 optional로 만들어 keyMap-only Aria 허용. PageViewer의 QuickOpen을 `<Aria behavior={combobox}>`로 전환하고 body를 keyMap-only Aria로 래핑.

**Tech Stack:** React, TypeScript, Vitest, @testing-library/react, userEvent

**PRD:** `docs/superpowers/specs/2026-03-21-nested-aria-bubbling-prd.md`

---

### Task 1: defaultPrevented 가드 추가 (useAria.ts + useAriaZone.ts)

**Files:**
- Modify: `src/interactive-os/hooks/useAria.ts:255-265` (아이템 onKeyDown)
- Modify: `src/interactive-os/hooks/useAria.ts:278-288` (컨테이너 onKeyDown)
- Modify: `src/interactive-os/hooks/useAriaZone.ts:346` (아이템 onKeyDown)
- Modify: `src/interactive-os/hooks/useAriaZone.ts:370` (컨테이너 onKeyDown)
- Test: `src/interactive-os/__tests__/nested-aria-bubbling.test.tsx` (신규)

> **주의:** onFocus 가드 (useAria L247, useAriaZone L337)는 건드리지 않는다 — focus 이벤트는 defaultPrevented 패턴이 아님.

- [ ] **Step 1: 중첩 Aria 버블링 테스트 작성**

테스트는 DOM 상태로 검증한다 (mock 호출 검증 금지).
부모 keyMap이 호출되면 `data-quick-open="true"` 속성을 토글하고, DOM에서 해당 속성의 존재 여부로 검증.

```tsx
// src/interactive-os/__tests__/nested-aria-bubbling.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { useState } from 'react'
import { Aria } from '../components/aria'
import { listbox } from '../behaviors/listbox'
import { ROOT_ID } from '../core/types'
import { core } from '../plugins/core'
import type { Command } from '../core/types'
import type { BehaviorContext } from '../behaviors/types'

function fixtureData() {
  return {
    entities: {
      a: { id: 'a', data: { label: 'A' } },
      b: { id: 'b', data: { label: 'B' } },
    },
    relationships: { [ROOT_ID]: ['a', 'b'] },
  }
}

function NestedAriaHarness({ parentKey }: { parentKey: string }) {
  const [opened, setOpened] = useState(false)
  return (
    <div data-testid="root" data-opened={opened || undefined}>
      <Aria
        keyMap={{ [parentKey]: (() => { setOpened(true); return undefined }) as (ctx: BehaviorContext) => Command | void }}
        data={{ entities: {}, relationships: { [ROOT_ID]: [] } }}
        plugins={[]}
      >
        <Aria behavior={listbox} data={fixtureData()} plugins={[core()]} aria-label="inner">
          <Aria.Item render={(node) => <span>{(node.data as Record<string, unknown>)?.label as string}</span>} />
        </Aria>
      </Aria>
    </div>
  )
}

describe('Nested Aria bubbling', () => {
  it('parent keyMap receives keys not handled by child', async () => {
    const user = userEvent.setup()
    const { getByTestId } = render(<NestedAriaHarness parentKey="Meta+p" />)

    const option = document.querySelector('[role="option"]')!
    await user.click(option)
    await user.keyboard('{Meta>}p{/Meta}')

    expect(getByTestId('root').hasAttribute('data-opened')).toBe(true)
  })

  it('parent does NOT receive keys already handled by child', async () => {
    const user = userEvent.setup()
    const { getByTestId } = render(<NestedAriaHarness parentKey="ArrowDown" />)

    const option = document.querySelector('[role="option"]')!
    await user.click(option)
    await user.keyboard('{ArrowDown}')

    // ArrowDown은 listbox가 처리 → preventDefault → 부모 스킵
    expect(getByTestId('root').hasAttribute('data-opened')).toBe(false)
  })

  it('keyMap-only Aria (no behavior) renders without role/tabIndex', () => {
    const { container } = render(
      <Aria
        keyMap={{ 'Meta+k': (() => undefined) as (ctx: BehaviorContext) => Command | void }}
        data={{ entities: {}, relationships: { [ROOT_ID]: [] } }}
        plugins={[]}
      >
        <button>child</button>
      </Aria>
    )

    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.getAttribute('role')).toBeNull()
    expect(wrapper.getAttribute('tabindex')).toBeNull()
    expect(wrapper.hasAttribute('data-aria-container')).toBe(true)
  })
})
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `pnpm vitest run src/interactive-os/__tests__/nested-aria-bubbling.test.tsx`
Expected: FAIL (behavior 없는 Aria 미지원 + 버블링 차단)

- [ ] **Step 3: useAria.ts에 defaultPrevented 가드 추가**

`src/interactive-os/hooks/useAria.ts` — 아이템 onKeyDown (L255 부근):
```ts
// 변경 전:
if (event.target !== event.currentTarget) return

// 변경 후:
if (event.defaultPrevented) return
if (event.target !== event.currentTarget) return
```

컨테이너 onKeyDown (L278 부근):
```ts
// 변경 전:
if (event.target !== event.currentTarget && isEditableElement(event.target as Element)) return

// 변경 후:
if (event.defaultPrevented) return
if (event.target !== event.currentTarget && isEditableElement(event.target as Element)) return
```

- [ ] **Step 4: useAriaZone.ts에 defaultPrevented 가드 추가**

`src/interactive-os/hooks/useAriaZone.ts` — 아이템 onKeyDown (L346):
```ts
if (event.defaultPrevented) return
if (event.target !== event.currentTarget) return
```

컨테이너 onKeyDown (L370):
```ts
if (event.defaultPrevented) return
if (event.target !== event.currentTarget && isEditableElement(event.target as Element)) return
```

- [ ] **Step 5: behavior optional — useAria.ts**

`UseAriaOptions.behavior`를 optional로 변경:
```ts
export interface UseAriaOptions {
  behavior?: AriaBehavior
  // ... 나머지 동일
}
```

`useAria` 함수 내부 분기:
- behavior 없으면 containerProps에서 `onKeyDown`만 등록
- containerProps.onKeyDown: `if (event.defaultPrevented) return` 가드 후 keyMap 매칭. **매칭 성공 시 `event.preventDefault()` 호출** (상위 Aria로의 추가 버블링 차단)
- `target !== currentTarget` 가드 없음 (버블링 수신 목적)
- role, tabIndex, activedescendant 생략
- getNodeProps는 빈 객체 반환

- [ ] **Step 6: behavior optional — aria.tsx**

`AriaProps.behavior`를 optional로 변경.

AriaRoot 분기:
- behavior 없으면 `<div>` 래퍼에서 role, aria-orientation, style 생략
- `data-aria-container`는 유지
- containerProps 스프레드 유지 (keyMap onKeyDown 포함)

- [ ] **Step 7: 테스트 전체 통과 확인**

Run: `pnpm vitest run src/interactive-os/__tests__/`
Expected: 기존 테스트 전부 PASS + 새 테스트 3개 PASS

- [ ] **Step 8: 커밋**

```bash
git add src/interactive-os/hooks/useAria.ts src/interactive-os/hooks/useAriaZone.ts src/interactive-os/components/aria.tsx src/interactive-os/__tests__/nested-aria-bubbling.test.tsx
git commit -m "feat(engine): nested Aria bubbling via defaultPrevented + behavior optional"
```

---

### Task 2: PageViewer QuickOpen → os combobox 전환

**Files:**
- Modify: `src/pages/PageViewer.tsx:421-547` (QuickOpen 컴포넌트)
- Modify: `src/pages/PageViewer.tsx:551-748` (PageViewer body Aria 래핑, addEventListener 제거)

**Imports 추가:**
- `import { combobox } from '../interactive-os/behaviors/combobox'`
- `import { combobox as comboboxPlugin } from '../interactive-os/plugins/combobox'`
- `import { Aria }` (이미 import됨)

QuickOpen 전환 요약:
1. `role="dialog"`, `role="combobox"`, `role="listbox"`, `role="option"` 하드코딩 제거
2. `onKeyDown={handleInputKeyDown}` 제거
3. `window.addEventListener('keydown', handler)` 제거
4. QuickOpen 내부에서 Fuse.js 검색 결과를 `useMemo`로 NormalizedData 변환:
   ```ts
   const comboboxData = useMemo(() => ({
     entities: Object.fromEntries(results.map(f => [f.id, { id: f.id, data: f }])),
     relationships: { [ROOT_ID]: results.map(f => f.id) },
   }), [results])
   ```
5. `<Aria behavior={combobox()} plugins={[core(), comboboxPlugin()]}>`로 래핑
6. `<Aria.Item>` render로 파일 아이콘 + 경로 표시
7. combobox close → onChange 콜백에서 isOpen 체크 → onClose 호출
8. combobox select → onChange 콜백에서 선택된 아이템의 path로 onSelect 호출

- [x] **Step 1: QuickOpen 컴포넌트를 os combobox로 교체**

- Fuse.js 검색은 그대로 유지
- 검색 결과를 NormalizedData로 변환 (위 코드 참조)
- `<Aria behavior={combobox()}>` + `<Aria.Item>` 사용
- handleInputKeyDown, focusIndex state, role 하드코딩 모두 제거
- onClose는 combobox close onChange에서 처리
- 기존 backdrop click close 유지

- [x] **Step 2: PageViewer body를 keyMap-only Aria로 래핑**

```tsx
<Aria
  keyMap={{ 'Meta+p': () => { setQuickOpenVisible(true); return undefined } }}
  data={{ entities: {}, relationships: { [ROOT_ID]: [] } }}
  plugins={[]}
>
  <div className="vw">
    {/* 기존 내용 */}
  </div>
</Aria>
```

`useEffect`의 `window.addEventListener('keydown')` 블록 (L602-611) 제거.

- [x] **Step 3: TypeScript 에러 확인**

Run: `pnpm tsc --noEmit`
Expected: 에러 0

- [x] **Step 4: 기존 테스트 통과 확인**

Run: `pnpm vitest run`
Expected: 전부 PASS

- [x] **Step 5: `pnpm health` 재실행 → PageViewer 징후 확인**

Run: `pnpm health`
Expected: PageViewer의 addEventListener, hardcoded role, onKeyDown direct 징후 0건

- [x] **Step 6: 커밋**

```bash
git add src/pages/PageViewer.tsx
git commit -m "feat(viewer): migrate QuickOpen to os combobox + body keyMap Aria"
```
