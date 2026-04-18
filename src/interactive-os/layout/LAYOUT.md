# FlatLayout — 배치 엔진 스펙

FlatLayout은 React JSX 중첩을 NormalizedData 선언으로 대체하는 배치 엔진이다.
화면을 만드는 공식: **데이터 설계 → 컴포넌트 조각(widget) 설계 → `definePage` 하나로 배치**.

```tsx
import { definePage } from '@os/layout'
import { FlatLayout } from '@os/ui/FlatLayout'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'

const layout = definePage({ entities: { /* LayoutNode 트리 */ } })
const registry = createWidgetRegistry({ MyWidget, OtherWidget })

<FlatLayout data={layout} registry={registry} aria-label="My Page" />
```

---

## LayoutNode 레퍼런스

### split — 분할

수평/수직으로 자식을 분할한다. 리사이즈 가능.

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| direction | `'horizontal' \| 'vertical'` | 필수 | 분할 방향 |
| sizes | `(number \| 'flex')[]` | 필수 | 자식별 크기. number=비율(0~1), `'flex'`=나머지 |
| resizable | `boolean` | `true` | `false`면 고정 비율, 리사이저 없음 |
| surface | `LayoutSurface` | — | 깊이 레이어 |

```ts
{ type: 'split', direction: 'horizontal', sizes: [0.2, 'flex', 0.3] }
```

**자식 규칙:** sizes.length === children.length

### stack — 수직 쌓기

자식을 수직으로 쌓는다. gap으로 간격 조절.

| prop | 타입 | 기본값 |
|------|------|--------|
| gap | `'sm' \| 'md' \| 'lg'` | `'md'` |

```ts
{ type: 'stack', gap: 'md' }
```

**자식 규칙:** 제한 없음. 자식은 자연 높이로 렌더링.

### grid — 그리드

CSS grid N열 레이아웃.

| prop | 타입 | 기본값 |
|------|------|--------|
| columns | `2 \| 3 \| 4 \| 5 \| 7` | 필수 |
| gap | `'sm' \| 'md' \| 'lg'` | `'md'` |

```ts
{ type: 'grid', columns: 3, gap: 'sm' }
```

### bar — 수평 바

자식을 수평으로 나열한다.

| prop | 타입 | 기본값 |
|------|------|--------|
| justify | `'start' \| 'center' \| 'between' \| 'end'` | `'start'` |

```ts
{ type: 'bar', justify: 'between' }
```

### nav — 사이드바 + 콘텐츠

첫 번째 자식 = 사이드바, 나머지 = 콘텐츠 탭. NavLayoutContext로 activeIndex 관리.

| prop | 타입 | 기본값 |
|------|------|--------|
| sidebarWidth | `number` (0~1) | `0.2` |

```ts
{ type: 'nav', sidebarWidth: 0.18 }
```

**자식 규칙:** children[0] = nav widget, children[1..] = 콘텐츠 페이지들

### tabgroup — 탭 그룹

자식 탭 중 하나(`activeTabId`)를 활성화하여 본문으로 보여준다. 탭 바는 `ViewerTabList` 기반 store-backed.

| prop | 타입 | 기본값 |
|------|------|--------|
| activeTabId | `string` | 필수 — 초기 활성 tab id |

```ts
{ type: 'tabgroup', activeTabId: 'tab-1' }
```

**자식 규칙:** children은 모두 `type: 'tab'` 노드여야 한다.

**동적 조작:**
- 탭 추가: `workspaceCommands.addTab(tabgroupId, tab)` (activeTabId도 동시 갱신)
- 탭 제거: `workspaceCommands.removeTab(tabId)` — 마지막이면 부모 split 자동 collapse
- 탭 활성화: `workspaceCommands.setActiveTab(tabgroupId, tabId)` 또는 `nextTab/prevTab/gotoTab`

### tab — 탭 자식

tabgroup의 자식. 탭바에 `label`로 표시되고, 활성 시 자신의 children[0]을 본문으로 렌더. 본문 widget은 `useFlatLayoutSurface()` hook으로 자신을 감싼 tab의 data(contentType, contentRef)를 pull할 수 있다.

| prop | 타입 | 기본값 |
|------|------|--------|
| label | `string` | 필수 — 탭 바에 표시 |
| contentType | `string` | — 도메인 키 (예: `'chat'`, `'entities'`, `'files'`) |
| contentRef | `string` | — 도메인 엔티티 식별자 (예: session id) |

