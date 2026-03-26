# Value Axis (6번째 축) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 6번째 축 `value()`를 추가하여 연속 값(min/max/step) 위젯(slider, spinbutton)을 지원한다.

**Architecture:** meta-entity `__value__`로 위젯 상태 관리, `BehaviorContext.value?` optional namespace(grid? 패턴), `valueCommands`로 Command 생성. slider/spinbutton behavior는 factory function으로 사용자에게 제공하고 내부 축 합성은 은닉.

**Tech Stack:** TypeScript, React, Vitest, @testing-library/react, userEvent

**PRD:** `docs/superpowers/prds/2026-03-21-value-axis-prd.md`

---

### Task 1: valueCommands + VALUE_ID (core plugin 확장)

**Files:**
- Modify: `src/interactive-os/plugins/core.ts`

- [ ] **Step 1: Write valueCommands**

`core.ts` 끝, `gridColCommands` 아래에 추가:

```typescript
export const VALUE_ID = '__value__'

export interface ValueRange {
  min: number
  max: number
  step: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Round to avoid floating-point drift (e.g. 0.1 + 0.2 !== 0.3) */
function roundToStep(value: number, step: number): number {
  const precision = Math.max(
    (step.toString().split('.')[1] || '').length,
    (value.toString().split('.')[1] || '').length,
  )
  return Number(value.toFixed(precision))
}

export const valueCommands = {
  setValue(value: number, range: ValueRange): Command {
    let prev: number | undefined
    const clamped = clamp(roundToStep(value, range.step), range.min, range.max)
    return {
      type: 'core:set-value',
      payload: { value: clamped },
      execute(store) {
        prev = (store.entities[VALUE_ID] as Record<string, unknown>)?.value as number | undefined
        return {
          ...store,
          entities: {
            ...store.entities,
            [VALUE_ID]: { id: VALUE_ID, value: clamped, min: range.min, max: range.max, step: range.step },
          },
        }
      },
      undo(store) {
        if (prev === undefined) {
          const { [VALUE_ID]: _removed, ...rest } = store.entities
          void _removed
          return { ...store, entities: rest }
        }
        return {
          ...store,
          entities: {
            ...store.entities,
            [VALUE_ID]: { id: VALUE_ID, value: prev, min: range.min, max: range.max, step: range.step },
          },
        }
      },
    }
  },

  increment(step: number, range: ValueRange): Command {
    const store_ref = { prev: 0 }
    return {
      type: 'core:increment-value',
      payload: { step },
      execute(store) {
        const current = ((store.entities[VALUE_ID] as Record<string, unknown>)?.value as number) ?? range.min
        store_ref.prev = current
        const next = clamp(roundToStep(current + step, range.step), range.min, range.max)
        return {
          ...store,
          entities: {
            ...store.entities,
            [VALUE_ID]: { id: VALUE_ID, value: next, min: range.min, max: range.max, step: range.step },
          },
        }
      },
      undo(store) {
        return {
          ...store,
          entities: {
            ...store.entities,
            [VALUE_ID]: { id: VALUE_ID, value: store_ref.prev, min: range.min, max: range.max, step: range.step },
          },
        }
      },
    }
  },

  decrement(step: number, range: ValueRange): Command {
    return valueCommands.increment(-step, range)
  },
}
```

- [ ] **Step 2: Run existing tests to verify no breakage**

Run: `pnpm vitest run`
Expected: 모든 기존 테스트 PASS

- [ ] **Step 3: Commit**

```bash
git add src/interactive-os/plugins/core.ts
git commit -m "feat(core): add valueCommands + VALUE_ID meta-entity for continuous value axis"
```

---

### Task 2: types 확장 (ValueNav, BehaviorContext.value?, AriaBehavior.valueRange?)

**Files:**
- Modify: `src/interactive-os/behaviors/types.ts`
- Modify: `src/interactive-os/axes/composePattern.ts`

- [ ] **Step 1: Add ValueNav and extend BehaviorContext**

`behaviors/types.ts`에 추가:

```typescript
// GridNav 아래에 추가
export interface ValueNav {
  current: number
  min: number
  max: number
  step: number
  increment(step?: number): Command
  decrement(step?: number): Command
  setToMin(): Command
  setToMax(): Command
  setValue(value: number): Command
}
```

`BehaviorContext`에 추가:

