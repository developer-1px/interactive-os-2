좋은 질문이에요. 프로젝트 메모리와 현재 코드를 먼저 살펴봤습니다.

현재 `dnd` 플러그인(`src/interactive-os/plugins/dnd.ts`)에 이미 `moveUp`, `moveDown`, `moveOut`, `moveIn`, `moveTo` 5개 Command가 있고, 모두 `moveNode` 기반에 `execute/undo` 쌍을 갖추고 있습니다. 키보드 리오더(Cmd+Arrow)는 spatial behavior 메모에서도 "컬렉션 레벨 기본기"로 명시되어 있고, 기존 dnd plugin의 keyMap은 뷰마다 달라서 `options.keyMap`으로 유지하는 것이 확정된 원칙입니다.

---

| 요소 | 내용 | 이해도 |
|------|------|--------|
| 목적 | 드래그앤드롭과 키보드 두 경로로 아이템 순서를 바꾸고 싶음. 두 인터랙션의 모델 공유 여부를 결정하려 함 | 🟡 70% |
| 배경 | interactive-os에 이미 dnd 플러그인(Command 기반 moveUp/Down/Out/In/moveTo)이 존재. 키보드 리오더도 spatial behavior에서 Cmd+Arrow로 설계됨. 마우스 드래그는 아직 DOM 이벤트 레벨 구현이 없음 | 🟡 65% |
| 이상적 결과 | 마우스 드래그와 키보드 양쪽에서 아이템 순서를 바꿀 수 있고, undo/redo가 통합됨 | 🟡 50% |
| 현실 | Command 레벨(moveUp/moveDown/moveTo)은 존재. 키보드 keyMap 바인딩은 뷰별로 주입하는 구조. 마우스 드래그 이벤트 → Command 연결은 미구현 | 🟡 60% |
| 문제 | 마우스 드래그가 만드는 "임의 위치로 이동"과 키보드의 "한 칸씩 이동"이 같은 Command를 쓸 수 있는지, 중간 상태(드래그 중 preview)는 어떻게 모델링할지 | 🔴 40% |
| 원인 | 미정 | 🔴 10% |
| 제약 | 미정 | 🔴 10% |
| 목표 | 미정 | 🔴 10% |
| 해결 | 미정 | 🔴 10% |
| 부작용 | 미정 | 🔴 10% |

---

제 판단부터 말씀드리겠습니다.

**모델은 반드시 공유해야 합니다.** 이유는 세 가지입니다:

1. **이미 공유하고 있습니다.** 현재 `dndCommands.moveTo(nodeId, targetParentId, index)`가 "임의 위치 이동"의 범용 Command입니다. 키보드의 `moveUp/moveDown`도 내부적으로 같은 `moveNode` 함수를 씁니다. 마우스 드래그의 drop도 최종적으로 `moveTo`를 dispatch하면 됩니다.

2. **undo/redo 통합이 자동으로 됩니다.** Command 패턴이니까 history 플러그인이 입력 경로(마우스/키보드)를 구분하지 않습니다. 모델을 분리하면 히스토리를 두 벌 관리해야 하는데, 이건 정확히 interactive-os가 해결하려던 문제의 반대 방향입니다.

3. **"입력 경로가 다르고 모델은 같다"는 게 이 프레임워크의 핵심 설계입니다.** clipboard도 Ctrl+C(키보드)와 우클릭 복사(마우스)가 같은 Command를 씁니다. dnd도 동일한 패턴입니다.

분리가 필요한 부분은 모델이 아니라 **인터랙션 레이어**입니다:
- **키보드**: keyMap에서 `Cmd+ArrowUp` → `dndCommands.moveUp(focusedId)` dispatch (동기적, 한 칸)
- **마우스 드래그**: dragstart/dragover/drop 이벤트 → 중간 preview 상태(이건 store 밖의 로컬 UI state) → drop 시 `dndCommands.moveTo(nodeId, targetParentId, dropIndex)` dispatch

다르게 보시면 말씀해주세요.

---

가장 이해도가 낮은 부분을 향해 질문합니다:

**이 기능을 넣으려는 구체적 뷰가 어디인가요?** TreeGrid(파일 탐색기), ListBox, Kanban 등에 따라 "드래그 중 preview"의 형태와 drop 가능 위치 규칙이 완전히 달라집니다.

A) TreeGrid — 트리 노드 간 이동, 깊이 변경 포함
B) ListBox / 플랫 리스트 — 형제 간 순서만
C) Kanban — 컬럼 간 + 컬럼 내 이동
D) 다른 뷰

**제 판단: 어떤 뷰든 Command 레이어는 공유하되, 드래그 preview / drop target 판정 로직은 뷰별로 달라야 합니다.** 이유: 현재 dnd plugin이 keyMap을 뷰별 `options.keyMap`으로 주입하는 원칙과 동일한 패턴이기 때문입니다. 대상 뷰를 알면 구체적인 drop 규칙을 정할 수 있습니다.
