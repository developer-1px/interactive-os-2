# Combobox 완성 — PRD

> Discussion: combobox를 실무 수준으로 완성. 하나의 behavior로 Select, Autocomplete, Multi-Select, Tag Input, Creatable 5가지 변형 커버.

## 범위

**이 PRD:** combobox behavior/plugin/UI 확장 — 멀티셀렉트, 태그 토큰, 그룹핑, Creatable
**현재 구현:** 단일 선택 + 텍스트 필터링 + read-only/editable 모드

## 1. 유저 스토리

| # | Given | When | Then |
|---|-------|------|------|
| US1 | Multi-Select combobox에 포커스 | 항목 Enter/클릭 | 항목 토글(선택/해제), 드롭다운 유지 |
| US2 | Multi-Select에 항목 3개 선택됨 | 입력 필드 확인 | 선택된 항목이 태그 토큰으로 표시 |
| US3 | 태그 토큰이 있는 상태 | Backspace (입력 비어있을 때) | 마지막 토큰에 포커스 이동 |
| US4 | 토큰에 포커스 | Delete 또는 Backspace | 해당 토큰 제거 (항목 선택 해제) |
| US5 | 토큰에 포커스 | ← → | 토큰 간 이동 |
| US6 | 그룹핑된 드롭다운 | ↑ ↓ | 그룹 헤더 건너뜀, 선택 가능 항목만 이동 |
| US7 | Creatable combobox에서 필터 결과 0개 | 드롭다운 확인 | "Create [입력값]" 옵션 표시 |
| US8 | "Create [입력값]" 옵션에서 Enter | 키 입력 | 새 엔티티 생성 + 선택 + 드롭다운 닫힘(단일) 또는 토큰 추가(멀티) |
| US9 | 단일 선택 combobox | 항목 Enter/클릭 | 항목 선택 + 드롭다운 닫힘 (기존 동작 유지) |
| US10 | editable combobox | 텍스트 입력 | 필터링 (기존 동작 유지) |

상태: 🟡

## 2. 화면 구조

```
┌─ Combobox Container ─────────────────────────┐
│ ┌─ Token Area (멀티셀렉트 시) ──────────────┐ │
│ │ [Tag1 ×] [Tag2 ×] [Tag3 ×]  [input___]   │ │
│ └───────────────────────────────────────────┘ │
│                                               │
│ ┌─ Dropdown (isOpen=true) ──────────────────┐ │
│ │ ── Group Header: Fruits ──                │ │
│ │   ☑ Apple                                 │ │
│ │   ☐ Banana                                │ │
│ │ ── Group Header: Vegetables ──            │ │
│ │   ☐ Carrot                                │ │
│ │   ☑ Potato                                │ │
│ │ ─────────────────────────────             │ │
│ │   + Create "Mango"          (creatable)   │ │
│ └───────────────────────────────────────────┘ │
└───────────────────────────────────────────────┘
```

**변형별 차이:**

| 변형 | Token Area | Input | Dropdown | 선택 모드 |
|------|-----------|-------|----------|----------|
| Select | ❌ | read-only, 선택값 표시 | ✅ | single |
| Autocomplete | ❌ | editable, 필터링 | ✅ | single |
| Multi-Select | ✅ 태그 토큰 | editable, 필터링 | ✅ (닫히지 않음) | multiple |
| Tag Input | ✅ 태그 토큰 | editable, 자유 입력 | ✅ 또는 ❌ | multiple |
| Creatable | 선택적 | editable | ✅ + "Create" 옵션 | single/multiple |

상태: 🟡

## 3. 인터랙션 맵

### 공통 (모든 변형)

| 입력 | 현재 상태 | 결과 |
|------|----------|------|
| ↓ | 닫힘 | 드롭다운 열기 + 첫 항목 포커스 |
| ↓ | 열림 | 다음 항목 (그룹 헤더 건너뜀) |
| ↑ | 열림 | 이전 항목 (그룹 헤더 건너뜀) |
| Home | 열림 | 첫 번째 항목 |
| End | 열림 | 마지막 항목 |
| Escape | 열림 | 드롭다운 닫기 |
| Tab | 열림 | 드롭다운 닫기 + 다음 포커스 가능 요소로 (브라우저 네이티브) |
| 클릭 (입력 필드) | 닫힘 | 드롭다운 열기 |
| 클릭 (항목) | 열림 | 항목 선택 (변형에 따라 닫힘/유지) |
| 클릭 (외부) | 열림 | 드롭다운 닫기 |