```typescript
  grid?: GridNav
  value?: ValueNav  // ← 추가
```

`NodeState`에 추가 (ariaAttributes에서 현재 값을 읽기 위해):

```typescript
export interface NodeState {
  // ... 기존 필드 ...
  valueCurrent?: number  // ← 추가: value axis의 현재 값
  [key: string]: unknown
}
```

`AriaBehavior`에 추가 (`ValueRange` 타입을 core.ts에서 재사용):

```typescript
import type { ValueRange } from '../plugins/core'

  colCount?: number
  /** Value range for continuous value widgets (slider, spinbutton). */
  valueRange?: ValueRange  // ← 추가
```

- [ ] **Step 2: Extend AxisConfig in composePattern.ts**

`axes/composePattern.ts`의 `AxisConfig`에 추가 (`ValueRange` 타입 재사용):

```typescript
import type { ValueRange } from '../plugins/core'

export interface AxisConfig {
  // ... 기존 필드 ...
  colCount: number
  valueRange: ValueRange  // ← 추가
}
```

`composePattern` 함수의 v2 Identity path에 추가 (colCount 전파 바로 아래):

```typescript
  ...(mergedConfig.valueRange !== undefined && { valueRange: mergedConfig.valueRange }),
```

v1 PatternConfig path에도 동일하게 추가.

- [ ] **Step 3: Run existing tests**

Run: `pnpm vitest run`
Expected: 모든 기존 테스트 PASS (optional 필드만 추가, 기존 코드 무영향)

- [ ] **Step 4: Commit**

```bash
git add src/interactive-os/behaviors/types.ts src/interactive-os/axes/composePattern.ts
git commit -m "feat(types): add ValueNav, BehaviorContext.value?, AriaBehavior.valueRange?"
```

---

### Task 3: createBehaviorContext에 value namespace 생성

**Files:**
- Modify: `src/interactive-os/behaviors/createBehaviorContext.ts`

- [ ] **Step 1: Add valueRange to BehaviorContextOptions**

```typescript
import type { ValueRange } from '../plugins/core'

export interface BehaviorContextOptions {
  expandable?: boolean
  selectionMode?: SelectionMode
  colCount?: number
  valueRange?: ValueRange  // ← 추가
}
```

- [ ] **Step 2: Build ctx.value when valueRange present**

`createBehaviorContext` 함수 끝, `grid` 생성 블록 아래에 추가:

```typescript
import { valueCommands, VALUE_ID } from '../plugins/core'
import type { ValueNav } from './types'

// grid 블록 아래에:
const valueRange = options?.valueRange
const value: ValueNav | undefined = valueRange ? (() => {
  const currentValue = ((store.entities[VALUE_ID] as Record<string, unknown>)?.value as number) ?? valueRange.min
  return {
    current: currentValue,
    min: valueRange.min,
    max: valueRange.max,
    step: valueRange.step,
    increment: (s?: number) => valueCommands.increment(s ?? valueRange.step, valueRange),
    decrement: (s?: number) => valueCommands.decrement(s ?? valueRange.step, valueRange),
    setToMin: () => valueCommands.setValue(valueRange.min, valueRange),
    setToMax: () => valueCommands.setValue(valueRange.max, valueRange),
    setValue: (v: number) => valueCommands.setValue(v, valueRange),
  }
})() : undefined
```

return 객체에 `value` 추가:

```typescript
  return {
    // ... 기존 필드 ...
    grid,
    value,  // ← 추가
  }
```

- [ ] **Step 3: Run existing tests**

Run: `pnpm vitest run`
Expected: 모든 기존 테스트 PASS

- [ ] **Step 4: Commit**

```bash
git add src/interactive-os/behaviors/createBehaviorContext.ts
git commit -m "feat(context): build ctx.value namespace when valueRange is present"
```

---

### Task 4: useAria META_ENTITY_IDS에 VALUE_ID 등록

**Files:**
- Modify: `src/interactive-os/hooks/useAria.ts`

- [ ] **Step 1: Add VALUE_ID to META_ENTITY_IDS**

```typescript
import { focusCommands, FOCUS_ID, SELECTION_ID, SELECTION_ANCHOR_ID, EXPANDED_ID, GRID_COL_ID, VALUE_ID } from '../plugins/core'

const META_ENTITY_IDS = new Set([FOCUS_ID, SELECTION_ID, SELECTION_ANCHOR_ID, EXPANDED_ID, GRID_COL_ID, RENAME_ID, '__combobox__', '__spatial_parent__', VALUE_ID])
```

