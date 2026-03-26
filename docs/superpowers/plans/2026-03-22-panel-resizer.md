# Panel Resizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `useResizer` hook으로 CMS 3패널 + Agent Viewer 다중 컬럼에 드래그+키보드 resizer 추가

**Architecture:** engine 밖 독립 hook. pointer events로 드래그, APG Window Splitter 키보드(Arrow/Home/End). 드래그 중 CSS variable로 DOM 직접 조작(React 리렌더 방지), pointerup 시 state 확정 + localStorage persist.

**Tech Stack:** React hook, pointer events, CSS custom properties, localStorage, vitest + @testing-library

**PRD:** `docs/superpowers/prds/2026-03-22-panel-resizer-prd.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/hooks/useResizer.ts` (create) | 범용 resizer hook — pointer/keyboard handlers, size state, persist |
| `src/styles/resizer.css` (create) | `.resizer-handle` 공용 스타일 |
| `src/__tests__/useResizer.test.tsx` (create) | hook 통합 테스트 — pointer/keyboard → DOM 상태 |
| `src/pages/cms/CmsLayout.tsx` (modify) | sidebar↔canvas, canvas↔detail 경계에 resizer 적용 |
| `src/styles/cms.css` (modify) | sidebar/detail 고정 width → CSS variable 전환 |
| `src/pages/PageAgentViewer.tsx` (modify) | sessions↔columns, column↔column 경계에 resizer 적용 |
| `src/pages/PageAgentViewer.module.css` (modify) | sessions 고정 width → CSS variable 전환 |

---

### Task 1: `useResizer` hook — 드래그 리사이즈

**Files:**
- Create: `src/hooks/useResizer.ts`
- Create: `src/__tests__/useResizer.test.tsx`

- [ ] **Step 1: 테스트 파일 생성 — 드래그 리사이즈 테스트**

```tsx
// src/__tests__/useResizer.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { useResizer } from '../hooks/useResizer'

function TestHarness(props: { defaultSize?: number; minSize?: number; maxSize?: number }) {
  const { separatorProps, size } = useResizer({
    defaultSize: props.defaultSize ?? 200,
    minSize: props.minSize ?? 100,
    maxSize: props.maxSize ?? 400,
  })
  return (
    <div style={{ display: 'flex' }}>
      <div data-testid="panel" style={{ width: size }} />
      <div data-testid="separator" {...separatorProps} />
      <div style={{ flex: 1 }} />
    </div>
  )
}

describe('useResizer', () => {
  describe('drag resize', () => {
    it('renders separator with correct ARIA attributes', () => {
      const { getByTestId } = render(<TestHarness />)
      const sep = getByTestId('separator')
      expect(sep.getAttribute('role')).toBe('separator')
      expect(sep.getAttribute('aria-valuenow')).toBe('200')
      expect(sep.getAttribute('aria-valuemin')).toBe('100')
      expect(sep.getAttribute('aria-valuemax')).toBe('400')
      expect(sep.tabIndex).toBe(0)
      expect(sep.getAttribute('aria-orientation')).toBe('vertical')
    })

    it('updates size on pointer drag', () => {
      const { getByTestId } = render(<TestHarness />)
      const sep = getByTestId('separator')

      sep.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200, bubbles: true }))
      document.dispatchEvent(new PointerEvent('pointermove', { clientX: 250, bubbles: true }))
      document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))

      expect(getByTestId('separator').getAttribute('aria-valuenow')).toBe('250')
    })

    it('clamps to minSize', () => {
      const { getByTestId } = render(<TestHarness defaultSize={150} minSize={100} maxSize={400} />)
      const sep = getByTestId('separator')

      sep.dispatchEvent(new PointerEvent('pointerdown', { clientX: 150, bubbles: true }))
      document.dispatchEvent(new PointerEvent('pointermove', { clientX: 50, bubbles: true }))
      document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))

      expect(sep.getAttribute('aria-valuenow')).toBe('100')
    })

    it('clamps to maxSize', () => {
      const { getByTestId } = render(<TestHarness defaultSize={200} minSize={100} maxSize={400} />)
      const sep = getByTestId('separator')

      sep.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200, bubbles: true }))
      document.dispatchEvent(new PointerEvent('pointermove', { clientX: 700, bubbles: true }))
      document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))

      expect(sep.getAttribute('aria-valuenow')).toBe('400')
    })
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `pnpm vitest run src/__tests__/useResizer.test.tsx`
Expected: FAIL — `useResizer` not found

- [ ] **Step 3: `useResizer` hook 구현 — 드래그**

```ts
// src/hooks/useResizer.ts
import { useState, useCallback, useRef, useEffect } from 'react'

