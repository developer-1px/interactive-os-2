# Rename UI — PRD

> Discussion: rename 플러그인(store)은 완성, UI 연결이 없어 F2를 눌러도 화면에 변화가 없음. contenteditable로 제자리 편집 구현. Visual CMS 확장성 고려.

## 1. 동기

| # | Given | When | Then |
|---|-------|------|------|
| 1 | 노드 목록(listbox, tree 등)에서 한 노드에 포커스 중 | F2를 누른다 | 해당 노드의 label이 제자리에서 편집 가능해진다 |
| 2 | rename 모드에서 텍스트를 수정 중 | Enter를 누른다 | 수정된 값이 store에 반영되고 rename 모드가 종료된다 |
| 3 | rename 모드에서 텍스트를 수정 중 | Escape를 누른다 | 수정이 취소되고 원래 값으로 돌아간다 |
| 4 | rename으로 값을 변경한 후 | Cmd+Z를 누른다 | 이전 값으로 되돌아간다 (기존 undo 동작) |

상태: 🟢

## 2. 인터페이스

### 2-1. 키보드 — rename 모드 진입/종료

| 입력 | 조건 | 결과 |
|------|------|------|
| F2 | 노드 포커스 중, rename 모드 아님 | rename 모드 진입: 해당 노드의 편집 대상 요소가 contenteditable이 되고 텍스트 전체 선택 |
| Enter | rename 모드 중 | confirmRename(nodeId, field, newValue) dispatch → rename 모드 종료 → 노드에 포커스 복귀 |
| Escape | rename 모드 중 | cancelRename() dispatch → 원래 텍스트 복원 → rename 모드 종료 → 노드에 포커스 복귀 |

### 2-2. 키보드 — rename 모드 중 행동 변경

| 입력 | 조건 | 결과 |
|------|------|------|
| ↑↓←→ | rename 모드 중 | contenteditable 내 커서 이동 (behavior keyMap 억제) |
| 모든 printable key | rename 모드 중 | contenteditable에 타이핑 (behavior keyMap 억제) |
| Tab | rename 모드 중 | confirm 후 rename 종료 (키보드 트랩 방지, WCAG 2.1.2) |
| Home/End | rename 모드 중 | contenteditable 내 텍스트 시작/끝으로 커서 이동 |
| Cmd+Z | rename 모드 중 | 브라우저 네이티브 undo (contenteditable 내부, store undo 아님) |
| Cmd+A | rename 모드 중 | contenteditable 내 전체 선택 |

### 2-3. 마우스/포인터

| 입력 | 조건 | 결과 |
|------|------|------|
| 더블클릭 | 노드 위 | rename 모드 진입 |
| 클릭 (다른 노드) | rename 모드 중 | confirm 후 클릭된 노드로 포커스 이동 |
| 클릭 (빈 영역) | rename 모드 중 | confirm 후 rename 종료 |

### 2-4. Editable Element 모드 (중앙 관리)

useAria의 onKeyDown **한 곳**에서 "타이핑 가능한 곳"의 모든 특수 동작을 관리한다. contenteditable, input, textarea 중 하나가 event.target이면 자동으로 이 모드가 적용된다.

| 입력 | editable element 모드 동작 |
|------|--------------------------|
| 모든 키 이벤트 | behavior keyMap 스킵 (패스스루) |
| Enter | confirm 처리 (단, isComposing이면 무시) |
| Escape | cancel 처리 |
| Tab | confirm 후 rename 종료 (키보드 트랩 방지, WCAG 2.1.2) |
| Cmd+Z | 브라우저 네이티브 undo (store undo 아님) |
| 나머지 | 브라우저 기본 동작 (타이핑, 커서 이동, 선택 등) |

적용 대상: `<Aria.Editable>`, 소비자가 직접 넣은 `<input>`/`<textarea>`, 향후 리치 에디터 블록 — 모두 자동 적용, 별도 설정 불필요.

상태: 🟢

## 3. 산출물

### 3-1. NodeState 확장

- `NodeState.renaming: boolean` — `__rename__` 엔티티에서 해당 노드가 rename 중인지 파생

### 3-2. useAria 변경