- [ ] **Step 2: Add valueRange to behaviorCtxOptions**

```typescript
  const behaviorCtxOptions = useMemo(
    () => ({
      expandable: behavior.expandable,
      selectionMode: behavior.selectionMode,
      colCount: behavior.colCount,
      valueRange: behavior.valueRange,  // ← 추가
    }),
    [behavior.expandable, behavior.selectionMode, behavior.colCount, behavior.valueRange]
  )
```

- [ ] **Step 3: Add valueCurrent to getNodeState**

`getNodeState` 함수 안, return 객체에 추가:

```typescript
  // getNodeState 함수 밖, store 읽는 부분에:
  const valueMeta = behavior.valueRange ? store.entities[VALUE_ID] as Record<string, unknown> | undefined : undefined

  // getNodeState return 객체에:
  ...(behavior.valueRange && { valueCurrent: (valueMeta?.value as number) ?? behavior.valueRange.min }),
```

- [ ] **Step 4: Run existing tests**

Run: `pnpm vitest run`
Expected: 모든 기존 테스트 PASS

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/hooks/useAria.ts
git commit -m "feat(useAria): register VALUE_ID in META_ENTITY_IDS, pass valueRange to context, add valueCurrent to NodeState"
```

---

### Task 5: value() 축

**Files:**
- Create: `src/interactive-os/axes/value.ts`

- [ ] **Step 1: Implement value axis**

```typescript
import type { AxisConfig, KeyMap } from './composePattern'
import type { BehaviorContext } from '../behaviors/types'

interface ValueOptions {
  min: number
  max: number
  step: number
  orientation?: 'horizontal' | 'vertical'  // slider=horizontal, spinbutton=vertical
}

export function value(options: ValueOptions): { keyMap: KeyMap; config: Partial<AxisConfig> } {
  const { min, max, step, orientation = 'horizontal' } = options
  const bigStep = step * 10

  const keyMap: KeyMap = {
    PageUp: (ctx: BehaviorContext) => ctx.value?.increment(bigStep),
    PageDown: (ctx: BehaviorContext) => ctx.value?.decrement(bigStep),
    Home: (ctx: BehaviorContext) => ctx.value?.setToMin(),
    End: (ctx: BehaviorContext) => ctx.value?.setToMax(),
  }

  // vertical: ArrowUp/Down only (spinbutton)
  keyMap['ArrowUp'] = (ctx: BehaviorContext) => ctx.value?.increment()
  keyMap['ArrowDown'] = (ctx: BehaviorContext) => ctx.value?.decrement()

  if (orientation === 'horizontal') {
    // horizontal adds ArrowRight/Left (slider)
    keyMap['ArrowRight'] = (ctx: BehaviorContext) => ctx.value?.increment()
    keyMap['ArrowLeft'] = (ctx: BehaviorContext) => ctx.value?.decrement()
  }

  return {
    keyMap,
    config: {
      valueRange: { min, max, step },
    },
  }
}
```

- [ ] **Step 2: Run existing tests**

Run: `pnpm vitest run`
Expected: 모든 기존 테스트 PASS

- [ ] **Step 3: Commit**

```bash
git add src/interactive-os/axes/value.ts
git commit -m "feat(axes): add value() axis for continuous value widgets"
```

---

### Task 6: slider behavior

**Files:**
- Create: `src/interactive-os/behaviors/slider.ts`
- Test: `src/interactive-os/__tests__/slider-keyboard.integration.test.tsx`

- [ ] **Step 1: Write slider behavior**

```typescript
import type { Entity } from '../core/types'
import type { NodeState } from './types'
import { composePattern } from '../axes/composePattern'
import { value } from '../axes/value'

interface SliderOptions {
  min: number
  max: number
  step: number
}

