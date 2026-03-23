# MD 기반 콘텐츠 관리 시스템 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** MDX를 제거하고 순수 MD + `tsx render` codeblock으로 범용 컴포넌트 임베드 시스템을 구축한다. Axis 그룹을 첫 전환 대상으로 삼는다.

**Architecture:** react-markdown(이미 설치됨)으로 MD를 런타임 렌더. `tsx render` codeblock을 간이 JSX 파서로 처리하여 글로벌 레지스트리에서 컴포넌트를 찾아 렌더. routeConfig에 `md` 필드를 추가하여 Page 컴포넌트 없이 MD 파일을 직접 라우팅.

**Tech Stack:** react-markdown (v10.1.0, 이미 설치), remark-gfm (이미 설치), Vite `?raw` import

**PRD:** `docs/superpowers/specs/2026-03-23-md-content-system-prd.md`

---

## File Structure

| 파일 | 역할 | 상태 |
|------|------|------|
| `src/pages/parseJsx.ts` | 간이 JSX 파서 — `<Component prop="value" />` → createElement | Create |
| `src/__tests__/parseJsx.test.ts` | parseJsx 유닛 테스트 | Create |
| `src/pages/MdPage.tsx` | MD 렌더러 — react-markdown + tsx render 핸들러 | Create |
| `src/pages/mdComponents.ts` | 글로벌 컴포넌트 레지스트리 | Create |
| `src/pages/AxisSpec.tsx` | axis SSOT 컴포넌트 — keyMap/options → 테이블 | Create |
| `src/pages/axis/SelectDemo.tsx` | PageSelect에서 데모 로직 추출 | Create |
| `src/pages/axis/ActivateDemo.tsx` | PageActivate에서 데모 로직 추출 | Create |
| `src/pages/axis/ExpandDemo.tsx` | PageExpand에서 데모 로직 추출 | Create |
| `src/pages/axis/TrapDemo.tsx` | PageTrap에서 데모 로직 추출 | Create |
| `src/App.tsx` | routeConfig에 md 필드 추가, axis 그룹 MdPage로 전환 | Modify |
| `src/pages/PageAreaViewer.tsx` | glob `*.mdx` → `*.md`, raw import 방식 전환 | Modify |
| `src/pages/AreaSidebar.tsx` | glob `*.mdx` → `*.md` | Modify |
| `docs/2-areas/axes/navigate.md` | import 제거 + `tsx render` codeblock 적용 | Rename+Modify |
| `src/pages/remarkRender.ts` | remark 플러그인 — `tsx render` codeblock을 커스텀 노드로 변환 | Create |
| `docs/2-areas/**/*.mdx` → `*.md` | 71개 일괄 rename (axis 7 + 나머지 64) | Rename |
| `vite.config.ts` | `@mdx-js/rollup` 제거 | Modify |
| `src/pages/axis/PageNavigate.tsx` | 삭제 (MdPage로 대체) | Delete |
| `src/pages/axis/PageSelect.tsx` | 삭제 (SelectDemo로 분리됨) | Delete |
| `src/pages/axis/PageActivate.tsx` | 삭제 | Delete |
| `src/pages/axis/PageExpand.tsx` | 삭제 | Delete |
| `src/pages/axis/PageTrap.tsx` | 삭제 | Delete |

---

### Task 1: parseJsx — 간이 JSX 파서

