# Aria Zone — PRD

> Discussion: os의 "1 engine = 1 widget" 결합을 분리. 하나의 앱에서 여러 Zone이 같은 engine(data + commands)을 공유하되, 독립 view state(focus/selection)와 DOM scope를 가진다.

## 1. 동기

| # | Given | When | Then |
|---|-------|------|------|
| 1 | 하나의 NormalizedData를 두 UI(sidebar listbox + canvas spatial)가 동시에 보여주는 앱이 있다 | sidebar를 useAria로 전환한다 | engine이 2개가 되어 derived store, onChange diff, data-node-id 충돌 등 글루코드 5개가 필요해진다 |
| 2 | sidebar에서 section을 삭제한다 | sidebar zone이 `crudCommands.remove()`를 dispatch한다 | 공유 engine이 store를 변경하고, canvas zone도 즉시 반영된다 (동기화 코드 없이) |
| 3 | canvas에서 section 내부 노드를 포커스한다 | canvas zone의 focus가 변경된다 | sidebar zone의 focus는 영향받지 않는다 (독립 view state) |
| 4 | sidebar에서 section을 리오더한다 | sidebar zone이 `dndCommands.moveUp()`을 dispatch한다 | 공유 engine의 history에 기록되어 어느 zone에서든 Mod+Z로 undo 가능 |

상태: 🟢

## 2. 인터페이스

> 이 기능은 hooks API. UI 키보드 인터페이스는 각 zone이 behavior로 정의.

### useEngine

| 입력 | 조건 | 결과 |
|------|------|------|
| `initialData: NormalizedData` | 앱 마운트 시 | CommandEngine 생성, store 소유 |
| `middlewares?: Middleware[]` | history 등 공유 미들웨어 | 모든 zone의 dispatch가 이 pipeline을 통과 |
| 반환: `{ engine, data }` | — | engine: dispatch/getStore/syncStore, data: 현재 store (React state) |

### useAriaZone

| 입력 | 조건 | 결과 |
|------|------|------|
| `engine: CommandEngine` | useEngine에서 받은 공유 engine | zone이 이 engine에 command를 dispatch |
| `behavior: AriaBehavior` | listbox, spatial, treegrid 등 | zone의 키보드 인터랙션 결정 |
| `scope: string` | 필수. 예: `'sidebar'`, `'canvas'` | DOM에 `data-{scope}-id` 속성 사용, DOM focus sync를 scope container 내부로 한정 |
| `keyMap?: Record<...>` | zone별 커스텀 키 바인딩 | behavior keyMap에 merge (override) |
| `plugins?: Plugin[]` | focusRecovery 등 zone-level 플러그인 | zone의 dispatch 전후에 동작 |
| `onActivate?: (id) => void` | — | Enter/click 시 호출 |
| `initialFocus?: string` | — | zone 마운트 시 초기 포커스 |
| 반환 | — | `UseAriaReturn` (기존과 동일: dispatch, getNodeProps, getNodeState, focused, selected, containerProps, getStore) |

### useAria (기존 — sugar 유지)

| 입력 | 조건 | 결과 |
|------|------|------|
| 기존 API 그대로 | scope 없는 단일 zone | 내부에서 `useEngine` + `useAriaZone` 조합. __focus__ 등 메타 엔티티를 store에 저장하는 기존 동작 유지 |

상태: 🟢

## 3. 산출물

### 구조

```
interactive-os/
  core/
    createCommandEngine.ts  ← 변경 없음
  hooks/
    useEngine.ts            ← 신규: engine 생성 + React state 바인딩
    useAriaZone.ts          ← 신규: zone hook (engine 주입, scope, 로컬 view state)
    useAria.ts              ← 리팩터: useEngine + useAriaZone sugar
    useControlledAria.ts    ← 폐기 예정 (useAriaZone이 상위 호환)
```

### 관계

- `useEngine` → `createCommandEngine` (내부 호출)
- `useAriaZone` → `CommandEngine` (주입받음), `AriaBehavior`, `focusRecovery` (zone-level)
- `useAria` → `useEngine` + `useAriaZone` (조합)
- `useControlledAria` → `useAriaZone`로 대체 가능 (scope + engine 주입)

### Zone의 view state 관리