export function slider(options: SliderOptions) {
  const { min, max, step } = options

  return composePattern(
    {
      role: 'slider',
      ariaAttributes: (_node: Entity, state: NodeState) => ({
        'aria-valuenow': String(state.valueCurrent ?? min),
        'aria-valuemin': String(min),
        'aria-valuemax': String(max),
      }),
    },
    value({ min, max, step, orientation: 'horizontal' }),
  )
}
```

- [ ] **Step 2: Write the failing integration test**

```typescript
// src/interactive-os/__tests__/slider-keyboard.integration.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../components/aria'
import { slider } from '../behaviors/slider'
import { createStore } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'
import { core, VALUE_ID } from '../plugins/core'
import { history } from '../plugins/history'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      thumb: { id: 'thumb', data: { label: 'Volume' } },
    },
    relationships: {
      [ROOT_ID]: ['thumb'],
    },
  })
}

const sliderBehavior = slider({ min: 0, max: 100, step: 1 })

function renderSlider(data: NormalizedData, plugins = [core(), history()]) {
  return render(
    <Aria behavior={sliderBehavior} data={data} plugins={plugins}>
      <Aria.Item render={(item) => (
        <span data-testid="slider-thumb">
          {(item.data as Record<string, unknown>)?.label as string}
        </span>
      )} />
    </Aria>
  )
}

function getAriaValueNow(container: HTMLElement): string | null {
  return container.querySelector('[role="slider"]')?.getAttribute('aria-valuenow')
}

describe('Slider keyboard integration', () => {
  describe('increment/decrement', () => {
    it('ArrowRight increments value by step', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      container.querySelector<HTMLElement>('[data-node-id="thumb"]')!.focus()

      await user.keyboard('{ArrowRight}')

      expect(getAriaValueNow(container)).toBe('1')
    })

    it('ArrowLeft decrements value by step', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      container.querySelector<HTMLElement>('[data-node-id="thumb"]')!.focus()

      await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')
      await user.keyboard('{ArrowLeft}')

      expect(getAriaValueNow(container)).toBe('2')
    })

    it('ArrowUp increments value', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      container.querySelector<HTMLElement>('[data-node-id="thumb"]')!.focus()

      await user.keyboard('{ArrowUp}')

      expect(getAriaValueNow(container)).toBe('1')
    })

    it('ArrowDown decrements value', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      container.querySelector<HTMLElement>('[data-node-id="thumb"]')!.focus()

      await user.keyboard('{ArrowUp}{ArrowUp}{ArrowDown}')

      expect(getAriaValueNow(container)).toBe('1')
    })
  })

  describe('Home/End', () => {
    it('Home sets value to min', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      container.querySelector<HTMLElement>('[data-node-id="thumb"]')!.focus()

      await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')
      await user.keyboard('{Home}')

      expect(getAriaValueNow(container)).toBe('0')
    })

    it('End sets value to max', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      container.querySelector<HTMLElement>('[data-node-id="thumb"]')!.focus()

      await user.keyboard('{End}')

      expect(getAriaValueNow(container)).toBe('100')
    })
  })

  describe('PageUp/PageDown', () => {
    it('PageUp increments by step*10', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      container.querySelector<HTMLElement>('[data-node-id="thumb"]')!.focus()

      await user.keyboard('{PageUp}')

      expect(getAriaValueNow(container)).toBe('10')
    })

    it('PageDown at min clamps to min', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      container.querySelector<HTMLElement>('[data-node-id="thumb"]')!.focus()

      await user.keyboard('{PageDown}')

      expect(getAriaValueNow(container)).toBe('0')
    })
  })

  describe('clamping', () => {
    it('does not exceed max', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      container.querySelector<HTMLElement>('[data-node-id="thumb"]')!.focus()

      await user.keyboard('{End}{ArrowRight}')

      expect(getAriaValueNow(container)).toBe('100')
    })

    it('does not go below min', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      container.querySelector<HTMLElement>('[data-node-id="thumb"]')!.focus()

      await user.keyboard('{ArrowLeft}')

      expect(getAriaValueNow(container)).toBe('0')
    })
  })

  describe('undo/redo', () => {
    it('Mod+Z restores previous value', async () => {
      const user = userEvent.setup()
      const { container } = renderSlider(fixtureData())
      container.querySelector<HTMLElement>('[data-node-id="thumb"]')!.focus()

      await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')
      expect(getAriaValueNow(container)).toBe('3')

      await user.keyboard('{Control>}z{/Control}')

      expect(getAriaValueNow(container)).toBe('2')
    })
  })

  describe('ARIA attributes', () => {
    it('renders aria-valuemin and aria-valuemax', () => {
      const { container } = renderSlider(fixtureData())
      const el = container.querySelector('[role="slider"]')

      expect(el?.getAttribute('aria-valuemin')).toBe('0')
      expect(el?.getAttribute('aria-valuemax')).toBe('100')
    })
  })

  describe('onChange callback', () => {
    it('fires onChange with updated store after value change', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      const { container } = render(
        <Aria behavior={sliderBehavior} data={fixtureData()} plugins={[core()]} onChange={onChange}>
          <Aria.Item render={(item) => (
            <span>{(item.data as Record<string, unknown>)?.label as string}</span>
          )} />
        </Aria>
      )
      container.querySelector<HTMLElement>('[data-node-id="thumb"]')!.focus()

      await user.keyboard('{ArrowRight}')

      expect(onChange).toHaveBeenCalled()
      const newStore = onChange.mock.calls[onChange.mock.calls.length - 1][0]
      expect((newStore.entities['__value__'] as Record<string, unknown>).value).toBe(1)
    })
  })
})
```

- [ ] **Step 3: Run test to verify it passes**

Run: `pnpm vitest run src/interactive-os/__tests__/slider-keyboard.integration.test.tsx`
Expected: PASS (NodeState.valueCurrent는 Task 2+4에서 이미 추가됨)

- [ ] **Step 4: Run full test suite**

Run: `pnpm vitest run`
Expected: 모든 테스트 PASS

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/behaviors/slider.ts src/interactive-os/__tests__/slider-keyboard.integration.test.tsx
git commit -m "feat(behavior): add slider behavior with value axis integration + tests"
```