**Files:**
- Create: `src/pages/parseJsx.ts`
- Test: `src/__tests__/parseJsx.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/__tests__/parseJsx.test.ts
import { describe, it, expect } from 'vitest'
import { parseJsx } from '../pages/parseJsx'

describe('parseJsx', () => {
  it('parses self-closing tag without props', () => {
    expect(parseJsx('<NavigateDemo />')).toEqual({
      name: 'NavigateDemo',
      props: {},
    })
  })

  it('parses self-closing tag with string prop', () => {
    expect(parseJsx('<AxisSpec axis="navigate" />')).toEqual({
      name: 'AxisSpec',
      props: { axis: 'navigate' },
    })
  })

  it('parses boolean flag prop', () => {
    expect(parseJsx('<Demo compact />')).toEqual({
      name: 'Demo',
      props: { compact: true },
    })
  })

  it('parses multiple props', () => {
    expect(parseJsx('<Comp a="1" b="2" flag />')).toEqual({
      name: 'Comp',
      props: { a: '1', b: '2', flag: true },
    })
  })

  it('returns null for non-JSX', () => {
    expect(parseJsx('just text')).toBeNull()
  })

  it('returns null for nested JSX', () => {
    expect(parseJsx('<Outer><Inner /></Outer>')).toBeNull()
  })

  it('ignores expression props', () => {
    expect(parseJsx('<Comp val={123} />')).toEqual({
      name: 'Comp',
      props: {},
    })
  })

  it('trims whitespace', () => {
    expect(parseJsx('  <Demo />  ')).toEqual({
      name: 'Demo',
      props: {},
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/parseJsx.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

```ts
// src/pages/parseJsx.ts
export interface ParsedJsx {
  name: string
  props: Record<string, string | boolean>
}

export function parseJsx(input: string): ParsedJsx | null {
  const trimmed = input.trim()

  // Must be a self-closing tag: <Name ... />
  const match = trimmed.match(/^<([A-Z][A-Za-z0-9]*)(\s[^>]*)?\s*\/>$/)
  if (!match) return null

  const name = match[1]
  const attrString = match[2]?.trim() ?? ''
  const props: Record<string, string | boolean> = {}

  if (attrString) {
    // Match: key="value" or key (boolean)
    const attrRegex = /([a-zA-Z][a-zA-Z0-9]*)(?:="([^"]*)")?/g
    let attrMatch
    while ((attrMatch = attrRegex.exec(attrString)) !== null) {
      const [full, key, value] = attrMatch
      // Skip expression props like val={123}
      const afterAttr = attrString.slice(attrMatch.index + full.length)
      if (afterAttr.startsWith('={')) continue
      props[key] = value !== undefined ? value : true
    }
  }

  return { name, props }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/parseJsx.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/pages/parseJsx.ts src/__tests__/parseJsx.test.ts
git commit -m "feat: add parseJsx — lightweight JSX parser for tsx render codeblocks"
```

---

### Task 2: MdPage — MD 렌더러 컴포넌트

**Files:**
- Create: `src/pages/remarkRender.ts`
- Create: `src/pages/MdPage.tsx`
- Create: `src/pages/mdComponents.ts`

**Dependencies:** Task 1 (parseJsx)

**주의 — C1 해결:** react-markdown v10에서 fenced code의 `meta` (예: `render`)가 `data-meta` prop으로 전달되지 않음. `node.data.meta`에만 존재. 따라서 커스텀 remark 플러그인으로 `tsx render` 블록을 감지하여 일반 codeblock 대신 `render-block` 타입의 커스텀 노드로 변환한다.

- [ ] **Step 1: Create remarkRender plugin**

```ts
// src/pages/remarkRender.ts
// remark 플러그인: ```tsx render 블록을 html 노드로 변환
// react-markdown의 rehypeRaw + components.div로 처리
import type { Plugin } from 'unified'
import type { Root, Code } from 'mdast'
import { visit } from 'unist-util-visit'

const remarkRender: Plugin<[], Root> = () => (tree) => {
  visit(tree, 'code', (node: Code, index, parent) => {
    if (node.lang === 'tsx' && node.meta === 'render' && parent && index !== undefined) {
      // Replace code node with html node containing a marker div
      // react-markdown renders html nodes when rehypeRaw is used
      parent.children[index] = {
        type: 'html',
        value: `<div data-render>${node.value}</div>`,
      } as any
    }
  })
}

export default remarkRender
```

- [ ] **Step 2: Create mdComponents registry (empty)**

```ts
// src/pages/mdComponents.ts
import type { ComponentType } from 'react'

