# Plugins

> Command 확장. 엔진에 CRUD, history, clipboard 등 도메인 기능을 주입하는 미들웨어.

## 주기율표

| 플러그인 | 함수 | 제공 커맨드 | 주요 상수/export | 상태 |
|---------|------|-----------|-----------------|------|
| core | `core()` | focus, select, expand, activate, gridCol | `FOCUS_ID`, `SELECTION_ID`, `EXPANDED_ID`, `GRID_COL_ID` | 🟢 |
| crud | `crud()` | add, remove, update | `crudCommands` | 🟢 |
| history | `history()` | undo, redo | `historyCommands`, `SKIP_META`, `isContentDelta` | 🟢 delta-based |
| clipboard | `clipboard()` | cut, copy, paste | `clipboardCommands`, `getCutSourceIds()` | 🟢 |
| rename | `rename()` | startRename, commitRename, cancelRename | `RENAME_ID`, `renameCommands` | 🟢 |
| dnd | `dnd()` | moveUp, moveDown, moveIn, moveOut | `dndCommands` | 🟢 |
| focusRecovery | `focusRecovery()` | (자동) 삭제 후 포커스 복구 | `IsReachable`, `isVisible`, `spatialReachable` | 🟢 |
| spatial | `spatial()` | spatialParent, spatialChild | `SPATIAL_PARENT_ID`, `spatialCommands` | 🟢 |
| combobox | `combobox()` | filter, selectOption | `comboboxCommands` | 🟢 |
| typeahead | `typeahead()` | (없음 — onUnhandledKey) | `findTypeaheadMatch`, `isPrintableKey` | 🟢 |
| form | `form({ entityRules })` | submit, touch, reset | `ERRORS_ID`, `TOUCHED_ID`, `formCommands` | 🟡 prototype |
| zodSchema | `zodSchema({ childRules })` | (미들웨어만) | `ZodSchema` type export | 🟢 |

## 설계 원칙

- **Plugin은 keyMap까지 소유**: commands만 제공하면 복붙+누락 버그
- **focusRecovery는 불변 조건**: CRUD 있으면 반드시 동작, `isReachable`로 모델별 주입
- **core는 필수**: 다른 모든 플러그인의 전제 (FOCUS_ID, SELECTION_ID 등)
- **history는 content delta만 기록**: SKIP_META(focus, selection, expanded, gridCol, spatialParent)는 view state → undo 대상 아님. `__value__`는 content

## 의존 방향

```
core (필수 — FOCUS_ID, SELECTION_ID)
  ↓
crud, history (기본 CRUD + undo)
  ↓
clipboard, rename, dnd (crud 위에 구축)
  ↓
focusRecovery (CRUD 후 포커스 복구)

spatial, combobox, typeahead (독립)

zodSchema (Zod 스키마 SSOT)
  ├─ clipboard (구조 검증 — canAccept/canDelete)
  └─ form (값 검증 — __errors__/__touched__)
```

## form 플러그인

> Entity = 폼. 별도 폼 모델 없이, 정규화 엔티티의 data가 곧 폼 필드.

**미들웨어**: `rename:confirm` / `updateEntityData` 후 자동 Zod 검증 → `__errors__` 메타 엔티티 갱신

**커맨드**:
- `formCommands.submit(entityRules)` — 전체 검증 + 전체 touched 마킹
- `formCommands.touch(nodeId, field?)` — 개별 touched
- `formCommands.reset()` — errors + touched 초기화

**헬퍼**: `getFormErrors(store)`, `getFieldErrors(store, id)`, `isTouched(store, id, field?)`, `hasFormErrors(store)`

**검증 타이밍**: validate는 항상 (미들웨어), 표시는 touched 이후 (뷰의 관심사)

```tsx
import { form } from 'interactive-os/plugins/form'
import { z } from 'zod'

const entityRules = {
  field: z.object({ type: z.literal('field'), label: z.string(), value: z.string().min(1, 'Required') }),
}

// 플러그인으로 등록
form({ entityRules })
```

```tsx render
<FormDemo />
```

## 갭

- form: submit-on-Enter 미연결 (Aria dispatch 접근 경로 필요)