---

### Task 7: spinbutton behavior

**Files:**
- Create: `src/interactive-os/behaviors/spinbutton.ts`
- Test: `src/interactive-os/__tests__/spinbutton-keyboard.integration.test.tsx`

- [ ] **Step 1: Write spinbutton behavior**

```typescript
import type { Entity } from '../core/types'
import type { NodeState } from './types'
import { composePattern } from '../axes/composePattern'
import { value } from '../axes/value'

interface SpinbuttonOptions {
  min: number
  max: number
  step: number
}

export function spinbutton(options: SpinbuttonOptions) {
  const { min, max, step } = options

  return composePattern(
    {
      role: 'spinbutton',
      ariaAttributes: (_node: Entity, state: NodeState) => ({
        'aria-valuenow': String(state.valueCurrent ?? min),
        'aria-valuemin': String(min),
        'aria-valuemax': String(max),
      }),
    },
    value({ min, max, step, orientation: 'vertical' }),
  )
}
```

- [ ] **Step 2: Write integration test**

```typescript
// src/interactive-os/__tests__/spinbutton-keyboard.integration.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../components/aria'
import { spinbutton } from '../behaviors/spinbutton'
import { createStore } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'
import { core } from '../plugins/core'

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      input: { id: 'input', data: { label: 'Quantity' } },
    },
    relationships: {
      [ROOT_ID]: ['input'],
    },
  })
}

const spinBehavior = spinbutton({ min: 0, max: 10, step: 1 })

function renderSpinbutton(data: NormalizedData) {
  return render(
    <Aria behavior={spinBehavior} data={data} plugins={[core()]}>
      <Aria.Item render={(item) => (
        <span>{(item.data as Record<string, unknown>)?.label as string}</span>
      )} />
    </Aria>
  )
}

function getAriaValueNow(container: HTMLElement): string | null {
  return container.querySelector('[role="spinbutton"]')?.getAttribute('aria-valuenow')
}

describe('Spinbutton keyboard integration', () => {
  it('ArrowUp increments', async () => {
    const user = userEvent.setup()
    const { container } = renderSpinbutton(fixtureData())
    container.querySelector<HTMLElement>('[data-node-id="input"]')!.focus()

    await user.keyboard('{ArrowUp}')

    expect(getAriaValueNow(container)).toBe('1')
  })

  it('ArrowDown decrements', async () => {
    const user = userEvent.setup()
    const { container } = renderSpinbutton(fixtureData())
    container.querySelector<HTMLElement>('[data-node-id="input"]')!.focus()

    await user.keyboard('{ArrowUp}{ArrowUp}{ArrowDown}')

    expect(getAriaValueNow(container)).toBe('1')
  })

  it('ArrowRight does nothing (vertical only)', async () => {
    const user = userEvent.setup()
    const { container } = renderSpinbutton(fixtureData())
    container.querySelector<HTMLElement>('[data-node-id="input"]')!.focus()

    await user.keyboard('{ArrowRight}')

    expect(getAriaValueNow(container)).toBe('0')
  })

  it('Home/End sets min/max', async () => {
    const user = userEvent.setup()
    const { container } = renderSpinbutton(fixtureData())
    container.querySelector<HTMLElement>('[data-node-id="input"]')!.focus()

    await user.keyboard('{End}')
    expect(getAriaValueNow(container)).toBe('10')

    await user.keyboard('{Home}')
    expect(getAriaValueNow(container)).toBe('0')
  })

  it('clamps at boundaries', async () => {
    const user = userEvent.setup()
    const { container } = renderSpinbutton(fixtureData())
    container.querySelector<HTMLElement>('[data-node-id="input"]')!.focus()

    await user.keyboard('{ArrowDown}')
    expect(getAriaValueNow(container)).toBe('0')

    await user.keyboard('{End}{ArrowUp}')
    expect(getAriaValueNow(container)).toBe('10')
  })
})
```

