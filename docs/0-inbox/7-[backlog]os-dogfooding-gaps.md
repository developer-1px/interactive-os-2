# interactive-os 개밥먹기 갭 백로그

> 작성일: 2026-03-20
> Visual CMS를 os 기반으로 전환하면서 발견한 os 확장 필요 사항

## 현황

Canvas CRUD keyMap 전환 완료 (Delete, Mod+D, Mod+↑↓, Mod+C/X/V, Mod+Z/Shift+Z).
os의 `crudCommands`, `dndCommands`, `clipboardCommands`, `historyCommands`를 Canvas에서 직접 사용.
`history()` 플러그인 활성화로 undo/redo 지원.
`focusRecovery()`는 spatial navigation과 충돌하여 제외 (Gap 7 참조).

Sidebar, Toolbar, I18n Sheet은 여전히 날코딩 — 아래 갭 해결 후 전환 가능.

## 의존순서 그래프

```
[Gap 4] Template CRUD          (독립)
    crud plugin 확장

[Gap 7] Spatial-aware focusRecovery  (독립)
    focus-recovery plugin 확장

[Gap 6] 외부 engine 주입
    hooks 레이어 (useAria)
        │
[Gap 3] 다중 포커스
    core store 레이어
        │
[Gap 5] 양방향 뷰 동기화
    plugin 또는 새 패턴
```

## Gap 3: 다중 포커스

**문제**: `__focus__` 메타 엔티티가 store당 1개. 한 store를 공유하는 두 `<Aria>` 인스턴스가 독립적 포커스를 가질 수 없음.

**영향**: Sidebar를 `useAria(listbox)`로 전환 불가. Canvas 포커스와 충돌.

**os 레이어**: core store — `__focus__` 구조 변경 또는 namespace 도입
- 방안 A: `__focus__` → `__focus__{namespace}__` 패턴. useAria에 `focusNamespace` 옵션.
- 방안 B: `__focus__` 내부에 `focusMap: Record<string, string>` — view별 focusedId.
- 방안 C: 각 useAria가 독립 메타 엔티티 관리 (`__focus__canvas__`, `__focus__sidebar__`).

**선행**: Gap 6 (외부 engine 주입)

## Gap 4: Template CRUD

**문제**: `crudCommands.create(entity, parentId, index)`는 단일 엔티티만 추가. CMS의 "섹션 추가"는 엔티티 그룹(section + children + relationships)을 한 번에 삽입.

**영향**: Sidebar/Toolbar의 `addSectionToStore`, `duplicateSection` 등 날코딩 함수를 os 커맨드로 교체 불가.

**os 레이어**: crud plugin 확장
- 방안 A: `crudCommands.createSubtree(normalizedData, parentId, index)` — NormalizedData 조각을 병합.
- 방안 B: `crudCommands.createBatch(entities[], relationships, parentId, index)` — 관계 포함 일괄 생성.
- 방안 C: 기존 `clipboard.paste` 로직을 `crudCommands`로 일반화 (insertClipboardEntry가 이미 subtree 삽입 수행).

**선행**: 없음 (독립)

## Gap 5: 양방향 뷰 동기화

**문제**: Canvas→Sidebar 포커스 동기화는 CmsLayout에서 수동 계산. Sidebar→Canvas는 스크롤만 (포커스 이동 없음). 두 뷰 간 포커스 연동 패턴이 os에 없음.

**영향**: Sidebar 선택 시 Canvas가 해당 섹션으로 자동 포커스 이동 불가.

**os 레이어**: plugin 또는 새 패턴
- 방안 A: `viewSync()` 플러그인 — 한 namespace의 포커스 변경 → 다른 namespace에 파생 포커스 dispatch.
- 방안 B: 이벤트 기반 — `onFocusChange(namespace, callback)` 훅. 앱 레이어에서 연동 로직 작성.
- 방안 C: 단순 규칙 — "master view"가 포커스를 소유, "slave view"는 읽기 전용 하이라이트.

**선행**: Gap 3 (다중 포커스)

## Gap 6: 외부 engine 주입

**문제**: `useAria`가 내부적으로 `createCommandEngine`을 생성. 외부에서 engine을 주입할 수 없음. Layout 레벨에서 engine을 소유하고 하위 컴포넌트가 공유하는 패턴 불가.

**영향**: Toolbar/Sidebar가 Canvas engine에 os 커맨드를 dispatch 불가. CRUD 3벌 중복의 근본 원인.

**os 레이어**: hooks 레이어 (useAria)
- 방안 A: `useAria({ engine })` 옵션 — 외부 engine을 받으면 내부 생성 스킵. engine은 `useCommandEngine(data, plugins)` 별도 훅으로 생성.
- 방안 B: Context 기반 — `<AriaProvider engine={engine}>` 래퍼. 하위 `useAria`가 context에서 engine 획득.
- 방안 C: engine을 module-scoped store로 승격 (Zustand 패턴). `createCmsEngine()` → 어디서든 import하여 dispatch.

**선행**: 없음 (독립이지만, Gap 3 해결의 전제)

## Gap 7: Spatial-aware focusRecovery

**문제**: `focusRecovery()` 플러그인의 `isVisible()` 함수가 expand/collapse 모델 기반. 부모가 `expandedIds`에 없으면 자식을 "보이지 않음"으로 판단. Spatial navigation에서는 모든 노드가 항상 렌더링되므로 이 체크가 잘못됨.

**증상**: Spatial Enter (깊이 진입) 후 focusRecovery가 포커스를 잘못된 노드로 되돌림. CMS Canvas에서 Enter/Escape depth navigation 완전 실패.

**영향**: CMS Canvas에서 `focusRecovery()` 사용 불가. 삭제 후 포커스 자동 복구 없음.

**os 레이어**: focus-recovery plugin 확장
- 방안 A: `isVisible`에 spatial parent 체크 추가 — `__spatial_parent__`가 존재하면 expand 체크 스킵, 엔티티 존재만 확인.
- 방안 B: `focusRecovery({ visibilityMode: 'always' | 'expand' })` 옵션 — CMS는 `'always'`, tree-view는 `'expand'`.
- 방안 C: `isVisible` 함수를 주입 가능하게 — `focusRecovery({ isVisible: (store, nodeId) => boolean })`.

**선행**: 없음 (독립)