interface UseResizerOptions {
  defaultSize: number
  minSize: number
  maxSize: number
  direction?: 'horizontal' | 'vertical'
  step?: number
  storageKey?: string
}

function loadSize(key: string | undefined, defaultSize: number, min: number, max: number): number {
  if (!key) return defaultSize
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return defaultSize
    const v = Number(raw)
    return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : defaultSize
  } catch { return defaultSize }
}

export function useResizer(options: UseResizerOptions) {
  const { defaultSize, minSize, maxSize, direction = 'horizontal', step = 10, storageKey } = options
  const [size, setSize] = useState(() => loadSize(storageKey, defaultSize, minSize, maxSize))
  const dragging = useRef(false)
  const startX = useRef(0)
  const startSize = useRef(0)
  const sizeRef = useRef(size)
  sizeRef.current = size
  const separatorRef = useRef<HTMLElement | null>(null)

  const clamp = useCallback((v: number) => Math.min(maxSize, Math.max(minSize, v)), [minSize, maxSize])

  const persist = useCallback((v: number) => {
    if (storageKey) localStorage.setItem(storageKey, String(v))
  }, [storageKey])

  const commitSize = useCallback((v: number) => {
    const clamped = clamp(v)
    setSize(clamped)
    persist(clamped)
  }, [clamp, persist])

  // pointer handlers on document (move/up)
  // F2: 드래그 중에는 ref만 갱신 + aria-valuenow DOM 직접 조작.
  // setState는 pointerup 시에만 호출하여 리렌더 방지.
  // 패널 폭은 CSS variable(--resizer-size)로 부모가 읽어서 적용.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return
      const delta = e.clientX - startX.current
      const next = clamp(startSize.current + delta)
      sizeRef.current = next
      // DOM 직접 조작 — React 리렌더 없음
      const el = separatorRef.current
      if (el) {
        el.setAttribute('aria-valuenow', String(next))
        el.style.setProperty('--resizer-size', `${next}px`)
        // 왼쪽 패널(previousElementSibling)에 width 직접 적용
        const panel = el.previousElementSibling as HTMLElement | null
        if (panel) panel.style.width = `${next}px`
      }
    }
    const onUp = () => {
      if (!dragging.current) return
      dragging.current = false
      // pointerup 시에만 React state 확정 + persist
      commitSize(sizeRef.current)
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }
  }, [clamp, commitSize])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true
    startX.current = e.clientX
    startSize.current = sizeRef.current
    separatorRef.current = e.currentTarget as HTMLElement
    e.preventDefault()
  }, [])

  const isHorizontal = direction === 'horizontal'
  const growKey = isHorizontal ? 'ArrowRight' : 'ArrowDown'
  const shrinkKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp'

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case growKey: commitSize(sizeRef.current + step); e.preventDefault(); break
      case shrinkKey: commitSize(sizeRef.current - step); e.preventDefault(); break
      case 'Home': commitSize(minSize); e.preventDefault(); break
      case 'End': commitSize(maxSize); e.preventDefault(); break
    }
  }, [growKey, shrinkKey, step, minSize, maxSize, commitSize])

  const onDoubleClick = useCallback(() => {
    commitSize(defaultSize)
  }, [defaultSize, commitSize])

  const separatorProps = {
    role: 'separator' as const,
    'aria-orientation': (isHorizontal ? 'vertical' : 'horizontal') as 'vertical' | 'horizontal',
    'aria-valuenow': size,
    'aria-valuemin': minSize,
    'aria-valuemax': maxSize,
    tabIndex: 0,
    onPointerDown,
    onKeyDown,
    onDoubleClick,
    style: { cursor: (isHorizontal ? 'col-resize' : 'row-resize') as string },
  }

  return { separatorProps, size }
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

