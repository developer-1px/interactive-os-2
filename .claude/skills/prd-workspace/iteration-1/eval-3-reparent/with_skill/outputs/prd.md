# TreeGrid Drag Reparent — PRD

> Discussion: TreeGrid에서 노드를 드래그하여 다른 부모 아래로 reparent할 수 있어야 한다. parentId 변경, children 배열 업데이트, expand/collapse 상태 유지.

## 1. 동기

| # | Given | Data (before) | When | Then | Data (after) | 역PRD |
|---|-------|--------------|------|------|-------------|-------|
| 1 | TreeGrid에 계층 구조가 있고, 사용자가 노드 A를 보고 있다 | `relationships: { root: [folderX, folderY], folderX: [A, B] }` | 사용자가 노드 A를 드래그하여 folderY 위에 드롭한다 | A가 folderX에서 제거되고 folderY의 children으로 이동한다 | `relationships: { root: [folderX, folderY], folderX: [B], folderY: [A] }` | |
| 2 | 노드 A가 expanded 상태로 자식 C, D를 가지고 있다 | `expandedIds: ['A'], relationships: { ..., A: ['C', 'D'] }` | A를 다른 부모로 reparent한다 | A의 expanded 상태가 유지되고, 자식 C, D도 함께 이동한다 | `expandedIds: ['A'], relationships: { ..., newParent: [A], A: ['C', 'D'] }` | |
| 3 | 사용자가 reparent 후 결과가 마음에 들지 않는다 | reparent 완료 상태 | Ctrl+Z (undo)를 누른다 | 노드가 원래 부모, 원래 인덱스로 복원된다 | reparent 이전 상태와 동일 | |

상태: 🟡

## 2. 인터페이스

| 입력 | Data (before) | 조건 | 결과 | Data (after) | 역PRD |
|------|--------------|------|------|-------------|-------|
| 마우스 드래그 시작 (mousedown + mousemove) | `focused: nodeId` | TreeGrid `enableEditing=true` | 드래그 중인 노드에 시각적 피드백 (예: opacity 변경, 드래그 고스트) | 드래그 상태 활성화 (UI 전용, store 미변경) | |
| 드래그 중 다른 노드 위 호버 | 드래그 활성 상태 | 드롭 대상이 드래그 노드 자신이 아니고, 드래그 노드의 자손이 아님 | 드롭 위치 인디케이터 표시 (before/after/inside) | UI 전용, store 미변경 | |
| 드롭 (mouseup) — "inside" 위치 | `relationships: { oldParent: [..., nodeId, ...] }` | 드롭 대상이 유효한 부모 (자기 자손 아님) | `dndCommands.moveTo(nodeId, targetParentId)` 실행 | `relationships: { oldParent: [...], targetParent: [..., nodeId] }`, `expandedIds`에 targetParent 추가 (드롭 후 자식 보이도록) | |
| 드롭 — "before" 위치 | `relationships: { parent: [..., target, ...] }` | 드롭 대상의 부모에 삽입 | `dndCommands.moveTo(nodeId, targetParentId, targetIndex)` 실행 | `relationships: { parent: [..., nodeId, target, ...] }` | |
| 드롭 — "after" 위치 | `relationships: { parent: [..., target, ...] }` | 드롭 대상의 부모에 삽입 | `dndCommands.moveTo(nodeId, targetParentId, targetIndex + 1)` 실행 | `relationships: { parent: [..., target, nodeId, ...] }` | |
| Escape 키 (드래그 중) | 드래그 활성 상태 | — | 드래그 취소, 원래 상태로 복귀 | 드래그 이전 상태 유지 | |
| Alt+ArrowLeft | `relationships: { parent: [nodeId], grandparent: [parent] }` | focused 노드가 root 직속이 아님 | `dndCommands.moveOut(nodeId)` — 부모 레벨로 이동 | `relationships: { parent: [], grandparent: [parent, nodeId] }` | |
| Alt+ArrowRight | `relationships: { parent: [prevSibling, nodeId] }` | focused 노드 앞에 형제가 있음 | `dndCommands.moveIn(nodeId)` — 이전 형제의 자식으로 이동 | `relationships: { parent: [prevSibling], prevSibling: [..., nodeId] }` | |