- [ ] **Step 3: Run test**

Run: `pnpm vitest run src/interactive-os/__tests__/spinbutton-keyboard.integration.test.tsx`
Expected: PASS

- [ ] **Step 4: Run full test suite**

Run: `pnpm vitest run`
Expected: 모든 테스트 PASS

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/behaviors/spinbutton.ts src/interactive-os/__tests__/spinbutton-keyboard.integration.test.tsx
git commit -m "feat(behavior): add spinbutton behavior (vertical value axis) + tests"
```

---

### Task 8: floating-point precision test

**Files:**
- Test: `src/interactive-os/__tests__/slider-keyboard.integration.test.tsx` (기존 파일에 추가)

- [ ] **Step 1: Add floating-point test**

slider-keyboard.integration.test.tsx에 추가:

```typescript
describe('floating-point precision', () => {
  it('0.1 step increments accurately', async () => {
    const user = userEvent.setup()
    const decimalSlider = slider({ min: 0, max: 1, step: 0.1 })
    const { container } = render(
      <Aria behavior={decimalSlider} data={fixtureData()} plugins={[core()]}>
        <Aria.Item render={(item) => <span>{(item.data as Record<string, unknown>)?.label as string}</span>} />
      </Aria>
    )
    container.querySelector<HTMLElement>('[data-node-id="thumb"]')!.focus()

    // Press ArrowRight 10 times
    for (let i = 0; i < 10; i++) {
      await user.keyboard('{ArrowRight}')
    }

    expect(getAriaValueNow(container)).toBe('1')
  })
})
```

- [ ] **Step 2: Run test**

Run: `pnpm vitest run src/interactive-os/__tests__/slider-keyboard.integration.test.tsx`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/interactive-os/__tests__/slider-keyboard.integration.test.tsx
git commit -m "test(slider): add floating-point precision test (0.1 step × 10 = 1.0)"
```

---

### Task 9: UI 컴포넌트 (Slider.tsx, Spinbutton.tsx)

**Files:**
- Create: `src/interactive-os/ui/Slider.tsx`
- Create: `src/interactive-os/ui/slider.css`
- Create: `src/interactive-os/ui/Spinbutton.tsx`
- Create: `src/interactive-os/ui/spinbutton.css`

- [ ] **Step 1: Write Slider.tsx**

RadioGroup.tsx 패턴을 따른다:

```typescript
import React, { useRef } from 'react'
import './slider.css'
import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { slider as sliderBehavior } from '../behaviors/slider'
import { core, valueCommands } from '../plugins/core'
import { history } from '../plugins/history'
import { getAriaActions } from '../components/ariaRegistry'

interface SliderProps {
  id?: string
  data: NormalizedData
  min: number
  max: number
  step: number
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
}

export function Slider({
  id = 'slider',
  data,
  min,
  max,
  step,
  plugins = [core(), history()],
  onChange,
}: SliderProps) {
  const behavior = React.useMemo(() => sliderBehavior({ min, max, step }), [min, max, step])
  const trackRef = useRef<HTMLDivElement>(null)

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const newValue = min + pct * (max - min)
    const snapped = Math.round(newValue / step) * step
    const actions = getAriaActions(id)
    if (actions) {
      actions.dispatch(valueCommands.setValue(snapped, { min, max, step }))
    }
  }

  return (
    <Aria id={id} behavior={behavior} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Item render={(_item, state: NodeState) => {
        const pct = ((state.valueCurrent ?? min) - min) / (max - min) * 100
        return (
          <div className="slider-track" ref={trackRef} onClick={handleTrackClick}>
            <div className="slider-fill" style={{ width: `${pct}%` }} />
            <div className="slider-thumb" style={{ left: `${pct}%` }} />
            <span className="slider-value">{state.valueCurrent ?? min}</span>
          </div>
        )
      }} />
    </Aria>
  )
}
```

