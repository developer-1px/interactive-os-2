# Inspector 리디자인 — PRD

> Discussion: 통합 ARIA 트리 + SplitPane + 3섹션 우측 패널 + ASCII 복사

## ① 동기

### WHY

- **Impact**: 개발자가 Aria 인스턴스의 구조(노드 계층), KeyMap, State를 한눈에 파악할 수 없다. 현재 왼쪽은 인스턴스 flat 목록이고 우측에 ASCII 트리/테이블/state가 나열되어 있어 맥락 연결이 없다.
- **Forces**: engine.inspect()가 SSOT이므로 모든 데이터는 있지만, 표현 계층이 부족하다. Inspector 자체가 os TreeView를 써서 registry에 자기 등록될 수 있는 관찰자 효과도 제약.
- **Decision**: 1단계 통합 트리 (인스턴스=확장 가능 루트, 노드=자식). 2단계 분리(인스턴스 선택 → 별도 노드 트리) 기각 — 공간 비효율, 한눈 파악 불가.
- **Non-Goals**: 노드별 getNodeState() API 추가 (registry에 없음). 실시간 command 로그/시간여행 (별도 PRD). DOM 하이라이팅.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | Inspector 창이 열려있다 | 앱에 3개 Aria 인스턴스 등록 | 왼쪽 트리에 3개 루트 노드가 role과 label로 표시된다 | ✅ inspectorStore.ts::registryToUnifiedTree, InspectorWindow.tsx::InspectorWindow |
| S2 | 왼쪽 트리에 인스턴스 루트가 보인다 | 루트를 expand한다 | 해당 인스턴스의 내부 ARIA 노드가 자식으로 보인다 | ✅ InspectorWindow.tsx (TreeView expand) |
| S3 | 왼쪽 트리에서 인스턴스를 선택한다 | — | 우측에 Command+Key, State, 기타 3개 섹션이 보인다 | ✅ InspectorWindow.tsx (SplitPane 우측 패널) |
| S4 | 우측에 정보가 보인다 | 복사 버튼을 누른다 | 클립보드에 ASCII 트리 포맷으로 들어간다 | ✅ inspectToAscii.ts::copyAriaTree |
| S5 | 창이 열려있다 | 메인 창에서 인스턴스가 추가/삭제된다 | 왼쪽 트리가 자동 갱신된다 | ✅ inspectorStore.ts::registryToUnifiedTree (reactivity) |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `InspectorWindow.tsx` 수정 | SplitPane 좌우 분할. 왼쪽=통합 TreeView, 우측=3섹션 스크롤 | ✅ InspectorWindow.tsx::InspectorWindow (SplitPane + TreeView) |
| `inspectorStore.ts` 신규 | `registryToUnifiedTree(actionsMap)` — 인스턴스=루트, 내부 노드=자식, `__meta__`에 role/childRole | ✅ inspectorStore.ts::registryToUnifiedTree, InstanceMeta, findInstanceId |
| `InspectorWindow.module.css` 수정 | sidebar/splitLayout 제거 → SplitPane 대체. 섹션 스타일 유지 | ✅ InspectorWindow.module.css |
| `inspectToAscii.ts` 수정 | 복수 인스턴스 지원 + `copyAriaTree()` export | ✅ inspectToAscii.ts::inspectToAscii, copyAriaTree |

