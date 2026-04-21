---
name: cmuxPrd
type: prd
layer: pages
project: cmux
status: draft
date: 2026-04-20
tags: [cmux, chat, flatlayout, integration]
---

# cmux 통합 — PRD

> **Discussion**: routes doubt 세션 2026-04-20 (대화)
> **산출물 유형**: 페이지 통합 + 기본 fill 정책 변경
> **규모 추정**: 신규 1, 수정 6, 재사용 다수, 삭제 2

## §0 요구사항 (from doubt)

- 해결책 ⑪: `/chat` + `/chat/entities` + `/cmux/preview` → **`/cmux` 단일 라우트**로 통합. **모든 분할 패널의 기본 fill = chat UI (SurfaceLeaf)**.
- 제약 ⑦:
  - 기존 websocket chat 기능 손실 없음 (PageAgentChat이 본체)
  - preview 시나리오 시뮬레이션(`?scenario=`) + entities inspector 기능 유지 (URL 쿼리로 뷰 전환)
  - cmux layout 자체(sidebar + tabgroup)는 이미 FlatLayout 기반 → 구조 변경 최소
- 보유 자산 ⑧:
  - `PageAgentChat` — cmux 삼계층(Workspace/Surface/SplitPane) 이미 FlatLayout로 구현
  - `SurfaceLeafWidget` — tab content widget, 이미 chat pane 렌더
  - `CmuxPreviewScenarios`, `cmuxPreviewWidgets` — 선언 → 픽셀 시뮬 인프라
  - `PageChatEntities` — schema/live/fixtures/commands TreeGrid inspector
  - `layoutCommands.splitHere` — 분할 시 새 pane 생성 API

## §1 책임 분해

| # | 책임 | 파일 경로 | 레이어 | 기존/신규 | 의존 |
|---|------|----------|-------|----------|------|
| 1 | cmux 기본 레이아웃 (sidebar + tabgroup) | `src/pages/chat/PageAgentChat.tsx`의 `chatBaseLayout` | pages | 재사용 | — |
| 2 | 분할 시 기본 content = chat 정책 | `src/interactive-os/layout/layoutCommands.ts` (`splitHere`) | layout | 수정 | — |
| 3 | preview 시나리오 loader (URL `?preview=`) | `src/pages/cmux/cmuxPreviewLoader.ts` | pages | 신규(from cmux-preview/) | — |
| 4 | entities inspector 패널 widget | `src/pages/cmux/EntitiesInspectorWidget.tsx` | pages | 수정(from PageChatEntities) | — |
| 5 | cmux 페이지 컴포넌트 (URL 기반 view 분기) | `src/pages/cmux/PageCmux.tsx` | pages | 수정(from PageAgentChat) | 1, 3, 4 |
| 6 | router 갱신 — `/cmux` 단일 + 구 라우트 redirect | `src/router.tsx` | app | 수정 | 5 |
| 7 | ActivityBar — `/cmux` 단일 항목 | `src/ActivityBar.tsx` | app | 수정 | 6 |
| 8 | 삭제 — `pages/cmux-preview/` (loader로 이동 후) | `src/pages/cmux-preview/**` | pages | 삭제 | 3 |
| 9 | 삭제 — `pages/chat/` 폴더명 `pages/cmux/`로 rename + PageChatEntities 제거 | `src/pages/chat/` → `src/pages/cmux/` | pages | 이동 | 5 |

### 탐색 증거

- `Read("pages/chat/PageAgentChat.tsx")` → 이미 FlatLayout + cmux 구조 완비. "기본 fill = chat"의 75%는 이미 SurfaceLeafWidget의 기본 contentType='chat'로 성립.
- `Read("pages/cmux-preview/PageCmuxPreview.tsx")` → 시나리오 기반 FlatLayout provider wrapper, 10~20줄 수준. 흡수 비용 낮음.
- `Read("pages/chat/PageChatEntities.tsx")` → SplitPane + TreeGrid 4개로 조립. widget 전환 가능.
- `Grep("splitHere\|splitTab")` → `interactive-os/layout/layoutCommands.ts`에서 분할 로직 소유 (§1.2 수정 지점).
- `CATALOG.md`: cmux preview/entities inspector widget 없음 → §1.3, §1.4 신규/수정 정당.

**완성도**: 🟢

## §2 Contract

### `src/pages/cmux/cmuxPreviewLoader.ts` (신규, from cmux-preview)

