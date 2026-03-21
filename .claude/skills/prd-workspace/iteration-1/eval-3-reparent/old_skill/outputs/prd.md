# TreeGrid Drag Reparent — PRD

> Discussion: TreeGrid에서 노드를 드래그하여 다른 부모 아래로 reparent할 수 있어야 한다. parentId 변경, children 배열 업데이트, expand/collapse 상태 유지.

## 1. 동기

| # | Given | When | Then |
|---|-------|------|------|
| 1 | 사용자가 TreeGrid에서 파일/폴더 트리를 보고 있다 | 노드를 드래그하여 다른 폴더 위에 드롭한다 | 해당 노드가 드롭 대상 폴더의 자식으로 이동한다 |
| 2 | 사용자가 노드를 다른 부모로 reparent했다 | 원래 부모가 expanded 상태였다 | 원래 부모의 expanded 상태는 그대로 유지된다 |
| 3 | 사용자가 자식이 있는 노드를 reparent했다 | 해당 노드가 expanded 상태였다 | reparent 후에도 해당 노드의 expanded 상태가 유지되고 자식들이 보인다 |
| 4 | 사용자가 실수로 노드를 잘못된 위치에 드롭했다 | Ctrl+Z(undo)를 누른다 | 노드가 원래 부모의 원래 위치로 돌아간다 |
| 5 | 키보드 사용자가 TreeGrid에서 노드를 이동하려 한다 | Alt+Arrow 키 조합을 사용한다 | 기존 dnd 플러그인의 moveOut/moveIn과 동일하게 reparent된다 (이미 구현됨) |

상태: 🟡

## 2. 인터페이스

| 입력 | 조건 | 결과 |
|------|------|------|
| 마우스로 노드를 드래그 시작 | 노드가 유효한 엔티티다 | 드래그 인디케이터(시각적 피드백)가 표시된다 |
| 드래그 중 다른 노드 위로 호버 | 대상이 children을 가질 수 있는 노드다 (폴더 등) | 드롭 대상 노드가 하이라이트된다 |
| 드래그 중 다른 노드 위로 호버 | 대상 노드의 위/아래 가장자리 영역 | 형제로 삽입될 위치를 인디케이터로 표시한다 |
| 드래그 중 다른 노드 위로 호버 | 대상 노드의 중앙 영역 | 해당 노드의 자식(마지막)으로 삽입될 것임을 표시한다 |
| 드래그한 노드를 대상 위에 드롭 | 대상이 드래그 노드 자신이 아니다 | `dndCommands.moveTo(nodeId, targetParentId, index)`가 실행되어 reparent된다 |
| 드래그한 노드를 대상 위에 드롭 | 대상이 드래그 노드의 자손이다 | 드롭이 무시된다 (순환 참조 방지) |
| 드래그 중 TreeGrid 영역 밖으로 나감 | — | 드래그가 취소된다 |
| Escape 키 | 드래그 중 | 드래그가 취소된다 |
| 드롭 후 | — | 포커스가 이동된 노드에 유지된다 |
| ↑ 키 | 드래그 중이 아닐 때 | N/A (기존 navigate 동작) |
| ↓ 키 | 드래그 중이 아닐 때 | N/A (기존 navigate 동작) |
| ← 키 | 드래그 중이 아닐 때 | N/A (기존 expand collapse 동작) |
| → 키 | 드래그 중이 아닐 때 | N/A (기존 expand collapse 동작) |
| Enter | 드래그 중이 아닐 때 | N/A (기존 activate 동작) |
| Space | 드래그 중이 아닐 때 | N/A (기존 select 동작) |
| Tab | 드래그 중 | 드래그가 취소되고 포커스가 다음 요소로 이동 |
| Home/End | 드래그 중이 아닐 때 | N/A (기존 navigate 동작) |
| Alt+↑/↓ | 드래그 중이 아닐 때 | 기존 dndCommands.moveUp/moveDown (형제 간 이동) |
| Alt+←/→ | 드래그 중이 아닐 때 | 기존 dndCommands.moveOut/moveIn (reparent — 이미 구현) |
| 클릭 | 드래그가 아닌 짧은 클릭 | 기존 포커스/선택 동작 유지 |
| 더블클릭 | — | 기존 rename 동작 유지 (enableEditing 시) |

