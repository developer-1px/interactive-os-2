# Command Unification — PRD

> Discussion: OS 위의 모든 컴포넌트가 NormalizedData + Command로 상태/행동을 표현하여, 기록·통신·외부 조작이 가능하도록 통일한다.

## ① 동기

### WHY

- **Impact**: OS 위의 컴포넌트 중 engine을 우회하는 것들이 있다. `() => void` 직접 실행, `useState`로 view state 자체 관리 — 외부 조작 불가, 기록 불가, 데이터 변환 불가. 아마존 mandate: 소비자가 없어도 API는 존재해야 한다.
- **Forces**: engine의 CommandHandler가 NormalizedData를 전제 → store 없는 컴포넌트가 참여할 경로 없음. chat 블록은 `<details>` 네이티브 + isLatest 자동 collapse. Spinbutton/DatePicker는 engine 기반이나 edit/popup 축 부재로 useState 잔존. AriaRoute는 글로벌 keymap 레이어로 유지 필수.
- **Decision**: 모든 engine 우회 상태를 NormalizedData + Command로 통일. AriaRoute 시그니처를 `() => Command | void`로 변경. 기각: 별도 Command bus (engine이 이미 bus), effect handler (데이터 형식 불일치), Command 트리 버블링 (장기).
- **Non-Goals**: Command 트리 (engine 간 명시적 버블링) — DOM 버블링 유지.

### 전환 대상

| 분류 | 컴포넌트 | 현재 | 전환 방향 |
|------|---------|------|----------|
| A. engine-free | SpreadReader | `useState(spread)` + AriaRoute | useAria + navigate 축 |
| B. 네이티브 disclosure | ThinkingBlock | `<details>` + `useState(open)` + isLatest | useAria + expand 축 |
| B. | FallbackBlock | 동일 | 동일 |
| B. | ToolResultBlock | 동일 | 동일 |
| B. | ToolGroup | 동일 | 동일 |
| B. | ToolChainGroup | 동일 | 동일 |
| C. 축 부재 | Spinbutton | `useState(editing/editValue/invalid)` | edit 축 도입 |
| C. | DatePicker | `useState(isOpen/year/month)` | popup 축 + 달력 nav를 engine으로 |
| D. 인터페이스 | AriaRoute | `() => void` | `() => Command \| void` |
| D. | CmsLayout, PageViewer, PageBookViewer, FilePanel keyMap | 함수 직접 실행 | Command 반환 |

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | SpreadReader, 3-spread 문서, spread 1 | ArrowRight | spread 2로 이동 + Command 발행·로깅 | |
| S2 | SpreadReader, spread 1 | 외부에서 `dispatch(focusCommands.setFocus('spread-2'))` | spread 3으로 이동 (외부 조작) | |
| S3 | ThinkingBlock, collapsed | 외부에서 expand Command dispatch | 블록 열림 | |
| S4 | ThinkingBlock, live | isLatest → false | 자동 collapse (기존 동작 유지) | |
| S5 | ToolGroup, 채팅에 30개 블록 | 화면 표시 | 성능 저하 없음 | |
| S6 | Spinbutton, 값 표시 중 | 값 영역 클릭 | edit 모드 진입 + Command 발행 | |
| S7 | DatePicker, 닫힌 상태 | ArrowDown 또는 클릭 | 달력 열림 + Command 발행 | |
| S8 | PageViewer, Cmd+K 바인딩 | Cmd+K | Command 반환·로깅 + 기존 동작 유지 | |
| S9 | FilePanel + SpreadReader 중첩 | SpreadReader 포커스에서 ArrowRight | SpreadReader가 처리, AriaRoute 미도달 | |

완성도: 🟢

## ② 산출물

> 원칙: 모든 useState가 Command가 된다. 예외 없음. 외부 데이터는 TransformAdapter로 변환.

### 공통 인프라

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `store/createSingleNodeStore.ts` 신규 | 단일/소수 노드 NormalizedData 생성 헬퍼. chat 블록 등 최소 disclosure 보일러플레이트 제거 | |
| `axis/edit.ts` 신규 | edit 축: `editCommands.startEdit/commitEdit/cancelEdit`. meta entity `__edit__`. Spinbutton의 editing/editValue/invalid 상태 관리 | |