export const mdComponents: Record<string, ComponentType<Record<string, unknown>>> = {
  // Components registered here are available in ```tsx render blocks
  // e.g. NavigateDemo, AxisSpec, SelectDemo, etc.
}
```

- [ ] **Step 3: Create MdPage component**

```tsx
// src/pages/MdPage.tsx
import { useState, useEffect, createElement, type ReactNode } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import remarkRender from './remarkRender'
import { parseJsx } from './parseJsx'
import { mdComponents } from './mdComponents'
import areaStyles from './AreaViewer.module.css'

interface MdPageProps {
  md: string // path relative to docs/2-areas/, e.g. 'axes/navigate'
}

const mdModules = import.meta.glob<string>('/docs/2-areas/**/*.md', {
  query: '?raw',
  import: 'default',
})

function RenderBlock({ children }: { children: string }) {
  const lines = children.trim().split('\n')
  const elements: ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const parsed = parseJsx(line)
    if (!parsed) {
      elements.push(
        <div key={i} style={{ color: 'var(--color-destructive)', padding: '4px 8px' }}>
          Parse error: {line}
        </div>
      )
      continue
    }
    const Component = mdComponents[parsed.name]
    if (!Component) {
      elements.push(
        <div key={i} style={{ color: 'var(--color-destructive)', padding: '4px 8px' }}>
          Unknown component: {parsed.name}
        </div>
      )
      continue
    }
    elements.push(createElement(Component, { key: i, ...parsed.props }))
  }

  return <>{elements}</>
}