### 인터페이스 체크리스트 (AI 자가 검증용)

산출물 구조를 보고 아래를 전수 확인:
- [x] ArrowUp 키: N/A (드래그 reparent과 무관, 기존 navigate 축이 처리)
- [x] ArrowDown 키: N/A (기존 navigate 축이 처리)
- [x] ArrowLeft 키: Alt+ArrowLeft로 moveOut (기존 dnd keyMap에 이미 존재)
- [x] ArrowRight 키: Alt+ArrowRight로 moveIn (기존 dnd keyMap에 이미 존재)
- [x] Enter: N/A (드래그 reparent과 무관)
- [x] Escape: 드래그 중이면 드래그 취소
- [x] Space: N/A
- [x] Tab: N/A
- [x] Home/End: N/A
- [x] Cmd/Ctrl 조합: Ctrl+Z로 undo (기존 history plugin이 처리)
- [x] 클릭: 드래그 시작점 (mousedown → mousemove threshold 초과 시)
- [x] 더블클릭: N/A (기존 rename 동작 유지)
- [x] 이벤트 버블링: 드래그 이벤트가 중첩된 TreeGrid에서 버블링하면 안 됨 — stopPropagation 필요

상태: 🟡

## 3. 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `dndCommands.moveTo` 확장 | 이미 존재하는 `moveTo(nodeId, targetParentId, index?)` 커맨드를 reparent의 핵심 오퍼레이션으로 사용. 새 커맨드 불필요 — 기존 `moveNode`가 parentId 변경 + children 배열 업데이트를 이미 처리 | |
| 드래그 UI 상태 (React 로컬) | `dragState: { dragging: boolean, nodeId: string | null, dropTarget: { id: string, position: 'before' | 'after' | 'inside' } | null }` — store가 아닌 React 로컬 상태로 관리 (드래그 중 store 변경 없음, 드롭 시에만 커맨드 디스패치) | |
| 드롭 유효성 검증 함수 | 드롭 대상이 드래그 노드 자신이거나 자손인 경우를 감지하여 순환 참조 방지. `getChildren`을 재귀 순회하여 자손 여부 판정 | |
| 드롭 위치 계산 로직 | 마우스 Y 좌표를 기준으로 노드 영역을 3분할: 상단 25% = before, 하단 25% = after, 중앙 50% = inside. 자식을 가질 수 없는 리프 노드의 경우 상단 50% = before, 하단 50% = after (inside 없음) | |
| 드래그 시각 피드백 CSS | 드래그 중인 노드: `opacity: 0.5`. 드롭 인디케이터: before/after는 수평선, inside는 배경 하이라이트 | |
| 자동 expand on reparent | reparent 시 새 부모가 collapsed 상태이면 자동으로 expand하여 이동 결과를 사용자가 확인할 수 있도록 함. `createBatchCommand([moveTo(...), expand(newParentId)])` | |

상태: 🟡

## 4. 경계

