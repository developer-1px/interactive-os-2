# 플러그인 시스템 아키텍처 분석 및 이상적 모듈 구조

## 현재 구조 요약

현재 플러그인 시스템은 세 레이어로 구성되어 있다.

```
src/interactive-os/
  core/           ← Store + Engine (불변 데이터 + dispatch 파이프라인)
  plugins/        ← 10개 플러그인 (flat 디렉토리)
  behaviors/      ← 축(axis) 조합 + preset (UI 패턴)
  hooks/          ← useAria, useEngine (React 바인딩)
```

### Plugin 인터페이스 (`core/types.ts`)

```ts
interface Plugin {
  middleware?: Middleware
  commands?: Record<string, (...args) => Command>
  keyMap?: Record<string, (ctx) => Command | void>
  onUnhandledKey?: (event, engine) => boolean
}
```

4개 슬롯: middleware, commands, keyMap, onUnhandledKey. 각 플러그인은 이 중 필요한 것만 구현한다.

### 10개 플러그인의 실제 사용 패턴

| 플러그인 | middleware | commands | keyMap | onUnhandledKey | 상태 관리 |
|---------|:---:|:---:|:---:|:---:|-----------|
| core | O | O | - | - | 메타 엔티티 (FOCUS, SELECTION, EXPANDED, GRID_COL, VALUE) |
| crud | - | O | - | - | 없음 (store 직접 조작) |
| history | O | - | O | - | 클로저 (past/future 스택) |
| clipboard | - | O | O | - | 모듈 레벨 싱글톤 |
| rename | - | O | - | - | 메타 엔티티 (RENAME_ID) |
| dnd | - | O | - | - | 없음 |
| focusRecovery | O | - | - | - | 없음 (순수 미들웨어) |
| spatial | - | - | - | - | 메타 엔티티 (SPATIAL_PARENT) |
| combobox | - | O | - | - | 메타 엔티티 (COMBOBOX_ID) |
| typeahead | - | - | - | O | 클로저 (buffer + timer) |

## 현재 구조의 강점

1. **Plugin 인터페이스가 단순하다.** 4개 옵셔널 슬롯만 있어서 새 플러그인 작성이 쉽다.
2. **의존 방향이 일방향이다.** core -> crud/history -> clipboard/rename/dnd -> focusRecovery.
3. **keyMap 소유 원칙이 확립되어 있다.** Plugin이 commands와 keyMap을 함께 소유해서 바인딩 누락을 방지한다.
4. **미들웨어 체이닝이 reduceRight로 명확하다.** 순서가 곧 우선순위.

## 현재 구조에서 보이는 긴장

### 1. 상태 관리 방식이 3가지로 분산

- **메타 엔티티**: core, rename, spatial, combobox -- store 안에 `__focus__` 같은 특수 엔티티로 상태 저장
- **클로저**: history, typeahead -- Plugin 팩토리 함수의 클로저에 상태 포획
- **모듈 레벨 싱글톤**: clipboard -- `clipboardBuffer`, `cutSourceIds`가 모듈 스코프

clipboard의 싱글톤 패턴은 테스트에서 `resetClipboard()`를 수동 호출해야 하는 부담이 있고, 여러 위젯이 독립 클립보드를 가질 수 없다.

### 2. core 플러그인의 이중 역할

`core.ts`는 (1) 필수 메타 엔티티 정의 + (2) anchorResetMiddleware + (3) value 관련 commands까지 담당한다. 파일 크기가 438줄로 다른 플러그인(50~100줄)보다 압도적으로 크다. core는 "플러그인"이라기보다 "엔진의 기본 상태 모델"에 가깝다.

### 3. Plugin과 BehaviorContext의 순환 의존

- `createBehaviorContext.ts`는 `plugins/core.ts`의 commands(focusCommands, selectionCommands 등)를 직접 import
- `plugins/typeahead.ts`는 `behaviors/createBehaviorContext.ts`의 `getVisibleNodes`를 import

behaviors와 plugins가 서로를 참조하는 양방향 의존이 존재한다.

### 4. useAria의 거대 책임

`useAria.ts`가 397줄이면서 다음을 모두 처리한다:
- Engine 생성 + 초기 포커스
- 외부 데이터 싱크 (META_ENTITY_IDS 관리)
- Plugin keyMap 병합
- onUnhandledKey 디스패치
- DOM 포커스 동기화
- 포인터 이벤트 + 셀렉션

