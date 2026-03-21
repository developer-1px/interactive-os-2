# Area MDX 문서 체계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** MDX 기반 Area 문서 체계를 구축하여 레이어별 모듈 지도(L2)와 모듈 상세(L3)를 Viewer에서 렌더링

**Architecture:** Vite에 `@mdx-js/rollup` 플러그인 추가 → `docs/2-areas/` MDX 파일 작성 → Viewer에 MDX 렌더링 라우트 추가. 기존 tsx 데모 페이지는 유지하면서 데모 컴포넌트만 분리하여 MDX에서 import.

**Tech Stack:** `@mdx-js/rollup`, `remark-gfm` (이미 설치됨), Vite, React, react-router-dom

**Spec:** `docs/superpowers/specs/2026-03-21-area-mdx-docs-prd.md`

---

## Scope

이 Plan은 **파일럿 범위**로 axes 레이어만 다룬다. 아래는 이 Plan에 포함하지 않으며, 파일럿 검증 후 별도 Plan으로 진행:
- `overview.mdx` (L1) — 전체 레이어가 Area MDX로 전환된 후 작성
- `/area` 스킬 — 파일럿에서 워크플로우 검증 후 스킬로 정형화
- 나머지 레이어 Area MDX (patterns, plugins, hooks, ui, pages)

## File Structure

```
vite.config.ts                              — Modify: MDX 플러그인 추가
package.json                                — Modify: @mdx-js/rollup 의존성 추가
src/mdx.d.ts                                — Create: MDX 모듈 타입 선언
docs/2-areas/axes.mdx                       — Create: L2 axes 주기율표 (파일럿)
docs/2-areas/axes/navigate.mdx              — Create: L3 navigate 모듈 상세 (파일럿)
docs/2-areas/axes/trigger-popup.mdx         — Create: L3 ⬜ 빈칸 (최소 컨텐츠)
src/pages/axis/NavigateDemo.tsx             — Create: PageNavigate에서 데모 부분 분리
src/pages/PageAreaViewer.tsx                — Create: MDX 렌더링 페이지
src/App.tsx                                 — Modify: Area 라우트 추가
```

---

### Task 1: MDX 빌드 인프라

**Files:**
- Modify: `package.json` — `@mdx-js/rollup` devDependency 추가
- Modify: `vite.config.ts` — MDX 플러그인 추가
- Create: `src/mdx.d.ts` — MDX 타입 선언

- [ ] **Step 1: @mdx-js/rollup 설치**

```bash
pnpm add -D @mdx-js/rollup
```

- [ ] **Step 2: Vite 설정에 MDX 플러그인 추가**

`vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import { fsPlugin } from './vite-plugin-fs'

export default defineConfig({
  plugins: [
    mdx({ remarkPlugins: [remarkGfm] }),
    react(),
    fsPlugin(),
  ],
})
```

주의: `mdx()` 플러그인은 `react()` 보다 **앞에** 와야 함 (MDX → JSX → React 순서).

- [ ] **Step 3: MDX 타입 선언 파일 생성**

`src/mdx.d.ts`:
```ts
declare module '*.mdx' {
  import type { ComponentType } from 'react'
  const component: ComponentType
  export default component
}
```

- [ ] **Step 4: 빌드 검증**

```bash
pnpm dev
```

Expected: dev 서버 정상 시작, 기존 페이지 동작 확인

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts package.json pnpm-lock.yaml src/mdx.d.ts
git commit -m "chore: add @mdx-js/rollup for MDX support"
```

---

### Task 2: NavigateDemo 컴포넌트 분리

**Files:**
- Create: `src/pages/axis/NavigateDemo.tsx` — 데모 인터랙션만 분리
- Modify: `src/pages/axis/PageNavigate.tsx` — NavigateDemo import로 교체

- [ ] **Step 1: NavigateDemo 컴포넌트 생성**

`src/pages/axis/NavigateDemo.tsx` — `PageNavigate.tsx`의 card 영역(line 95-129)과 컨트롤(line 43-94)을 별도 컴포넌트로 추출. 상태(orientation, wrap, mode)도 포함.

```tsx
import { useState } from 'react'
import { Aria } from '../../interactive-os/components/aria'
import { composePattern } from '../../interactive-os/axes/composePattern'
import { navigate } from '../../interactive-os/axes/navigate'
import { core } from '../../interactive-os/plugins/core'
import { focusRecovery } from '../../interactive-os/plugins/focusRecovery'
import type { NormalizedData } from '../../interactive-os/core/types'
import type { NodeState } from '../../interactive-os/behaviors/types'
import { axisListData, axisGridData, axisGridColumns } from './axis-demo-data'