- [ ] **Step 2: Write slider.css**

```css
.slider-track {
  position: relative;
  height: 6px;
  background: var(--color-border, #444);
  border-radius: 3px;
  cursor: pointer;
  margin: 16px 0;
}

.slider-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: var(--color-accent, #58a6ff);
  border-radius: 3px;
  transition: width 50ms ease;
}

.slider-thumb {
  position: absolute;
  top: 50%;
  width: 16px;
  height: 16px;
  background: var(--color-accent, #58a6ff);
  border: 2px solid var(--color-bg, #0d1117);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: left 50ms ease;
}

[data-focused] .slider-thumb {
  box-shadow: 0 0 0 3px var(--color-focus-ring, rgba(88, 166, 255, 0.4));
}

.slider-value {
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: var(--color-text-secondary, #8b949e);
}
```

- [ ] **Step 3: Write Spinbutton.tsx**

```typescript
import React from 'react'
import './spinbutton.css'
import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { spinbutton as spinbuttonBehavior } from '../behaviors/spinbutton'
import { core } from '../plugins/core'

interface SpinbuttonProps {
  data: NormalizedData
  min: number
  max: number
  step: number
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  label?: string
}

export function Spinbutton({
  data,
  min,
  max,
  step,
  plugins = [core()],
  onChange,
  label,
}: SpinbuttonProps) {
  const behavior = React.useMemo(() => spinbuttonBehavior({ min, max, step }), [min, max, step])

  return (
    <Aria behavior={behavior} data={data} plugins={plugins} onChange={onChange} aria-label={label}>
      <Aria.Item render={(_item, state: NodeState) => (
        <div className="spinbutton-inner">
          <span className="spinbutton-value">{state.valueCurrent ?? min}</span>
        </div>
      )} />
    </Aria>
  )
}
```

- [ ] **Step 4: Write spinbutton.css**

```css
.spinbutton-inner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border: 1px solid var(--color-border, #444);
  border-radius: 4px;
  font-variant-numeric: tabular-nums;
}

[data-focused] .spinbutton-inner {
  border-color: var(--color-accent, #58a6ff);
  box-shadow: 0 0 0 2px var(--color-focus-ring, rgba(88, 166, 255, 0.4));
}

.spinbutton-value {
  min-width: 3ch;
  text-align: center;
}
```

- [ ] **Step 5: Run full test suite**

Run: `pnpm vitest run`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/interactive-os/ui/Slider.tsx src/interactive-os/ui/slider.css src/interactive-os/ui/Spinbutton.tsx src/interactive-os/ui/spinbutton.css
git commit -m "feat(ui): add Slider + Spinbutton reference components"
```

---

### Task 10: 데모 페이지 + 라우팅

**Files:**
- Create: `src/pages/PageSlider.tsx`
- Create: `src/pages/PageSpinbutton.tsx`
- Modify: `src/App.tsx` (라우트 추가)

- [ ] **Step 1: Write PageSlider.tsx**

PageRadioGroup.tsx 패턴을 따른다:

```typescript
import { Slider } from '../interactive-os/ui/Slider'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'

const sliderData = createStore({
  entities: {
    thumb: { id: 'thumb', data: { label: 'Volume' } },
  },
  relationships: {
    [ROOT_ID]: ['thumb'],
  },
})

