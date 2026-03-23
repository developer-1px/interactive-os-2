# Homepage Route Big-Bang (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** GOAL.md Phase 1 — 라우트 구조를 외부용(/,/docs,/ui/*,/examples/*) + 내부용(/internals/*) 으로 전환하고, ActivityBar를 재구성한다. 기존 페이지 내용은 그대로 유지.

**Architecture:** App.tsx의 routeConfig에 `internals/` prefix 추가, navItems를 external/internal 2분할, CMS·Viewer를 `/examples/*`로 이동, Landing·Docs placeholder 추가. 페이지 컴포넌트 파일은 이동하지 않고 라우트 매핑만 변경.

**Tech Stack:** React Router v6, lucide-react icons, interactive-os (Aria, NavList, Tooltip)

---

## Route Mapping (현재 → 목표)

| 현재 경로 | 목표 경로 | 비고 |
|-----------|----------|------|
| `/` (CMS) | `/examples/cms` | CMS는 examples로 이동 |
| `/viewer` | `/examples/viewer` | Viewer도 examples |
| `/agent` | `/examples/agent` | Agent도 examples |
| `/ui/*` | `/ui/*` | 유지 (UI 완성품 카탈로그) |
| `/theme` | `/internals/theme` | 내부 도구 |
| `/store/*` | `/internals/store/*` | |
| `/engine/*` | `/internals/engine/*` | |
| `/axis/*` | `/internals/axis/*` | |
| `/pattern/*` | `/internals/pattern/*` | |
| `/plugin/*` | `/internals/plugin/*` | |
| `/collection/*` | `/internals/collection/*` | |
| `/components/*` | `/internals/components/*` | |
| `/area/*` | `/internals/area/*` | |
| (없음) | `/` | Landing placeholder (new) |
| (없음) | `/docs` | Docs placeholder (new) |

## ActivityBar 재구성

```
── 외부 개발자용 ──
🏠 Landing      /
📖 Docs         /docs
🧩 UI           /ui
📦 Examples     /examples/cms (basePath)
────────────────
── 내부 개발용 ──
💾 Store        /internals/store/inspector
⚙️ Engine       /internals/engine/pipeline
🪓 Axis         /internals/axis/navigate
🧭 Pattern      /internals/pattern/accordion
🧩 Plugin       /internals/plugin/crud
📚 Collection   /internals/collection/treegrid
📦 Components   /internals/components/aria
📖 Area         /internals/area/overview
────────────────
── Util ──
🌗 Theme toggle
```

## File Structure

| 파일 | 변경 | 책임 |
|------|------|------|
| `src/pages/PageLanding.tsx` | **Create** | Landing placeholder |
| `src/pages/PageDocs.tsx` | **Create** | Docs placeholder |
| `src/App.tsx` | **Modify** | routeConfig, navItems, ActivityBar, routing logic 전체 재구성 |

---

### Task 1: Landing placeholder 페이지

**Files:**
- Create: `src/pages/PageLanding.tsx`

- [ ] **Step 1: PageLanding.tsx 생성**

```tsx
import { useNavigate } from 'react-router-dom'

export default function PageLanding() {
  const navigate = useNavigate()

  return (
    <main className="content" style={{ gridColumn: '2 / -1' }}>
      <div style={{ maxWidth: 640, margin: '80px auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>interactive-os</h1>
        <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 32 }}>
          Keyboard-first UI primitives for building accessible interfaces.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={() => navigate('/docs')} className="btn-primary">Get Started</button>
          <button onClick={() => navigate('/ui')} className="btn-secondary">Browse UI</button>
        </div>
      </div>
    </main>
  )
}
```

---

### Task 2: Docs placeholder 페이지

**Files:**
- Create: `src/pages/PageDocs.tsx`

- [ ] **Step 1: PageDocs.tsx 생성**

```tsx
export default function PageDocs() {
  return (
    <main className="content" style={{ gridColumn: '2 / -1' }}>
      <div style={{ maxWidth: 640, margin: '60px auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Documentation</h1>
        <p style={{ color: 'var(--text-muted)' }}>Getting Started guide — coming soon.</p>
      </div>
    </main>
  )
}
```

---

### Task 3: App.tsx 라우트 구조 전환

**Files:**
- Modify: `src/App.tsx`

이 Task가 Phase 1의 핵심. routeConfig, navItems, ActivityBar, 조건부 렌더링을 모두 전환한다.

- [ ] **Step 1: import 추가**

```tsx
// 기존 import 아래에 추가
import PageLanding from './pages/PageLanding'
import PageDocs from './pages/PageDocs'
// lucide-react에 Home, BookText 추가
import { ..., Home, BookText } from 'lucide-react'
```

- [ ] **Step 2: routeConfig 수정 — internals/ prefix**

모든 기존 routeConfig 그룹의 `id`에 `internals/` prefix를 추가하고, `basePath`를 `/internals/{id}/{first}` 형태로 변경.

```tsx
const routeConfig: RouteGroup[] = [
  {
    id: 'internals/store',
    label: 'Store',
    icon: Database,
    basePath: '/internals/store/inspector',
    items: [
      { path: 'inspector', label: 'Inspector', status: 'ready', component: PageStoreInspector },
    ],
  },
  {
    id: 'internals/engine',
    label: 'Engine',
    icon: Cog,
    basePath: '/internals/engine/pipeline',
    items: [
      { path: 'pipeline', label: 'Pipeline', status: 'ready', component: PageEnginePipeline },
      { path: 'history', label: 'History', status: 'ready', component: PageEngineHistory },
    ],
  },
  // ... axis, pattern, plugin, collection, components, area — 동일 패턴
]
```