type Orientation = 'vertical' | 'horizontal' | 'both'
type Mode = 'list' | 'grid'

const plugins = [core(), focusRecovery()]

export default function NavigateDemo() {
  const [orientation, setOrientation] = useState<Orientation>('vertical')
  const [wrap, setWrap] = useState(false)
  const [mode, setMode] = useState<Mode>('list')
  const [data, setData] = useState<NormalizedData>(axisListData)
  const [gridData, setGridData] = useState<NormalizedData>(axisGridData)

  const behavior = mode === 'grid'
    ? composePattern(
        { role: 'grid', childRole: 'row', ariaAttributes: () => ({}) },
        navigate({ grid: { columns: 3 } }),
      )
    : composePattern(
        { role: 'listbox', childRole: 'option', ariaAttributes: () => ({}) },
        navigate({ orientation, wrap }),
      )

  return (
    <>
      <div className="page-keys">
        {/* 모드 선택 + orientation/wrap 컨트롤 (PageNavigate line 43-94 내용) */}
        <label style={{ marginRight: 12 }}>
          <select value={mode} onChange={(e) => setMode(e.target.value as Mode)} style={{ marginRight: 4 }}>
            <option value="list">List</option>
            <option value="grid">Grid</option>
          </select>
        </label>
        {mode === 'list' && (
          <>
            <label style={{ marginRight: 12 }}>
              <select value={orientation} onChange={(e) => setOrientation(e.target.value as Orientation)} style={{ marginRight: 4 }}>
                <option value="vertical">vertical</option>
                <option value="horizontal">horizontal</option>
                <option value="both">both</option>
              </select>
              orientation
            </label>
            <label>
              <input type="checkbox" checked={wrap} onChange={(e) => setWrap(e.target.checked)} />
              {' '}wrap
            </label>
          </>
        )}
      </div>
      <div className="page-keys">
        {/* 키 힌트 (PageNavigate line 66-94 내용) */}
        {mode === 'grid' ? (
          <>
            <kbd>↑↓</kbd> <span className="key-hint">row</span>{' '}
            <kbd>←→</kbd> <span className="key-hint">col</span>{' '}
            <kbd>Home/End</kbd> <span className="key-hint">col bounds</span>{' '}
            <kbd>⌘Home/End</kbd> <span className="key-hint">row bounds</span>
          </>
        ) : orientation === 'vertical' ? (
          <>
            <kbd>↑</kbd> <span className="key-hint">prev</span>{' '}
            <kbd>↓</kbd> <span className="key-hint">next</span>{' '}
            <kbd>Home</kbd> <span className="key-hint">first</span>{' '}
            <kbd>End</kbd> <span className="key-hint">last</span>
          </>
        ) : orientation === 'horizontal' ? (
          <>
            <kbd>←</kbd> <span className="key-hint">prev</span>{' '}
            <kbd>→</kbd> <span className="key-hint">next</span>{' '}
            <kbd>Home</kbd> <span className="key-hint">first</span>{' '}
            <kbd>End</kbd> <span className="key-hint">last</span>
          </>
        ) : (
          <>
            <kbd>↑←</kbd> <span className="key-hint">prev</span>{' '}
            <kbd>↓→</kbd> <span className="key-hint">next</span>
          </>
        )}
      </div>
      <div className="card">
        {/* 데모 위젯 (PageNavigate line 96-129 내용) */}
        {mode === 'grid' ? (
          <>
            <table className="grid-table" role="presentation">
              <thead>
                <tr>
                  {axisGridColumns.map((col) => (
                    <th key={col.key}>{col.header}</th>
                  ))}
                </tr>
              </thead>
            </table>
            <Aria behavior={behavior} data={gridData} plugins={plugins} onChange={setGridData} aria-label="navigate grid demo">
              <Aria.Item render={(node, state: NodeState) => {
                const cells = (node.data as Record<string, unknown>)?.cells as string[]
                const cls = ['grid-row', state.focused && 'grid-row--focused'].filter(Boolean).join(' ')
                return (
                  <div className={cls}>
                    {cells?.map((cell, i) => (
                      <Aria.Cell key={i} index={i}><span>{cell}</span></Aria.Cell>
                    ))}
                  </div>
                )
              }} />
            </Aria>
          </>
        ) : (
          <Aria behavior={behavior} data={data} plugins={plugins} onChange={setData} aria-label="navigate demo">
            <Aria.Item render={(node, state: NodeState) => {
              const d = node.data as Record<string, unknown>
              const cls = ['list-item', state.focused && 'list-item--focused'].filter(Boolean).join(' ')
              return <div className={cls}>{d?.label as string}</div>
            }} />
          </Aria>
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 2: PageNavigate에서 NavigateDemo import로 교체**

`src/pages/axis/PageNavigate.tsx` — page-header와 page-section 텍스트만 남기고 나머지를 NavigateDemo로 교체:

```tsx
import NavigateDemo from './NavigateDemo'

export default function PageNavigate() {
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">navigate()</h2>
        <p className="page-desc">
          Focus movement axis. Controls how arrow keys move focus between items.
          Toggle options below to see how behavior changes.
        </p>
      </div>
      <NavigateDemo />
      <div className="page-section">
        <h3 className="page-section-title">About navigate()</h3>
        <p className="page-desc">
          The <code>navigate()</code> axis controls focus movement. Options: <code>orientation</code> (vertical/horizontal/both),
          <code>wrap</code> (circular navigation), <code>grid</code> (2D with column tracking).
          It also sets <code>focusStrategy: roving-tabindex</code> in the pattern config.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: dev 서버에서 /axis/navigate 정상 동작 확인**

```bash
pnpm dev
```

Expected: 기존과 동일하게 동작

- [ ] **Step 4: Commit**

```bash
git add src/pages/axis/NavigateDemo.tsx src/pages/axis/PageNavigate.tsx
git commit -m "refactor: extract NavigateDemo from PageNavigate for MDX reuse"
```

---

### Task 3: L3 파일럿 — axes/navigate.mdx

**Files:**
- Create: `docs/2-areas/axes/navigate.mdx` — L3 모듈 상세

- [ ] **Step 1: axes 폴더 생성**

```bash
mkdir -p docs/2-areas/axes
```

- [ ] **Step 2: navigate.mdx 작성**

`docs/2-areas/axes/navigate.mdx`:
```mdx
import NavigateDemo from '../../../src/pages/axis/NavigateDemo'

# navigate()

> 키보드 네비게이션 축. ↑↓←→ Home End로 포커스를 이동한다.

## 스펙

| 키 | 동작 | 조건 |
|---|---|---|
| ↑ | focusPrev | orientation: vertical 또는 both |
| ↓ | focusNext | orientation: vertical 또는 both |
| ← | focusPrev | orientation: horizontal 또는 both |
| → | focusNext | orientation: horizontal 또는 both |
| Home | focusFirst | — |
| End | focusLast | — |

### 옵션

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| orientation | `'vertical' \| 'horizontal' \| 'both'` | `'vertical'` | 화살표 키 방향 |
| wrap | `boolean` | `false` | 끝에서 처음으로 순환 |
| grid | `{ columns: number }` | — | 2D 그리드 모드 (navGrid 활성화) |

## 관계

- **select**와 조합 → listbox multi-select (Shift+↑↓로 범위 선택)
- **expand**와 조합 → tree navigation (←→로 expand/collapse, depthArrow가 navigate보다 우선)
- **value**와 키 충돌 → ←→ 겹침 (chain of responsibility로 해결, value가 우선)
- **activate**와 독립 → Enter/Space는 navigate가 관여하지 않음

## 데모

<NavigateDemo />

## 관련

- [behavior-axis-decomposition-prd](/docs/superpowers/specs/2026-03-20-behavior-axis-decomposition-prd.md)
- 사용 패턴: listbox, tree, treegrid, grid, menu, toolbar, tabs, radiogroup, combobox
```

- [ ] **Step 3: Commit**

```bash
git add docs/2-areas/axes/navigate.mdx
git commit -m "docs: add L3 Area MDX pilot — axes/navigate"
```

---

### Task 4: L2 파일럿 — axes.mdx

**Files:**
- Create: `docs/2-areas/axes.mdx` — L2 주기율표

- [ ] **Step 1: axes.mdx 작성**

`docs/2-areas/axes.mdx`:
```mdx
# Axes

> 키맵 원자. 6개 축이 behavior(패턴)를 조합하는 빌딩블록. `composePattern(metadata, ...axes)` → `AriaBehavior`.

## 주기율표

| 축 | 함수 | 점유 키 | 사용 패턴 | 상태 |
|---|---|---|---|---|
| Navigation | `navigate()` | ↑↓←→ Home End | listbox, tree, grid, menu, toolbar, tabs, radiogroup, combobox | 🟢 |
| Selection | `select()` | Space, Shift+↑↓ Home End | listbox(multi), treegrid(multi) | 🟢 |
| Activation | `activate()` | Enter, Space(fallback) | listbox, menu, switch, toolbar | 🟢 |
| Expansion | `expand()` | ←→ (state-dependent) | tree, accordion, disclosure | 🟢 |
| Trap | `trap()` | Escape | dialog, alertdialog | 🟢 |
| Value | `value()` | ↑↓←→ min/max/step | slider, spinbutton | 🟢 |
| **Trigger↔Popup** | **—** | **?** | **combobox, tooltip, popover** | **⬜** |

## 의존 방향

```
core (Entity, Command, Store)
  ↓
axes (navigate, select, activate, expand, trap, value)
  ↓
behaviors (composePattern → AriaBehavior)
```

## 축 간 키 충돌 해결

축은 chain of responsibility로 합성된다. 같은 키를 여러 축이 점유하면 스택 위(우선순위 높은 축)부터 순회, 첫 번째 non-void Command가 승리한다.

| 충돌 키 | 축 A (우선) | 축 B | 해결 |
|--------|------------|------|------|
| ←→ | expand (depthArrow) | navigate | expand가 expanded 상태에서만 반응, 아니면 void → navigate로 fallback |
| ←→ | value | navigate | value가 slider에서만 사용, 조합하지 않음 |
| Space | select (selectToggle) | activate | select가 먼저 처리, select 없으면 activate로 fallback |

## 갭

- ⬜ **trigger↔popup**: combobox의 open/close, tooltip의 show/hide를 축으로 분리 가능한지 미결정. 현재 combobox behavior에 하드코딩.
```

- [ ] **Step 2: ⬜ 빈칸 L3 파일 생성**

`docs/2-areas/axes/trigger-popup.mdx`:
```mdx
# trigger↔popup

> ⬜ 미구현

trigger(열기)↔popup(닫기) 인터랙션을 축으로 분리하는 개념. combobox의 open/close, tooltip의 show/hide, popover의 toggle이 해당.

## 왜 필요한가

현재 combobox behavior에 open/close 로직이 하드코딩되어 있다. tooltip, popover 등 유사한 trigger↔popup 패턴이 추가되면 같은 코드를 복사해야 함.

## TODO

- [ ] trigger↔popup이 독립 축이 되어야 하는지, metadata 수준에서 해결 가능한지 판단
- [ ] 점유 키 결정 (Enter? Space? Escape?)
- [ ] combobox behavior에서 분리 가능성 검토
```

- [ ] **Step 3: Commit**

```bash
git add docs/2-areas/axes.mdx docs/2-areas/axes/trigger-popup.mdx
git commit -m "docs: add L2 Area MDX pilot — axes periodic table + blank slot"
```

---

### Task 5: Viewer에서 MDX 렌더링

**Files:**
- Create: `src/pages/PageAreaViewer.tsx` — MDX 렌더링 페이지
- Modify: `src/App.tsx` — Area 라우트 추가

- [ ] **Step 1: PageAreaViewer 작성**

`src/pages/PageAreaViewer.tsx` — URL path 전체를 사용하여 MDX 파일을 동적 로딩:

```tsx
import { useState, useEffect, type ComponentType } from 'react'
import { useLocation } from 'react-router-dom'

const mdxModules = import.meta.glob<{ default: ComponentType }>('/docs/2-areas/**/*.mdx')

export default function PageAreaViewer() {
  const location = useLocation()
  const [Content, setContent] = useState<ComponentType | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setContent(null)
    setError(null)

    // /area/axes → /docs/2-areas/axes.mdx
    // /area/axes/navigate → /docs/2-areas/axes/navigate.mdx
    const segments = location.pathname.replace(/^\/area\/?/, '')
    const mdxPath = segments
      ? `/docs/2-areas/${segments}.mdx`
      : '/docs/2-areas/axes.mdx'

    const loader = mdxModules[mdxPath]
    if (!loader) {
      setError(`Not found: ${mdxPath}`)
      return
    }

    loader().then((mod) => setContent(() => mod.default)).catch((e) => setError(String(e)))
  }, [location.pathname])

  if (error) return <div className="page-header"><p className="page-desc">{error}</p></div>
  if (!Content) return <div className="page-header"><p className="page-desc">Loading...</p></div>

  return (
    <div>
      <Content />
    </div>
  )
}
```

핵심: `useParams('*')` 대신 `useLocation().pathname`을 파싱하여 전체 경로를 MDX 경로로 변환. 이렇게 하면 `/area/axes/navigate` → `/docs/2-areas/axes/navigate.mdx`로 정확히 매핑.

- [ ] **Step 2: App.tsx에 Area 라우트 추가**

`src/App.tsx`에 두 가지 변경:

1. import 추가:
```tsx
import { BookOpen } from 'lucide-react'
import PageAreaViewer from './pages/PageAreaViewer'
```

2. `routeConfig` 배열에 Area 그룹 추가 (vision 그룹 뒤):
```tsx
{
  id: 'area',
  label: 'Area',
  icon: BookOpen,
  basePath: '/area/axes',
  items: [
    { path: 'axes', label: 'Axes', status: 'ready', component: PageAreaViewer },
  ],
},
```

3. `<Routes>` 내부에 Area 와일드카드 라우트를 **별도로** 추가 (routeConfig 자동 생성 라우트와 별개):
```tsx
<Route path="/area/*" element={<PageAreaViewer />} />
```

이렇게 하면:
- 사이드바에는 `Axes`만 표시 (빈 label 없음)
- `/area/axes` — routeConfig 라우트로 L2 렌더링
- `/area/axes/navigate` — 와일드카드 라우트로 L3 렌더링
- `BookOpen` 아이콘으로 `Map`(vision)과 구별

- [ ] **Step 4: dev 서버에서 검증**

```bash
pnpm dev
```

Expected:
- `/area/axes` → axes.mdx 렌더링 (주기율표 보임)
- `/area/axes/navigate` → navigate.mdx 렌더링 (스펙 + NavigateDemo 라이브 동작)
- 기존 `/axis/navigate` 페이지도 정상 동작 (공존)

- [ ] **Step 5: Commit**

```bash
git add src/pages/PageAreaViewer.tsx src/App.tsx
git commit -m "feat: add Area MDX viewer with L2/L3 rendering"
```

---

### Task 6: 빌드 검증 + 최종 확인

**Files:** (없음 — 검증만)

- [ ] **Step 1: 전체 빌드 검증**

```bash
pnpm build
```

Expected: 빌드 성공, MDX 파일 정상 컴파일

- [ ] **Step 2: 기존 테스트 통과 확인**

```bash
pnpm test
```

Expected: 기존 테스트 전부 통과 (MDX 추가로 깨지는 테스트 없음)

- [ ] **Step 3: Viewer에서 E2E 확인**

- `/area/axes` — 주기율표 렌더링, ⬜ trigger↔popup 빈칸 보임
- `/area/axes/navigate` — 스펙 표 + 관계 + NavigateDemo 라이브 데모 한 화면
- 기존 `/axis/navigate` — 변함없이 동작

- [ ] **Step 4: 최종 commit (필요 시)**

누락된 파일이 있으면 추가 커밋.
