# DatePicker Composite — PRD

> Discussion: Gap 3 해소 — 바이브코딩에서 `<DatePicker />` 한 줄로 접근성 완전한 date picker 생산

## ① 동기

### WHY

- **Impact**: 바이브코딩 사용자가 DatePicker 필요 시 접근성 있는 완성품이 없어 APG 직접 구현 또는 접근성 포기. DatePicker는 폼 UI에서 가장 흔한 composite 위젯.
- **Forces**: "1 pattern = 1 store = 1 component" 원칙 vs 3개 독립 인터랙션 zone. useEngine + useAriaZone 조합으로 기존 아키텍처 안에서 해결 가능 확인.
- **Decision**: CalendarGrid ui/ 신규 + DatePicker ui/ 조합 완성품. 기각: Carousel(실전 빈도 낮음), dialog useAriaZone(plain focus trap 충분), 새 composite 아키텍처(불필요).
- **Non-Goals**: TimePicker, DateRangePicker, Carousel, input 직접 타이핑 날짜 파싱 (readOnly 우선)

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | 폼에 DatePicker가 있다 | input 클릭 또는 ArrowDown | dialog 열림, calendar grid 포커스 | |
| S2 | dialog 열림, grid 포커스 | 화살표 탐색 후 Enter | 날짜 선택, dialog 닫힘, input에 날짜 표시, 포커스 input 복귀 | |
| S3 | dialog 열림 | Escape | dialog 닫힘, 선택 변경 없음, input 포커스 복귀 | |
| S4 | dialog 열림, 월 경계 날짜 | 화살표로 월 넘어감 | 자동 월 전환, 포커스 유지 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `ui/CalendarGrid.tsx` | calendarGrid pattern 기반 ui/ 완성품. AriaComponentProps 준수. 6x7 grid, 화살표 네비게이션 | |
| `ui/DatePicker.tsx` | 조합 완성품. readOnly input + dialog + CalendarGrid. useEngine + useAriaZone 내부 사용 | |
| `ui/DatePicker.module.css` | DatePicker 전용 스타일 | |
| `ui/CalendarGrid.module.css` | CalendarGrid 전용 스타일 | |
| `pattern/examples/DatePickerCombobox.tsx` 수정 | primitives 직접 사용 → DatePicker ui/ 소비로 교체 | |
| showcase 등록 | DatePicker showcase 등록 | |

> 구조: DatePicker = input(plain) + dialog(focus trap) + CalendarGrid(useAriaZone) + useEngine(공유 store)
> Props: DatePicker — value, onChange, aria-label. CalendarGrid — AriaComponentProps 확장(data, onActivate, onFocusChange)
> Non-Goals: min/max date 제한 (후속 enhancement)

완성도: 🟢

## ③ 인터페이스

### Zone 1: Input (dialog 닫힌 상태)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| ↓ ArrowDown | input 포커스 | dialog 열림, grid 포커스 | APG combobox: ArrowDown = popup 열기 | dialog 열림 | |
| Click input | input 포커스 | dialog 열림 | 마우스 기본 진입점 | dialog 열림 | |
| Click trigger | dialog 닫힘 | dialog 토글 | 시각적 affordance | dialog 열림/닫힘 | |
| Tab | input 포커스 | 다음 폼 필드 | 네이티브 tab order | 포커스 해제 | |
| Escape | input 포커스 | N/A | 폼 맥락에서 값 클리어는 위험, X 버튼이 안전 | 변경 없음 | |
| ↑←→/Enter/Space | input 포커스 | N/A | readOnly input | 변경 없음 | |

### Zone 2: Dialog (열린 상태)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| ←→↑↓ | grid 포커스 | 이전/다음 일/주 | calendarGrid: 7열 flat grid | 포커스 이동, 월 경계 시 자동 전환 | |
| Enter | grid 포커스 | 선택 + dialog 닫기 + input 갱신 | APG: Enter = activate | dialog 닫힘, input 포커스 | |
| Space | grid 포커스 | 선택 (dialog 유지) | APG: Space = select | 선택 표시, dialog 유지 | |
| Escape | dialog 열림 | dialog 닫기, 선택 변경 없음 | APG: Escape = 취소 | dialog 닫힘, input 포커스 | |
| Home/End | grid 포커스 | 주의 첫째/마지막 날 | calendarGrid: Home/End = 행 시작/끝 | 포커스 이동 | |
| PageUp/Down | grid 포커스 | 이전/다음 월 같은 일자 | APG: 월 단위 이동 | 월 전환 | |
| Shift+PageUp/Down | grid 포커스 | 이전/다음 년 같은 일자 | APG: 년 단위 이동 | 년 전환 | |
| Tab | dialog 열림 | nav→grid→action 순환 | dialog focus trap | 포커스 순환 | |
| Click 날짜 셀 | dialog 열림 | 선택 + dialog 닫기 | 마우스 직접 선택 = Enter 동일 | dialog 닫힘 | |
| Click Cancel | dialog 열림 | dialog 닫기, 변경 없음 | 명시적 취소 | dialog 닫힘 | |
| Click OK | dialog 열림 | 포커스 날짜 선택 + dialog 닫기 | 명시적 확인 | dialog 닫힘 | |
| Click nav 버튼 | dialog 열림 | 월/년 이동 | nav 컨트롤 | 월/년 전환 | |

