# UI Showcase Template + ListBox 완성품 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** GOAL.md Phase 2 시작 — `/ui/{name}` 페이지 템플릿 구축 + ListBox를 첫 번째 완성품으로 구현. 이후 11개 컴포넌트는 이 패턴을 반복.

**Architecture:** `showcaseRegistry`의 `ComponentEntry`에 `testPath`와 `apg` 필드를 추가. `PageUiShowcase`의 컴포넌트 상세 뷰를 GOAL.md `/ui/{name}` 레이아웃(demo + test runner + usage + keyboard table)으로 교체. 개별 라우트가 아닌 기존 showcase의 slug 라우팅 활용.

**Tech Stack:** React, TestRunnerPanel, ApgKeyboardTable, showcaseRegistry

---

## `/ui/{name}` 페이지 목표 레이아웃

```
┌──────────────────────────────────────┐
│ {ComponentName}                      │
│ 설명 한 줄                            │
├──────────────────────────────────────┤
│ ┌──────────────────────────────────┐ │
│ │  [실제 컴포넌트 — render area]     │ │  ← TestRunnerPanel
│ └──────────────────────────────────┘ │
│                                      │
│ ▶ Run Test    9 passed  9 total      │  ← auto run on load
│  ● navigation                        │
│    ● ArrowDown moves focus...        │
├──────────────────────────────────────┤
│ ## Usage                             │
│ <ListBox data={data} />              │
├──────────────────────────────────────┤
│ ## Keyboard                          │
│ | Key | Action |                     │  ← APG 키보드 표
└──────────────────────────────────────┘
```

## File Structure

| 파일 | 변경 | 책임 |
|------|------|------|
| `src/pages/showcaseRegistry.tsx` | **Modify** | ComponentEntry에 testPath, apg 추가 |
| `src/pages/PageUiShowcase.tsx` | **Modify** | ComponentDemo를 새 레이아웃으로 교체 |
| `src/pages/PageUiShowcase.module.css` | **Modify** | test runner + keyboard table 스타일 |

---

### Task 1: ComponentEntry 타입 확장

**Files:**
- Modify: `src/pages/showcaseRegistry.tsx`

- [ ] **Step 1: ComponentEntry 인터페이스에 optional 필드 추가**

```tsx
export interface ComponentEntry {
  slug: string
  name: string
  description: string
  usage: string
  render: (data: NormalizedData, onChange: (d: NormalizedData) => void) => React.ReactNode
  makeData: () => NormalizedData
  testPath?: string     // e.g. 'src/interactive-os/__tests__/listbox-keyboard.integration.test'
  apg?: ApgPatternData  // APG keyboard table data
}
```

- [ ] **Step 2: listbox 엔트리에 testPath + apg 추가**

```tsx
import { apgListbox } from './apg-data'

// listbox entry에 추가:
{
  slug: 'listbox',
  // ... 기존 필드 유지
  testPath: 'src/interactive-os/__tests__/listbox-keyboard.integration.test',
  apg: apgListbox,
}
```

- [ ] **Step 3: lint 검증**

```bash
npx eslint src/pages/showcaseRegistry.tsx
```

---

### Task 2: PageUiShowcase 레이아웃 전환

**Files:**
- Modify: `src/pages/PageUiShowcase.tsx`
- Modify: `src/pages/PageUiShowcase.module.css`

- [ ] **Step 1: import 추가**

```tsx
import { TestRunnerPanel } from '../testRunner/TestRunnerPanel'
import { ApgKeyboardTable } from './ApgKeyboardTable'
```

- [ ] **Step 2: ComponentDemo 컴포넌트를 새 레이아웃으로 교체**

기존 ComponentDemo는 Live Demo + Usage만 보여줌. 새 구조:

```tsx
function ComponentDemo({ entry }: { entry: ComponentEntry }) {
  const [data, setData] = useState(() => entry.makeData())
  const onChange = useCallback((next: NormalizedData) => setData(next), [])

  return (
    <div className={styles.uiCard}>
      <h2 className={styles.uiCardHeading}>{entry.name}</h2>
      <p className={styles.uiCardDescription}>{entry.description}</p>

      {/* Visual Test Runner (test runner가 있으면 demo 대체) */}
      {entry.testPath ? (
        <div className={styles.uiTestRunner}>
          <TestRunnerPanel testPath={entry.testPath} autoRun />
        </div>
      ) : (
        <div className={styles.uiDemo}>
          <div className={styles.uiDemoLabel}>Live Demo</div>
          {entry.render(data, onChange)}
        </div>
      )}

      {/* Usage */}
      <div className={styles.uiCodeSection}>
        <div className={styles.uiCodeLabel}>Usage</div>
        <pre className={styles.uiCode}><code>{entry.usage}</code></pre>
      </div>

      {/* Keyboard (APG table) */}
      {entry.apg && (
        <div className={styles.uiKeyboardSection}>
          <div className={styles.uiCodeLabel}>Keyboard</div>
          <ApgKeyboardTable {...entry.apg} />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: CSS 추가**

`PageUiShowcase.module.css`에 test runner 영역 스타일 추가:

```css
.uiTestRunner {
  margin-bottom: 16px;
}

.uiKeyboardSection {
  margin-bottom: 32px;
}
```

- [ ] **Step 4: 빌드 검증**

```bash
npx tsc --noEmit
npx eslint src/pages/PageUiShowcase.tsx
```

---

### Task 3: 전체 검증

- [ ] **Step 1: TypeScript 검증**
```bash
npx tsc --noEmit
```

- [ ] **Step 2: Lint 검증**
```bash
npx eslint src/pages/showcaseRegistry.tsx src/pages/PageUiShowcase.tsx
```

- [ ] **Step 3: 테스트 실행**
```bash
npx vitest run
```

- [ ] **Step 4: 개발 서버에서 /ui/listbox 페이지 확인**
- TestRunnerPanel이 render area에 ListBox를 렌더
- 테스트 결과가 아래에 표시 (9 passed)
- Usage 코드 블록 표시
- APG Keyboard 표 표시