export default function MdPage({ md }: MdPageProps) {
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setContent(null)
    setError(null)

    const mdPath = `/docs/2-areas/${md}.md`
    const loader = mdModules[mdPath]
    if (!loader) {
      setError(`Not found: ${mdPath}`)
      return
    }

    loader().then(setContent).catch((e) => setError(String(e)))
  }, [md])

  if (error) return <div className="page-header"><p className="page-desc">{error}</p></div>
  if (content === null) return <div className="page-header"><p className="page-desc">Loading...</p></div>

  return (
    <div className={areaStyles.root}>
      <Markdown
        remarkPlugins={[remarkGfm, remarkRender]}
        rehypePlugins={[rehypeRaw]}
        components={{
          div({ children, node, ...rest }) {
            // data-render marker from remarkRender plugin
            if ((rest as Record<string, unknown>)['data-render'] !== undefined) {
              const text = typeof children === 'string' ? children
                : Array.isArray(children) ? children.filter(c => typeof c === 'string').join('')
                : ''
              if (text) return <RenderBlock>{text}</RenderBlock>
            }
            return <div {...rest}>{children}</div>
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  )
}
```

- [ ] **Step 3: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/pages/MdPage.tsx src/pages/mdComponents.ts
git commit -m "feat: add MdPage renderer — react-markdown + tsx render codeblock support"
```

---

### Task 3: AxisSpec — SSOT 컴포넌트

**Files:**
- Create: `src/pages/AxisSpec.tsx`

**Dependencies:** Task 2 (mdComponents registry에 등록)

- [ ] **Step 1: Create AxisSpec component**

AxisSpec은 axis 이름을 받아 해당 axis 함수를 호출하고, 반환된 keyMap/config에서 스펙 테이블을 렌더합니다.

```tsx
// src/pages/AxisSpec.tsx
import { navigate, type NavigateOptions } from '../interactive-os/axes/navigate'
import { select } from '../interactive-os/axes/select'
import { activate } from '../interactive-os/axes/activate'
import { expand } from '../interactive-os/axes/expand'
import { trap } from '../interactive-os/axes/trap'
import type { KeyMap } from '../interactive-os/axes/composePattern'

const axisRegistry: Record<string, () => { keyMap: KeyMap; config?: unknown }> = {
  navigate: () => navigate(),
  'navigate-horizontal': () => navigate({ orientation: 'horizontal' }),
  'navigate-both': () => navigate({ orientation: 'both' }),
  'navigate-grid': () => navigate({ grid: { columns: 3 } }),
  select: () => select(),
  'select-extended': () => select({ mode: 'multiple', extended: true }),
  activate: () => activate(),
  expand: () => expand(),
  'expand-enter-esc': () => expand({ mode: 'enter-esc' }),
  trap: () => trap(),
}

export default function AxisSpec({ axis }: { axis?: string }) {
  if (!axis || !axisRegistry[axis]) {
    return <div style={{ color: 'var(--color-destructive)' }}>Unknown axis: {axis}</div>
  }

  const { keyMap } = axisRegistry[axis]()
  const keys = Object.keys(keyMap)

  if (keys.length === 0) {
    return <p>No key bindings.</p>
  }

  return (
    <table>
      <thead>
        <tr>
          <th>키</th>
        </tr>
      </thead>
      <tbody>
        {keys.map((key) => (
          <tr key={key}>
            <td><kbd>{key}</kbd></td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  // NOTE: keyMap의 값은 함수이므로 "동작" 설명은 자동 추출 불가.
  // 키 목록만 SSOT로 자동 표시하고, 동작 설명은 MD에서 수동 작성.
}
```

- [ ] **Step 2: Register AxisSpec in mdComponents**

```ts
// src/pages/mdComponents.ts 에 추가
import AxisSpec from './AxisSpec'

export const mdComponents: Record<string, ComponentType<Record<string, unknown>>> = {
  AxisSpec,
}
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/pages/AxisSpec.tsx src/pages/mdComponents.ts
git commit -m "feat: add AxisSpec — SSOT keyMap table from axis implementations"
```

---

### Task 4: Axis Demo 컴포넌트 추출

**Files:**
- Create: `src/pages/axis/SelectDemo.tsx`
- Create: `src/pages/axis/ActivateDemo.tsx`
- Create: `src/pages/axis/ExpandDemo.tsx`
- Create: `src/pages/axis/TrapDemo.tsx`
- Modify: `src/pages/mdComponents.ts`

**Dependencies:** Task 2 (mdComponents 레지스트리)

각 Page*.tsx에서 page-header/page-section(설명 텍스트)을 제거하고, 데모 로직(state + behavior + Aria 렌더)만 추출합니다.

- [ ] **Step 1: Extract SelectDemo from PageSelect**

`src/pages/axis/SelectDemo.tsx` — PageSelect.tsx에서 `page-header`와 `page-section`을 제거. state(mode, extended, data), behavior 구성, toggle UI, Aria 렌더 부분만 유지.

```tsx
// src/pages/axis/SelectDemo.tsx
// PageSelect.tsx의 라인 1-76을 복사하되:
// - export default function SelectDemo() 로 이름 변경
// - return 안에서 page-header div 제거
// - return 안에서 page-section div (About) 제거
// - 나머지 (page-keys toggles + card) 유지
```

- [ ] **Step 2: Extract ActivateDemo, ExpandDemo, TrapDemo**

동일 패턴으로:
- `ActivateDemo.tsx` ← PageActivate.tsx (page-header, page-section 제거)
- `ExpandDemo.tsx` ← PageExpand.tsx (page-header, page-section 제거)
- `TrapDemo.tsx` ← PageTrap.tsx (page-header, page-section 제거)

- [ ] **Step 3: Register all demo components in mdComponents**

```ts
// src/pages/mdComponents.ts
import type { ComponentType } from 'react'
import AxisSpec from './AxisSpec'
import NavigateDemo from './axis/NavigateDemo'
import SelectDemo from './axis/SelectDemo'
import ActivateDemo from './axis/ActivateDemo'
import ExpandDemo from './axis/ExpandDemo'
import TrapDemo from './axis/TrapDemo'

export const mdComponents: Record<string, ComponentType<Record<string, unknown>>> = {
  AxisSpec,
  NavigateDemo,
  SelectDemo,
  ActivateDemo,
  ExpandDemo,
  TrapDemo,
}
```

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/pages/axis/SelectDemo.tsx src/pages/axis/ActivateDemo.tsx \
  src/pages/axis/ExpandDemo.tsx src/pages/axis/TrapDemo.tsx src/pages/mdComponents.ts
git commit -m "feat: extract axis demo components for MD embedding"
```

---

### Task 5: Axis MD 파일에 tsx render codeblock 적용

**Files:**
- Modify: `docs/2-areas/axes/navigate.mdx` → rename to `.md` + modify
- Modify: `docs/2-areas/axes/select.mdx` → rename to `.md` + modify
- Modify: `docs/2-areas/axes/activate.mdx` → rename to `.md` + modify
- Modify: `docs/2-areas/axes/expand.mdx` → rename to `.md` + modify
- Modify: `docs/2-areas/axes/trap.mdx` → rename to `.md` + modify

**Dependencies:** Task 4 (demo 컴포넌트 + 레지스트리 등록)

- [ ] **Step 1: Rename 5 axis MDX files to MD**

```bash
git mv docs/2-areas/axes/navigate.mdx docs/2-areas/axes/navigate.md
git mv docs/2-areas/axes/select.mdx docs/2-areas/axes/select.md
git mv docs/2-areas/axes/activate.mdx docs/2-areas/axes/activate.md
git mv docs/2-areas/axes/expand.mdx docs/2-areas/axes/expand.md
git mv docs/2-areas/axes/trap.mdx docs/2-areas/axes/trap.md
```

- [ ] **Step 2: Update navigate.md**

Remove the `import NavigateDemo from '...'` line. Add `tsx render` codeblock for demo:

```md
# navigate()

> 키보드 네비게이션 축. ↑↓←→ Home End로 포커스를 이동한다.

## 스펙

(기존 수동 테이블 유지 — 점진적으로 AxisSpec으로 전환 가능)

| 키 | 동작 | 조건 |
|---|---|---|
| ↑ | focusPrev | orientation: vertical 또는 both |
...

## 데모

```tsx render
<NavigateDemo />
```

## 관계
(기존 내용 유지)
```

- [ ] **Step 3: Update select.md, activate.md, expand.md, trap.md**

각 파일 끝에 데모 섹션 추가:

select.md:
```md
## 데모

```tsx render
<SelectDemo />
```
```

activate.md:
```md
## 데모

```tsx render
<ActivateDemo />
```
```

expand.md:
```md
## 데모

```tsx render
<ExpandDemo />
```
```

trap.md:
```md
## 데모

```tsx render
<TrapDemo />
```
```

- [ ] **Step 4: Commit**

```bash
git add docs/2-areas/axes/
git commit -m "feat: convert axis MDX to MD with tsx render codeblocks"
```

---

### Task 6: routeConfig — Axis 그룹 MdPage 전환

**Files:**
- Modify: `src/App.tsx`

**Dependencies:** Task 2 (MdPage), Task 5 (axis MD files)

- [ ] **Step 1: Add md field to RouteItem type and axis items**

`src/App.tsx`에서:

1. RouteItem 타입에 `md?: string` 필드 추가
2. axis 그룹의 items에서 `component: PageXxx` → `md: 'axes/xxx'` 변경
3. MdPage import 추가
4. Route 렌더링에서 `item.md`가 있으면 `<MdPage md={item.md} />`로 렌더

```tsx
// RouteItem 타입 수정 — component를 optional | null로 변경 (기존 null 사용처 호환)
interface RouteItem {
  path: string
  label: string
  status: 'ready' | 'wip'
  component?: ComponentType | null
  md?: string  // docs/2-areas/ 하위 경로
}

// axis 그룹 수정
{
  id: 'axis',
  label: 'Axis',
  icon: Axe,
  basePath: '/axis/navigate',
  items: [
    { path: 'navigate', label: 'navigate()', status: 'ready', md: 'axes/navigate' },
    { path: 'select', label: 'select()', status: 'ready', md: 'axes/select' },
    { path: 'activate', label: 'activate()', status: 'ready', md: 'axes/activate' },
    { path: 'expand', label: 'expand()', status: 'ready', md: 'axes/expand' },
    { path: 'trap', label: 'trap()', status: 'ready', md: 'axes/trap' },
  ],
},

// Route 렌더링 수정 (기존 component 방식과 md 방식 공존)
{routeConfig.flatMap((group) =>
  group.items.map((item) => (
    <Route
      key={`${group.id}/${item.path}`}
      path={`/${group.id}/${item.path}`}
      element={item.md ? <MdPage md={item.md} /> : item.component ? <item.component /> : null}
    />
  ))
)}
```

- [ ] **Step 2: Remove unused axis Page imports**

PageNavigate, PageSelect, PageActivate, PageExpand, PageTrap import 제거.

- [ ] **Step 3: Verify build + navigation works**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: axis routes use MdPage — md field in routeConfig"
```

---

### Task 7: 나머지 60개 MDX → MD 일괄 전환

**Files:**
- Rename: `docs/2-areas/**/*.mdx` → `*.md` (axis 5개는 Task 5에서 완료)
- Modify: `src/pages/PageAreaViewer.tsx` — glob 패턴 변경
- Modify: `src/pages/AreaSidebar.tsx` — glob 패턴 변경

**Dependencies:** Task 6 (axis 전환 완료 확인)

**주의:** PRD X4 — `@mdx-js/rollup` 제거는 전환 완료 후에 해야 함. 이 task에서는 rename만.

- [ ] **Step 1: Rename remaining MDX files**

axis 5개(Task 5에서 완료)를 제외한 나머지 60개:

```bash
# axes/ 나머지
git mv docs/2-areas/axes/value.mdx docs/2-areas/axes/value.md
git mv docs/2-areas/axes/trigger-popup.mdx docs/2-areas/axes/trigger-popup.md

# L2 index files
git mv docs/2-areas/axes.mdx docs/2-areas/axes.md
git mv docs/2-areas/core.mdx docs/2-areas/core.md
git mv docs/2-areas/patterns.mdx docs/2-areas/patterns.md
git mv docs/2-areas/plugins.mdx docs/2-areas/plugins.md
git mv docs/2-areas/hooks.mdx docs/2-areas/hooks.md
git mv docs/2-areas/ui.mdx docs/2-areas/ui.md
git mv docs/2-areas/vision.mdx docs/2-areas/vision.md
git mv docs/2-areas/overview.mdx docs/2-areas/overview.md
git mv docs/2-areas/ui-dictionary.mdx docs/2-areas/ui-dictionary.md
git mv docs/2-areas/ui-usage-concept.mdx docs/2-areas/ui-usage-concept.md

# core/
git mv docs/2-areas/core/types.mdx docs/2-areas/core/types.md
git mv docs/2-areas/core/createStore.mdx docs/2-areas/core/createStore.md
git mv docs/2-areas/core/createCommandEngine.mdx docs/2-areas/core/createCommandEngine.md

# patterns/ (모든 파일)
for f in docs/2-areas/patterns/*.mdx; do git mv "$f" "${f%.mdx}.md"; done

# plugins/ (모든 파일)
for f in docs/2-areas/plugins/*.mdx; do git mv "$f" "${f%.mdx}.md"; done

# hooks/ (모든 파일)
for f in docs/2-areas/hooks/*.mdx; do git mv "$f" "${f%.mdx}.md"; done

# ui/ (모든 파일)
for f in docs/2-areas/ui/*.mdx; do git mv "$f" "${f%.mdx}.md"; done
```

- [ ] **Step 2: Update PageAreaViewer glob**

`src/pages/PageAreaViewer.tsx` line 5:
```tsx
// Before:
const mdxModules = import.meta.glob<{ default: ComponentType }>('/docs/2-areas/**/*.mdx')

// After: raw MD string import
const mdModules = import.meta.glob<string>('/docs/2-areas/**/*.md', {
  query: '?raw',
  import: 'default',
})
```

PageAreaViewer를 MdPage와 동일한 react-markdown 렌더링으로 전환:

```tsx
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { parseJsx } from './parseJsx'
import { mdComponents } from './mdComponents'
// ... RenderBlock 로직은 MdPage와 공유 가능 (또는 MdPage를 직접 사용)
```

실제로는 **PageAreaViewer 자체를 MdPage 기반으로 교체**:

```tsx
import MdPage from './MdPage'

export default function PageAreaViewer() {
  const { pathname } = useLocation()
  const segments = pathname.replace(/^\/area\/?/, '')
  const md = segments || 'overview'

  return (
    <div className={areaStyles.root}>
      <MdPage md={md} />
    </div>
  )
}
```

- [ ] **Step 3: Update AreaSidebar glob**

`src/pages/AreaSidebar.tsx`의 glob 패턴:
```tsx
// Before:
const mdxFiles = import.meta.glob('/docs/2-areas/**/*.mdx')

// After:
const mdFiles = import.meta.glob('/docs/2-areas/**/*.md')
```

파일 경로 파싱 로직에서 `.mdx` → `.md` 로 변경.

- [ ] **Step 4: Verify Area sidebar + viewer still works**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add docs/2-areas/ src/pages/PageAreaViewer.tsx src/pages/AreaSidebar.tsx
git commit -m "refactor: rename 60 MDX files to MD, update Area viewer and sidebar globs"
```

---

### Task 8: MDX 인프라 제거 + Page*.tsx 정리

**Files:**
- Modify: `vite.config.ts` — `@mdx-js/rollup` import/plugin 제거
- Delete: `src/pages/axis/PageNavigate.tsx`
- Delete: `src/pages/axis/PageSelect.tsx`
- Delete: `src/pages/axis/PageActivate.tsx`
- Delete: `src/pages/axis/PageExpand.tsx`
- Delete: `src/pages/axis/PageTrap.tsx`

**Dependencies:** Task 7 (모든 MDX → MD 전환 완료)

- [ ] **Step 1: Grep for any remaining .mdx references**

```bash
grep -r "\.mdx" src/ --include="*.ts" --include="*.tsx"
grep -r "\.mdx" docs/ --include="*.md"
```

Expected: No results (모든 참조 제거됨)

- [ ] **Step 2: Remove @mdx-js/rollup from vite.config.ts and package.json**

```ts
// vite.config.ts:
// mdx import 제거
// plugins에서 mdx(...) 제거
// remarkGfm import도 vite.config에서 제거 (MdPage에서 직접 사용)
```

```bash
pnpm remove @mdx-js/rollup
```

- [ ] **Step 3: Delete axis Page wrapper components**

```bash
rm src/pages/axis/PageNavigate.tsx
rm src/pages/axis/PageSelect.tsx
rm src/pages/axis/PageActivate.tsx
rm src/pages/axis/PageExpand.tsx
rm src/pages/axis/PageTrap.tsx
```

**주의:** NavigateDemo.tsx, axis-demo-data.ts, SelectDemo.tsx 등 Demo 컴포넌트는 유지!

- [ ] **Step 4: Clean up App.tsx imports**

PageNavigate, PageSelect, PageActivate, PageExpand, PageTrap import가 이미 Task 6에서 제거되었는지 확인. 남아있으면 제거.

- [ ] **Step 5: Build verification**

Run: `npx tsc --noEmit && npx vitest run`
Expected: Build success, all tests pass

- [ ] **Step 6: Commit**

```bash
git add vite.config.ts src/App.tsx
git rm src/pages/axis/PageNavigate.tsx src/pages/axis/PageSelect.tsx \
  src/pages/axis/PageActivate.tsx src/pages/axis/PageExpand.tsx src/pages/axis/PageTrap.tsx
git commit -m "refactor: remove MDX infrastructure and axis Page wrappers"
```

---

### Task 9: 최종 검증

**Dependencies:** Task 8

- [ ] **Step 1: Full build + test**

```bash
npx tsc --noEmit && npx vitest run
```

- [ ] **Step 2: Verify axis routes render MD content**

Dev server에서 `/axis/navigate` 접근 → MD 콘텐츠 + NavigateDemo 렌더 확인

- [ ] **Step 3: Verify Area viewer still works**

`/area/overview`, `/area/axes/navigate` 등 접근 → MD 렌더 확인

- [ ] **Step 4: Verify AreaSidebar tree**

사이드바 트리가 정상 빌드되는지 확인 (빈 목록 아님)

- [ ] **Step 5: Final commit if any fixes**

수정된 파일만 명시적으로 staging 후 커밋. `git add -A` 사용 금지.