### 이벤트 버블링

| 상황 | 처리 |
|------|------|
| grid ←→↑↓ | calendarGrid preventDefault → dialog 안 받음 |
| grid Escape | calendarGrid 미사용 → dialog handler 닫기 |
| grid PageUp/Down | calendarGrid 미포함 → dialog onKeyDown fallback 월 이동 |
| grid Tab | calendarGrid 미사용 → dialog focus trap 순환 |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| E1: 1월 1일 ← | 1월 첫 주 일요일 | 월 경계 연속 이동 | 12월 전환, 이전 날짜 포커스 | 12월, year-1 | |
| E2: 12월 31일 → | 12월 마지막 날 | 역방향 동일 | 1월 전환, 다음 날짜 포커스 | 1월, year+1 | |
| E3: value=null 열기 | 미선택 | 오늘 기준 시작이 직관적 | 오늘 포커스, 현재 월 | 오늘 포커스 | |
| E4: 1월31일 PageDown | 31일 포커스 | 2월31일 없음 → 마지막 날 클램프 | 2월 28/29일 포커스 | 2월 grid | |
| E5: 외부 클릭 | dialog 열림 | modal이지만 외부 클릭 닫기가 보편적 | dialog 닫힘, 변경 없음 | dialog 닫힘 | |
| E6: Tab focus trap | OK 포커스 | focus trap: 밖 나가면 접근성 위반 | 첫 nav 버튼 순환 | nav 포커스 | |
| E7: Shift+Tab 역순환 | 첫 nav 포커스 | 역방향 focus trap | OK 버튼 순환 | OK 포커스 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | os 기반 개발 (CLAUDE.md) | ② useEngine+useAriaZone | 비위반 — ui/ 레이어 | — | |
| 2 | 1 pattern = 1 store (feedback) | ② 내부 구조 | 비위반 — CalendarGrid=1p1s, DatePicker=ui조합 | — | |
| 3 | Slot=render function (feedback) | ② dialog 콘텐츠 | 비위반 — plain HTML container | — | |
| 4 | Pattern=identity (feedback) | ② CalendarGrid | 비위반 — calendarGrid 고정 | — | |
| 5 | 포커스=결과 (feedback) | ③ dialog 포커스 | 비위반 — 선택/오늘 날짜에 포커스 | — | |
| 6 | 가역적 동선 (feedback) | ③ 열기/닫기 | 비위반 — ArrowDown↔Escape 대칭 | — | |
| 7 | 중첩 버블링 가드 (feedback) | ③ 버블링 | 비위반 — preventDefault 체인 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | DatePickerCombobox.tsx 전면 교체 | 기존 334줄→수십 줄, 테스트 깨짐 | 중 | 테스트 함께 교체 | |
| 2 | showcaseFixtures.ts | DatePicker 등록 추가 | 낮 | 추가만 | |
| 3 | dialog focus trap | 기존 유틸 없음 → 신규 구현 | 중 | DatePicker 내부 minimal 구현 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | DatePicker 내부에서 Aria Part 직접 사용 | ⑤-3 | dialog 콘텐츠는 plain HTML + CalendarGrid ui/ | |
| 2 | calendarGrid pattern 수정 | ⑤-4 | pattern identity 유지 | |
| 3 | example에서 useEngine/useAriaZone 직접 사용 | ⑤-1 | `<DatePicker />` 한 줄만 | |
| 4 | store에 ReactNode 저장 | ⑤-3 | 순수 날짜 데이터만 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | S1 | ArrowDown으로 dialog 열기 | dialog 표시, grid 포커스, 오늘/선택 날짜 | |
| V2 | S2 | 화살표 탐색 후 Enter | 선택, dialog 닫힘, input 갱신, input 포커스 | |
| V3 | S3 | Escape로 닫기 | dialog 닫힘, 값 변경 없음, input 포커스 | |
| V4 | S4 | 월 경계 넘기 | 자동 월/년 전환, 포커스 유지 | |
| V5 | E4 | 1월31일 PageDown | 2월 28/29일 클램프 | |
| V6 | E5 | 외부 클릭 | dialog 닫힘, 값 변경 없음 | |
| V7 | E6 | Tab focus trap 순환 | OK→첫 nav 순환, 밖 안 나감 | |
| V8 | ③ | 날짜 셀 클릭 | 선택 + dialog 닫힘 | |
| V9 | ③ | PageUp/Down 월 이동 | 월 전환, 같은 일자 (없으면 클램프) | |
| V10 | ③ | Space 선택 | 선택 표시, dialog 안 닫힘 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