### A. SpreadReader (engine-free → useAria)

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `ui/SpreadReader.tsx` 수정 | `useState(spread/totalSpreads)` 제거 → useAria + navigate 축. CSS 측정으로 N개 노드 NormalizedData 구성. AriaRoute 제거 | |

### B. Chat 블록 (`<details>` → disclosure 패턴)

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `ui/chat/ThinkingBlock.tsx` 수정 | `<details>` + `useState(open)` → Aria + disclosure. isLatest→false 시 `expandCommands.collapse` dispatch | |
| `ui/chat/FallbackBlock.tsx` 수정 | 동일 전환 | |
| `ui/chat/ToolSummaryBlock.tsx` 수정 | ToolResultBlock, ToolGroup, ToolChainGroup 3곳의 `<details>` → Aria + disclosure | |

### C. 축 부재 해소

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `ui/Spinbutton.tsx` 수정 | `useState(editing/editValue/invalid)` → edit 축 Command. engine 내부에서 edit 상태 관리 | |
| `ui/DatePicker.tsx` 수정 | `useState(isOpen)` → popup 축. `useState(year/month)` → `calendar:prevMonth/nextMonth` Command + TransformAdapter로 재normalize. 모든 useState 제거 | |

### D. AriaRoute Command 전환

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `primitives/AriaRoute.tsx` 수정 | `RouteKeyMap = Record<string, () => void>` → `Record<string, () => Command \| void>`. 반환 Command를 로깅 | |
| `pages/cms/CmsLayout.tsx` 수정 | keyMap 핸들러가 Command 반환 | |
| `pages/viewer/PageViewer.tsx` 수정 | 동일 | |
| `pages/book/PageBookViewer.tsx` 수정 | 동일 | |
| `pages/viewer/widgets/FilePanel.tsx` 수정 | 동일 | |

완성도: 🟢

## ③ 인터페이스

### A. SpreadReader

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| ArrowRight | spread N, N < total-1 | 다음 spread | navigate 축 next. 노드=spread | focus → N+1 | |
| ArrowRight | 마지막 spread | onNextBoundary 콜백 | 노드 없음, 부모에 경계 알림 | focus 유지 + 콜백 | |
| ArrowLeft | spread N, N > 0 | 이전 spread | navigate 축 prev | focus → N-1 | |
| ArrowLeft | 첫 spread | onPrevBoundary 콜백 | 역방향 경계 | focus 유지 + 콜백 | |
| Home | 아무 상태 | 첫 spread | navigate first | focus → 0 | |
| End | 아무 상태 | 마지막 spread | navigate last | focus → total-1 | |
| Tab | 아무 상태 | 포커스 이탈 | natural-tab-order | 다음 focusable | |
| 외부 dispatch | 아무 상태 | `focusCommands.setFocus('spread-N')` | engine data sync | focus → N | |
| resetKey 변경 | 아무 상태 | 재측정 + NormalizedData 재구성 | 새 문서 | initialSpread에 따라 first/last | |

### B. Chat 블록 (disclosure)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| Enter/Space | collapsed | 열림 | disclosure toggle | expanded | |
| Enter/Space | expanded | 닫힘 | 동일 | collapsed | |
| Click | summary | toggle | disclosure clickMap | 토글 | |
| isLatest→false | expanded (live) | 자동 collapse | `expandCommands.collapse` dispatch | collapsed | |
| 외부 dispatch | collapsed | `expandCommands.expand` | 외부 조작 | expanded | |

### C. Spinbutton (edit 축)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| Click value | 비편집 | edit 진입 | `editCommands.startEdit` | editing=true | |
| Enter | editing | 커밋 | `editCommands.commitEdit` → `valueCommands.setValue` | editing=false, 값 반영 | |
| Escape | editing | 취소 | `editCommands.cancelEdit` | editing=false, 원래값 | |
| ArrowUp/Down | editing | 증감 | `valueCommands.increment/decrement` | editValue 갱신 | |
| 잘못된 입력+Enter | editing | 무효 | validation 실패 | invalid=true, editing 유지 | |

