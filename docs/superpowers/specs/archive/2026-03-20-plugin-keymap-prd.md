# Plugin KeyMap — PRD

> Discussion: Plugin이 commands만 제공하고 keyMap은 소비자가 수동 연결하는 구조 → 5곳 복붙, 1곳 누락 버그. Plugin이 keyMap까지 소유해야 한다.

## 1. 동기

| # | Given | When | Then |
|---|-------|------|------|
| 1 | clipboard plugin이 commands만 export | 새 뷰(CmsSidebar)에서 Mod+C/V를 사용하려 할 때 | 개발자가 clipboardCommands를 import하고 keyMap에 수동 연결해야 함 |
| 2 | 동일한 `Mod+C/X/V → clipboardCommands` 3줄이 5곳에 복붙됨 | 6번째 장소(CmsSidebar)가 추가될 때 | keyMap 연결을 깜빡하고 "복사 안 됨" 버그 발생 |
| 3 | plugin을 등록(plugins=[clipboard()])했음 | 사용자가 Mod+C를 누를 때 | commands는 등록되었지만 keyMap이 없어서 아무 일도 안 일어남 |

상태: 🟢

## 2. 인터페이스

| 입력 | 조건 | 결과 |
|------|------|------|
| Plugin에 `keyMap` 필드 추가 | plugin이 keyMap을 제공할 때 | behavior.keyMap → plugin.keyMap → options.keyMap 순서로 자동 합성 |
| `plugins=[clipboard()]` 등록 | 뷰에 별도 keyMap 없이 | Mod+C/X/V가 자동으로 동작 |
| `plugins=[clipboard()]` + `keyMap={...}` | 뷰가 override keyMap 제공 | options.keyMap이 plugin.keyMap보다 우선 |
| `plugins=[clipboard(), history()]` | 여러 plugin이 keyMap 제공 | 모든 plugin keyMap이 합성됨. 충돌 시 나중 plugin이 우선 |

### 합성 우선순위 (낮음 → 높음)

```
behavior.keyMap (ARIA 표준)
  ← plugin.keyMap (plugin 기본값)
    ← options.keyMap (뷰별 override)
```

상태: 🟢

## 3. 산출물

### Plugin 타입 확장

```
Plugin {
  middleware?    (기존)
  commands?      (기존)
  keyMap?        (신규) — Record<string, (ctx: BehaviorContext) => Command | void>
}
```

### clipboard plugin 변경

clipboard()가 keyMap을 함께 반환:

```
keyMap:
  Mod+C → copy(selected > 0 ? selected : [focused])
  Mod+X → cut(selected > 0 ? selected : [focused])
  Mod+V → paste(focused)
```

### history plugin 변경

history()가 keyMap을 함께 반환:

```
keyMap:
  Mod+Z → undo()
  Mod+Shift+Z → redo()
```

### keyMap 합성 위치

useAriaZone에서 mergedKeyMap 계산 시 plugin keyMap 포함:

```
현재: { ...behavior.keyMap, ...options.keyMap }
변경: { ...behavior.keyMap, ...pluginKeyMaps, ...options.keyMap }
```

### 수동 keyMap 제거 대상

5곳에서 clipboard/history 수동 keyMap 삭제:
- CmsCanvas.tsx
- TreeGrid.tsx
- ListBox.tsx
- TabList.tsx
- kanban.ts (behavior)

상태: 🟢

## 4. 경계

| 조건 | 예상 동작 |
|------|----------|
| plugin이 keyMap을 제공하지 않을 때 (기존 plugin) | 기존대로 동작. keyMap 필드는 optional |
| 여러 plugin이 같은 키를 바인딩할 때 | plugins 배열에서 나중 plugin이 우선 (spread 순서) |
| options.keyMap이 plugin keyMap의 키를 override할 때 | options.keyMap이 우선 (뷰별 커스터마이즈) |
| behavior.keyMap과 plugin.keyMap이 충돌할 때 | plugin.keyMap이 우선. behavior는 ARIA 기본, plugin이 기능 확장 |
| CmsSidebar처럼 단일 선택만 지원하는 뷰 | plugin의 default keyMap(`selected > 0 ? selected : [focused]`)이 자동으로 올바르게 동작. selected가 비어있으면 [focused]로 폴백 |

상태: 🟢

## 5. 금지

| # | 하면 안 되는 것 | 이유 |
|---|---------------|------|
| 1 | plugin.keyMap을 behavior.keyMap보다 낮은 우선순위로 두기 | plugin은 기능 확장이므로 ARIA 기본 동작을 override할 수 있어야 함. 예: Mod+C는 behavior에 없고 plugin이 추가하는 것 |
| 2 | 기존 Plugin 인터페이스의 middleware/commands를 변경하기 | 하위 호환성. keyMap만 optional로 추가 |
| 3 | 수동 keyMap 제거 시 뷰별 커스텀 로직까지 삭제 | CmsSidebar의 Delete 가드(`length <= 1`) 같은 뷰 고유 로직은 options.keyMap에 남아야 함 |

상태: 🟢

## 6. 검증

| # | 시나리오 | 예상 결과 |
|---|---------|----------|
| 1 | `plugins=[clipboard()]` 등록 후 Mod+C → Mod+V | 노드 복사 후 붙여넣기 동작. 새 노드 생성 |
| 2 | `plugins=[clipboard(), history()]` 등록 후 Mod+Z | undo 동작 |
| 3 | plugin keyMap 없이 behavior만 사용 | 기존 동작과 동일 (하위 호환) |
| 4 | options.keyMap으로 Mod+C를 다른 동작으로 override | options.keyMap의 동작이 실행됨 |
| 5 | CmsSidebar에서 `plugins=[clipboard()]` | 사이드바에서 Mod+C/V로 섹션 복사/붙여넣기 동작 |
| 6 | ListBox/TreeGrid에서 기존 clipboard 수동 keyMap 제거 후 | plugin keyMap으로 동일하게 동작 |

상태: 🟢

---

**전체 상태:** 🟢 6/6
