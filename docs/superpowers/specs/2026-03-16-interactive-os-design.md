# interactive-os Design Spec

작성일: 2026-03-16

## 개요

**interactive-os**는 모든 ARIA role에 대해 키보드 인터랙션, 포커스 관리, CRUD를 플러그인 아키텍처로 통합 제공하는 React 전용 headless 프레임워크다.

기존 라이브러리(React Aria, react-complex-tree 등)는 탐색/표시(show) 수준의 키보드 지원은 하지만, copy/paste/undo/redo 같은 편집(edit) 기능을 통합 제공하지 않는다. interactive-os는 이 갭을 메운다.

### 핵심 비전

- **키보드가 마우스보다 중요해지는 FE** — 데스크톱 앱 수준의 키보드 조작을 웹에서
- **ProseMirror가 텍스트 에디터에 한 것을 ARIA 컴포넌트에** — 플러그인으로 기능을 조합
- **LLM 친화적 API** — pit of success, 정답 코드의 형태가 하나로 수렴

### 타겟 사용자

디자인 시스템 / 컴포넌트를 만드는 개발자. 앱 개발자는 이 프레임워크 위에 만들어진 컴포넌트를 소비한다.

```
interactive-os (headless 코어)
  → 디자인 시스템 개발자가 <Aria>로 컴포넌트 제작
    → 앱 개발자가 완성된 <FileTree>, <DataGrid> 사용
```

---

## 레이어 아키텍처

```
┌─────────────────────────────────────────────┐
│  ⑥ UI Layer (interactive-os/ui)              │
│     shadcn 방식 레퍼런스 컴포넌트 (복사/수정)    │
├─────────────────────────────────────────────┤
│  ⑤ Compound Components                      │
│     <Aria> + <Aria.Node> + <Aria.Cell>       │
│     render slot 기반, 소비자는 시각만 담당       │
├─────────────────────────────────────────────┤
│  ④ ARIA Behavior Layer                       │
│     behavior 객체로 role별 키보드/포커스/aria-*  │
│     프리셋 제공 + 오버라이드 + 커스텀 정의 가능   │
├─────────────────────────────────────────────┤
│  ③ Plugin System                             │
│     미들웨어 체인으로 Command 파이프라인에 참여    │
│     core(), crud(), history(), clipboard()... │
├─────────────────────────────────────────────┤
│  ② Command Engine                            │
│     Command 객체(execute/undo) + 미들웨어       │
│     모든 조작의 단일 진입점                      │
├─────────────────────────────────────────────┤
│  ① Normalized Store                          │
│     entities + relationships                 │
│     transform 어댑터로 외부 데이터 변환          │
└─────────────────────────────────────────────┘
       ↕ 외부 상태관리 (Zustand, Jotai 등)
```

---

## ① Normalized Store

### 정규화 포맷

프레임워크가 이해하는 유일한 데이터 형태:

```ts
interface NormalizedData {
  entities: Record<string, Entity>
  relationships: Record<string, string[]>
}

interface Entity {
  id: string
  [key: string]: unknown
}
```

- `entities` — 데이터 자체. key는 id, value는 소비자가 자유롭게 정의
- `relationships` — 구조. key는 parentId, value는 정렬된 childIds 배열 (순서 = 렌더링 순서)
- Root entity — `relationships["__root__"]`가 최상위 노드 목록을 가리킴
- Entity와 Relationship의 분리가 핵심:
  - `rename()` → entities만 수정
  - `dnd()` → relationships만 수정
  - `history()` → 둘을 독립적으로 diff/patch

### Transform 어댑터

외부 데이터 ↔ 정규화 포맷 양방향 변환:

```ts
interface TransformAdapter<TExternal> {
  normalize(external: TExternal): NormalizedData
  denormalize(internal: NormalizedData): TExternal
}
```

- 소비자는 자기 데이터 shape에 맞는 어댑터를 한 번만 작성
- CRUD 전용 훅 불필요 — 정규화 포맷에 대한 일반적인 조작이 곧 CRUD