```ts
{ type: 'tab', label: 'Chat', contentType: 'chat', contentRef: 'session-1' }
```

**자식 규칙:** children 길이 1. widget / split / stack / tabgroup 중 하나.

### section — 제목 + 콘텐츠

접을 수 있는 섹션. 제목과 카운트 표시.

| prop | 타입 | 기본값 |
|------|------|--------|
| title | `string` | 필수 |
| count | `number` | — |

```ts
{ type: 'section', title: 'Components', count: 42 }
```

### overlay — 오버레이

modal/popup/hint. visible 상태로 표시/숨김.

| prop | 타입 | 기본값 |
|------|------|--------|
| overlayType | `'modal' \| 'popup' \| 'hint'` | 필수 |
| visible | `boolean` | `false` |
| trigger | `string` | — |

```ts
{ type: 'overlay', overlayType: 'modal', visible: false }
```

**토글:** `layoutCommands.setVisibility(nodeId, true/false)` 또는 `updateEntityData`

### floating — 떠있는 요소

화면 상/하단 고정 위치.

| prop | 타입 | 기본값 |
|------|------|--------|
| anchor | `'float-top-center' \| 'float-bottom-center'` | 필수 |
| hidden | `boolean` | `false` |

```ts
{ type: 'floating', anchor: 'float-bottom-center' }
```

### widget — React 컴포넌트 슬롯

registry에 등록된 React 컴포넌트를 배치한다.

| prop | 타입 | 기본값 |
|------|------|--------|
| widget | `string` | 필수 — registry 키 |
| source | `string` | — |

```ts
{ type: 'widget', widget: 'MySidebar', surface: 'sunken' }
```

### state — 데이터 전용 노드

렌더링되지 않는다. widget 간 공유 상태를 store에 보관하는 용도.

```ts
{ type: 'state', selectedId: null, count: 0 }
```

**읽기:** `useFlatLayout()` → `getEntityData(store, 'shared')`
**쓰기:** `dispatch(command)` → store 업데이트

---

## 공통 속성

모든 LayoutNode는 `surface`와 `hidden`을 가진다:

### hidden — 조건부 노출

```ts
{ type: 'widget', widget: 'SortBar', hidden: true }
```

`hidden: true`인 노드는 렌더링되지 않는다 (트리에서 제거).
토글: `updateEntityData(data, nodeId, { hidden: false })` 또는 `layoutCommands.setHidden(nodeId, true/false)`.

### surface — 깊이 레이어

| surface | 용도 | 시각 |
|---------|------|------|
| `'sunken'` | 보조 패널 (사이드바, 디테일) | 움푹 |
| `'base'` | 기본 콘텐츠 | 평평 |
| `'raised'` | 도구바, 부유 패널 | 올라옴 + shape: lg |
| `'overlay'` | 모달, 팝업 | 최상위 |

---

## 조합 규칙

### 가능한 조합

| 부모 | 자식 | 비고 |
|------|------|------|
| split | split, stack, grid, bar, widget, nav, tabgroup | 가장 유연 |
| stack | widget, bar, overlay, floating, section | 수직 쌓기 |
| grid | widget | 그리드 셀 = widget |
| bar | widget | 수평 나열 |
| nav | widget (첫째=nav), section/tabgroup/widget (나머지) | 사이드바+콘텐츠 |
| tabgroup | tab | 자식은 모두 tab 노드 |
| tab | widget, split, stack, tabgroup | 본문 1개 (children 길이 1) |
| section | grid, widget, stack | 섹션 콘텐츠 |
| overlay | widget, stack, split | 오버레이 콘텐츠 |
| floating | widget | 떠있는 콘텐츠 |

### 금지 조합

- widget의 자식으로 split/nav → widget은 리프 또는 widget 자식만
- state는 자식을 가질 수 없음 (데이터 전용)
- overlay 안에 overlay → 중첩 오버레이 금지

---

## Widget 규약

### Pull 모델 (필수)

widget은 props로 런타임 값을 받지 않는다. 도메인 Context에서 pull한다.

```tsx
// 정석: widget이 context에서 pull
function MySidebar() {
  const { store, selectedId } = useMyDomainContext()
  return <ListBox data={store} ... />
}

// 금지: definePage에서 props push
{ type: 'widget', widget: 'MySidebar', props: { items, onSelect } }  // ❌
```

### Domain Context 생성

```ts
import { createDomainContext } from '@os/layout'

export interface MyContextValue { /* ... */ }
export const [MyProvider, useMy] = createDomainContext<MyContextValue>('My')
```