```ts
import type { NormalizedData } from '@os/store/types'
import type { CmuxPreviewContext } from '../cmux-preview/cmuxPreviewContext'

export interface CmuxPreviewScenario {
  id: string
  label: string
  page: NormalizedData
  context: CmuxPreviewContext
}

/** URL `?preview=<id>` 파싱. id 없거나 잘못되면 null. */
export function parsePreviewQuery(search: string): string | null

/** id → scenario. 없으면 null. */
export function getScenario(id: string | null): CmuxPreviewScenario | null
```

### `src/pages/cmux/EntitiesInspectorWidget.tsx` (수정 from PageChatEntities)

```tsx
/**
 * Entities inspector — widget 형태로 FlatLayout tab 안에서 렌더.
 * PageChatEntities.tsx의 SplitPane+TreeGrid 4개 조립을 그대로 widget으로 포장.
 * URL `?view=entities`일 때 cmux canvas의 tab content로 교체된다.
 */
export function EntitiesInspectorWidget(): JSX.Element
```

### `src/pages/cmux/PageCmux.tsx` (수정 from PageAgentChat)

```tsx
/**
 * cmux 통합 페이지.
 * - 기본: chat workspace (기존 PageAgentChat 동작)
 * - ?preview=<scenario>: FlatLayout data/context를 scenario로 교체 (시뮬 모드)
 * - ?view=entities: 초기 tab의 content widget을 EntitiesInspector로 교체
 *
 * 세 모드 모두 동일 cmux 뼈대(sidebar + tabgroup) 사용.
 */
export default function PageCmux(): JSX.Element
```

### `src/interactive-os/layout/layoutCommands.ts` (수정)

```ts
/**
 * splitHere: 분할 시 새로 생기는 tab의 기본 contentType/widget 정책.
 * @change — 이전: 빈 placeholder / 이후: contentType='chat', widget='SurfaceLeaf'
 * @invariant 기본값은 registry에 SurfaceLeaf가 등록된 경우에만 적용. 없으면 빈 placeholder로 폴백.
 */
export function splitHere(ctx: LayoutCommandCtx, axis: 'horizontal' | 'vertical'): void
```

**완성도**: 🟢

## §3 WHY

1. **/chat이 이미 cmux 그 자체.** `PageAgentChat`의 `chatBaseLayout`은 FlatLayout으로 cmux 삼계층을 완성했다. `/cmux/preview`는 그 구조의 시뮬 버전, `/chat/entities`는 그 store의 inspector 버전. **본체-실험-inspector라는 3 역할이 같은 앱의 뷰 모드일 뿐이다.**
2. **기본 fill = chat은 cmux의 정체성.** 사용자가 Mod+D로 분할했을 때 비어있는 placeholder가 뜨면 "다음 뭐 꽂지"를 고민하게 된다. 분할 = 새 대화 시작이라는 cmux 본연의 UX에 맞추려면 기본 fill이 chat이어야 한다.
3. **URL query로 뷰 분기**는 pages 파일 수를 최소화하면서도 각 모드의 북마크/공유를 유지한다. PageCmuxPreview의 `?scenario=` 패턴을 확장해 `?preview=` / `?view=entities`로 통일.

## §4 HOW

```mermaid
flowchart TD
  U[/cmux URL] --> Q{query parse}
  Q -->|?preview=x| P[load scenario x]
  Q -->|?view=entities| E[tab content = EntitiesInspector]
  Q -->|none| C[default chat layout]
  P --> FL[FlatLayout]
  E --> FL
  C --> FL
  FL --> SB[sidebar widget]
  FL --> TG[tabgroup]
  TG -->|default contentType=chat| SL[SurfaceLeaf widget = ChatPane]
  TG -.split.-> TG2[new tab contentType=chat]
```

## §5 WHAT (의존 순서)

### W1. splitHere 기본값 변경 (§1.2)

**의존**: —
**파일**: `src/interactive-os/layout/layoutCommands.ts`

분할 시 새로 생성되는 tab의 `contentType`/`contentRef` 기본값을 `'chat'` / `''`로, content widget을 `'SurfaceLeaf'`로 설정. registry에 `SurfaceLeaf`가 없을 때만 빈 placeholder로 폴백.

```ts
const DEFAULT_SPLIT_CONTENT = { contentType: 'chat', widget: 'SurfaceLeaf' } as const

function hasDefaultWidget(registry: WidgetRegistry | undefined): boolean {
  return !!registry?.has?.(DEFAULT_SPLIT_CONTENT.widget)
}

export function splitHere(ctx: LayoutCommandCtx, axis: 'horizontal' | 'vertical'): void {
  // ... 기존 분할 로직 ...
  const newTab = hasDefaultWidget(ctx.registry)
    ? { type: 'tab', label: 'Chat', contentType: 'chat', contentRef: '' }
    : { type: 'tab', label: 'Untitled', contentType: 'widget', contentRef: '' }
  // ... insert newTab ...
}
```