### 인터페이스 체크리스트 (AI 자가 검증용)

산출물 구조를 보고 아래를 전수 확인:
- [x] ↑ 키: N/A — 드래그 중이 아닐 때 기존 동작 유지
- [x] ↓ 키: N/A — 드래그 중이 아닐 때 기존 동작 유지
- [x] ← 키: N/A — 드래그 중이 아닐 때 기존 동작 유지
- [x] → 키: N/A — 드래그 중이 아닐 때 기존 동작 유지
- [x] Enter: N/A — 드래그 중이 아닐 때 기존 동작 유지
- [x] Escape: 드래그 취소
- [x] Space: N/A — 드래그 중이 아닐 때 기존 동작 유지
- [x] Tab: 드래그 취소 후 포커스 이동
- [x] Home/End: N/A — 드래그 중이 아닐 때 기존 동작 유지
- [x] Cmd/Ctrl 조합: Ctrl+Z undo로 reparent 되돌리기
- [x] 클릭: 짧은 클릭은 기존 포커스/선택 동작
- [x] 더블클릭: 기존 rename 동작
- [x] 이벤트 버블링: 드래그 이벤트가 중첩된 TreeGrid 노드에서 버블링되지 않도록 격리 필요

상태: 🟡

## 3. 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

### 데이터 레이어

- **`createStore.moveNode()`**: 이미 존재. `moveNode(store, nodeId, newParentId, index)` — relationships만 변경하고 entities는 유지. expand 상태(`__expanded__` 엔티티의 `expandedIds` 배열)는 노드 id 기반이므로 moveNode으로 인해 자동으로 보존된다.
- **`dndCommands.moveTo()`**: 이미 존재. 제네릭 move 커맨드로 undo 지원.

### UI 레이어 (새로 필요)

- **드래그 상태 관리**: `Aria` 컴포넌트 또는 TreeGrid에서 드래그 소스/타깃 상태를 관리
  - 드래그 중인 노드 id
  - 현재 호버 중인 드롭 대상 id
  - 드롭 위치 (before / after / inside)
- **드롭 영역 계산**: 노드 요소의 상/중/하 영역을 구분하여 삽입 위치 결정
  - 상단 25%: 대상 노드 앞에 형제로 삽입
  - 중앙 50%: 대상 노드의 자식으로 삽입
  - 하단 25%: 대상 노드 뒤에 형제로 삽입
- **시각적 피드백**: 드래그 인디케이터 (CSS)
  - 드래그 소스 노드의 반투명 처리
  - 드롭 대상 하이라이트
  - 삽입 위치 라인 인디케이터
- **순환 참조 검증**: 드래그 노드의 자손에는 드롭할 수 없음 — `getChildren`을 재귀적으로 탐색하여 검증

### 기존 코드와의 관계

- `dnd` 플러그인(`plugins/dnd.ts`): 키보드 기반 moveUp/moveDown/moveIn/moveOut은 이미 구현. 마우스 드래그는 이 커맨드들을 재사용.
- `core` 플러그인(`plugins/core.ts`): expand 상태는 `__expanded__` 엔티티의 `expandedIds` 배열에 노드 id로 저장. `moveNode`은 relationships만 변경하므로 id가 바뀌지 않아 expand 상태가 자동 보존.
- `history` 플러그인: undo/redo는 Command의 execute/undo를 통해 이미 지원됨. `dndCommands.moveTo`가 이미 undo를 구현.

상태: 🟡

## 4. 경계