### 외부 상태 연결

```ts
const store = useExternalStore(zustandStore, fileTreeAdapter)
```

- 상태는 외부 store에 위임
- 프레임워크는 transform을 통해 읽기/쓰기만 중개

### 데이터 주입은 선택적

- treegrid — 외부 데이터(entities + relationships) 필수
- disclosure — 데이터 없이도 동작 (내부 상태로 관리)
- disclosure에 외부 제어가 필요하면 entities를 주입 가능

```ts
// 데이터 없이 동작
const disc = useAria({ behavior: disclosure, plugins: [core()] })

// 외부에서 상태 제어
const disc = useAria({
  behavior: disclosure,
  entities: { "section-1": { open: true } },
  plugins: [core()]
})
```

---

## ② Command Engine

### Command 인터페이스

```ts
interface Command {
  type: string              // 네임스페이스: 'clipboard:paste', 'crud:delete'
  payload: unknown
  execute(store: NormalizedData): NormalizedData
  undo(store: NormalizedData): NormalizedData
}

// 여러 Command를 하나의 undo 단위로 묶는 Batch Command
interface BatchCommand extends Command {
  type: 'batch'
  commands: Command[]
  execute(store: NormalizedData): NormalizedData  // commands를 순서대로 실행
  undo(store: NormalizedData): NormalizedData     // commands를 역순으로 undo
}
```

- Command는 순수 함수 — 현재 store를 받아 새 store를 반환 (immutable)
- `execute`와 `undo`가 쌍으로 존재 — undo/redo가 아키텍처에 내장
- BatchCommand — 여러 Command를 묶어 하나의 undo 단위로 만들 수 있음 (예: "선택된 5개 노드 삭제"를 한 번에 undo)

### 실행 모델

Command Engine이 Command의 실행과 상태 적용을 담당한다:

```ts
interface CommandEngine {
  dispatch(command: Command): void
  getStore(): NormalizedData
}

function createCommandEngine(
  initialStore: NormalizedData,
  middlewares: Middleware[],
  onStoreChange: (store: NormalizedData) => void  // 외부 store 동기화
): CommandEngine {
  let store = initialStore

  // 파이프라인의 마지막 — Command를 실제 실행하고 store에 적용
  const executor = (command: Command) => {
    store = command.execute(store)
    onStoreChange(store)
  }

  // 미들웨어 체인 구성 (outside-in, Express 방식)
  const chain = middlewares.reduceRight(
    (next, mw) => mw(next),
    executor
  )

  return {
    dispatch: (command) => chain(command),
    getStore: () => store,
  }
}
```

- **Engine이 `execute()` 반환값을 store에 적용** — Command는 순수하게 새 상태만 반환, 부수효과는 Engine이 처리
- **`onStoreChange`로 외부 store 동기화** — transform 어댑터의 `denormalize`를 거쳐 외부 상태관리에 반영
- **미들웨어는 outside-in** — 먼저 등록된 미들웨어가 바깥에서 감싸는 형태 (Express 방식)
- **history 미들웨어가 undo 시**: `next()`를 호출하지 않고 직접 `command.undo(engine.getStore())`를 실행하여 store 적용

### 미들웨어 파이프라인

```ts
type Middleware = (next: (command: Command) => void) => (command: Command) => void
```

- 미들웨어 순서 = 플러그인 등록 순서
- Command가 체인을 순서대로 통과하며 실행
- 미들웨어는 `next()`를 호출하지 않으면 Command를 차단할 수 있음 (validation, permissions)
- 미들웨어는 `next()` 전후에 로직을 실행할 수 있음 (logging, history 기록)

---

## ③ Plugin System

### Plugin 인터페이스

플러그인은 두 가지 역할을 겸한다:
1. **Command 생산자** — 특정 조작에 대한 Command 객체를 생성
2. **미들웨어** — Command 파이프라인에 참여하여 가로채기/변환/기록

```ts
interface Plugin {
  middleware?: Middleware
  commands?: Record<string, (...args: any[]) => Command>
}
```