**검증**: vitest — `splitHere({registry: {has: () => true}}, 'horizontal')` → 새 tab의 `contentType === 'chat'`. registry 없을 때 `'widget'`.

### W2. cmuxPreviewLoader (§1.3)

**의존**: —
**파일**: `src/pages/cmux/cmuxPreviewLoader.ts`

```ts
import { getScenario as getRaw } from '../cmux-preview/cmuxPreviewScenarios'

export function parsePreviewQuery(search: string): string | null {
  return new URLSearchParams(search).get('preview')
}

export function getScenario(id: string | null) {
  return id ? getRaw(id) : null
}

// 이 파일 확정 후 cmux-preview/ 내부 파일들을 pages/cmux/로 이동
// (cmuxPreviewScenarios.ts, cmuxPreviewWidgets.tsx, cmuxPreviewContext.ts)
```

**검증**: `parsePreviewQuery('?preview=split')` → `'split'`. `getScenario(null)` → `null`.

### W3. EntitiesInspectorWidget (§1.4)

**의존**: —
**파일**: `src/pages/cmux/EntitiesInspectorWidget.tsx`

PageChatEntities.tsx의 JSX를 그대로 widget 함수로 포장. export 방식만 변경.

**검증**: screen test — `/cmux?view=entities` → Schema/Live/Commands TreeGrid 렌더.

### W4. PageCmux (§1.5)

**의존**: W1, W2, W3
**파일**: `src/pages/cmux/PageCmux.tsx`

```tsx
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { FlatLayout } from '@os/ui/FlatLayout'
import { defineLayout } from '@os/layout/flatLayout'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { useActiveSession, useChatSessions } from './chatStore'
import { ChatProvider } from './chatContext'
import { WorkspaceSidebarWidget, SurfaceLeafWidget } from './chatWidgets'
import { ChatKeybindingsWidget } from './chatKeybindings'
import { parsePreviewQuery, getScenario } from './cmuxPreviewLoader'
import { EntitiesInspectorWidget } from './EntitiesInspectorWidget'
import { cmuxPreviewWidgets } from './cmuxPreviewWidgets'
import { CmuxPreviewProvider } from './cmuxPreviewContext'
import './PageAgentChat.css'

const defaultCmuxLayout = defineLayout({ /* 기존 chatBaseLayout 그대로 */ })

function makeEntitiesLayout() {
  return defineLayout({
    entities: {
      ...defaultCmuxLayout.entities,
      't1-body': { data: { type: 'widget', widget: 'EntitiesInspector' } },
    },
  })
}

const cmuxWidgets = createWidgetRegistry({
  WorkspaceSidebar: WorkspaceSidebarWidget,
  SurfaceLeaf: SurfaceLeafWidget,
  EntitiesInspector: EntitiesInspectorWidget,
})

export default function PageCmux() {
  const { search } = useLocation()
  const previewId = parsePreviewQuery(search)
  const view = new URLSearchParams(search).get('view')

  // Preview mode: scenario 기반 (chat store 무시)
  if (previewId) {
    const scenario = getScenario(previewId)
    if (!scenario) return <div>Unknown scenario: {previewId}</div>
    return (
      <CmuxPreviewProvider value={scenario.context}>
        <FlatLayout data={scenario.page} registry={cmuxPreviewWidgets} aria-label={`cmux preview — ${scenario.label}`} />
      </CmuxPreviewProvider>
    )
  }

  // Default / entities mode: 실제 chat store
  const sessions = useChatSessions()
  const activeSession = useActiveSession()
  const chatCtx = useMemo(() => ({
    sessions, activeSessionId: activeSession?.id ?? null,
    modifiedFiles: [], workspaces: [{ id: 'ws-1', label: 'Claude', status: 'idle' as const, unreadCount: 0 }],
    activeWorkspaceId: 'ws-1',
  }), [sessions, activeSession])

  const layout = view === 'entities' ? makeEntitiesLayout() : defaultCmuxLayout

  return (
    <ChatProvider value={chatCtx}>
      <FlatLayout data={layout} registry={cmuxWidgets} aria-label="cmux">
        <ChatKeybindingsWidget />
      </FlatLayout>
    </ChatProvider>
  )
}
```