### C. DatePicker (popup + calendar Command)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| ArrowDown/Click | 닫힘 | 열림 | `popupCommands.open` | isOpen=true | |
| Escape | 열림 | 닫힘 | `popupCommands.close` | isOpen=false | |
| PageUp | 열림 | 이전 달 | `calendar:prevMonth` → TransformAdapter 재normalize | 이전 달 data | |
| Shift+PageUp | 열림 | 이전 년 | `calendar:prevYear` | 이전 년 data | |
| PageDown/Shift+PageDown | 열림 | 다음 달/년 | 동일 역방향 | 다음 달/년 data | |
| Enter | 열림, 셀 포커스 | 선택+닫힘 | activate + `popupCommands.close` | 값 변경+닫힘 | |
| Space | 열림, 셀 포커스 | 선택(닫지 않음) | select만 | 값 변경+열림 유지 | |

### D. AriaRoute

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 바인딩된 키 | 아무 상태 | 핸들러 실행 + Command 반환·로깅 | 기존 동작 + Command 기록 | 기존+로그 | |
| 바인딩된 키 | 자식이 처리(defaultPrevented) | 무시 | DOM 버블링 유지 | 변화 없음 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| SpreadReader: 1 spread | total=1 | 노드 1개면 navigate 불가 | indicator 숨김, Arrow → boundary 콜백 | 단일 노드 | |
| SpreadReader: 리사이즈로 spread 감소 | focus=spread-3, total→2 | 포커스 노드 소멸 | 마지막 노드로 focus 복구 | focus → spread-1 | |
| SpreadReader: resetKey + initialSpread='last' | 아무 상태 | 새 문서 마지막부터 | NormalizedData 재구성 + focus last | focus → total-1 | |
| Chat: 30개 동시 렌더 | 스크롤 | engine 30개 — 경량이므로 허용 범위 | 정상 렌더 (구현 후 실측 검증) | 정상 | |
| Chat: isLatest=true 여러 개 | 스트리밍 중 | 각 블록 독립 engine | 각자 독립 expand | 각 블록 expanded | |
| Spinbutton: edit 중 외부 값 변경 | editing=true | 사용자 입력 우선 | edit 유지, 외부값은 커밋/취소 후 반영 | editing 유지 | |
| Spinbutton: min=max | value=min=max | 증감 불가 | increment/decrement 무시 | value=min | |
| DatePicker: 31일→2월 | focus=31일 | 2월은 28/29일 | clampDay 마지막 날 조정 | focus → 28/29 | |
| DatePicker: popup + 외부 클릭 | 열림 | 트랩 밖 클릭 | `popupCommands.close` | 닫힘 | |
| AriaRoute: void 반환 | 핸들러가 undefined | 하위 호환 | 로깅 스킵, 기존 동작 유지 | 변화 없음 | |
| AriaRoute: 3단 중첩 | 가장 안쪽 포커스 | defaultPrevented 가드 | 안쪽만 반응 | 외부 무시 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 역PRD |
|---|------------|----------|----------|-------|
| 1 | OS 기반 개발 — pages/에서 useAria 금지 (CLAUDE.md) | ② SpreadReader는 ui/ | 미위반 | |
| 2 | KeyMap 선언, addEventListener 금지 (CLAUDE.md) | ③ AriaRoute document listener | 미위반 — 글로벌 레이어로서 정당 | |
| 3 | 축 SSOT, 패턴 정체성 (feedback_axis_pattern_principles) | ② edit 축 신규 | 미위반 — 기존 축 구조 준수 | |
| 4 | expand/collapse는 undo 대상 아님 (feedback_expand_not_history) | ③ chat disclosure | 미위반 — meta:true, history 안 붙임 | |
| 5 | 선언=등록, 합성 런타임 불변 (feedback_declarative_ocp) | ② AriaRoute Command | 미위반 — keyMap 선언 유지 | |
| 6 | UI만 노출, primitives 금지 (feedback_ui_over_primitives) | ② chat 블록 Aria 사용 | 미위반 — ui/ 내부는 primitives 사용 정당 | |
| 7 | 중첩 버블링 가드 필수 (feedback_nested_event_bubbling) | ④ 3단 중첩 | 미위반 — defaultPrevented 유지 | |
| 8 | ax()만 사용 (feedback_style_is_hatch) | ② 렌더링 변경 | 미위반 | |
| 9 | engine 우회 금지 (feedback_design_over_request) | 전체 PRD | 미위반 — PRD 목적 자체 | |