### 내장 플러그인 예시

```ts
// 조합해서 사용
plugins: [core(), crud(), history(), clipboard(), rename(), dnd()]
```

| 플러그인 | 역할 |
|----------|------|
| `core()` | 포커스 관리, 선택, 탐색 — 모든 role에 필수 |
| `crud()` | create, read, update, delete — entities/relationships 조작 |
| `history()` | undo/redo — Command 스택 관리 (미들웨어로 동작) |
| `clipboard()` | copy/cut/paste — 노드 복사/이동 |
| `rename()` | inline editing — F2로 노드 이름 편집 |
| `dnd()` | drag & drop — 키보드 포함 |

### history 플러그인 상세

```ts
function history(): Plugin {
  const past: Command[] = []
  const future: Command[] = []

  return {
    middleware: (next) => (command) => {
      if (command.type === 'history:undo') {
        const cmd = past.pop()
        cmd?.undo(/* ... */)
        future.push(cmd)
      } else if (command.type === 'history:redo') {
        const cmd = future.pop()
        cmd?.execute(/* ... */)
        past.push(cmd)
      } else {
        next(command)
        past.push(command)
        future.length = 0
      }
    }
  }
}
```

### readonly vs CRUD

- **전체 readonly** — CRUD 플러그인을 안 넣으면 됨
- **노드별 readonly** — permissions 미들웨어로 Command를 조건부 차단

```ts
const permissions = (rules): Middleware => (next) => (command) => {
  const target = command.payload.nodeId
  if (rules(target, command.type)) next(command)
}

plugins: [
  permissions((node, action) => {
    if (node.locked && action === 'rename:execute') return false
    if (node.isRoot && action === 'crud:delete') return false
    return true
  }),
  crud(),
  history(),
]
```

---

## ④ ARIA Behavior Layer

### Behavior 인터페이스

```ts
interface AriaBehavior {
  role: string
  keyMap: Record<string, (ctx: BehaviorContext) => Command | void>
  focusStrategy: FocusStrategy
  ariaAttributes: (node: Entity, state: NodeState) => Record<string, string>
}

interface FocusStrategy {
  type: 'roving-tabindex' | 'aria-activedescendant'
  orientation: 'vertical' | 'horizontal' | 'both'
}
```

### BehaviorContext

keyMap 핸들러가 받는 컨텍스트. 현재 포커스/선택 상태 + 탐색 메서드 + Command dispatch:

```ts
interface BehaviorContext {
  // 현재 상태
  focused: string                  // 현재 포커스된 노드 id
  selected: string[]               // 현재 선택된 노드 id 목록
  isExpanded: boolean              // 현재 포커스된 노드의 expanded 상태

  // 탐색 메서드 — 포커스 이동 Command를 반환
  focusNext(): Command
  focusPrev(): Command
  focusFirst(): Command
  focusLast(): Command
  focusParent(): Command
  focusChild(): Command            // 첫 번째 자식으로

  // 조작 메서드
  expand(): Command
  collapse(): Command
  activate(): Command              // Enter 기본 동작
  toggleSelect(): Command

  // Command dispatch — 플러그인의 Command를 실행
  dispatch(command: Command): void

  // store 접근 (읽기 전용)
  getEntity(id: string): Entity | undefined
  getChildren(id: string): string[]
}
```

### NodeState

render slot과 ariaAttributes가 받는 노드 상태. 기본 상태 + behavior별 확장:

```ts
// 모든 behavior에 공통인 기본 상태
interface NodeState {
  focused: boolean
  selected: boolean
  disabled: boolean
  index: number                    // 형제 중 위치 (0-based)
  siblingCount: number             // 형제 총 수

  // tree 계열 behavior에서만 존재 (treegrid, tree)
  expanded?: boolean
  level?: number

  // behavior별 커스텀 확장 — 소비자가 제네릭으로 타입 지정 가능
  [key: string]: unknown
}
```

behavior가 `NodeState`를 확장하는 예:

```ts
// timeline behavior에서 커스텀 상태 추가
interface TimelineNodeState extends NodeState {
  currentTime: number
  duration: number
}

const timelineBehavior: AriaBehavior<TimelineNodeState> = {
  // ...
  ariaAttributes: (node, state) => ({
    'aria-valuenow': String(state.currentTime),  // 타입 안전
  })
}
```

### useAria 훅

`<Aria>` 컴포넌트의 프로그래매틱 대안. 컴포넌트 없이 직접 제어가 필요할 때 사용:

```ts
interface UseAriaOptions {
  behavior: AriaBehavior
  store?: NormalizedData          // 외부 store 연결 시
  keyMap?: Record<string, (ctx: BehaviorContext) => Command | void>  // 오버라이드
  plugins?: Plugin[]
}

interface UseAriaReturn {
  // Command dispatch
  dispatch(command: Command): void

  // 노드별 props 생성 — compound component 없이 직접 바인딩할 때
  getNodeProps(id: string): {
    role: string
    tabIndex: number
    'aria-expanded'?: string
    'aria-selected'?: string
    'aria-level'?: string
    onKeyDown: (e: KeyboardEvent) => void
    onFocus: (e: FocusEvent) => void
  }

  // 상태 조회
  getNodeState(id: string): NodeState
  focused: string
  selected: string[]

  // store 접근
  getStore(): NormalizedData
}
```

일반적으로 `<Aria>` compound component 사용을 권장. `useAria`는 compound component로 표현하기 어려운 고급 사용 사례(가상화, 커스텀 렌더링 파이프라인 등)를 위한 escape hatch.
```

### Behavior는 객체로 주입

문자열이 아닌 import한 객체:

```ts
import { treegrid, listbox, disclosure } from 'interactive-os/behaviors'
```

- Tree-shakable — 안 쓰는 behavior는 번들에 안 들어감
- 타입 추론 — behavior의 keyMap, ariaAttributes 타입이 자동으로 잡힘
- OCP — 새 behavior 추가 시 프레임워크 코드 수정 불필요

### 프리셋 + 오버라이드

같은 treegrid라도 제품마다 동작이 다를 수 있다 (VS Code vs IntelliJ). 프리셋을 기본값으로 제공하되 오버라이드 가능:

```ts
const tree = useAria({
  behavior: treegrid,
  keyMap: {
    'Enter': (ctx) => ctx.toggleSelect(),  // VS Code 스타일로 오버라이드
  },
  plugins: [core(), crud()],
  store,
})
```

- `behavior` 필드에 프리셋을 넣으면 기본 keyMap/focusStrategy/ariaAttributes 로드
- 명시한 필드만 deep merge로 오버라이드
- 프리셋 없이 전부 직접 정의도 가능

### 커스텀 behavior

W3C APG에 없는 role도 같은 인터페이스로 정의:

```ts
const timelineBehavior: AriaBehavior = {
  role: 'application',
  keyMap: {
    'ArrowLeft': (ctx) => ctx.dispatch(scrub(-1)),
    'ArrowRight': (ctx) => ctx.dispatch(scrub(+1)),
    'Space': (ctx) => ctx.dispatch(togglePlay()),
  },
  focusStrategy: { type: 'roving-tabindex', orientation: 'horizontal' },
  ariaAttributes: (node, state) => ({
    'aria-valuenow': String(state.currentTime),
    'aria-valuemin': '0',
    'aria-valuemax': String(state.duration),
  })
}
```

### treegrid behavior 프리셋 예시

```ts
const treegridBehavior: AriaBehavior = {
  role: 'treegrid',
  keyMap: {
    'ArrowDown':     (ctx) => ctx.focusNext(),
    'ArrowUp':       (ctx) => ctx.focusPrev(),
    'ArrowRight':    (ctx) => ctx.isExpanded ? ctx.focusChild() : ctx.expand(),
    'ArrowLeft':     (ctx) => ctx.isExpanded ? ctx.collapse() : ctx.focusParent(),
    'Enter':         (ctx) => ctx.activate(),
    'Space':         (ctx) => ctx.toggleSelect(),
    'Home':          (ctx) => ctx.focusFirst(),
    'End':           (ctx) => ctx.focusLast(),
    'Ctrl+C':        (ctx) => ctx.dispatch(clipboard.copy(ctx.selected)),
    'Ctrl+V':        (ctx) => ctx.dispatch(clipboard.paste(ctx.focused)),
    'Ctrl+Z':        (ctx) => ctx.dispatch(history.undo()),
    'Ctrl+Shift+Z':  (ctx) => ctx.dispatch(history.redo()),
    'Delete':        (ctx) => ctx.dispatch(crud.delete(ctx.selected)),
    'F2':            (ctx) => ctx.dispatch(rename.start(ctx.focused)),
  },
  focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
  ariaAttributes: (node, state) => ({
    'aria-expanded': String(state.expanded),
    'aria-level': String(state.level),
    'aria-selected': String(state.selected),
    'aria-posinset': String(state.index + 1),
    'aria-setsize': String(state.siblingCount),
  })
}
```

### ARIA role별 데이터 결합도

모든 role이 같은 정규화 포맷 위에서 동작하되, 데이터 주입은 선택적:

| 레벨 | 예시 | entities | relationships |
|------|------|----------|---------------|
| Entity CRUD | treegrid, listbox, grid | 외부 필수 | 외부 필수 |
| Data-driven | accordion, menu, tabs | 외부 필수 | 외부 필수 |
| Stateful UI | disclosure, dialog, tooltip | 선택적 | 불필요 |

---

## ⑤ Compound Components

### 단일 진입점: `<Aria>`

```tsx
<Aria
  behavior={treegrid}
  store={store}
  keyMap={{ 'Enter': (ctx) => ctx.toggleSelect() }}
  plugins={[core(), crud(), history(), clipboard(), rename()]}
