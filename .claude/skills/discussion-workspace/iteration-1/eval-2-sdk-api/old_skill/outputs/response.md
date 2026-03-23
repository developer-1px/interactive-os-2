| 요소 | 내용 | 이해도 |
|------|------|--------|
| 목적 | hook 하나(`useAria`)로 복잡한 트리 구조의 키보드/포커스/CRUD를 다루는 SDK 제공. 사용자가 ARIA primitives를 직접 조합하지 않아도 되게 하려는 것. | 🟡 60% |
| 배경 | interactive-os가 이미 존재. 5-layer 아키텍처(Store→Engine→Plugin→Behavior→Component), 13 behaviors, 41 exports. 현재 UI 컴포넌트가 데모용이라 실제 앱에서 우회되는 문제가 있음. v1은 과도한 추상화로 실패한 히스토리. | 🟡 70% |
| 이상적 결과 | `useAria` 하나로 트리 구조를 다룰 수 있는 API. 구체적인 API 형태는 미정. | 🔴 30% |
| 현실 | 현재 `useAria`가 있고 `useAriaZone`으로 engine 분리까지 진행됨. 하지만 실제로 앱에서 쓰려면 store + plugins + behavior + keyMap을 조합해야 해서 boilerplate가 큼. UI 컴포넌트 11개 완성품 계획은 수립됨(Sidebar부터). | 🟡 65% |
| 문제 | "useAria 하나면 다 된다"의 구체적 API 모습이 안 잡힘. 어디까지 hook이 감추고, 어디부터 사용자가 제어해야 하는지의 경계가 불명확. | 🟡 50% |
| 원인 | 미정 | 🔴 20% |
| 제약 | 미정 | 🔴 10% |
| 목표 | 미정 | 🔴 10% |
| 해결 | 미정 | 🔴 10% |
| 부작용 | 미정 | 🔴 0% |

---

여기서 하나 짚고 넘어가야 할 게 있습니다.

"useAria 하나로 다 되는 것"과 프로젝트에서 이미 확립된 원칙 사이에 긴장이 있습니다. 기존에 확인된 원칙은 **"범용 hook 하나보다 용도별 완성품 다수"**입니다. v1이 정확히 "하나의 범용 추상화"로 실패했고, v2 방향은 Sidebar, TreeView, DataGrid 같은 **표준 UI 어휘 기준의 구체적 완성품**이었습니다.

그래서 "useAria 하나면 다 된다"를 두 가지로 읽을 수 있습니다:

**A) 내부 엔진 레벨** -- useAria가 내부적으로는 하나의 통합 엔진이되, 사용자에게는 `<TreeView>`, `<DataGrid>` 같은 완성품으로 노출. Radix(내부) vs shadcn/ui(외부) 관계.

**B) 사용자 API 레벨** -- 진짜로 사용자가 `useAria({ behavior: 'treegrid', data, plugins })` 형태로 하나의 hook을 직접 쓰는 것. 파워 유저용 escape hatch.

**제 판단: A가 맞는 방향.** 이유: v1 실패 경험 + "LLM/사용자는 UI 컴포넌트만 쓴다" 원칙 + hook-first 구조(용도별 hook + 편의 컴포넌트) 계획이 이미 있기 때문입니다. useAria는 내부 인프라이고, SDK의 표면적은 `useTreeView()`, `useSidebar()` 같은 용도별 hook이 되어야 합니다.

다만 "아직 감이 안 잡힌다"고 하신 건, 이 용도별 hook의 **구체적 시그니처와 반환값**이 뭔지를 말씀하시는 걸 수도 있습니다.

---

가장 이해도가 낮은 부분을 향해 질문합니다:

**"useAria 하나면 다 된다"에서 "다"의 범위가 뭔가요?**

A) 트리 구조의 탐색(키보드 네비게이션 + 포커스)만 -- 기본기를 쉽게 쓰게
B) 탐색 + CRUD(추가/삭제/이동/이름변경) + clipboard + undo까지 -- 편집 가능한 트리
C) 위 전부 + 다른 위젯(리스트, 그리드, 탭 등)까지 동일 hook으로 -- 진짜 만능

**제 판단: B.** 이유: interactive-os의 차별점이 "탐색만 하는 ARIA 라이브러리와 달리 CRUD/clipboard/undo까지 통합"인데, 그렇다면 SDK의 가치도 거기에 있을 것. 하지만 C까지 가면 v1의 실수를 반복할 위험이 있습니다. 다르게 보시면 말씀해주세요.