### Widget 구현 위치

- `src/pages/{domain}/{domain}Widgets.tsx` — 도메인 context에 결합
- `src/pages/{domain}/{domain}Context.ts` — Provider + use hook

### Widget에서 사용 가능한 hook

| hook | 용도 |
|------|------|
| `useFlatLayout()` | OS 상태 읽기/쓰기 (store, dispatch) |
| `useDomainContext()` | 도메인 ephemeral 상태 pull |
| `useEngine()` | 데이터 store 접근 |

### Registry

```tsx
import { createWidgetRegistry } from '@os/layout/widgetRegistry'

const registry = createWidgetRegistry({
  MySidebar: MySidebarWidget,
  MyPreview: MyPreviewWidget,
})
```

---

## Commands

### layoutCommands

| command | 시그니처 | 용도 |
|---------|----------|------|
| `setVisibility` | `(nodeId, visible: boolean)` | overlay/floating 표시/숨김 |
| `setHidden` | `(nodeId, hidden: boolean)` | 모든 노드 조건부 노출 |
| `setGap` | `(nodeId, gap: string)` | stack/grid 간격 변경 |
| `setFocus` | `(nodeId, tabId?)` | 현재 포커스된 tabgroup을 기록. splitHere/closeHere/focusDir의 기준점 |
| `splitHere` | `(direction)` | focusedTabgroupId를 horizontal/vertical 분할 |
| `closeHere` | `()` | focused tabgroup의 active tab 제거. 마지막이면 pane 자동 collapse |
| `focusDir` | `(dir)` | `'left'`/`'right'`/`'up'`/`'down'` — DOM rect 기반 공간 이웃 tabgroup으로 포커스 이동 |
| `flashPane` | `()` | focused pane에 300ms flash ring 1회 재생. 위치 확인용 |

### workspaceCommands

| command | 시그니처 | 용도 |
|---------|----------|------|
| `resize` | `(splitId, newSizes: PaneSize[])` | split 크기 변경 |
| `splitPane` | `(paneId, direction)` | 새 분할 생성 |
| `closePane` | `(paneId)` | 패널 제거 |

---

## 패턴 카탈로그

### 3-Pane (CMS 패턴)

```ts
definePage({
  entities: {
    root:    { data: { type: 'split', direction: 'horizontal', sizes: [0.1, 'flex', 0.2] }, children: ['sidebar', 'preview', 'detail'] },
    sidebar: { data: { type: 'widget', widget: 'Sidebar', surface: 'sunken' } },
    preview: { data: { type: 'widget', widget: 'Preview' } },
    detail:  { data: { type: 'widget', widget: 'Detail', surface: 'sunken' } },
  },
})
```

### Sidebar + Content (Catalog 패턴)

```ts
definePage({
  entities: {
    root:    { data: { type: 'nav', sidebarWidth: 0.18 }, children: ['nav', 'page1', 'page2'] },
    nav:     { data: { type: 'widget', widget: 'NavWidget' } },
    page1:   { data: { type: 'section', title: 'Section A' }, children: ['grid1'] },
    grid1:   { data: { type: 'grid', columns: 3 }, children: ['w1', 'w2', 'w3'] },
    ...
  },
})
```

### Stack + Overlay (Book 패턴)

```ts
definePage({
  entities: {
    root:       { data: { type: 'stack', gap: 'md' }, children: ['reader', 'footer', 'nav', 'toc'] },
    reader:     { data: { type: 'widget', widget: 'Reader' } },
    footer:     { data: { type: 'widget', widget: 'Footer' } },
    nav:        { data: { type: 'bar', justify: 'between' }, children: ['prev', 'next'] },
    prev:       { data: { type: 'widget', widget: 'PrevButton' } },
    next:       { data: { type: 'widget', widget: 'NextButton' } },
    toc:        { data: { type: 'overlay', overlayType: 'modal', visible: false }, children: ['toc-w'] },
    'toc-w':    { data: { type: 'widget', widget: 'TocOverlay' } },
  },
})
```

### Simple Stack (i18n 패턴)

```ts
definePage({
  entities: {
    root:   { data: { type: 'stack', gap: 'md' }, children: ['header', 'toolbar', 'hints', 'grid'] },
    header: { data: { type: 'widget', widget: 'Header' } },
    toolbar:{ data: { type: 'widget', widget: 'Toolbar' } },
    hints:  { data: { type: 'widget', widget: 'KeyHints' } },
    grid:   { data: { type: 'widget', widget: 'Grid' } },
  },
})
```

