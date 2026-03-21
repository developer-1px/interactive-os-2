# Kanban Card Drag & Drop — PRD

> Discussion: 칸반 보드에서 카드를 마우스 드래그앤드롭으로 다른 컬럼으로 이동할 수 있어야 한다. 현재는 키보드(Alt+Arrow)로만 이동 가능.

## 1. 동기

| # | Given | Data (before) | When | Then | Data (after) | 역PRD |
|---|-------|--------------|------|------|-------------|-------|
| 1 | 사용자가 칸반 보드에서 카드를 보고 있다 | `relationships: { 'col-a': ['a1','a2'], 'col-b': ['b1'] }` | 카드 a2를 드래그하여 col-b의 b1 위에 드롭 | 카드가 col-b로 이동, 드롭 위치에 삽입 | `relationships: { 'col-a': ['a1'], 'col-b': ['a2','b1'] }` | |
| 2 | 마우스 사용자가 카드 정렬을 바꾸고 싶다 | `relationships: { 'col-a': ['a1','a2','a3'] }` | 카드 a3를 드래그하여 a1 위에 드롭 | 같은 컬럼 내에서 순서 변경 | `relationships: { 'col-a': ['a3','a1','a2'] }` | |
| 3 | 키보드와 마우스 혼용 사용자 | 임의의 칸반 상태 | 마우스로 드래그 이동 후 Mod+Z | undo로 원래 위치 복귀 | 이동 전 relationships 복원 | |

상태: 🟡

## 2. 인터페이스

| 입력 | Data (before) | 조건 | 결과 | Data (after) | 역PRD |
|------|--------------|------|------|-------------|-------|
| mousedown on card | card in col-a at index i | — | 드래그 시작. 카드에 드래그 비주얼(반투명 복제 또는 원본 이동) | 상태 변화 없음 (드래그 중 임시 상태만) | |
| mousemove (dragging) | 드래그 진행 중 | 다른 카드/컬럼 위를 지남 | 드롭 위치 인디케이터 표시 (삽입선) | 상태 변화 없음 | |
| mouseup on target column | card in source col, target col 존재 | 드래그 중이었음 | `dndCommands.moveTo(cardId, targetColId, targetIndex)` 디스패치. 포커스는 이동한 카드로 | `relationships[sourceCol]`에서 제거, `relationships[targetCol]`의 targetIndex에 삽입 | |
| mouseup on same column (reorder) | card in col at index i | 드롭 위치가 원래와 다름 | `dndCommands.moveTo(cardId, sameColId, newIndex)` 디스패치 | `relationships[col]` 내 순서 변경 | |
| mouseup on original position | card at original index | 드래그 시작 위치와 동일 | 드래그 취소, 상태 변화 없음 | 변경 없음 | |
| Escape during drag | 드래그 진행 중 | — | 드래그 취소, 원래 위치로 복귀 | 변경 없음 | |
| mouseup outside board | 드래그 진행 중 | 보드 영역 밖 | 드래그 취소, 원래 위치로 복귀 | 변경 없음 | |

### 인터페이스 체크리스트 (AI 자가 검증용)

산출물 구조를 보고 아래를 전수 확인:
- [x] ↑ 키: N/A (기존 키보드 네비게이션, 이번 범위 아님)
- [x] ↓ 키: N/A
- [x] ← 키: N/A
- [x] → 키: N/A
- [x] Enter: N/A
- [x] Escape: 드래그 중 Escape → 드래그 취소
- [x] Space: N/A
- [x] Tab: N/A
- [x] Home/End: N/A
- [x] Cmd/Ctrl 조합: N/A (Mod+Z undo는 기존 인프라, 별도 구현 불필요)
- [x] 클릭: mousedown → 드래그 시작 (짧은 클릭은 기존 포커스 동작 유지)
- [x] 더블클릭: N/A (기존 rename 동작 유지)
- [x] 이벤트 버블링: 카드 내부 Editable 영역에서의 mousedown은 드래그를 시작하면 안 됨 (rename 모드)

상태: 🟡

## 3. 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| 드래그 상태 관리 | 드래그 중인 카드 ID, 소스 컬럼, 원래 인덱스, 현재 마우스 위치를 추적하는 상태. Kanban 컴포넌트 내부 또는 별도 hook | |
| 드롭 타겟 계산 로직 | 마우스 좌표 → 어떤 컬럼의 어떤 인덱스인지 계산. 카드 DOM 요소의 getBoundingClientRect 기반 | |
| 드래그 비주얼 피드백 | 드래그 중 카드의 시각적 상태 (반투명/이동 중), 드롭 위치 인디케이터 (삽입선) | |
| 기존 Command 재사용 | `dndCommands.moveTo` 그대로 사용. 새 Command 타입 불필요. undo/redo 자동 지원 | |
| 포커스 동기화 | 드롭 완료 후 `focusCommands.setFocus(draggedCardId)` — 이동한 카드가 포커스 유지 | |