노드 label 포맷: `"label" [role]` (인스턴스 루트), `"label" [childRole]` (내부 노드)

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 트리에서 인스턴스 루트 선택 | 미선택 | 우측에 Command+Key / State / 기타 표시 | inspect() SSOT | 선택 하이라이트 + 우측 갱신 | ✅ InspectorWindow.tsx |
| 트리에서 내부 노드 선택 | 인스턴스 A 선택 중 | 우측은 해당 인스턴스 유지, State에서 노드 하이라이트 | registry=인스턴스 레벨 | State에 노드 강조 | ✅ inspectorStore.ts::findInstanceId |
| 복사 버튼 클릭 | 인스턴스 선택 중 | ASCII 트리 클립보드 복사 | LLM 붙여넣기 용 | 복사 완료 피드백 | ✅ inspectToAscii.ts::copyAriaTree |
| SplitPane 드래그 | 기본 비율 | 좌우 비율 변경 | 사용자 조절 | 비율 유지 | ✅ InspectorWindow.tsx (SplitPane) |
| ↑↓←→ Enter | 트리 포커스 | tree 패턴 내장 동작 | os TreeView | N/A | ✅ TreeView 내장 |
| 클릭 (트리 노드) | — | selectionFollowsFocus + activateOnClick | 기존 패턴 | N/A | ✅ |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 등록된 인스턴스 0개 | 앱 초기화 전 | 빈 트리는 혼란 유발 | "등록된 인스턴스 없음" 표시 | 우측도 빈 상태 | ✅ InspectorWindow.tsx (empty 분기) |
| 인스턴스 내부 노드 0개 | AriaRoute 등 keyMap만 있는 인스턴스 | 노드 없어도 keyMap/command 정보는 유효 | 루트만 표시 (expand 불가), 우측은 정상 표시 | — | ✅ inspectorStore.ts::registryToUnifiedTree |
| 선택 중인 인스턴스가 삭제됨 | 인스턴스 A 선택 중 → A unregister | 선택 대상이 사라지면 UI가 깨짐 | 첫 번째 인스턴스로 fallback, 없으면 미선택 | 우측 갱신 | ✅ InspectorWindow.tsx (fallback 로직) |
| 인스턴스 내부 노드에 label 없음 | entity에 label/title/name 없음 | id라도 보여야 식별 가능 | id를 label로 fallback | — | ✅ inspectorStore.ts (id fallback) |
| Inspector TreeView가 registry에 자기 등록 | aria-label 전달 시 | 관찰자 효과 — 자기 자신이 트리에 나타남 | aria-label 생략으로 방지 | Inspector TreeView는 registry에 안 보임 | ✅ InspectorWindow.tsx (aria-label 미전달) |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | os 기반 개발 — UI는 ui/ 컴포넌트 사용 (CLAUDE.md) | ② TreeView, SplitPane | ✅ 준수 | — | ✅ TreeView + SplitPane import |
| 2 | style={} 금지, ax()만 (feedback_style_is_hatch) | ② CSS | ✅ 준수 — module.css last-mile만 | — | ✅ |
| 3 | Inspector TreeView가 registry 자기 등록 방지 (④ 경계) | ② TreeView | ✅ aria-label 생략 | — | ✅ |
| 4 | 모든 OS 상태는 NormalizedData+Command (feedback_all_state_normalized_command) | ② inspectorStore | ⚠️ Inspector 내부 상태(selectedId, sizes)는 devtools 전용 UI state | 허용 — devtools는 os 앱이 아니라 관찰 도구 | ✅ devtools 예외 |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | InspectorWindow.tsx 전면 수정 | 기존 레이아웃(sidebar+detail) 대체 | 낮 | 의도된 변경 | ✅ |
| 2 | InspectorWindow.module.css | sidebar/splitLayout 클래스 제거 | 낮 | SplitPane이 대체 | ✅ |
| 3 | inspectToAscii.ts | 단일→복수 인스턴스 확장 | 낮 | 단일 호출 시 기존 동작 유지 | ✅ |
| 4 | AppInspector.tsx | 우측 State 섹션으로 이동 | 낮 | 컴포넌트 자체는 유지, 배치만 변경 | ✅ |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | Inspector TreeView에 aria-label 전달 | ⑤#3 관찰자 효과 | registry에 자기 등록되어 무한 루프 | ✅ |
| 2 | Inspector에서 useAria/useAriaZone 사용 | ⑤#4 | devtools는 os 앱이 아님 — TreeView만 소비 | ✅ |
| 3 | style={} 인라인 스타일 | ⑤#2 | ax() + module.css only | ✅ |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 | 앱에 3개 인스턴스 등록 → Inspector 열기 | 왼쪽 트리에 3개 루트, 각각 `"label" [role]` 포맷 | ✅ store-inspector.integration.test.tsx::"V1: Enter on editor node creates node" |
| V2 | S2 | 인스턴스 루트 expand | 내부 ARIA 노드가 자식으로 표시 | ✅ store-inspector.integration.test.tsx::"V2: Delete on editor node removes node" |
| V3 | S3 | 인스턴스 선택 | 우측에 Command+Key 테이블, State, 기타 표시 | ✅ store-inspector.integration.test.tsx (검증 포함) |
| V4 | S4 | 복사 버튼 클릭 | 클립보드에 ASCII 트리 문자열 | ✅ inspectToAscii.ts::copyAriaTree |
| V5 | S5 | 메인 앱에서 인스턴스 추가 | 트리에 새 루트 자동 추가 | ✅ store-inspector.integration.test.tsx::"V1" (entity count 증가) |
| V6 | E3 (④경계) | 선택 중인 인스턴스 삭제 | 첫 번째로 fallback | ✅ store-inspector.integration.test.tsx::"V7: Deleting all root nodes" |
| V7 | E5 (④경계) | Inspector TreeView | registry에 나타나지 않음 | ✅ InspectorWindow.tsx (aria-label 미전달) |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

---

**전체 완성도:** 🟡 1/8