Run: `pnpm vitest run src/__tests__/useResizer.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/hooks/useResizer.ts src/__tests__/useResizer.test.tsx
git commit -m "feat(resizer): useResizer hook with drag resize + ARIA separator"
```

---

### Task 2: `useResizer` — 키보드 + persist + 더블클릭

**Files:**
- Modify: `src/__tests__/useResizer.test.tsx`
- (hook 구현은 Task 1에서 이미 포함)

- [ ] **Step 1: 키보드/persist/더블클릭 테스트 추가**

`src/__tests__/useResizer.test.tsx`에 다음 테스트를 추가:

```tsx
import userEvent from '@testing-library/user-event'

// ... 기존 describe 내부에 추가:

describe('keyboard resize', () => {
  it('ArrowRight increases size by step', async () => {
    const user = userEvent.setup()
    const { getByTestId } = render(<TestHarness defaultSize={200} minSize={100} maxSize={400} />)
    const sep = getByTestId('separator')

    await user.click(sep)
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')

    expect(sep.getAttribute('aria-valuenow')).toBe('230')
  })

  it('ArrowLeft decreases size by step', async () => {
    const user = userEvent.setup()
    const { getByTestId } = render(<TestHarness defaultSize={200} minSize={100} maxSize={400} />)
    const sep = getByTestId('separator')

    await user.click(sep)
    await user.keyboard('{ArrowLeft}')

    expect(sep.getAttribute('aria-valuenow')).toBe('190')
  })

  it('Home sets minSize', async () => {
    const user = userEvent.setup()
    const { getByTestId } = render(<TestHarness defaultSize={200} minSize={100} maxSize={400} />)
    const sep = getByTestId('separator')

    await user.click(sep)
    await user.keyboard('{Home}')

    expect(sep.getAttribute('aria-valuenow')).toBe('100')
  })

  it('End sets maxSize', async () => {
    const user = userEvent.setup()
    const { getByTestId } = render(<TestHarness defaultSize={200} minSize={100} maxSize={400} />)
    const sep = getByTestId('separator')

    await user.click(sep)
    await user.keyboard('{End}')

    expect(sep.getAttribute('aria-valuenow')).toBe('400')
  })
})

describe('double-click reset', () => {
  it('resets to defaultSize on double-click', async () => {
    const user = userEvent.setup()
    const { getByTestId } = render(<TestHarness defaultSize={200} minSize={100} maxSize={400} />)
    const sep = getByTestId('separator')

    // Change size first
    await user.click(sep)
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')
    expect(sep.getAttribute('aria-valuenow')).toBe('230')

    // Double-click to reset
    await user.dblClick(sep)
    expect(sep.getAttribute('aria-valuenow')).toBe('200')
  })
})

describe('localStorage persist', () => {
  beforeEach(() => localStorage.clear())

  function PersistHarness() {
    const { separatorProps, size } = useResizer({
      defaultSize: 200, minSize: 100, maxSize: 400, storageKey: 'test-panel',
    })
    return (
      <div style={{ display: 'flex' }}>
        <div data-testid="panel" style={{ width: size }} />
        <div data-testid="separator" {...separatorProps} />
      </div>
    )
  }

  it('persists size to localStorage on keyboard change', async () => {
    const user = userEvent.setup()
    const { getByTestId } = render(<PersistHarness />)

    await user.click(getByTestId('separator'))
    await user.keyboard('{ArrowRight}')

    expect(localStorage.getItem('test-panel')).toBe('210')
  })

  it('restores size from localStorage on mount', () => {
    localStorage.setItem('test-panel', '300')
    const { getByTestId } = render(<PersistHarness />)
    expect(getByTestId('separator').getAttribute('aria-valuenow')).toBe('300')
  })

  it('clamps stored value to min/max range', () => {
    localStorage.setItem('test-panel', '999')
    const { getByTestId } = render(<PersistHarness />)
    expect(getByTestId('separator').getAttribute('aria-valuenow')).toBe('400')
  })
})
```

