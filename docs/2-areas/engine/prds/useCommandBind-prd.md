# useCommandBind — PRD

> Discussion: ExpandIndicator 클릭 시 expand toggle. 이벤트와 커맨드를 선언적으로 바인딩하는 hook.

## WHY

- **Impact**: ExpandIndicator가 순수 시각 부품이라 클릭해도 아무 일도 안 일어남. 사용자가 chevron을 클릭해서 expand toggle하는 건 APG가 허용하는 기본 기대.
- **Forces**: (1) 이벤트 핸들러 직접 등록 금지 원칙 (2) clickMap은 아이템 단위이므로 아이템 내부 영역 분기 불가 (3) indicator에 aria 강제 불가 (4) OCP — useAria에 특정 zone 하드코딩 금지
- **Decision**: useCommandBind hook 생성. 이벤트 종류와 커맨드를 인자로 받아 props를 반환. ExpandIndicator에서 spread. 기각 대안: (A) clickMap 키에 `@zone` 확장 — 과설계 (B) Aria.Trigger 재활용 — popup용이라 의미 불일치 (C) useAria onClick 하드코딩 — OCP 위반 (D) selectAndAnchor에 target 전달 — DOM 레이어 위반
- **Non-Goals**: clickMap 구조 변경 없음. 기존 패턴(accordion, disclosure)의 클릭 동작은 변경하지 않음

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| 1 | TreeView에서 폴더 아이템이 보임 | chevron(ExpandIndicator) 클릭 | 해당 노드 expand toggle | |
| 2 | Accordion 아이템이 보임 | chevron 클릭 | 해당 섹션 expand toggle | |
| 3 | 앱이 selectAndAnchor 모드 | chevron 외 영역 클릭 | 기존대로 selectAndAnchor 실행 (expand 아님) | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `useCommandBind` hook | `primitives/useCommandBind.ts` — 이벤트 종류 + 커맨드명을 받아 바인딩 props 반환 | |
| `ExpandIndicator` 변경 | `ui/indicators/ExpandIndicator.tsx` — useCommandBind로 클릭 시 expand:toggle | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `useCommandBind('click', 'expand:toggle')` | Aria.Item 안에서 호출 | AriaInternalContext에서 dispatch, AriaItemContext에서 nodeId 취득. `{ onClick }` props 반환 | hook이 context에서 dispatch/nodeId를 읽고, 이벤트→커맨드 바인딩을 props로 캡슐화 | 컴포넌트에 spread 가능한 props 객체 | |
| ExpandIndicator의 chevron 클릭 | 노드가 collapsed | onClick 발생 → stopPropagation → `expandCommands.toggleExpand(nodeId)` dispatch | stopPropagation으로 부모 clickMap(selectAndAnchor 등) 차단. toggleExpand가 expanded 상태 반전 | 노드가 expanded | |
| ExpandIndicator의 chevron 클릭 | 노드가 expanded | 동일 | 동일 | 노드가 collapsed | |
| Aria 밖에서 useCommandBind 호출 | context 없음 | props 반환하되 onClick은 no-op | AriaInternalContext가 null이면 dispatch 불가 — 에러 대신 graceful 무시 | 클릭해도 아무 일 없음 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| hasChildren=false (leaf 노드) | ExpandIndicator가 chevron 미렌더링 | chevron이 없으면 클릭 대상 자체가 없음 | 빈 span 클릭 → no-op | 변화 없음 | |
| Accordion/Disclosure: 부모 clickMap에도 Click→toggle 있음 | 부모와 indicator 둘 다 toggle 바인딩 | stopPropagation이 부모 전파 차단하므로 이중 실행 없음 | indicator 클릭 → 1회 toggle만 | expanded 상태 1회 반전 | |
| DatePicker/chat blocks: AriaItemContext 없음 | ExpandIndicator가 Aria 밖에서 사용 | context 없으면 바인딩 불가, 기존 동작(순수 시각) 유지 | onClick no-op | 변화 없음 | |
| 빠른 더블클릭 | expanded 상태 | 각 클릭이 독립적 toggle | 2회 toggle → 원래 상태 복귀 | 원래 상태 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 선언적 OCP (feedback_declarative_ocp) | useCommandBind 설계 | ✓ 준수 — hook 추가만, 기존 파일 수정 없음 | — | |
| 2 | addEventListener 금지 (CLAUDE.md) | useCommandBind 구현 | ✓ 준수 — React props 반환 | — | |
| 3 | indicator에 aria 강제 금지 (CLAUDE.md) | ExpandIndicator | ✓ 준수 — aria-* 속성 추가 없음, onClick만 | — | |
| 4 | 중첩 이벤트 버블링 가드 (feedback_nested_bubbling_guard) | stopPropagation | ✓ 준수 — stopPropagation으로 부모 전파 차단 | — | |
| 5 | expand=view state, undo 제외 (feedback_expand_not_history) | toggleExpand 커맨드 | ✓ 준수 — 기존 커맨드 재사용, meta:true | — | |
| 6 | UI 컴포넌트만 노출, primitives 금지 (feedback_ui_over_primitives) | useCommandBind 위치 | ⚠ 주의 — primitives hook이지만 ui/ 내부에서만 사용 | ExpandIndicator가 ui/ 소속이므로 pages에 노출 안 됨 | |
| 7 | 파일명=주 export (CLAUDE.md) | useCommandBind.ts | ✓ 준수 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | ExpandIndicator 사용처 전체 (11개 파일) | 기존 순수 시각 → interactive로 성격 변경 | 중 | Aria 밖 사용처(DatePicker, chat)는 graceful no-op | |
| 2 | TreeView activateOnClick 모드 | chevron 클릭 시 activate 대신 expand | 저 | 의도한 동작 — chevron은 expand, 나머지는 activate | |
| 3 | Accordion/Disclosure 패턴 | 이중 toggle 가능성 | 저 | stopPropagation이 방지 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | ExpandIndicator에 aria-expanded 직접 추가 | ⑤-3 indicator aria 금지 | treeitem이 이미 aria-expanded 소유, 중복 | |
| 2 | useCommandBind 내부에서 addEventListener 사용 | ⑤-2 addEventListener 금지 | React props로만 바인딩 | |
| 3 | Aria 밖 호출 시 에러 throw | ⑥-1 graceful 대응 | DatePicker 등 기존 사용처 깨짐 방지 | |
| 4 | pages에서 useCommandBind 직접 import | ⑤-6 primitives 노출 금지 | ui/ 내부에서만 사용 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| 1 | ①-1 | TreeView에서 chevron 클릭 | 노드 expand toggle | |
| 2 | ①-2 | Accordion에서 chevron 클릭 | 섹션 expand toggle | |
| 3 | ①-3 | TreeView에서 chevron 외 영역 클릭 | selectAndAnchor 실행, expand 안 됨 | |
| 4 | ④-1 | leaf 노드 ExpandIndicator 영역 클릭 | no-op (chevron 없음) | |
| 5 | ④-2 | Disclosure에서 chevron 클릭 | 1회 toggle만 (이중 실행 없음) | |
| 6 | ④-3 | DatePicker에서 ExpandIndicator 클릭 | 기존 동작 유지 (no-op) | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

## 교차 검증

1. **동기 ↔ 검증**: 동기 3개 → 검증 #1,#2,#3 커버 ✓
2. **인터페이스 ↔ 산출물**: useCommandBind가 props 반환 → ExpandIndicator에서 spread ✓
3. **경계 ↔ 검증**: 경계 4개 → 검증 #4,#5,#6 커버 ✓
4. **금지 ↔ 출처**: 모든 금지의 출처(⑤/⑥) 유효 ✓
5. **원칙 대조 ↔ 전체**: 위반 없음. ⑤-6 주의사항은 ui/ 내부 사용으로 해결 ✓
