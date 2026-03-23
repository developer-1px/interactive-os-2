# Router Migration: createBrowserRouter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** App.tsx의 수동 pathname 매칭 + ternary chain을 `createBrowserRouter` + layout route로 교체. 508줄 monolith를 3개 파일로 분리.

**Architecture:** `createBrowserRouter`로 모든 라우트를 선언적으로 정의. AppShell(ActivityBar) + SidebarLayout(sidebar+outlet) layout route 패턴. standalone 페이지는 `lazy()` 로드.

**Tech Stack:** react-router-dom v7 (createBrowserRouter, RouterProvider, Outlet, lazy)

---

## 현재 → 목표

| 현재 | 목표 |
|------|------|
| `src/App.tsx` (508줄 monolith) | `src/AppShell.tsx` + `src/SidebarLayout.tsx` + `src/router.tsx` |
| `<BrowserRouter>` + `<Routes>` | `createBrowserRouter` + `<RouterProvider>` |
| 40+ eager page imports | standalone 페이지는 `lazy()`, internals는 routeConfig 유지 |
| is* 플래그 7개 + ternary chain | React Router가 매칭, layout route가 분기 |
| `useLocation` 수동 pathname 매칭 | React Router route matching |

## File Structure

| 파일 | 변경 | 책임 |
|------|------|------|
| `src/router.tsx` | **Create** | createBrowserRouter, 모든 route 정의 |
| `src/AppShell.tsx` | **Create** | ActivityBar + Outlet (root layout) |
| `src/SidebarLayout.tsx` | **Create** | Sidebar + Outlet (internals layout) |
| `src/main.tsx` | **Modify** | BrowserRouter → RouterProvider |
| `src/App.tsx` | **Delete** | router.tsx + AppShell + SidebarLayout로 분해 |
| `src/__tests__/activitybar-focus.test.tsx` | **Modify** | MemoryRouter → createMemoryRouter |

---

### Task 1: router.tsx — 라우트 정의

**Files:**
- Create: `src/router.tsx`

routeConfig(internals 데이터) + 전체 라우트 트리를 정의한다. standalone 페이지는 lazy, internals 페이지는 routeConfig에서 component 참조 유지.

- [ ] **Step 1: router.tsx 생성**

routeConfig를 App.tsx에서 이동. `createBrowserRouter`로 라우트 트리 구성:

```
AppShell (root layout)
├── / → PageLanding (lazy)
├── /docs → PageDocs (lazy)
├── /ui/* → PageUiShowcase (lazy)
├── /examples/cms → CmsLayout (lazy)
├── /examples/viewer/* → PageViewer (lazy)
├── /examples/agent/* → PageAgentViewer (lazy)
├── /internals/theme → PageThemeCreator (lazy)
├── SidebarLayout (nested layout)
│   ├── /internals/store → redirect
│   ├── /internals/store/inspector → PageStoreInspector
│   ├── /internals/engine/pipeline → PageEnginePipeline
│   ├── ... (routeConfig items)
│   └── /internals/area/* → PageAreaViewer
└── * → redirect /
```

- [ ] **Step 2: tsc 검증**

---

### Task 2: AppShell.tsx — root layout

**Files:**
- Create: `src/AppShell.tsx`

App.tsx에서 추출: ActivityBar, theme state, FileViewerModal, ReproRecorderOverlay, navItems, activityBarStore, renderNavItem.

`<Outlet />`이 content 영역을 대체.

URL → activityBarFocusId 로직은 `useLocation()`으로 유지하되, is* 플래그 대신 navItems의 path와 pathname을 매칭.

- [ ] **Step 1: AppShell.tsx 생성**

activityBarFocusId를 navItems.path 기반으로 계산:
```tsx
const activityBarFocusId = navItems.find(n =>
  n.path === '/' ? pathname === '/' : pathname.startsWith(n.path)
)?.id ?? activeGroup?.id
```
이렇게 하면 is* 플래그 7개가 사라짐.

- [ ] **Step 2: tsc 검증**

---

### Task 3: SidebarLayout.tsx — internals layout

**Files:**
- Create: `src/SidebarLayout.tsx`

App.tsx에서 Sidebar 컴포넌트와 AreaSidebar 분기를 추출. `<Outlet />`으로 content 영역 렌더.

- [ ] **Step 1: SidebarLayout.tsx 생성**

```tsx
function SidebarLayout() {
  const { pathname } = useLocation()
  const activeGroup = routeConfig.find(g => pathname.startsWith('/' + g.id))
  if (!activeGroup) return <Outlet />
  return (
    <>
      {activeGroup.id === 'internals/area'
        ? <AreaSidebar />
        : <Sidebar activeGroup={activeGroup} activeItemPath={...} />
      }
      <main className="content"><Outlet /></main>
    </>
  )
}
```

- [ ] **Step 2: tsc 검증**

---

### Task 4: main.tsx — RouterProvider 전환

**Files:**
- Modify: `src/main.tsx`

```tsx
import { RouterProvider } from 'react-router-dom'
import { router } from './router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
```

- [ ] **Step 1: main.tsx 수정**
- [ ] **Step 2: App.tsx 삭제**
- [ ] **Step 3: tsc + lint 검증**

---

### Task 5: 테스트 수정

**Files:**
- Modify: `src/__tests__/activitybar-focus.test.tsx`

`MemoryRouter` + `<App>` → `createMemoryRouter` + `RouterProvider`로 전환.

- [ ] **Step 1: 테스트 업데이트**
- [ ] **Step 2: vitest run 전체 통과 확인**

---

### Task 6: 전체 검증

- [ ] **Step 1: tsc --noEmit**
- [ ] **Step 2: eslint**
- [ ] **Step 3: vitest run**
- [ ] **Step 4: 개발 서버에서 주요 라우트 동작 확인**
  - `/`, `/docs`, `/ui/listbox`, `/examples/cms`, `/examples/viewer`, `/internals/store/inspector`, `/internals/area/overview`