export default function PageSlider() {
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Slider</h2>
        <p className="page-desc">Continuous value slider following W3C APG slider pattern</p>
      </div>
      <div className="page-keys">
        <kbd>←→↑↓</kbd> <span className="key-hint">±step</span>{' '}
        <kbd>PgUp/PgDn</kbd> <span className="key-hint">±step×10</span>{' '}
        <kbd>Home/End</kbd> <span className="key-hint">min/max</span>
      </div>
      <div className="card" style={{ padding: '32px 24px' }}>
        <Slider data={sliderData} min={0} max={100} step={1} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write PageSpinbutton.tsx**

```typescript
import { Spinbutton } from '../interactive-os/ui/Spinbutton'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'

const spinData = createStore({
  entities: {
    input: { id: 'input', data: { label: 'Quantity' } },
  },
  relationships: {
    [ROOT_ID]: ['input'],
  },
})

export default function PageSpinbutton() {
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Spinbutton</h2>
        <p className="page-desc">Numeric spinner following W3C APG spinbutton pattern</p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">±step</span>{' '}
        <kbd>PgUp/PgDn</kbd> <span className="key-hint">±step×10</span>{' '}
        <kbd>Home/End</kbd> <span className="key-hint">min/max</span>
      </div>
      <div className="card" style={{ padding: '24px' }}>
        <Spinbutton data={spinData} min={0} max={99} step={1} label="Quantity" />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Add routes to App.tsx**

Import + route 추가 (Navigation 그룹 내, radiogroup 아래):

```typescript
import PageSlider from './pages/PageSlider'
import PageSpinbutton from './pages/PageSpinbutton'

// Navigation 라우트 배열에 추가:
{ path: 'slider', label: 'Slider', status: 'ready', component: PageSlider },
{ path: 'spinbutton', label: 'Spinbutton', status: 'ready', component: PageSpinbutton },
```

- [ ] **Step 4: Run dev server and verify pages render**

Run: `pnpm dev`
Navigate: `/navigation/slider`, `/navigation/spinbutton`

- [ ] **Step 5: Commit**

```bash
git add src/pages/PageSlider.tsx src/pages/PageSpinbutton.tsx src/App.tsx
git commit -m "feat(app): add Slider + Spinbutton demo pages in Navigation layer"
```

---

### Task 11: package.json exports + PROGRESS.md

**Files:**
- Modify: `package.json`
- Modify: `docs/PROGRESS.md`

- [ ] **Step 1: Add exports to package.json**

```json
"./behaviors/slider": {
  "import": "./dist-lib/behaviors/slider.js",
  "types": "./dist-lib/behaviors/slider.d.ts"
},
"./behaviors/spinbutton": {
  "import": "./dist-lib/behaviors/spinbutton.js",
  "types": "./dist-lib/behaviors/spinbutton.d.ts"
},
"./ui/Slider": {
  "import": "./dist-lib/ui/Slider.js",
  "types": "./dist-lib/ui/Slider.d.ts"
},
"./ui/Spinbutton": {
  "import": "./dist-lib/ui/Spinbutton.js",
  "types": "./dist-lib/ui/Spinbutton.d.ts"
},
"./axes/value": {
  "import": "./dist-lib/axes/value.js",
  "types": "./dist-lib/axes/value.d.ts"
}
```

tsup config에도 entry 추가 (있다면).

- [ ] **Step 2: Update PROGRESS.md**

④ ARIA Behavior Layer에 추가:
```markdown
- [x] slider — 연속 값 (value axis), ArrowRight/Left/Up/Down ±step, Home/End min/max, PageUp/PageDown ±step×10
- [x] spinbutton — 연속 값 (value axis, vertical), ArrowUp/Down ±step
```

⑤ Components + Hooks에 추가:
```markdown
- [x] `BehaviorContext.value?` — ValueNav optional namespace (grid? 패턴), increment/decrement/setValue
- [x] `__value__` meta-entity — 연속 값 위젯 상태 관리
```

⑥ UI Layer에 추가:
```markdown
- [x] Slider
- [x] Spinbutton
```

⑨ APG Pattern Coverage 테이블에서 Slider, Spinbutton을 Done으로 변경.

미구현 behavior에서 `[P2]` slider, spinbutton 항목 제거.

- [ ] **Step 3: Run full test suite + lint + build**

Run: `pnpm vitest run && pnpm lint && pnpm build:lib`
Expected: 모든 PASS

- [ ] **Step 4: Commit**

```bash
git add package.json docs/PROGRESS.md
git commit -m "feat: slider + spinbutton — value axis (6th axis) complete"
```