상태: 🟡

## 4. 경계

| 조건 | Data (before) | 예상 동작 | Data (after) | 역PRD |
|------|--------------|----------|-------------|-------|
| 빈 컬럼으로 드롭 | `relationships: { 'col-empty': [] }` | 빈 컬럼 전체가 드롭 타겟. 카드가 index 0에 삽입 | `relationships: { 'col-empty': ['draggedCard'] }` | |
| 컬럼 헤더 위로 드롭 | 컬럼에 카드 있음 | 해당 컬럼의 index 0(맨 위)에 삽입 | 카드가 컬럼의 첫 번째 자리에 | |
| rename(편집) 모드인 카드를 드래그 | `cardState.renaming === true` | 드래그 시작하지 않음. 텍스트 선택 등 기본 동작 유지 | 변경 없음 | |
| 카드 1개뿐인 컬럼에서 드래그 아웃 | `relationships: { 'col-a': ['a1'] }` | 이동 후 컬럼이 빈 상태가 됨 | `relationships: { 'col-a': [] }` | |
| 스크롤이 필요한 긴 컬럼 | 카드 수가 뷰포트 초과 | 드래그 중 컬럼 가장자리에 도달하면 자동 스크롤 (?) | — | |
| 선택된 카드 여러 개인 상태에서 드래그 | `selected: ['a1','a2']` | 단일 카드만 드래그 (다중 드래그는 이번 범위에서 제외) (?) | 드래그한 카드만 이동 | |

상태: 🟡

## 5. 금지

| # | 하면 안 되는 것 | 이유 | 역PRD |
|---|---------------|------|-------|
| 1 | HTML5 Drag and Drop API 사용 | 크로스 브라우저 비일관성, 커스텀 드래그 비주얼 제어 불가, 모바일 미지원. pointer events 기반으로 구현 | |
| 2 | 새 Command 타입 생성 | `dndCommands.moveTo`가 이미 cross-column 이동 + undo를 지원. 중복 생성 금지 | |
| 3 | 드래그 중 실제 store 변경 (optimistic update) | 드래그 취소 시 롤백 복잡성. 드롭 확정 시점에만 Command 디스패치 | |
| 4 | 컬럼 자체를 드래그로 재배치 | 이번 범위는 카드 이동만. 컬럼 순서 변경은 별도 PRD | |
| 5 | 외부 라이브러리(dnd-kit, react-beautiful-dnd 등) 도입 | interactive-os는 자체 ARIA 인프라 위에 동작. 외부 DnD 라이브러리의 포커스/ARIA 관리가 충돌 | |

상태: 🟡

## 6. 검증

| # | 시나리오 | 예상 결과 | 역PRD |
|---|---------|----------|-------|
| 1 | 카드를 다른 컬럼으로 드래그 드롭 | `relationships`에서 소스 컬럼에서 제거, 타겟 컬럼의 드롭 위치에 삽입. 포커스가 이동한 카드에 유지 | |
| 2 | 같은 컬럼 내에서 카드 순서 변경 드래그 | `relationships[col]` 배열 순서 변경 | |
| 3 | 드래그 후 Mod+Z | `relationships`가 드래그 전 상태로 복원 | |
| 4 | 빈 컬럼으로 드래그 | 카드가 빈 컬럼의 index 0에 삽입 | |
| 5 | 드래그 중 Escape | 드래그 취소, `relationships` 변경 없음, 카드가 원래 위치에 표시 | |
| 6 | 보드 밖으로 드래그 후 mouseup | 드래그 취소, 변경 없음 | |
| 7 | rename 모드인 카드에서 mousedown | 드래그 시작하지 않음, 텍스트 편집 동작 유지 | |
| 8 | Alt+ArrowRight(키보드 이동)와 드래그 이동이 동일한 Command 사용 | 둘 다 `dnd:move-to` 타입의 Command가 디스패치되어 undo 스택에 동일하게 쌓임 | |

상태: 🟡

---

**전체 상태:** 🟡 6/6 (AI 초안 완료, 사용자 확인 대기)