- [ ] **Step 2: 테스트 실행 — 통과 확인**

Run: `pnpm vitest run src/__tests__/useResizer.test.tsx`
Expected: PASS (전체)

- [ ] **Step 3: 커밋**

```bash
git add src/__tests__/useResizer.test.tsx
git commit -m "test(resizer): keyboard, double-click reset, localStorage persist"
```

---

### Task 3: Resizer CSS

**Files:**
- Create: `src/styles/resizer.css`

- [ ] **Step 1: 공용 resizer 스타일 생성**

```css
/* src/styles/resizer.css */
.resizer-handle {
  width: 4px;
  flex-shrink: 0;
  cursor: col-resize;
  background: transparent;
  transition: background var(--transition-fast);
  position: relative;
  z-index: 1;
}

/* Wider hit area via pseudo-element */
.resizer-handle::after {
  content: '';
  position: absolute;
  inset: 0 -4px;
}

.resizer-handle:hover,
.resizer-handle:active {
  background: var(--accent);
}

.resizer-handle:focus-visible {
  background: var(--accent);
  outline: none;
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/styles/resizer.css
git commit -m "style(resizer): shared resizer-handle CSS"
```

---

### Task 4: CMS 레이아웃에 resizer 적용

**Files:**
- Modify: `src/pages/cms/CmsLayout.tsx`
- Modify: `src/styles/cms.css`

- [ ] **Step 1: `cms.css` — 고정 width를 제거하고 flex-basis 또는 inline style로 전환**

`cms.css` 변경:
```css
/* 기존: width: 120px; flex-shrink: 0; → flex-shrink: 0만 유지, width는 inline style로 제어 */
.cms-sidebar {
  flex-shrink: 0;
  background: var(--surface-1);
  border-right: 1px solid var(--border-dim);
  display: flex; flex-direction: column;
  overflow: hidden;
}

/* 기존: width: 240px; flex-shrink: 0; → 동일 */
.cms-detail-panel {
  flex-shrink: 0;
  background: var(--surface-1);
  border-left: 1px solid var(--border-dim);
  display: flex; flex-direction: column;
  overflow-y: auto;
}
```

- [ ] **Step 2: `CmsLayout.tsx` — resizer 삽입**

```tsx
// CmsLayout.tsx 상단에 추가
import { useResizer } from '../../hooks/useResizer'
import '../../styles/resizer.css'

// CmsLayout 함수 내부에 추가 (state 선언 영역):
const sidebarResizer = useResizer({
  defaultSize: 120, minSize: 80, maxSize: 300, step: 10,
  storageKey: 'cms-sidebar-width',
})
const detailResizer = useResizer({
  defaultSize: 240, minSize: 160, maxSize: 480, step: 10,
  storageKey: 'cms-detail-width',
})

// JSX — cms-body 내부 변경:
<div className="cms-body">
  <CmsSidebar ... style={{ width: sidebarResizer.size }} />
  <div className="resizer-handle" {...sidebarResizer.separatorProps} />
  <div className="cms-canvas-area">
    ...
  </div>
  <div className="resizer-handle" {...detailResizer.separatorProps} />
  <CmsDetailPanel ... style={{ width: detailResizer.size }} />
</div>
```

Note: `CmsSidebar`와 `CmsDetailPanel` 컴포넌트가 `style` prop을 받아서 루트 요소에 전달하도록 수정이 필요할 수 있다. 해당 컴포넌트를 확인하고, `style` prop 패스스루가 안 되면 wrapper div로 감싸거나 컴포넌트를 수정한다.

- [ ] **Step 3: 미디어쿼리 — 모바일에서 sidebar resizer 숨김**

```css
/* cms.css 기존 미디어쿼리 수정 */
@media (max-width: 600px) {
  .cms-sidebar { display: none; }
  .cms-sidebar + .resizer-handle { display: none; }
}
```

- [ ] **Step 4: dev server 확인 — `pnpm dev`로 CMS 페이지에서 드래그 동작 확인**

- [ ] **Step 5: 커밋**