>
  <Aria.Node render={(node, state) => (
    <span style={{ paddingLeft: state.level * 16 }}>
      {state.expanded ? '▼' : '▶'} {node.name}
    </span>
  )} />

  <Aria.Cell render={(cell) => (
    <span>{cell.value}</span>
  )} />
</Aria>
```

- **`<Aria>`** — behavior에 따라 내부 동작이 결정되는 유일한 컴포넌트
- **`<Aria.Node>`, `<Aria.Cell>`** — behavior가 정의하는 구조 단위에 대한 render slot
- **render 함수** — `(data: Entity, state: NodeState) => ReactNode`
- **ARIA 속성, 키보드, 포커스** — 프레임워크가 wrapper에 자동 적용, 소비자 코드에 없음

### LLM 친화적 설계 (pit of success)

이 API 구조를 선택한 이유:

1. **빠뜨릴 수 없음** — ARIA role, tabIndex, aria-*, onKeyDown을 소비자가 spread하는 게 아니라 프레임워크가 내부 처리
2. **LLM이 수렴함** — "`<Aria>`를 쓰고 render slot을 채우세요"가 프롬프트 한 줄이면 됨
3. **TS가 강제함** — render 함수 시그니처가 틀리면 컴파일 에러
4. **런타임 검증** — `<Aria.Cell>`이 `<Aria>` 밖에 있으면 에러

---

## ⑥ UI Layer (interactive-os/ui)

shadcn 방식의 레퍼런스 컴포넌트:

```bash
npx interactive-os add treegrid
# → src/components/ui/treegrid.tsx 생성 (소스 코드, 수정 자유)
```

```tsx
// 생성되는 레퍼런스 구현
export function TreeGrid({ data, plugins, ...props }) {
  const store = useExternalStore(data, treeAdapter)

  return (
    <Aria behavior={treegrid} store={store} plugins={plugins}>
      <Aria.Node render={(node, state) => (
        <div data-level={state.level} data-selected={state.selected}>
          <ChevronIcon expanded={state.expanded} />
          <span>{node.name}</span>
        </div>
      )} />
    </Aria>
  )
}
```

- CLI로 소스를 프로젝트에 복사 — npm 의존성이 아님
- 디자인 토큰, 구조 자유롭게 수정 가능
- 코어 라이브러리의 실사용 레퍼런스이자 테스트 대상

---

## 미결정 사항 (구현 시 해결)

아래 항목들은 설계 방향은 잡혀 있으나 Phase 1~2 구현 과정에서 구체화해야 한다:

1. **선택 모델** — single/multiple/extended 선택 모드, Shift+Click 범위 선택, Ctrl+Click 토글. `core()` 플러그인에서 옵션으로 제공할 예정
2. **Relationship 모델의 비-트리 확장** — grid(row/col 이중 관계), tabs(tab→panel 매핑) 등 tree가 아닌 구조를 relationships로 표현하는 구체적인 컨벤션. Phase 4에서 해당 behavior 구현 시 정의
3. **키보드 플랫폼 차이** — `Ctrl+C` vs `Cmd+C` (macOS). keyMap에서 `Mod+C`를 플랫폼 독립 modifier로 제공하여 해결할 예정
4. **대용량 데이터 가상화** — 10k+ 노드 시 렌더링 성능. `<Aria>` 컴포넌트가 가상화 전략을 옵션으로 받거나 `useAria` escape hatch로 해결
5. **에러 처리 전략** — Command `execute()` 실패 시 롤백, transform 유효성 검증 등. CommandEngine에 `onError` 콜백 제공
6. **접근성 테스트 전략** — axe-core 기반 통합 테스트, ARIA 적합성 자동 검증

---

## 패키지 구조

```
interactive-os/
  core/           — Normalized Store, Command Engine
  plugins/        — core(), crud(), history(), clipboard(), rename(), dnd()
  behaviors/      — treegrid, listbox, grid, disclosure, accordion, menu, tabs...
  components/     — <Aria>, <Aria.Node>, <Aria.Cell>
  hooks/          — useAria(), useExternalStore()
  ui/             — CLI + 레퍼런스 컴포넌트 (shadcn 방식)
