# Plugin KeyMap — PRD

> Discussion: Plugin이 commands만 제공하고 keyMap은 소비자가 수동 연결하는 구조라 5곳 복붙, 1곳 누락 버그가 발생. Plugin이 keyMap까지 소유해야 한다.

## 1. 동기

| # | Given | When | Then |
|---|-------|------|------|
| 1 | clipboard plugin이 `clipboardCommands`만 export하고 keyMap은 제공하지 않음 | 새 뷰(예: CmsSidebar)를 추가하면서 Mod+C/X/V를 사용하려 할 때 | 개발자가 clipboardCommands를 import하고 keyMap 객체에 `Mod+C`, `Mod+X`, `Mod+V` 3줄을 수동으로 작성해야 함 |
| 2 | 동일한 clipboard keyMap 바인딩(`Mod+C/X/V → clipboardCommands`)이 5곳(CmsCanvas, TreeGrid, ListBox, TabList, kanban behavior)에 복붙됨 | CmsSidebar가 6번째 사용처로 추가될 때 | keyMap 복붙을 깜빡하여 "복사/붙여넣기가 안 됨" 버그 발생 |
| 3 | history plugin도 동일 구조 — `historyCommands`만 export, keyMap은 소비자 책임 | plugin을 `plugins=[clipboard(), history()]`로 등록했음에도 | 키보드 단축키가 동작하지 않음. commands는 등록되었지만 keyMap 연결이 없어서 아무 반응 없음 |

상태: 🟡

## 2. 인터페이스

| 입력 | 조건 | 결과 |
|------|------|------|
| Plugin 인터페이스에 optional `keyMap` 필드 추가 | plugin이 keyMap을 제공할 때 | useAria/useAriaZone이 자동으로 behavior.keyMap → plugin.keyMap → options.keyMap 순서로 합성 |
| `plugins=[clipboard()]`만 등록 | 뷰에 별도 keyMap 없이 | Mod+C, Mod+X, Mod+V가 자동으로 동작 |
| `plugins=[clipboard()]` + `keyMap={...}` | 뷰가 자체 keyMap override 제공 | options.keyMap이 plugin.keyMap보다 우선하여 뷰별 커스터마이즈 가능 |
| `plugins=[clipboard(), history()]` | 여러 plugin이 각자 keyMap 제공 | 모든 plugin keyMap이 합성됨. plugins 배열에서 나중 plugin이 같은 키에 대해 우선 |
| `plugins=[crud()]` (keyMap 미제공 plugin) | 기존 plugin이 keyMap 없이 사용될 때 | 기존 동작 변화 없음. keyMap 필드는 optional |

### 합성 우선순위 (낮음 → 높음)

```
behavior.keyMap (ARIA 표준 네비게이션)
  ← plugin.keyMap (plugin이 소유한 기본 바인딩)
    ← options.keyMap (뷰별 override)
```

상태: 🟡

## 3. 산출물

### Plugin 타입 확장

Plugin 인터페이스에 optional `keyMap` 필드 추가:

```
Plugin {
  middleware?    (기존 — 변경 없음)
  commands?      (기존 — 변경 없음)
  keyMap?        (신규) — Record<string, (ctx) => Command | void>
}
```

### clipboard plugin 변경

`clipboard()` 반환값에 keyMap 포함:

```
keyMap:
  Mod+C → copy(selected.length > 0 ? selected : [focused])
  Mod+X → cut(selected.length > 0 ? selected : [focused])
  Mod+V → paste(focused)
```

### history plugin 변경

`history()` 반환값에 keyMap 포함:

```
keyMap:
  Mod+Z → undo()
  Mod+Shift+Z → redo()
```

### keyMap 합성 로직 위치

useAria와 useAriaZone 모두에서 mergedKeyMap 계산 시 plugin keyMap 삽입:

```
현재: { ...behavior.keyMap, ...options.keyMap }
변경: { ...behavior.keyMap, ...pluginKeyMaps, ...options.keyMap }
```

pluginKeyMaps는 plugins 배열을 순회하며 각 plugin.keyMap을 spread로 합성.

### 수동 keyMap 제거 대상 (5곳)

