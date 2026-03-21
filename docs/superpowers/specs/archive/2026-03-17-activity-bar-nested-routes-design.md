# ActivityBar + Nested Routes — Design Spec

**Date:** 2026-03-17
**Scope:** App shell 리팩터링 — flat sidebar → ActivityBar + layer-grouped nested routes

---

## 1. Problem

현재 `App.tsx`는 14개 APG 패턴 + Viewer를 flat sidebar에 나열한다. 문제:

- **구조 부재** — Store/Engine/Plugin 레이어 showcase가 들어갈 자리가 없다
- **혼재** — Behavior 데모(treegrid)와 Component 쇼케이스(Viewer)가 같은 레벨
- **확장 불가** — Vision 문서, DevTools 등 새 카테고리 추가 시 sidebar가 무한 확장

## 2. Design

### 2.1 Layout: ActivityBar + Sidebar + Content

```
┌──────┬────────────────┬──────────────────────────────┐
│ Act  │   Sidebar      │        Content               │
│ Bar  │   (context)    │                              │
│      │                │                              │
│ 48px │   220px        │        flex: 1               │
└──────┴────────────────┴──────────────────────────────┘
```

- **ActivityBar** (왼쪽 48px): 아이콘 + 레이어 이름(작은 텍스트). 세로 고정. 현재 선택된 그룹 표시.
- **Sidebar** (220px): 선택된 그룹의 하위 페이지 목록. 기존 sidebar 스타일 유지.
- **Content**: 기존과 동일.

### 2.2 Route Structure

Default landing은 `/components/viewer`. Viewer는 모든 레이어(Store, Engine, Plugin, Behavior, Component)를 사용하면서 동시에 프로젝트 문서를 보여주는 메타적 쇼케이스이므로, "이 프로젝트가 뭔지"를 한눈에 보여주는 진입점으로 적합하다.

기존 URL(`/treegrid`, `/listbox` 등)은 모두 `/behaviors/*`로 변경된다. 외부 링크 및 북마크 대응으로 catch-all route를 추가하여 `/behaviors/treegrid`로 리디렉트한다.

```
/                              → Navigate to /components/viewer
/*                             → catch-all: Navigate to /components/viewer
/store
  /store/explorer              → placeholder
  /store/operations            → placeholder
/engine
  /engine/pipeline             → placeholder
  /engine/history              → placeholder
/plugins
  /plugins/core                → placeholder
  /plugins/crud                → placeholder
  /plugins/clipboard           → placeholder
  /plugins/rename              → placeholder
  /plugins/dnd                 → placeholder
/behaviors
  /behaviors/treegrid          → 기존 treegrid 페이지
  /behaviors/listbox           → 기존 listbox 페이지
  /behaviors/tabs              → 기존 tabs 페이지
  /behaviors/menu              → 기존 menu 페이지
  /behaviors/accordion         → 기존 accordion 페이지
  /behaviors/disclosure        → 기존 disclosure 페이지
  /behaviors/dialog            → 기존 dialog 페이지
  /behaviors/combobox          → 기존 combobox 페이지
  /behaviors/toolbar           → 기존 toolbar 페이지
  /behaviors/grid              → 기존 grid 페이지
  /behaviors/radiogroup        → 기존 radiogroup 페이지
  /behaviors/alertdialog       → 기존 alertdialog 페이지
  /behaviors/switch            → 기존 switch 페이지
/components
  /components/viewer           → 기존 viewer 페이지 (default landing)
/vision
  /vision/architecture         → mermaid 비전 문서 렌더링
```

### 2.3 ActivityBar Items

| 순서 | ID | Label | 아이콘 | 기본 경로 |
|------|----|-------|--------|-----------|
| 1 | store | Store | `Database` (lucide) | /store/explorer |
| 2 | engine | Engine | `Cog` | /engine/pipeline |
| 3 | plugins | Plugins | `Plug` | /plugins/core |
| 4 | behaviors | Behaviors | `Keyboard` | /behaviors/treegrid |
| 5 | components | Components | `Layout` | /components/viewer |
| 6 | vision | Vision | `Map` | /vision/architecture |

ActivityBar 아이콘은 Lucide React 사용 (이미 devDependency에 있음).

### 2.4 ActivityBar 스타일

현재 디자인 톤(`App.css`)을 그대로 유지:
- 배경: `--bg-surface`
- 활성 아이콘: `--accent` (초록)
- 비활성 아이콘: `--text-muted`
- 활성 표시: 왼쪽 2px accent border (기존 sidebar의 `border-right` 패턴에서 방향만 반전한 새 스타일)
- 아이콘 아래 작은 텍스트 (10px, mono)

### 2.5 Sidebar 동작

- ActivityBar 그룹 선택 시 → 해당 그룹의 하위 페이지 목록 표시
- 목록 헤더에 그룹 이름 (기존 `sidebar-section-title` 스타일)
- 하위 페이지 링크는 기존 `sidebar-link` 스타일 그대로
- URL이 그룹 prefix와 매치되면 해당 ActivityBar 아이콘 활성화 (`pathname.startsWith('/' + group.id)`)
- 그룹 루트 경로 접속 시 (예: `/store`) → 해당 그룹의 `basePath`로 리디렉트

### 2.6 Route Config 데이터 구조

```ts
interface RouteGroup {
  id: string
  label: string
  icon: LucideIcon
  basePath: string
  items: RouteItem[]
}

interface RouteItem {
  path: string
  label: string
  status: 'ready' | 'wip' | 'placeholder'
  component: React.ComponentType | null  // null = placeholder
}
```

모든 라우트 정의를 하나의 `routeConfig` 배열로 관리. ActivityBar, Sidebar, Routes 모두 이 데이터에서 파생.

### 2.7 Placeholder 페이지

새 레이어 페이지는 공통 `Placeholder` 컴포넌트로 렌더링:
- 레이어 이름 + 페이지 이름
- "Coming soon" 텍스트
- 기존 `wip-placeholder` CSS 클래스 재사용

### 2.8 기존 페이지 이동

기존 14개 페이지 파일(`src/pages/*.tsx`)은 **파일 위치를 변경하지 않는다**. 라우트 경로만 `/treegrid` → `/behaviors/treegrid`로 변경. import 경로는 동일.

## 3. Impact

### 변경 파일
- `src/App.tsx` — 전면 리라이트 (ActivityBar + nested routes + routeConfig)
- `src/App.css` — ActivityBar 스타일 추가, 기존 sidebar 스타일 조정

### 신규 파일
- `src/pages/placeholder.tsx` — 공통 placeholder 컴포넌트
- `src/pages/vision-architecture.tsx` — placeholder (향후 mermaid 비전 문서 렌더링)

### 변경하지 않는 것
- `src/pages/*.tsx` (기존 14개 페이지) — 그대로
- `src/interactive-os/**` — 라이브러리 코드 무관
- 테스트 — 데모 페이지에 대한 테스트 없음 (showcase app)

## 4. Rejected Alternatives

### 파일 디렉토리 재구성 (`src/pages/behaviors/treegrid.tsx`)
라우트 구조와 파일 구조를 1:1 매핑하면 깔끔하지만, 14개 파일의 import 경로가 전부 바뀌고 git diff가 불필요하게 커진다. 라우트 경로만 바꾸는 것으로 충분.

### React Router Layout Routes
`<Outlet>` 기반 nested layout도 가능하나, 현재 규모에서는 과도. 단일 `App.tsx`에서 routeConfig 기반으로 렌더링하는 것이 단순.