- `getNodeState()` — `__rename__` 엔티티 조회하여 `renaming` 필드 반영
- `getNodeProps().onKeyDown` — event.target이 editable element면 early return (범용 가드)

### 3-3. `<Aria.Editable>` 컴포넌트

- AriaNodeContext에서 nodeId, renaming 상태를 읽음
- `field` prop으로 편집 대상 필드 지정
- renaming=false: children을 그대로 렌더
- renaming=true: contenteditable div로 전환, 텍스트 전체 선택, Enter/Esc 핸들링
- confirm 시 el.textContent로 값 읽어서 confirmRename dispatch
- cancel 시 원래 텍스트 복원 후 cancelRename dispatch

### 3-4. 데모 페이지 수정

- PageRename.tsx — renderItem에 `<Aria.Editable field="label">` 적용

상태: 🟢

## 4. 경계

| 조건 | 예상 동작 |
|------|----------|
| 빈 문자열로 confirm | 별도 리액션 없이 원래 값 복원 (cancel과 동일하게 동작) |
| rename 중 다른 노드 삭제 (외부 dispatch) | rename 취소 + focusRecovery 동작 |
| rename 중 undo (Cmd+Z) | contenteditable 내부 undo (브라우저 네이티브) |
| rename 대상 노드가 화면에서 사라짐 (collapse) | rename 취소 |
| rename 플러그인이 없는 Aria에서 `<Aria.Editable>` 사용 | `__rename__` 엔티티 없음 → renaming 항상 false → children 그대로 렌더 (graceful) |
| IME 입력 (한글, 일본어) | isComposing 중이면 Enter를 confirm으로 처리하지 않음. compositionend 후 정상 동작 |
| 매우 긴 텍스트 입력 | contenteditable 자연 확장. 별도 제한 없음 (소비자 CSS 영역) |

상태: 🟢

## 5. 금지

| # | 하면 안 되는 것 | 이유 |
|---|---------------|------|
| 1 | rename 모드 중 React 리렌더로 contenteditable DOM 덮어쓰기 | 사용자 입력 소실. contenteditable은 React가 초기값만 렌더하고 편집 중 손 놓아야 함 |
| 2 | stopPropagation으로 키 이벤트 억제 | VS Code 패턴 따라 이벤트 소스에서 필터링. stopPropagation은 다른 리스너 차단 부작용 |
| 3 | `<input>` 요소로 교체 렌더 | contenteditable로 제자리 편집해야 함. Visual CMS 확장성 확보 |
| 4 | rename 전용 키맵 억제 로직 | isEditableElement 범용 가드로 해결. rename에 종속된 특수 로직 불필요 |
| 5 | Aria.Editable 내부에서 useState로 편집 값 관리 | 리렌더 유발 → contenteditable DOM 충돌. ref로 관리 |

상태: 🟢

## 6. 검증

| # | 시나리오 | 예상 결과 |
|---|---------|----------|
| 1 | F2 → 텍스트 타이핑 → Enter | store에 새 값 반영, renaming=false |
| 2 | F2 → 텍스트 타이핑 → Escape | 원래 값 유지, renaming=false |
| 3 | F2 → Enter → Cmd+Z | undo로 이전 값 복원 |
| 4 | F2 → ↑↓ 키 입력 | 포커스 이동 안 됨 (커서만 이동) |
| 5 | F2 → "abc" 타이핑 | behavior keyMap에 잡히지 않고 텍스트 입력됨 |
| 6 | rename 플러그인 없이 Aria.Editable 사용 | 에러 없이 일반 텍스트 렌더 |
| 7 | NodeState.renaming이 true인 노드 확인 | `__rename__` active:true + 해당 nodeId 일치 시에만 true |
| 8 | IME 한글 입력 후 Enter | 조합 완료 후 confirm, 중간 상태에서 confirm 안 됨 |
| 9 | F2 → 텍스트 전부 지움 → Enter | 빈 문자열이므로 별도 리액션 없이 원래 값 복원 (cancel과 동일) |
| 10 | 더블클릭으로 rename 진입 → Enter | F2 진입과 동일하게 동작 |
| 11 | rename 중 다른 노드 클릭 | 현재 값으로 confirm 후 클릭된 노드로 포커스 이동 |

상태: 🟢

---

**전체 상태:** 🟢 6/6