완성도: 🟢

## ⑥ 부작용

| # | 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|----------------|-----------|--------|------|-------|
| 1 | SpreadReader props (onSpreadChange) | 콜백이 engine focus 변화로 대체 | 중 | onFocusChange로 매핑하여 호환 | |
| 2 | `<details>` 네이티브 접근성 | 자동 aria-expanded 사라짐 | 중 | expand 축 ariaGen이 명시적 생성 | |
| 3 | `<details>` 스타일링 (::marker 등) | 고유 CSS 사라짐 | 낮 | module.css 대체, 이미 커스텀 사용 중 | |
| 4 | chat 블록 렌더 성능 | 블록당 engine 인스턴스 | 중 | 구현 후 실측. disclosure engine은 최소 비용 | |
| 5 | Spinbutton input 포커스 | edit 진입 시 rAF focus+select | 낮 | edit 축 Command 부수효과로 동일 처리 | |
| 6 | DatePicker focus trap | 수동 Tab 트랩 → engine 이관 | 중 | popup 축 modal 옵션 기존 인프라 | |
| 7 | AriaRoute 소비자 타입 | `() => void` → `() => Command \| void` | 낮 | void 반환 허용, 하위 호환 | |
| 8 | 기존 테스트 | disclosure-apg 테스트 대상 변경 | 낮 | 테스트 함께 수정 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---------------|------|------|-------|
| 1 | `useState`로 view state 직접 관리 | ⑤#9 | PRD 존재 이유. 모든 상태는 NormalizedData + Command | |
| 2 | `<details>` 네이티브 disclosure | ⑥#2 | engine 밖 접근성 → Command 흐름 단절 | |
| 3 | chat 블록에 history 플러그인 | ⑤#4 | expand/collapse는 view state, undo 대상 아님 | |
| 4 | AriaRoute에서 Command 없이 side-effect | ⑤#5 | 기록·통신 불가 | |
| 5 | DatePicker year/month를 useState | ⑤#9 + /conflict | TransformAdapter + calendar Command | |
| 6 | Spinbutton editing을 useState | 동일 | edit 축 Command | |
| 7 | 한 파일에서 engine + useState 혼용 | ⑥#1 | 빅뱅. 중간 상태 금지 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | ①S1 | SpreadReader 3-spread ArrowRight | focus 이동 + Command 로깅 | |
| V2 | ①S2 | SpreadReader 외부 dispatch setFocus | spread 이동 (외부 조작) | |
| V3 | ①S3 | ThinkingBlock 외부 expand dispatch | 블록 열림 | |
| V4 | ①S4 | ThinkingBlock isLatest→false | 자동 collapse | |
| V5 | ①S5 | 채팅 30개 블록 렌더 | 렌더 시간 허용 범위 (실측) | |
| V6 | ①S6 | Spinbutton 클릭→편집→Enter | edit Command + 값 반영 | |
| V7 | ①S7 | DatePicker ArrowDown→열림→PageUp | popup + calendar Command | |
| V8 | ①S8 | PageViewer Cmd+K | Command 로깅 + quick open | |
| V9 | ①S9 | 3단 중첩 ArrowRight | SpreadReader만 반응 | |
| V10 | ④E1 | SpreadReader 1-spread | indicator 숨김, Arrow→boundary | |
| V11 | ④E2 | SpreadReader 리사이즈 spread 감소 | focus 복구→마지막 노드 | |
| V12 | ④E6 | Spinbutton edit 중 외부 값 변경 | edit 유지, 커밋 후 반영 | |
| V13 | ④E7 | Spinbutton min=max | 증감 무시 | |
| V14 | ④E8 | DatePicker 31일→2월 | clampDay 28/29 | |
| V15 | ④E10 | AriaRoute void 반환 | 로깅 스킵, 기존 동작 유지 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