```

---

## 구현 전략

treegrid부터 시작하여 패턴을 검증한 뒤 나머지 role로 확장:

1. **Phase 1** — Normalized Store + Command Engine + Plugin System (①②③)
2. **Phase 2** — treegrid behavior + Compound Components (④⑤)
3. **Phase 3** — 플러그인 확장 (crud, history, clipboard, rename, dnd)
4. **Phase 4** — 추가 behavior (listbox, grid, accordion, menu, tabs, disclosure...)
5. **Phase 5** — UI Layer (interactive-os/ui)

---

## 핵심 결정 기록

| 결정 | 선택 | 근거 |
|------|------|------|
| 타겟 | 디자인 시스템 / 컴포넌트 개발자 | 앱 개발자는 완성된 컴포넌트를 소비 |
| 아키텍처 | Command-Driven Plugin Engine | undo/redo 내장, 플러그인 간 Command로 소통 |
| 데이터 | Entity + Relationship 분리 | 플러그인별 관심사 분리, history diff 정밀도 |
| 상태 관리 | 외부 위임 + transform 어댑터 | 정규화 포맷 단일화, CRUD 훅 불필요 |
| 플러그인 통신 | Command(기반) + 미들웨어(확장) | Command.undo()로 undo 내장, 미들웨어로 cross-cutting |
| ARIA behavior | 객체로 주입 (문자열 아님) | tree-shakable, OCP, 타입 추론 |
| 렌더링 | Compound component + render slot | LLM 친화, pit of success, TS 강제 |
| readonly/CRUD | 플러그인 유무 + permissions 미들웨어 | 전체/노드별 제어 모두 가능 |
| 프레임워크 | React 전용 | 생태계 집중, API 자연스러움 |
| UI Layer | shadcn 방식 (소스 복사) | 수정 자유, 레퍼런스 역할 |
| 데이터 주입 | 선택적 (role별 다름) | 일관성 유지하되 불필요하면 생략 가능 |