| 상태 | 위치 | 이유 |
|------|------|------|
| entities, relationships | 공유 engine store | data는 앱 전체에서 하나 |
| focus (focusedId) | zone 로컬 (useState) | zone마다 다른 노드에 포커스 |
| selection (selectedIds) | zone 로컬 (useState) | zone마다 다른 선택 상태 |
| expanded (expandedIds) | zone 로컬 (useState) | zone마다 다른 펼침 상태 |
| history (undo/redo) | 공유 engine middleware | undo/redo는 data 변경 단위 |

### focusRecovery in Zone

focusRecovery는 engine middleware가 아닌 **zone-level post-dispatch hook**:

```
zone.dispatch(command):
  1. prevStore = engine.getStore()
  2. engine.dispatch(command)          // 공유 store 변경
  3. newStore = engine.getStore()
  4. zone 로컬 focusRecovery 실행:
     - focused entity가 newStore에 없으면 → fallback (다음 형제 → 이전 형제 → 부모)
     - 새 entity가 생겼으면 → 그곳으로 focus
```

### getNodeProps scope

```
scope='sidebar' → { 'data-sidebar-id': nodeId, ... }
scope='canvas'  → { 'data-canvas-id': nodeId, ... }
scope 미지정    → { 'data-node-id': nodeId, ... }   // 기존 호환
```

### DOM focus sync scope

```
기존: document.querySelector(`[data-node-id="${focusedId}"]`)
zone: container.querySelector(`[data-${scope}-id="${focusedId}"]`)
     (container = zone의 data-aria-container 요소)
```

상태: 🟢

## 4. 경계

| 조건 | 예상 동작 |
|------|----------|
| 같은 entity ID가 두 zone에 렌더 | scope 속성이 다르므로 DOM 충돌 없음 |
| zone A가 entity 삭제 → zone B가 그 entity에 focus 중 | zone B의 focusRecovery가 post-dispatch에서 fallback 실행 |
| undo로 삭제된 entity 복원 | 공유 engine이 store 복원 → 두 zone 모두 re-render |
| zone 마운트 시 engine store가 비어있음 | initialFocus 없으면 ROOT_ID의 첫 자식에 focus |
| zone이 unmount | zone 로컬 state 정리. engine에 영향 없음 |
| scope 문자열 중복 (두 zone이 같은 scope) | 개발자 실수 — DOM 충돌 발생. 런타임 경고만 (DEV) |
| 기존 useAria 사용 코드 | 변경 없이 동작. sugar 내부가 바뀔 뿐 |

상태: 🟢

## 5. 금지

| # | 하면 안 되는 것 | 이유 |
|---|---------------|------|
| 1 | zone이 focus/selection을 공유 engine store에 쓰면 안 됨 | zone 간 focus 간섭. "1 store = 1 focus" 문제 재발 |
| 2 | focusRecovery를 engine middleware로 넣으면 안 됨 (zone 모드에서) | engine은 어떤 zone의 focus를 복구해야 하는지 모름 |
| 3 | useAriaZone에서 scope를 선택사항으로 만들면 안 됨 | scope 없이 두 zone을 만들면 data-node-id 충돌. 실수 방지 |
| 4 | 기존 useAria의 외부 API를 변경하면 안 됨 | 14개 패턴 + 기존 테스트 전부 깨짐 |
| 5 | zone 간 통신 메커니즘을 os 안에 만들면 안 됨 | React prop/callback이면 충분. 오버엔지니어링 |

상태: 🟢

## 6. 검증

| # | 시나리오 | 예상 결과 |
|---|---------|----------|
| 1 | 기존 useAria 테스트 전체 실행 | 전부 통과 (sugar 리팩터이므로) |
| 2 | 두 zone이 같은 engine 공유, zone A에서 entity 삭제 | zone B에서도 즉시 사라짐 |
| 3 | zone A와 zone B가 같은 entity ID를 렌더 | DOM에 `data-sidebar-id`, `data-canvas-id` 별도 존재, 충돌 없음 |
| 4 | zone A에서 focus 이동 | zone B의 focus 불변 |
| 5 | zone A에서 삭제 → zone B가 삭제된 entity에 focus 중 | zone B의 focusRecovery가 다음 형제로 이동 |
| 6 | 공유 engine에서 undo | 두 zone 모두 이전 상태 반영 |
| 7 | CmsSidebar를 useAriaZone으로 전환 | derived store, onChange diff, data-sidebar-id, manual DOM focus sync, pendingFocusRef 전부 제거 |

상태: 🟢

---

**전체 상태:** 🟢 6/6
