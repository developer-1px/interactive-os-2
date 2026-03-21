# Plugin KeyMap Ownership — PRD

> Discussion: Plugin이 commands만 제공하고 keyMap은 소비자가 수동 연결하는 구조라 5곳 복붙, 1곳 누락 버그가 발생. Plugin이 keyMap까지 소유해야 한다.

## 1. 동기

| # | Given | Data (before) | When | Then | Data (after) | 역PRD |
|---|-------|--------------|------|------|-------------|-------|
| 1 | clipboard plugin이 commands만 export하고, 5곳(CmsCanvas, TreeGrid, ListBox, TabList, kanban)이 수동으로 `Mod+C → clipboardCommands.copy(...)` 를 keyMap에 복붙 | `Plugin { middleware?, commands? }` — keyMap 필드 없음. 각 소비자의 keyMap에 `'Mod+C': (ctx) => clipboardCommands.copy(...)` 등 3줄씩 중복 | 6번째 장소(CmsSidebar)를 추가할 때 | keyMap 연결을 깜빡하고 Mod+C가 아무 반응 없는 버그 발생 | CmsSidebar의 keyMap에 clipboard 바인딩 누락 상태 | |
| 2 | `plugins=[clipboard()]`로 plugin을 등록함 | `useAria({ plugins: [clipboard()], keyMap: { ... } })` — plugin은 commands만 제공 | 사용자가 Mod+C를 누름 | commands는 등록되었지만 keyMap이 없으므로 아무 일도 안 일어남 | store 변경 없음 (키 이벤트 무시됨) | |
| 3 | history plugin도 동일 구조: `historyCommands.undo/redo` export, keyMap은 소비자가 연결 | kanban.ts 등에 `'Mod+Z': () => historyCommands.undo()` 수동 복붙 | 새 뷰를 추가할 때마다 | 동일한 Mod+Z 바인딩을 반복 작성해야 함 | 복붙 코드 N곳 증가 | |

상태: 🟡

## 2. 인터페이스

| 입력 | Data (before) | 조건 | 결과 | Data (after) | 역PRD |
|------|--------------|------|------|-------------|-------|
| Plugin 타입에 `keyMap?` 필드 추가 | `Plugin { middleware?, commands? }` | plugin 팩토리 함수가 keyMap을 반환할 때 | useAria/useAriaZone이 plugin keyMap을 자동 수집하여 합성 | `Plugin { middleware?, commands?, keyMap? }` | |
| `plugins=[clipboard()]` 등록만으로 | mergedKeyMap = `{ ...behavior.keyMap, ...options.keyMap }` | 뷰에 별도 keyMap 없이 | Mod+C/X/V가 자동 동작 | mergedKeyMap = `{ ...behavior.keyMap, ...pluginKeyMaps, ...options.keyMap }` | |
| `plugins=[clipboard()]` + `keyMap={ 'Mod+C': customHandler }` | plugin.keyMap에 `'Mod+C': defaultCopyHandler` | 뷰가 override keyMap 제공 | options.keyMap이 plugin.keyMap보다 우선 적용 | mergedKeyMap에서 `'Mod+C'`는 customHandler | |
| `plugins=[clipboard(), history()]` | 각 plugin이 독립적 keyMap 보유 | 여러 plugin이 keyMap 제공 | 모든 plugin keyMap이 합성됨. 같은 키는 plugins 배열 뒤쪽이 우선 | mergedKeyMap에 clipboard + history keyMap 합산 | |

### 합성 우선순위 (낮음 → 높음)

```
behavior.keyMap (ARIA 표준 네비게이션)
  ← plugin.keyMap (plugin 기본 단축키)
    ← options.keyMap (뷰별 override)
```

이 순서가 보장되어야 하는 이유: behavior는 ARIA 네비게이션 기본(ArrowUp/Down 등), plugin은 기능 확장(Mod+C 등), options는 뷰별 커스터마이즈. 상위 레이어가 하위를 override할 수 있어야 한다.

상태: 🟡

## 3. 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `Plugin.keyMap?` 타입 확장 (`core/types.ts`) | `keyMap?: Record<string, (ctx: any) => Command \| void>` — optional 필드 추가. 기존 middleware/commands는 변경 없음 | |
| `clipboard()` 반환값에 keyMap 포함 (`plugins/clipboard.ts`) | `keyMap: { 'Mod+C': copy handler, 'Mod+X': cut handler, 'Mod+V': paste handler }` | |
| `history()` 반환값에 keyMap 포함 (`plugins/history.ts`) | `keyMap: { 'Mod+Z': undo, 'Mod+Shift+Z': redo }` | |
| `useAria` keyMap 합성 로직 변경 (`hooks/useAria.ts`) | pluginKeyMaps를 plugins에서 추출하여 mergedKeyMap에 삽입 | |
| `useAriaZone` keyMap 합성 로직 변경 (`hooks/useAriaZone.ts`) | useAria와 동일한 합성 로직 적용 | |
| 5곳 수동 keyMap 제거 | CmsCanvas, TreeGrid, ListBox, TabList, kanban에서 clipboard/history 수동 바인딩 삭제 | |

