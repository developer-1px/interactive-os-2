좋은 주제입니다. 먼저 현재 상태를 정리하고 숨겨진 갭을 찾아보겠습니다.

**선행 조사 결과:** 현재 `dnd` 플러그인은 이미 키보드 커맨드를 가지고 있습니다 — `moveUp`, `moveDown`, `moveIn`, `moveOut`, `moveTo`. 그리고 kanban behavior에서 `Alt+Arrow` 키바인딩으로 이 커맨드들을 연결하고 있습니다. treegrid 등 다른 behavior에서는 dnd 키바인딩이 없는 상태입니다.

즉 "키보드로 drag and drop"은 이미 kanban에서 동작하고 있고, 문제는 **다른 패턴(treegrid, listbox 등)에 dnd 키보드를 어떻게 확산하느냐**인 것 같습니다. 아니면 "마우스 drag"(실제 HTML5 DnD 또는 pointer drag)을 말씀하시는 건지 확인이 필요합니다.

---

| 요소 | 내용 | 이해도 |
|------|------|--------|
| 목적 | 마우스 전용인 DnD에 키보드 접근성 추가 | 🟡 60% |
| 배경 | dnd 플러그인(moveUp/Down/In/Out/To)은 존재. kanban은 Alt+Arrow로 연결됨. 다른 behavior는 미연결 | 🟡 70% |
| 이상적 결과 | 모든(또는 특정) behavior에서 키보드로 노드 이동 가능 | 🔴 30% |
| 현실 | kanban만 Alt+Arrow DnD 키바인딩 있음. treegrid/listbox 등은 dnd 플러그인 등록은 가능하나 키바인딩 없음. 마우스 pointer drag는 별도 구현 필요 | 🟡 70% |
| 문제 | 이상적 결과가 불명확하여 갭 정의 불가 | 🔴 20% |
| 원인 | — | 🔴 0% |
| 제약 | 축 모델 6축 상한. dnd는 플러그인 레벨(축 밖). Plugin은 keyMap까지 소유해야 함 | 🟡 60% |
| 목표 | — | 🔴 0% |
| 해결 | — | 🔴 0% |
| 부작용 | — | 🔴 0% |

---

"키보드 네비게이션을 drag and drop에 넣고 싶다"는 말이 두 가지로 읽힙니다:

**A) dnd 키바인딩을 더 많은 behavior에 확산** — kanban처럼 Alt+Arrow를 treegrid, listbox 등에도 넣는 것. 이건 각 behavior에 `kanbanPlugins` 같은 axis를 추가하거나, dnd 플러그인이 자체 keyMap을 소유하게 하면 됩니다. 기존 아키텍처로 바로 가능.

**B) 마우스 drag 인터랙션 자체를 키보드로 대체** — "grab 모드 진입 → 화살표로 위치 미리보기 → Enter로 drop" 같은 ARIA live drag-and-drop 패턴. 이건 새로운 인터랙션 모드가 필요합니다.

**제 판단: A가 더 가능성 높습니다.** 이유: 현재 프로젝트의 설계 철학이 "키보드로 모든 것을 할 수 있어야 한다"이고, dnd 커맨드는 이미 있으니 키바인딩 연결만 남은 상황입니다. B는 APG의 drag-and-drop 패턴인데, 현재 축 모델과 별개의 새 모드 개념이 필요해서 스코프가 큽니다.

**어떤 쪽인가요? 아니면 C) 다른 의미가 있으시면 말씀해 주세요.**