- [ ] **Step 3: navItems → externalNavItems + internalNavItems 분리**

```tsx
const externalNavItems: NavItem[] = [
  { id: 'landing', label: 'Home', icon: Home, path: '/' },
  { id: 'docs', label: 'Docs', icon: BookText, path: '/docs' },
  { id: 'ui-showcase', label: 'UI', icon: Component, path: '/ui' },
  { id: 'examples', label: 'Examples', icon: Presentation, path: '/examples/cms' },
]

const internalNavItems: NavItem[] = routeConfig.map((g) => ({
  id: g.id,
  label: g.label,
  icon: g.icon,
  path: g.basePath,
}))

const navItems: NavItem[] = [...externalNavItems, ...internalNavItems]
```

- [ ] **Step 4: APP_IDS, OS_IDS 상수 업데이트**

```tsx
const EXTERNAL_IDS = externalNavItems.map((n) => n.id)
const INTERNAL_IDS = internalNavItems.map((n) => n.id)
const UTIL_IDS = ['theme']
```

- [ ] **Step 5: ActivityBar aria-label 그룹명 변경**

```tsx
<div role="group" aria-label="External">
  <Aria.Item asChild ids={EXTERNAL_IDS} render={...} />
</div>
<div role="separator" className="activity-bar__separator" />
<div role="group" aria-label="Internal">
  <Aria.Item asChild ids={INTERNAL_IDS} render={...} />
</div>
```

- [ ] **Step 6: 조건부 렌더링 로직 업데이트**

URL 판별 로직을 새 라우트에 맞게 변경:

```tsx
const isLanding = pathname === '/'
const isDocs = pathname === '/docs'
const isUiShowcase = pathname === '/ui' || pathname.startsWith('/ui/')
const isExampleCms = pathname === '/examples/cms'
const isExampleViewer = pathname.startsWith('/examples/viewer')
const isExampleAgent = pathname.startsWith('/examples/agent')
const isTheme = pathname === '/internals/theme'
const activeGroup = routeConfig.find((g) => pathname.startsWith('/' + g.id))
```

렌더링 분기:

```tsx
{isLanding ? (
  <PageLanding />
) : isDocs ? (
  <PageDocs />
) : isExampleCms ? (
  <CmsLayout />
) : isExampleViewer ? (
  <PageViewer />
) : isExampleAgent ? (
  <PageAgentViewer />
) : isUiShowcase ? (
  <PageUiShowcase />
) : isTheme ? (
  <PageThemeCreator />
) : (
  <>
    {activeGroup && (activeGroup.id === 'internals/area'
      ? <AreaSidebar />
      : <Sidebar activeGroup={activeGroup} activeItemPath={pathname.split('/').pop()} />
    )}
    <main className="content">
      <Routes>
        {/* internals routes */}
      </Routes>
    </main>
  </>
)}
```

- [ ] **Step 7: Routes 내부 경로 업데이트**

```tsx
<Routes>
  {routeConfig.map((group) => (
    <Route key={group.id} path={`/${group.id}`} element={<Navigate to={group.basePath} replace />} />
  ))}
  {routeConfig.flatMap((group) =>
    group.items.map((item) => (
      <Route
        key={`${group.id}/${item.path}`}
        path={`/${group.id}/${item.path}`}
        element={
          item.md ? <MdPage md={item.md} /> : item.component ? <item.component /> : <Placeholder group={group.label} label={item.label} />
        }
      />
    ))
  )}
  <Route path="/internals/area/*" element={<PageAreaViewer />} />
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

- [ ] **Step 8: activityBarFocusId 로직 업데이트**

```tsx
const activityBarFocusId =
  activeGroup?.id ??
  (isLanding ? 'landing' :
   isDocs ? 'docs' :
   isUiShowcase ? 'ui-showcase' :
   (isExampleCms || isExampleViewer || isExampleAgent) ? 'examples' :
   isTheme ? 'theme-creator' :
   undefined)
```

- [ ] **Step 9: Sidebar의 navigate 경로 업데이트**

Sidebar 컴포넌트의 `handleActivate`에서 `/${activeGroup.id}/${nodeId}` 경로가 `internals/` prefix를 포함하도록 확인. `activeGroup.id`가 이미 `internals/store` 형태이므로 자동 반영.

- [ ] **Step 10: 빌드 검증**

```bash
npx tsc --noEmit
npx vite build --mode development 2>&1 | head -20
```

---

### Task 4: 빌드 + 테스트 전체 검증

- [ ] **Step 1: TypeScript 검증**
```bash
npx tsc --noEmit
```
Expected: 에러 0

- [ ] **Step 2: Lint 검증**
```bash
npx eslint src/App.tsx src/pages/PageLanding.tsx src/pages/PageDocs.tsx
```
Expected: 에러 0

- [ ] **Step 3: 테스트 실행**
```bash
npx vitest run
```
Expected: 기존 테스트 전체 통과 (라우트 변경은 테스트에 영향 없음 — 통합테스트는 컴포넌트 단위)

- [ ] **Step 4: 개발 서버 동작 확인**
```bash
npx vite --port 5173 &
# /, /docs, /ui, /examples/cms, /internals/store/inspector 등 접근 가능 확인
```