| 파일 | 제거할 내용 |
|------|-----------|
| CmsCanvas.tsx | clipboard/history 수동 keyMap |
| TreeGrid.tsx | clipboard/history 수동 keyMap |
| ListBox.tsx | clipboard/history 수동 keyMap |
| TabList.tsx | clipboard/history 수동 keyMap |
| kanban.ts (behavior) | clipboard/history 수동 keyMap |

상태: 🟡

## 4. 경계

| 조건 | 예상 동작 |
|------|----------|
| plugin이 keyMap을 제공하지 않을 때 (crud 등 기존 plugin) | 기존대로 동작. keyMap 필드는 optional이므로 하위 호환 |
| 여러 plugin이 동일한 키 조합을 바인딩할 때 | plugins 배열에서 나중 순서의 plugin이 우선 (Object.assign spread 순서) |
| options.keyMap이 plugin keyMap과 동일한 키를 지정할 때 | options.keyMap이 우선. 뷰가 plugin 기본 동작을 override 가능 |
| behavior.keyMap과 plugin.keyMap이 충돌할 때 | plugin.keyMap이 우선. behavior는 ARIA 네비게이션 기본, plugin은 기능 확장 |
| 단일 선택만 지원하는 뷰(CmsSidebar)에서 clipboard 사용 | plugin의 default keyMap이 `selected.length > 0 ? selected : [focused]`로 자동 폴백하므로 올바르게 동작 |
| plugin이 0개일 때 (`plugins=[]` 또는 미지정) | pluginKeyMaps가 비어있어 behavior.keyMap + options.keyMap만 적용. 기존 동작과 동일 |

상태: 🟡

## 5. 금지

| # | 하면 안 되는 것 | 이유 |
|---|---------------|------|
| 1 | plugin.keyMap을 behavior.keyMap보다 낮은 우선순위로 두기 | plugin은 기능 확장이므로 ARIA 기본 네비게이션 위에 기능 키(Mod+C 등)를 추가하는 것. 낮은 우선순위면 behavior에 같은 키가 있을 때 plugin 기능이 묻힘 |
| 2 | 기존 Plugin 인터페이스의 middleware/commands 시그니처 변경 | 하위 호환성 파괴. keyMap만 optional 필드로 추가해야 함 |
| 3 | 수동 keyMap 제거 시 뷰 고유 로직까지 삭제 | CmsSidebar의 Delete 가드(`items.length <= 1`이면 삭제 금지) 같은 뷰 고유 조건은 options.keyMap에 남아야 함. plugin keyMap은 범용 기본값일 뿐 |
| 4 | plugin.keyMap의 ctx 타입을 plugin 전용으로 만들기 | BehaviorContext와 동일한 ctx를 받아야 합성 시 일관성 유지. 별도 ctx 타입은 타입 불일치 유발 |

상태: 🟡

## 6. 검증

| # | 시나리오 | 예상 결과 |
|---|---------|----------|
| 1 | `plugins=[clipboard()]` 등록 후 Mod+C → Mod+V | 포커스된 노드가 복사되고, 붙여넣기 시 새 노드 생성 |
| 2 | `plugins=[clipboard(), history()]` 등록 후 Mod+Z | 직전 동작이 undo됨 |
| 3 | plugin keyMap 없이 behavior만 사용 (`plugins=[]`) | 기존 동작과 완전히 동일. 하위 호환 보장 |
| 4 | options.keyMap으로 Mod+C를 다른 동작으로 override | options.keyMap에 지정한 동작이 실행됨. plugin의 copy는 무시됨 |
| 5 | CmsSidebar에서 `plugins=[clipboard()]`만 등록 (수동 keyMap 없음) | 사이드바에서 Mod+C/V로 섹션 복사/붙여넣기 정상 동작. 기존 누락 버그 해결 |
| 6 | 5곳(CmsCanvas, TreeGrid, ListBox, TabList, kanban)에서 수동 clipboard keyMap 제거 후 | plugin keyMap으로 기존과 동일하게 동작. 기능 회귀 없음 |
| 7 | `plugins=[clipboard(), history()]`에서 두 plugin 모두 keyMap 합성 | Mod+C/X/V (clipboard) + Mod+Z, Mod+Shift+Z (history) 모두 동작 |

상태: 🟡

---

**전체 상태:** 🟡 0/6 (AI 초안 — 사용자 확인 전)