이는 플러그인 시스템 자체의 문제가 아니지만, 플러그인 합성 결과를 소비하는 지점이 과도하게 복잡하다.

## 이상적 모듈 구조 제안

### 원칙

- **상태 관리 통일**: 모든 플러그인 상태는 store 안의 메타 엔티티로 통일. 클로저/싱글톤 제거.
- **core를 엔진 내부로**: core는 Plugin이 아니라 Engine의 기본 장비.
- **순환 의존 제거**: behaviors -> plugins 단방향만 허용.
- **Plugin 합성 결과를 Engine이 제공**: useAria가 아니라 Engine 레벨에서 keyMap 병합 + 미들웨어 체이닝.

### 구조 다이어그램

```
src/interactive-os/

  core/
    types.ts              ← Command, NormalizedData, Entity (변경 없음)
    createStore.ts        ← CRUD 순수 함수 (변경 없음)
    computeStoreDiff.ts   ← delta 계산 (변경 없음)
    stateModel.ts         ← [NEW] 기존 core 플러그인의 메타 엔티티 정의
                             FOCUS_ID, SELECTION_ID, EXPANDED_ID 등
                             + focusCommands, selectionCommands, expandCommands
                             core()가 아니라 엔진의 "기본 상태 모델"로 승격
    createEngine.ts       ← [RENAME] createCommandEngine + plugin 합성 로직 통합
                             - middlewares 수집
                             - keyMap 병합
                             - onUnhandledKey 수집
                             결과: Engine 객체가 mergedKeyMap, handleKey()를 직접 소유

  plugins/
    types.ts              ← [NEW] Plugin 인터페이스 분리 (core/types.ts에서 이동)
                             + PluginState 인터페이스 추가
    history.ts            ← middleware + keyMap (상태를 store 메타 엔티티로 이동)
    clipboard.ts          ← commands + keyMap (싱글톤 → 인스턴스 상태)
    crud.ts               ← commands only (변경 없음)
    dnd.ts                ← commands only (변경 없음)
    rename.ts             ← commands only (변경 없음)
    focusRecovery.ts      ← middleware only (변경 없음)
    combobox.ts           ← commands only (변경 없음)
    spatial.ts            ← commands only (변경 거의 없음)
    typeahead.ts           ← onUnhandledKey (getVisibleNodes를 engine에서 받도록 수정)

  behaviors/
    (변경 없음 — 단, stateModel.ts를 core/에서 import)

  hooks/
    useAria.ts            ← Engine.handleKey()를 호출만 하도록 경량화
    useEngine.ts          ← 변경 없음
```

### 핵심 변경점 상세

#### A. core 플러그인 해체 → `core/stateModel.ts`

현재 `core()`는 "설치하지 않으면 아무것도 안 되는" 필수 플러그인이다. 이것은 Plugin이 아니라 Engine의 기본 장비다.

```ts
// core/stateModel.ts
export const FOCUS_ID = '__focus__'
export const SELECTION_ID = '__selection__'
// ... 기존 core.ts의 상수 + commands 전부

// anchorResetMiddleware도 여기에 — Engine이 기본 장착
export const coreMiddleware: Middleware = ...
```

Engine 생성 시 `coreMiddleware`는 자동 적용. `core()` 호출 불필요.

#### B. Plugin 상태를 Store로 통일

history의 past/future 스택, clipboard의 buffer를 메타 엔티티로:

```ts
// history: __history__ 메타 엔티티
{
  id: '__history__',
  past: StoreDiff[][],    // undo 스택
  future: StoreDiff[][],  // redo 스택
}

// clipboard: __clipboard__ 메타 엔티티
{
  id: '__clipboard__',
  buffer: ClipboardEntry[],
  mode: 'copy' | 'cut',
  cutSourceIds: string[],
}
```

장점:
- 테스트에서 `resetClipboard()` 불필요 -- store 초기화가 곧 리셋
- DevTools에서 플러그인 상태 관찰 가능 (store 하나만 보면 전부 보인다)
- 여러 위젯이 독립 clipboard 인스턴스 가능

단점/주의:
- history 스택이 store 안에 있으면 history 자체의 변경이 history에 기록되는 순환 발생. 이것은 SKIP_META에 `__history__`를 추가하면 해결.
- 성능: past 스택이 커지면 store 복사 비용 증가. 하지만 현재도 delta 기반이라 실제 데이터는 작다.

#### C. Engine이 keyMap 합성을 담당

현재 useAria가 하는 keyMap 병합을 Engine 레벨로 이동:

```ts
// createEngine.ts
interface EngineConfig {
  data: NormalizedData
  plugins: Plugin[]
  onChange: (store: NormalizedData) => void
}

function createEngine(config: EngineConfig): Engine {
  // 1. coreMiddleware 자동 적용
  // 2. plugins의 middleware 수집 + 체이닝
  // 3. plugins의 keyMap 병합
  // 4. plugins의 onUnhandledKey 수집

  return {
    dispatch,
    getStore,
    syncStore,
    handleKey(event, ctx),   // ← NEW: keyMap 매칭 + dispatch
    mergedKeyMap,             // ← NEW: behavior keyMap과 합성용
  }
}
```

useAria는 `engine.handleKey(event, ctx)`를 호출만 하면 된다. 현재 useAria의 150줄 가량이 30줄 이내로 줄어든다.

#### D. 순환 의존 제거

typeahead가 `getVisibleNodes`를 import하는 것이 문제.

해결: `getVisibleNodes`를 `core/` 유틸로 이동하거나, `onUnhandledKey`의 시그니처에 visibleNodes를 전달:

```ts
onUnhandledKey?: (event: KeyboardEvent, engine: Engine, visibleNodes: string[]) => boolean
```

Engine이 호출 시점에 visibleNodes를 계산해서 넘기면 typeahead는 behaviors를 import할 필요가 없다.

### 의존 관계 (이상적 구조)

```
core/
  types.ts
  createStore.ts
  stateModel.ts      ← core 상수 + commands
  computeStoreDiff.ts
  createEngine.ts    ← plugins/types.ts import

plugins/
  types.ts           ← core/types.ts import (단방향)
  history.ts         ← core/ import
  clipboard.ts       ← core/ import
  crud.ts            ← core/ import
  ...

behaviors/
  types.ts           ← core/ import
  createBehaviorContext.ts  ← core/stateModel.ts import (단방향)
  listbox.ts, tree.ts ...   ← behaviors/types.ts import

hooks/
  useAria.ts         ← core/createEngine + behaviors/ import
  useEngine.ts       ← core/createEngine import
```

순환 없음. 모든 화살표가 core를 향한다.

## 마이그레이션 순서 (권장)

리팩토링 시 한 번에 하지 않고 단계별로:

1. **stateModel 추출**: `core.ts`에서 상수 + commands를 `core/stateModel.ts`로 이동. `core()` 팩토리는 당분간 유지하되 내부적으로 stateModel을 re-export. 기존 코드 깨지지 않음.

2. **Engine에 keyMap 합성 이동**: `createEngine.ts`에 `handleKey` 메서드 추가. useAria가 이를 호출하도록 전환. useAria 경량화.

3. **순환 의존 제거**: `getVisibleNodes`를 `core/`로 이동하거나 onUnhandledKey 시그니처 변경. typeahead 수정.

4. **clipboard 싱글톤 제거**: clipboardBuffer를 store 메타 엔티티로 이동. `resetClipboard()` 제거.

5. **history 상태를 store로 이동**: past/future를 메타 엔티티로. SKIP_META에 `__history__` 추가.

6. **core() 제거**: Engine이 stateModel을 기본 장착. `core()` 호출 지점 제거.

## 변경하지 않는 것

- **Plugin 인터페이스의 4슬롯 구조**: middleware / commands / keyMap / onUnhandledKey. 이 구조는 충분히 단순하고 확장 가능하다. 인터페이스 자체는 건드리지 않는다.
- **Command 패턴**: execute/undo 쌍. 이것은 시스템의 근간이다.
- **NormalizedData 구조**: entities + relationships. 변경 불필요.
- **Behavior 레이어**: axis 조합 + preset 체계. 플러그인과 독립적으로 잘 작동한다.

## 요약

현재 구조는 10개 플러그인이 Integrated 상태로 안정적이다. 가장 큰 개선점은 세 가지:

1. **core를 Plugin에서 Engine 기본 장비로 승격** -- "설치 필수 플러그인"이라는 모순 제거
2. **상태 관리를 store 메타 엔티티로 통일** -- clipboard 싱글톤, history 클로저 제거 -> DevTools 관찰성 확보
3. **keyMap 합성을 Engine으로 이동** -- useAria 경량화, 관심사 분리 명확화

이 세 가지만 해결하면 플러그인 시스템의 모듈 구조가 "core는 엔진, plugin은 확장, behavior는 패턴, hook은 바인딩"이라는 깔끔한 4계층이 된다.