| 조건 | 예상 동작 |
|------|----------|
| 노드를 자기 자신 위에 드롭 | 아무 일도 일어나지 않는다 |
| 노드를 자신의 자손 위에 드롭 (순환 참조) | 드롭이 무시된다, 시각적으로 드롭 불가 표시 |
| 루트 레벨의 유일한 노드를 다른 부모로 이동 | 루트가 빈 상태가 되어도 정상 동작 |
| collapsed 상태인 폴더의 자식으로 드롭 | 해당 폴더를 expand하고 마지막 자식으로 삽입 (?) |
| 깊은 중첩 노드(depth 5+)를 루트로 이동 | depth가 변경되어도 aria-level이 올바르게 재계산된다 (NodeState.level은 렌더 시 계산) |
| 드래그 중 다른 사용자가 데이터를 변경 (외부 onChange) | 드래그가 취소된다 (controlled 모드에서 data prop 변경 감지) |
| 여러 노드를 선택한 상태에서 드래그 | 첫 번째 구현에서는 단일 노드 드래그만 지원 (?) |
| 노드를 같은 부모의 다른 위치로 드래그 | 형제 간 순서 변경으로 처리 (moveNode이 same-parent 케이스를 이미 처리) |

상태: 🟡

## 5. 금지

| # | 하면 안 되는 것 | 이유 |
|---|---------------|------|
| 1 | 노드 id를 변경하지 않는다 | id가 바뀌면 expandedIds, selectedIds, focusedId 등 모든 상태 참조가 깨진다 |
| 2 | expand 상태를 reparent 시 초기화하지 않는다 | 사용자가 펼쳐둔 트리 구조를 유지하는 것이 핵심 요구사항 |
| 3 | 드래그 중 기존 키보드 네비게이션을 가로채지 않는다 | 드래그 모드에서는 Escape(취소)와 Tab(취소+이동)만 처리, 나머지 키는 무시 |
| 4 | HTML5 Drag and Drop API를 직접 사용하지 않는다 (?) | 접근성 이슈와 크로스 브라우저 동작 차이가 크다. 마우스 이벤트(mousedown/mousemove/mouseup) 기반으로 구현 |
| 5 | moveNode 로직을 중복 구현하지 않는다 | createStore.moveNode과 dndCommands.moveTo가 이미 존재하므로 재사용 |
| 6 | 드래그 상태를 NormalizedData store에 저장하지 않는다 | 드래그는 일시적 UI 상태이므로 undo 히스토리에 포함되면 안 된다 |

상태: 🟡

## 6. 검증

| # | 시나리오 | 예상 결과 |
|---|---------|----------|
| 1 | 노드 A를 폴더 B 위에 드래그 드롭한다 | A가 B의 마지막 자식으로 이동, B의 children에 A의 id가 포함, 원래 부모의 children에서 A가 제거 |
| 2 | expanded 상태인 폴더 C를 다른 부모로 reparent한다 | reparent 후 C가 여전히 expanded 상태, C의 자식들이 화면에 보인다 |
| 3 | reparent 후 Ctrl+Z를 누른다 | 노드가 원래 부모의 원래 인덱스로 복귀, expand 상태도 복원 |
| 4 | 노드를 자신의 자손 위에 드롭 시도 | 드롭이 거부되고 트리 구조가 변경되지 않음 |
| 5 | depth 3인 노드를 루트로 이동 | `aria-level`이 1로 변경, 자식 노드들의 aria-level도 재계산 |
| 6 | 드래그 시작 후 Escape | 드래그 취소, 원래 상태 유지 |
| 7 | 노드의 위쪽 가장자리로 드롭 | 해당 노드 앞에 형제로 삽입 |
| 8 | 노드의 중앙으로 드롭 | 해당 노드의 자식(마지막)으로 삽입 |
| 9 | 노드의 아래쪽 가장자리로 드롭 | 해당 노드 뒤에 형제로 삽입 |
| 10 | Alt+→ 키로 reparent (키보드) | 이전 형제의 마지막 자식으로 이동 (기존 dndCommands.moveIn 동작, 이미 구현) |

상태: 🟡

---

**전체 상태:** 🟡 0/6 (AI 초안 완료, 사용자 확인 필요)
