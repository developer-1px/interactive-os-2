# Workspace

> SplitPane + TabGroup 재귀 오케스트레이터. cmux/IDE 스타일 분할 워크스페이스.

## Demo

```tsx render
<ShowcaseDemo slug="workspace" />
```

## Usage

```tsx
import { Workspace } from 'interactive-os/ui/Workspace'
import { createWorkspace, workspaceCommands } from 'interactive-os/plugins/workspaceStore'

const [data, setData] = useState(() => createWorkspace())

<Workspace
  data={data}
  onChange={setData}
  renderPanel={(tab) => <MyPanel tab={tab} />}
  aria-label="File workspace"
/>
```

### Split pane 추가 (useLayoutKeys)

```tsx
import { useLayoutKeys } from 'hooks/useLayoutKeys'

const { onKeyDown } = useLayoutKeys({
  splitH: () => { /* 수평 분할 로직 */ },
  splitV: () => { /* 수직 분할 로직 */ },
})

<div onKeyDown={onKeyDown}>
  <Workspace data={data} onChange={setData} renderPanel={renderPanel} />
</div>
```

### 외부 데이터 동기화 (syncFromExternal)

```tsx
import { syncFromExternal, collectContentRefs } from 'interactive-os/plugins/workspaceStore'

// useMemo로 외부 데이터 → workspace 탭 동기화
const wsData = useMemo(
  () => syncFromExternal(wsBase, sessions, sessionToTab, isSessionTab),
  [wsBase, sessions],
)
```

- `syncFromExternal(store, items, toTab, filter?)` — 순수 함수, 변경 없으면 동일 참조 반환
- `collectContentRefs(store, filter?)` — contentRef → tabId 맵 수집
- `splitAndAddTab(store, tgId, direction, tab)` — split + 새 tabgroup에 tab 추가

### workspaceCommands

| command | 설명 |
|---------|------|
| `setActiveTab(tgId, tabId)` | 탭 활성화 |
| `resize(splitId, sizes)` | split pane 비율 변경 |
| `addTab(tgId, tab)` | 탭 추가 + 활성화 |
| `removeTab(tabId)` | 탭 삭제 (마지막이면 pane collapse) |
| `splitPane(paneId, direction)` | pane을 split으로 분할 |
| `closePane(paneId)` | pane/tabgroup 전체 닫기 |

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| data | `NormalizedData` | 필수 | workspace store (split/tabgroup/tab 트리) |
| onChange | `(data: NormalizedData) => void` | 필수 | store 변경 콜백 |
| renderPanel | `(tab: Entity) => React.ReactNode` | 필수 | 탭의 컨텐츠 렌더러 |
| aria-label | `string` | — | workspace 레이블 |

## Keyboard

### Workspace 레벨 (useLayoutKeys — 부모 div에 onKeyDown)

| 키 | handler | 설명 |
|----|---------|------|
| `Meta+D` | `splitH` | 수평 분할 (페이지가 제공) |
| `Meta+Shift+D` | `splitV` | 수직 분할 (페이지가 제공) |
| `Meta+W` | `close` | 활성 탭 닫기 (내장) |
| `Meta+Shift+[` | `prevTab` | 이전 탭 전환 (내장) |
| `Meta+Shift+]` | `nextTab` | 다음 탭 전환 (내장) |

- `close`, `prevTab`, `nextTab`은 Workspace가 내장 제공
- `splitH`, `splitV`는 페이지가 useLayoutKeys에 핸들러로 주입
- 핸들러가 없는 키는 무시되고 이벤트 버블링 유지

### TabGroup 레벨 (tabs pattern — 탭바 포커스 시)

| 키 | 동작 |
|----|------|
| `ArrowLeft/Right` | 탭 포커스 이동 |
| `Delete` | 포커스된 탭 삭제 |
| `Meta+W` | 포커스된 탭 삭제 |

### SplitPane 레벨 (separator 포커스 시)

| 키 | 동작 |
|----|------|
| `Arrow keys` | 2% 단위 리사이즈 (방향에 따라) |
| `Home` | 현재 pane 최소화 |
| `End` | 현재 pane 최대화 |

## Accessibility

- Workspace: 컨테이너 역할, `aria-label`
- 내부는 SplitPane (`role="separator"`) + TabGroup (`role="tablist"`) 재귀 위임
- 탭 닫힘 시 인접 탭 자동 활성화 (next 우선, fallback prev)
- 마지막 탭 닫힘 시 pane collapse + split 정리

## Internals

### 데이터 구조

```
NormalizedData (workspaceStore)
  ROOT_ID
    └─ tabgroup (단일) 또는 split
         ├─ tabgroup
         │    ├─ tab { label, contentType, contentRef }
         │    └─ tab
         └─ tabgroup
              └─ tab
```

| entity | type 필드 | 주요 데이터 |
|--------|----------|------------|
| split | `'split'` | `direction`, `sizes: number[]` |
| tabgroup | `'tabgroup'` | `activeTabId: string` |
| tab | `'tab'` | `label`, `contentType`, `contentRef` |

### WorkspaceNode 재귀 렌더링

```
WorkspaceNode(nodeId)
  if type === 'split' → <SplitPane> + children.map(WorkspaceNode)
  if type === 'tabgroup' → <TabGroup>
```

### removeTab 자동 정리

1. 탭 삭제
2. tabgroup 비었으면 → pane 닫기 (closePaneInternal)
3. parent split에 자식 1개만 남으면 → split collapse (남은 자식을 grandparent로 승격)

### CSS

- 방식: CSS Modules
- 파일: Workspace.module.css
- workspace: `height: 100%`, flex-col
- workspaceContent: `flex: 1`, `min-height: 0`, `overflow: hidden`
- empty 상태: 중앙 정렬, `--text-muted`

### 사용처

| 페이지 | 역할 | 외부 데이터 | splitH/splitV |
|--------|------|-----------|---------------|
| PageViewer | 파일 탐색기 워크스페이스 | 직접 openTab | duplicatePane |
| PageAgentChat | 채팅 세션 멀티플렉서 | syncFromExternal(sessions) | splitAndAddTab |
| PageAgentViewer | Agent 세션 + 파일 뷰어 | syncFromExternal(sessions, filter) + openTab(files) | splitAndAddTab |
| PageComponentCreator | 고정 3-pane (Canvas \| Code \| Chat) | createCreatorWorkspace 초기 데이터 | — |