### 단일 선택 전용

| 입력 | 현재 상태 | 결과 |
|------|----------|------|
| Enter | 열림, 항목 포커스 | 항목 선택 + 드롭다운 닫기 |
| Space | 닫힘 (read-only) | 드롭다운 열기 |

### 멀티 선택 전용

| 입력 | 현재 상태 | 결과 |
|------|----------|------|
| Enter | 열림, 항목 포커스 | 항목 토글 (선택/해제), 드롭다운 유지 |
| Space | 열림, 항목 포커스 (non-editable) | 항목 토글 (Enter와 동일) |
| Space | 열림 (editable) | 문자 입력 (입력 필드에 스페이스) |
| Backspace | 입력 비어있음, 토큰 있음 | 마지막 토큰에 포커스 |
| Backspace | 토큰에 포커스 | 토큰 제거 (선택 해제) |
| Delete | 토큰에 포커스 | 토큰 제거 |
| ← | 토큰에 포커스 | 이전 토큰 |
| → | 토큰에 포커스 | 다음 토큰 (마지막이면 입력으로) |

### Creatable 전용

| 입력 | 현재 상태 | 결과 |
|------|----------|------|
| Enter | "Create [값]" 옵션 포커스 | 새 엔티티 생성 + 선택 |

### 이벤트 버블링

- 토큰 영역과 입력 필드가 같은 컨테이너 → 포커스 이벤트 격리 필요
- 토큰의 × 버튼 클릭 시 드롭다운 열림 방지 (stopPropagation)

상태: 🟡

## 4. 상태 전이

| 상태 | 진입 조건 | 탈출 조건 | 시각적 변화 |
|------|----------|----------|------------|
| Closed | 초기 / Escape / Enter(단일) / Tab / 외부 클릭 | ↓, 클릭, Enter(닫힘 시) | 드롭다운 숨김 |
| Open — 드롭다운 탐색 | ↓, 클릭 | Escape, Enter(단일), Tab | 드롭다운 표시, activedescendant 하이라이트 |
| Open — 토큰 포커스 (멀티) | Backspace(입력 비어있을 때) | →(마지막 토큰 다음) → 입력 복귀, Delete → 제거 후 입력 복귀 | 토큰 하이라이트 |
| Open — 텍스트 입력 (editable) | 문자 입력 | ↓ → 드롭다운 탐색 | 필터 적용, 드롭다운 갱신 |

상태: 🟡

## 5. 시각적 피드백

| 상태 | 사용자가 보는 것 |
|------|----------------|
| 항목 포커스 (activedescendant) | `combo-item--focused` 배경 하이라이트 |
| 항목 선택됨 | `combo-item--selected` 체크마크 또는 accent 배경 |
| 토큰 | 입력 필드 앞에 `[label ×]` 형태 pill |
| 토큰 포커스 | 토큰에 accent border |
| 그룹 헤더 | 볼드 텍스트 + 작은 폰트 + padding-top 구분 (구분선 없음) |
| "Create" 옵션 | `+ Create "값"` 텍스트, 일반 항목과 다른 스타일 |
| 빈 결과 | 드롭다운 비어있음. 소비자가 `renderEmpty` 콜백으로 표시 결정 |

상태: 🟡

## 6. 데이터 모델

### 기존 (확장)

```
__combobox__ 엔티티: { isOpen, filterText }
→ 추가: selectionMode 정보는 behavior 옵션으로 전달 (store에 넣지 않음)
```

### 그룹핑

```
ROOT → [group-1, group-2]
  group-1 → [item-a, item-b]    entity data: { type: 'group', label: 'Fruits' }
  group-2 → [item-c, item-d]    entity data: { type: 'group', label: 'Vegetables' }
```

그룹 엔티티는 relationships로 표현. behavior에서 그룹 헤더를 건너뛰는 로직 필요.

### Creatable

필터 결과 0개일 때 동적으로 `__create__` 임시 엔티티 표시. Enter 시 `crud().create`로 실제 엔티티 생성.

### 옵션 인터페이스 (Combobox UI props)