**검증**:
- `/cmux` → 기존 `/chat` 동작 동일
- `/cmux?view=entities` → 초기 tab이 EntitiesInspector
- `/cmux?preview=split` → scenario 렌더
- Mod+D 분할 시 새 tab이 chat (SurfaceLeaf)

### W5. router + redirect (§1.6)

**의존**: W4
**파일**: `src/router.tsx`

```ts
{ path: '/cmux', lazy: () => import('./pages/cmux/PageCmux').then(m => ({ Component: m.default })) },
// redirect for backward compat
{ path: '/chat', element: <Navigate to="/cmux" replace /> },
{ path: '/chat/entities', element: <Navigate to="/cmux?view=entities" replace /> },
{ path: '/cmux/preview', element: <Navigate to="/cmux" replace /> },
// /cmux/preview?scenario=x → /cmux?preview=x 는 redirect loader에서 처리하거나 수동 링크 갱신
```

**검증**: 수동 — 구 URL 방문 시 redirect 작동.

### W6. ActivityBar (§1.7)

**의존**: W5
**파일**: `src/ActivityBar.tsx`

```ts
// 'chat' 항목의 path를 '/cmux'로 변경. id는 'cmux'로 rename 권장(navPaths 일치 유지).
{ id: 'cmux', label: 'cmux', icon: MessageSquare, path: '/cmux' },
// 제거: cmux-preview (보조/진행중 섹션)
```

**검증**: 네비 클릭 → `/cmux` 진입.

### W7. 파일 이동/삭제 (§1.8, §1.9)

**의존**: W4, W5, W6
**파일**: `git mv` + `rm -rf`

1. `git mv src/pages/chat src/pages/cmux`
2. `git mv src/pages/cmux-preview/cmuxPreview*.ts{,x} src/pages/cmux/`
3. `rm src/pages/cmux-preview/PageCmuxPreview.tsx` → 디렉토리 빔 → `rmdir`
4. `rm src/pages/cmux/PageAgentChat.tsx` (PageCmux가 대체)
5. `rm src/pages/cmux/PageChatEntities.tsx` (EntitiesInspectorWidget이 대체)
6. PageAgentChat.css → `PageCmux.css`로 rename
7. 모든 `@/pages/chat/`, `@/pages/cmux-preview/` import 경로 일괄 치환

**검증**: `Grep("pages/chat|pages/cmux-preview")` 0건. typecheck pass. dev server에서 `/cmux`, `/cmux?view=entities`, `/cmux?preview=split` 모두 정상.

## §6 원칙 감시자 결과

- ✅ 레이어 의존 순서: layout(W1) ← pages(W2~W4). 역방향 없음.
- ✅ 있는 걸로 먼저: chatBaseLayout, SurfaceLeafWidget, cmuxPreviewScenarios, PageChatEntities JSX 모두 재사용.
- ✅ 파일명 규칙: Page*, *Widget, *Loader — pages 관례 준수.
- ✅ FlatLayout 단일 레이아웃 엔진 사용, SplitPane 직접 조립 없음 (단 W3 이관 시 기존 SplitPane 사용은 위젯 내부라 수용 가능; 추후 FlatLayout sub-layout으로 리팩토링 후속).
- ⚠️  W1은 기존 sight unseen 구현을 확인해야 안전 — `layoutCommands.ts`의 실제 구조 확인 후 착수.
- ⚠️  W4 `useChatSessions`/`useActiveSession`을 preview 분기 이전에 호출하지 않도록 조건부 hook 순서 주의 (React rules of hooks). 필요 시 별도 컴포넌트로 split.

---

**전체 완성도**: 🟢 (W1, W4의 주의점 해소 후 착수)

## 착수 순서 요약

1. W1 `splitHere` 기본값 변경 (+ unit test)
2. W2 `cmuxPreviewLoader` 신설
3. W3 `EntitiesInspectorWidget` 작성 (PageChatEntities 이관)
4. W4 `PageCmux` 작성 — hook 순서 안전하게 분기
5. W7 파일 이동/삭제 (`git mv`)
6. W5 router redirect
7. W6 ActivityBar 갱신
8. dev server 수동 3모드 검증 + typecheck + 커밋

## studio PRD와의 관계

- studio = **선언적 UI 런타임의 쇼케이스** (조립/스트리밍 example)
- cmux = **선언적 UI 런타임의 프로덕션 앱** (실사용 chat workspace)
- 둘 다 FlatLayout을 SSOT로 공유 → `useLayoutStream`(studio §1.2) 등의 primitives는 cmux에서도 재사용 가능 (예: AI가 대화 중 UI를 스트리밍으로 내려보내는 시나리오).