### Fixed Header + Content (Incident 패턴)

```ts
definePage({
  entities: {
    root:      { data: { type: 'split', direction: 'vertical', sizes: [0.05, 'flex'], resizable: false }, children: ['header', 'body'] },
    header:    { data: { type: 'widget', widget: 'Header' } },
    body:      { data: { type: 'split', direction: 'horizontal', sizes: [0.22, 'flex', 0.3], resizable: false }, children: ['left', 'center', 'right'] },
    left:      { data: { type: 'widget', widget: 'Left' } },
    center:    { data: { type: 'widget', widget: 'Center' } },
    right:     { data: { type: 'widget', widget: 'Right' } },
    shared:    { data: { type: 'state', selectedId: null } },
  },
})
```

---

### Conditional Mode Switch (Viewer 패턴)

```ts
definePage({
  entities: {
    root:      { data: { type: 'split', direction: 'horizontal', sizes: [0.18, 'flex'] }, children: ['sidebar', 'content'] },
    sidebar:   { data: { type: 'widget', widget: 'Sidebar', surface: 'sunken' } },
    content:   { data: { type: 'stack' }, children: ['toolbar', 'sort-bar', 'main', 'miller'] },
    toolbar:   { data: { type: 'widget', widget: 'Toolbar' } },
    'sort-bar':{ data: { type: 'widget', widget: 'SortBar', hidden: false } },
    main:      { data: { type: 'split', ... }, children: ['tree', 'preview'] },
    tree:      { data: { type: 'widget', widget: 'TreeGrid' } },
    preview:   { data: { type: 'widget', widget: 'Preview' } },
    miller:    { data: { type: 'widget', widget: 'Miller', hidden: true } },
  },
})
// viewMode 전환: updateEntityData로 sort-bar/main/miller의 hidden 토글
```

---

## 알려진 한계

| # | 한계 | 현재 우회 | 상태 |
|---|------|----------|------|
| 1 | **CMS floating 크롬** — ViewportBar 등 전역 크롬이 FlatLayout 밖 | `ax({ placement })` 직접 사용 | 허용 (전역 크롬은 레이아웃 트리 밖) |
| 2 | **Route-level modal** — present mode 등 라우트 수준 전환 | `RouteModal` / `useOverlay` 별도 | 허용 (FlatLayout 스코프 밖) |
| 3 | **Stack widget 크기 제어** — stack 안 widget이 자연 높이가 아닌 비율 지정 불가 | `vertical split`으로 대체 | GAP — stack sizing 정책 필요 |
| 4 | **동적 노드 CRUD** — definePage는 정적, 런타임 탭 추가/패널 열기 없음 | workspaceCommands + tabgroup renderer 연동 | **해결됨** — workspaceStore command + tabgroup renderer 연동 완료 (cmux-layout-prd.md) |
| 5 | ~~조건부 영역~~ | `LayoutBase.hidden` 일반화로 해결 | **해결됨** |
| 6 | **반응형 레이아웃** — viewport 기반 split 비율/노드 교체 불가 | CSS 미디어쿼리 widget 내부 | GAP — 방법 미정 |
| 7 | **포탈 패턴** — 동일 widget이 트리 두 곳에 동시 등장 불가 | 해당 없음 (현재 필요 사례 없음) | 한계 인지 |
| 8 | **Widget registry 타입 안전성** — props 타입 체크 없음 | `Record<string, unknown>` 캐스팅 | 낮은 우선순위 |

---

## Overlay 배치 기준

| 유형 | 위치 | 이유 |
|------|------|------|
| 콘텐츠 overlay (toc, quickOpen) | FlatLayout 안 (`OverlayNode`) | widget 조합, 레이아웃 트리 소속 |
| 전역 크롬 (ViewportBar, Toolbar) | FlatLayout 밖 (`ax({ placement })`) | 레이아웃 구조와 무관한 전역 UI |
| 라우트 모달 (present mode) | `RouteModal` / `useOverlay` | 라우트 수준 전환, FlatLayout 스코프 밖 |

---

## StateNode vs Domain Context

| 채널 | 대상 | 예시 |
|------|------|------|
| **StateNode** + `useFlatLayout()` | OS가 관심 갖는 상태 (Command로 변경) | selectedEventId, chatItemCount |
| **Domain Context** + `useDomainContext()` | React ephemeral (직렬화 불가) | items, feedRef, 콜백, DOM ref |

두 채널은 공존한다. StateNode는 replay/undo 대상, Context는 아님.