```bash
git add src/pages/cms/CmsLayout.tsx src/styles/cms.css src/styles/resizer.css
git commit -m "feat(cms): add panel resizer to sidebar and detail panel"
```

---

### Task 5: Agent Viewer에 resizer 적용

**Files:**
- Modify: `src/pages/PageAgentViewer.tsx`
- Modify: `src/pages/PageAgentViewer.module.css`

- [ ] **Step 1: `PageAgentViewer.module.css` — sessions 고정 width 제거**

```css
/* 기존: width: 200px; min-width: 160px; → flex-shrink: 0만 유지, width는 inline style */
.avSessions {
  flex-shrink: 0;
  background: var(--surface-1);
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-dim);
}
```

- [ ] **Step 2: `PageAgentViewer.tsx` — sessions↔columns resizer 추가**

```tsx
// 상단 import 추가
import { useResizer } from '../hooks/useResizer'
import '../styles/resizer.css'

// 컴포넌트 내부
const sessionsResizer = useResizer({
  defaultSize: 200, minSize: 120, maxSize: 360, step: 10,
  storageKey: 'agent-sessions-width',
})
```

JSX 변경:
```tsx
{archiveSessions.length > 0 && (
  <>
    <div className={styles.avSessions} style={{ width: sessionsResizer.size }}>
      ...
    </div>
    <div className="resizer-handle" {...sessionsResizer.separatorProps} />
  </>
)}
```

- [ ] **Step 3: 컬럼 간 resizer — 각 TimelineColumn 사이에 resizer 삽입**

각 컬럼에 개별 `useResizer`를 적용하려면, 컬럼별 폭 상태가 필요하다. 동적 N개 컬럼에 대해:

```tsx
// 컬럼별 resizer를 위한 wrapper 컴포넌트
function ResizableColumn({ session, onClose, onFileClick }: {
  session: SessionInfo
  onClose: () => void
  onFileClick: (path: string, ranges?: string[]) => void
}) {
  const resizer = useResizer({
    defaultSize: 420, minSize: 280, maxSize: 800, step: 10,
    storageKey: `agent-col-${session.id}`,
  })

  return (
    <>
      <div style={{ width: resizer.size, flexShrink: 0 }}>
        <TimelineColumn
          sessionId={session.id}
          sessionLabel={session.label}
          isLive={session.active}
          onClose={onClose}
          onFileClick={onFileClick}
        />
      </div>
      <div className="resizer-handle" {...resizer.separatorProps} />
    </>
  )
}
```

마지막 컬럼 뒤에는 resizer가 불필요 — 마지막 컬럼은 `flex: 1`로 나머지 공간을 차지하거나, 동일한 wrapper에서 마지막 여부를 판단하여 resizer를 생략한다.

```tsx
// displayColumns.map 부분 변경
displayColumns.map((session, i) => {
  const isLast = i === displayColumns.length - 1
  return isLast ? (
    <div key={session.id} style={{ flex: 1, minWidth: 280 }}>
      <TimelineColumn ... />
    </div>
  ) : (
    <ResizableColumn key={session.id} session={session} onClose={...} onFileClick={handleFileClick} />
  )
})
```

- [ ] **Step 4: dev server 확인 — Agent Viewer에서 드래그 동작 확인**

- [ ] **Step 5: 커밋**

```bash
git add src/pages/PageAgentViewer.tsx src/pages/PageAgentViewer.module.css
git commit -m "feat(agent-viewer): add panel resizer to sessions and timeline columns"
```

---

### Task 6: 전체 검증

- [ ] **Step 1: TypeScript 검사**

Run: `pnpm tsc --noEmit`
Expected: 에러 0

- [ ] **Step 2: Lint 검사**

Run: `pnpm lint`
Expected: 에러 0

- [ ] **Step 3: 전체 테스트**

Run: `pnpm vitest run`
Expected: 전체 통과

- [ ] **Step 4: PROGRESS.md 업데이트**

Window Splitter 행의 체크리스트를 ✅로 변경 (해당하는 항목)

- [ ] **Step 5: 커밋**

```bash
git add docs/PROGRESS.md
git commit -m "docs: mark panel resizer as implemented in PROGRESS.md"
```