상태: 🟡

## 4. 경계

| 조건 | Data (before) | 예상 동작 | Data (after) | 역PRD |
|------|--------------|----------|-------------|-------|
| plugin이 keyMap을 제공하지 않을 때 (focusRecovery 등 기존 plugin) | `Plugin { middleware }` — keyMap 없음 | 기존 동작 그대로. keyMap 필드는 optional이므로 하위 호환 보장 | pluginKeyMaps에 해당 plugin 기여 없음 | |
| 여러 plugin이 같은 키를 바인딩할 때 | `plugins=[pluginA({ keyMap: { 'Mod+Z': handlerA } }), pluginB({ keyMap: { 'Mod+Z': handlerB } })]` | plugins 배열에서 나중(뒤쪽) plugin이 우선 (Object.assign/spread 순서) | mergedKeyMap에서 `'Mod+Z'` = handlerB | |
| options.keyMap이 plugin keyMap과 충돌할 때 | plugin: `'Mod+C': defaultCopy`, options: `'Mod+C': customAction` | options.keyMap이 최상위 우선. 뷰별 커스터마이즈 보장 | mergedKeyMap `'Mod+C'` = customAction | |
| behavior.keyMap과 plugin.keyMap이 충돌할 때 | behavior: `'ArrowDown': navigate`, plugin: `'ArrowDown': customHandler` | plugin.keyMap이 우선. behavior는 ARIA 기본, plugin이 기능 확장 | mergedKeyMap `'ArrowDown'` = customHandler | |
| 단일 선택만 지원하는 뷰(CmsSidebar) | `ctx.selected = []` (선택 없음) | plugin의 default keyMap(`selected.length > 0 ? selected : [focused]`)이 자동으로 [focused]로 폴백 | clipboard에 [focused] 노드 저장 | |
| plugins 배열이 비어있을 때 | `plugins=[]` 또는 미지정 | pluginKeyMaps가 빈 객체. behavior.keyMap + options.keyMap만 합성 | 기존 동작과 동일 | |

상태: 🟡

## 5. 금지

| # | 하면 안 되는 것 | 이유 | 역PRD |
|---|---------------|------|-------|
| 1 | plugin.keyMap을 behavior.keyMap보다 낮은 우선순위로 두기 | plugin은 기능 확장(Mod+C 등)이므로 ARIA 기본 동작을 보완/override할 수 있어야 함. behavior에 없는 키를 plugin이 추가하는 것이 주요 사용 패턴 | |
| 2 | 기존 Plugin 인터페이스의 middleware/commands 시그니처 변경 | 하위 호환성. keyMap만 optional 필드로 추가해야 기존 plugin이 깨지지 않음 | |
| 3 | 수동 keyMap 제거 시 뷰별 커스텀 로직까지 삭제 | CmsSidebar의 Delete 가드(`length <= 1`이면 삭제 금지) 같은 뷰 고유 로직은 options.keyMap에 남아야 함. plugin의 default는 범용이고 뷰 특화 로직은 override로 남겨야 함 | |
| 4 | plugin keyMap 합성을 useAria에서만 하고 useAriaZone에서 누락 | useAriaZone도 독립적으로 keyMap을 합성하므로 동일 로직 적용 필수. 누락하면 zone 기반 multi-view에서 plugin 단축키가 안 됨 | |

상태: 🟡

## 6. 검증

| # | 시나리오 | 예상 결과 | 역PRD |
|---|---------|----------|-------|
| 1 | `plugins=[clipboard()]` 등록 후 별도 keyMap 없이 Mod+C → Mod+V | 노드가 복사되고 붙여넣기로 새 노드 생성됨 | |
| 2 | `plugins=[clipboard(), history()]` 등록 후 Mod+Z | 직전 명령이 undo됨 | |
| 3 | plugin keyMap 없는 plugin (focusRecovery)만 사용 | 기존 동작과 완전 동일 (하위 호환) | |
| 4 | options.keyMap으로 `'Mod+C'`를 다른 동작으로 override | options.keyMap의 handler가 실행됨. plugin default는 무시됨 | |
| 5 | CmsSidebar에서 `plugins=[clipboard()]`만 등록 | Mod+C/V로 섹션 복사/붙여넣기 정상 동작. 기존 누락 버그 해결 | |
| 6 | 기존 5곳(CmsCanvas, TreeGrid, ListBox, TabList, kanban)에서 수동 clipboard keyMap 제거 후 | plugin keyMap으로 동일하게 동작. 기능 회귀 없음 | |
| 7 | kanban behavior에서 `'Mod+Z'`/`'Mod+Shift+Z'` 수동 바인딩 제거 후 | history plugin keyMap으로 동일하게 동작 | |

상태: 🟡

---

**전체 상태:** 🟡 6/6 (AI 초안 — 사용자 확인 전)