```ts
interface ComboboxProps {
  data: NormalizedData
  selectionMode?: 'single' | 'multiple'  // NEW
  creatable?: boolean                      // NEW
  // grouped는 별도 prop 불필요 — store에 type:'group' 엔티티가 있으면 자동 감지
  editable?: boolean
  placeholder?: string
  renderItem?: ...
  renderToken?: ...                        // NEW
  onChange?: ...
}
```

상태: 🟡

## 7. 경계 조건

| 조건 | 예상 동작 |
|------|----------|
| 선택 항목 0개 (멀티) | 토큰 영역 숨김, 입력만 표시 |
| 선택 항목 많음 (10+) | 토큰 영역 줄바꿈 (flex-wrap) |
| 필터 결과 0개 | 드롭다운 빈 상태 (소비자가 renderEmpty로 처리). Creatable이면 "Create" 옵션만 표시 |
| 그룹 내 항목 0개 (필터링 후) | 그룹 헤더도 숨김 |
| 토큰 삭제 후 남은 토큰 0개 | 입력에 포커스 복귀 |
| 단일 선택에서 이미 선택된 항목 Enter | 동일 항목 재선택 (변화 없음) + 닫기 |
| Creatable에서 이미 존재하는 값 입력 | "Create" 옵션 안 표시 (기존 항목 선택만) |
| 윈도우 리사이즈 / viewport 변경 | 드롭다운 위치는 CSS로 처리 (headless — 포지셔닝 엔진 제공 안 함) |
| 이벤트 버블링 (토큰 ×, 입력, 드롭다운) | stopPropagation으로 격리 |

상태: 🟡

## 8. 접근성

- **ARIA role:**
  - 컨테이너 input: `role="combobox"`, `aria-expanded`, `aria-haspopup="listbox"`
  - 드롭다운: `role="listbox"`, `aria-multiselectable="true"` (멀티 시)
  - 항목: `role="option"`, `aria-selected`
  - 그룹: `role="group"`, `aria-label="[그룹명]"`
  - 그룹 헤더: `role="presentation"` (선택 불가)
  - 토큰 영역: `role="list"`, 각 토큰: `role="listitem"`
- **키보드 패턴(APG):**
  - APG Combobox: ↑↓, Enter, Escape, Home, End
  - 멀티 확장: Space 토글, Backspace 토큰 삭제, ←→ 토큰 이동
- **스크린리더:**
  - `aria-activedescendant`로 현재 포커스 항목 안내
  - 선택 변경 시 `aria-selected` 업데이트
  - 토큰 수: 소비자가 aria-live announcer로 처리 (headless — 기본 제공 안 함)

상태: 🟡

## 9. 검증 기준

| # | 시나리오 | 예상 결과 | 우선순위 |
|---|---------|----------|---------|
| T1 | 단일 선택: Enter → 항목 선택 | 선택 + 드롭다운 닫힘 | P0 |
| T2 | 멀티 선택: Enter → 항목 토글 | 토글 + 드롭다운 유지 | P0 |
| T3 | 멀티 선택: 3개 선택 → 토큰 표시 | 3개 토큰 렌더링 | P0 |
| T4 | 토큰에서 Backspace | 토큰 제거 + 선택 해제 | P0 |
| T5 | 토큰 ←→ 이동 | 토큰 간 포커스 이동 | P0 |
| T6 | 그룹핑: ↓ 키 | 그룹 헤더 건너뜀 | P0 |
| T7 | Creatable: 필터 결과 0 → Enter | 새 엔티티 생성 + 선택 | P0 |
| T8 | editable: 텍스트 입력 | 필터링 동작 (기존) | P0 |
| T9 | Tab | 드롭다운 닫기 + 외부 포커스 | P0 |
| T10 | 빈 입력 Backspace → 마지막 토큰 포커스 | 토큰 하이라이트 | P1 |
| T11 | 필터 결과 0개 (non-creatable) | 드롭다운 빈 상태 (소비자 renderEmpty 호출) | P1 |
| T12 | 그룹 내 전부 필터링됨 | 그룹 헤더도 숨김 | P1 |
| T13 | 토큰 × 클릭 | 토큰 제거, 드롭다운 안 열림 | P1 |
| T14 | 선택 항목 10+ | 토큰 영역 줄바꿈 (flex-wrap) | P1 |

상태: 🟡

---

**전체 상태:** 🟡 0/9 확정 (AI 초안 완료, 사용자 확인 필요)