| 조건 | Data (before) | 예상 동작 | Data (after) | 역PRD |
|------|--------------|----------|-------------|-------|
| 자기 자신 위에 드롭 | `relationships: { parent: [A] }` | no-op, 드래그 취소와 동일 | 변경 없음 | |
| 자손 노드 위에 드롭 (순환 참조 시도) | `relationships: { A: [B, C], B: [D] }`, A를 D 위에 드롭 시도 | 드롭 거부 — 인디케이터 표시 안 함 | 변경 없음 | |
| root 레벨 노드를 root 영역에 드롭 (형제 재정렬) | `relationships: { root: [A, B, C] }`, A를 C 뒤로 드롭 | `moveTo(A, root, 2)` — 형제 간 순서 변경 | `relationships: { root: [B, C, A] }` | |
| expanded 노드를 이동 | `expandedIds: ['folder1'], relationships: { folder1: [a, b] }` | folder1을 다른 부모로 이동, expand 상태 유지 | `expandedIds: ['folder1']` 유지, folder1의 children 관계도 유지 | |
| 빈 폴더(children 없음)에 드롭 | `relationships: { emptyFolder: [] }` | inside 위치로 드롭 가능, emptyFolder에 첫 자식으로 추가 | `relationships: { emptyFolder: [droppedNode] }` | |
| 같은 부모 내에서 순서 변경 | `relationships: { parent: [A, B, C] }`, A를 C 뒤로 드롭 | `moveTo(A, parent, 2)` | `relationships: { parent: [B, C, A] }` | |
| 깊이 3+ 노드를 root로 이동 | `A > B > C > D`, D를 root로 드롭 | depth가 3에서 1로 변경, `aria-level` 자동 재계산 | `relationships: { root: [..., D] }`, D의 level=1 | |
| 드래그 중 스크롤 | 긴 트리에서 드래그 중 | 뷰포트 가장자리에서 자동 스크롤 (?) | — | |

상태: 🟡

## 5. 금지

| # | 하면 안 되는 것 | 이유 | 역PRD |
|---|---------------|------|-------|
| 1 | 드래그 중 store를 변경하면 안 된다 | 드래그 취소 시 복원이 필요한데, store 변경 후 복원은 history를 오염시킨다. 드롭 확정 시에만 커맨드 디스패치 | |
| 2 | 순환 참조를 만드는 reparent를 허용하면 안 된다 | A의 자손 B 아래로 A를 이동하면 무한 루프 발생 | |
| 3 | expand/collapse 상태를 reparent 시 초기화하면 안 된다 | expandedIds는 노드 id 기반이므로 reparent와 무관하게 보존되어야 한다. moveNode는 relationships만 변경하므로 자연스럽게 보존됨 | |
| 4 | 새 커맨드 타입을 만들면 안 된다 | 기존 `dndCommands.moveTo`가 reparent를 이미 지원한다. 중복 커맨드는 혼란만 가중 | |
| 5 | enableEditing=false인 TreeGrid에서 드래그를 허용하면 안 된다 | 읽기 전용 모드에서 구조 변경은 의도하지 않은 동작 | |
| 6 | HTML5 Drag and Drop API를 사용하면 안 된다 | 크로스 브라우저 동작이 불일치하고, 드래그 고스트 커스터마이징이 제한적이다. pointer events(mousedown/mousemove/mouseup)로 구현 | |

상태: 🟡

## 6. 검증

| # | 시나리오 | 예상 결과 | 역PRD |
|---|---------|----------|-------|
| 1 | 노드를 다른 폴더 위 (inside 영역)에 드롭 | 해당 폴더의 children 마지막에 추가, 폴더가 자동 expand | |
| 2 | 노드를 다른 노드의 before 영역에 드롭 | 해당 노드 바로 앞에 형제로 삽입 | |
| 3 | 노드를 자기 자손 위에 드롭 시도 | 드롭 거부, store 변경 없음 | |
| 4 | expanded 노드를 reparent | expandedIds에 해당 노드 id 유지, 자식도 함께 이동, 이동 후에도 자식이 보임 | |
| 5 | reparent 후 Ctrl+Z | 노드가 원래 부모, 원래 인덱스로 복원. 새 부모의 자동 expand도 undo | |
| 6 | reparent 후 aria-level 확인 | 이동한 노드와 그 자손의 aria-level이 새 depth에 맞게 렌더링 | |
| 7 | enableEditing=false 상태에서 드래그 시도 | 드래그 시작 안 됨 | |
| 8 | Alt+ArrowRight로 이전 형제 안으로 moveIn | 키보드로 reparent 동작, moveTo와 동일한 결과 | |
| 9 | Alt+ArrowLeft로 부모 밖으로 moveOut | 키보드로 reparent 동작, 부모의 다음 형제로 이동 | |
| 10 | 드래그 중 Escape | 드래그 취소, 아무 변경 없음 | |

상태: 🟡

---

**전체 상태:** 🟡 6/6 (AI 초안 완료, 사용자 확인 전)
