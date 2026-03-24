# cellEdit Plugin — PRD

> Discussion: DataTable 셀 편집 UX를 Google Sheets 2모드 모델에 맞추기 (Mod+X 셀 cut, Delete 셀 클리어, Enter confirm→아래 이동)

## ① 동기

### WHY

- **Impact**: DataTable(i18n 번역 테이블 등)에서 Mod+C/V만 셀 특화, Mod+X/Delete/Enter는 행 단위로 동작 → 스프레드시트 멘탈 모델과 충돌하여 사용자가 의도치 않게 행을 삭제하거나 편집 흐름이 끊김
- **Forces**: edit 축은 "노드(행) CRUD" 설계, 셀 값 조작 개념이 후발 추가됨. Grid.tsx가 cellClipboardKeyMap을 소유하여 plugin-owns-keymap 원칙 위반
- **Decision**: 독립 cellEdit plugin 신규 생성. 기각 대안: (A) edit 축 내부 분기 → if 오염, (B) Page keyMap override → 복붙+누락 버그
- **Non-Goals**: 행 단위 CRUD 변경 없음(edit 축 그대로), 새로운 rename UI 만들지 않음(기존 AriaEditable 활용), 수식/함수 편집 미지원

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | Grid 셀 모드, 셀에 "hello" | Mod+X | 셀 값 "hello"가 클립보드에 복사되고 셀 값이 빈 문자열로 클리어됨 | |
| S2 | Grid 셀 모드, S1 후 다른 셀 포커스 | Mod+V | 대상 셀에 "hello" 붙여넣기 | |
| S3 | Grid 셀 모드, 셀에 "hello" | Delete | 셀 값이 빈 문자열로 클리어됨 (행 삭제 아님) | |
| S4 | Grid 편집 모드, 셀 값 수정 중 | Enter | 값 confirm + 포커스가 아래 행 같은 열로 이동 | |
| S5 | Grid 편집 모드, 셀 값 수정 중 | Shift+Enter | 값 confirm + 포커스가 위 행 같은 열로 이동 | |
| S5a | Grid 셀 모드 | Enter | 포커스가 아래 행으로 이동 (편집 진입 아님 — Sheets 표준) | |
| S5b | Grid 셀 모드 | Shift+Enter | 포커스가 위 행으로 이동 | |
| S6 | S1 후 | Mod+Z | 셀 값 "hello" 복원 (undo) | |
| S7 | S3 후 | Mod+Z | 셀 값 "hello" 복원 (undo) | |

완성도: 🟢 — AI 초안, 사용자 확인 필요

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `plugins/cellEdit.ts` | cellEdit plugin: keyMap(Delete→clearCell, Mod+X→cutCell, Mod+C→copyCell, Mod+V→pasteCell, Enter→focusNext, Shift+Enter→focusPrev) + commands(cutCellValue, clearCellValue) | |
| `clipboard.ts` 확장 | cutCellValue command 추가 — copyCellValue + clearCellValue 조합. cellValueBuffer 공유 | |
| `AriaEditable` `enterContinue` prop | Enter confirm 후 아래 행 이동 (셀 모드 복귀, auto-rename 없음). Shift+Enter=위 행. 기존 `tabContinue` 패턴과 동일 구조 | |
| `Grid.tsx` 정리 | cellClipboardKeyMap 제거 → cellEdit plugin의 keyMap으로 이전. `enableEditing` 시 cellEdit plugin 자동 포함 | |

완성도: 🟢

## ③ 인터페이스

> Google Sheets 2모드: 셀 모드(RENAME_ID.active=false) vs 편집 모드(RENAME_ID.active=true)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| Delete | 셀 모드 | clearCellValue(focused, colIndex) | 셀 모드 Delete=값 클리어가 스프레드시트 표준. 행 삭제는 edit 축이 shadow됨 | 셀 값 → "" | |
| Delete | 편집 모드 | 글자 삭제 (input 기본) | contentEditable가 키를 먼저 잡으므로 keyMap에 도달하지 않음 | 커서 우측 글자 삭제 | |
| Mod+X | 셀 모드 | cutCellValue(focused, colIndex) | Mod+C/V가 이미 셀 특화. X만 행 단위면 불일치 | 셀 값 → clipboard + 셀 값 → "" | |
| Mod+X | 편집 모드 | 선택 텍스트 잘라내기 (input 기본) | contentEditable가 키를 먼저 잡음 | 선택 영역 잘라내기 | |
| Mod+C | 셀 모드 | copyCellValue(focused, colIndex) | 기존 동작 유지, Grid.tsx에서 cellEdit plugin으로 이전 | 셀 값 → clipboard | |
| Mod+V | 셀 모드 | pasteCellValue(focused, colIndex) | 기존 동작 유지, Grid.tsx에서 cellEdit plugin으로 이전 | clipboard → 셀 값 | |
| Enter | 셀 모드 | focusNext(아래 행) | Sheets 표준: 셀 모드 Enter=아래 이동. 편집 진입은 F2/타이핑/더블클릭. cellEdit이 edit 축 Enter를 shadow | 아래 행 같은 열, 셀 모드 | |
| Shift+Enter | 셀 모드 | focusPrev(위 행) | Enter의 역방향. 가역적 동선 원칙 | 위 행 같은 열, 셀 모드 | |
| Enter | 편집 모드 | confirm + focusNext(아래 행) | AriaEditable enterContinue prop. tabContinue 패턴과 동일: synthetic ArrowDown. auto-rename 없음 (Sheets 표준) | 아래 행 같은 열, 셀 모드 | |
| Shift+Enter | 편집 모드 | confirm + focusPrev(위 행) | Enter의 역방향. synthetic ArrowUp | 위 행 같은 열, 셀 모드 | |
| Escape | 편집 모드 | cancelRename — 값 복원 | 기존 동작 유지 | 셀 모드, 원래 값 | |
| Tab | 편집 모드 | confirm + 오른쪽 셀 + startRename | 기존 tabContinue 동작 유지 | 오른쪽 셀, 편집 모드 | |
| F2 | 셀 모드 | startRename(focused) | edit 축 그대로 | 편집 모드 진입 | |
| ↑↓←→ | 셀 모드 | 셀 이동 | navigate 축 그대로 | N/A — 기존 동작 | |
| ↑↓←→ | 편집 모드 | 커서 이동 (input 기본) | contentEditable가 키를 먼저 잡음 | N/A — 기존 동작 | |
| Space | 셀 모드 | N/A | Grid에서 Space에 바인딩된 동작 없음 | N/A | |
| Home/End | 셀 모드 | 첫/마지막 열 이동 | navigate 축 그대로 | N/A — 기존 동작 | |
| 클릭 | 셀 모드 | 해당 행 포커스 + 열 포커스 | 기존 동작 유지 | N/A | |
| 더블클릭 | 셀 모드 | startRename | AriaEditable 기존 더블클릭 핸들러 | 편집 모드 진입 | |
| 타이핑 (printable) | 셀 모드 | replace 모드 편집 진입 | replaceEditPlugin 기존 동작 — 첫 글자가 값을 대체 | 편집 모드, replace | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 마지막 행에서 Enter confirm | 편집 모드, 마지막 행 | focusNext가 같은 노드 반환 = 마지막임을 의미. 아래로 갈 곳 없음 | confirm만 수행, 셀 모드로 복귀 (이동 없음) | 셀 모드, 같은 셀 | |
| 첫 행에서 Shift+Enter confirm | 편집 모드, 첫 행 | focusPrev가 같은 노드 반환 | confirm만 수행, 셀 모드로 복귀 | 셀 모드, 같은 셀 | |
| 빈 셀에서 Delete | 셀 모드, 값 "" | 이미 빈 값 → 클리어할 것 없음 | no-op (store 변경 없음) | 그대로 | |
| Mod+X 후 Mod+Z | 셀 모드 | cut은 copy+clear 조합이므로 undo는 clear만 되돌림 | 셀 값 복원 | 원래 값 | |
| 편집 중 Mod+X | 편집 모드 | contentEditable가 잡으므로 cellEdit keyMap 미도달 | 브라우저 기본 cut (선택 텍스트) | input 상태 유지 | |
| cellEdit 없는 Grid (edit만) | edit: true, cellEdit 미설정 | cellEdit은 선택적. 기존 Grid는 행 단위 동작 유지 | Delete=행 삭제, Enter=rename (기존 그대로) | 기존 동작 | |
| IME 조합 중 Enter | 편집 모드, composing=true | 한글 등 IME 입력 중 Enter는 조합 완성이지 confirm이 아님 | Enter 무시 (기존 composingRef 가드) | 편집 모드 유지 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | Plugin은 keyMap까지 소유 (feedback_plugin_owns_keymap) | ② cellEdit plugin이 keyMap 소유 | ✅ 준수 — Grid.tsx cellClipboardKeyMap을 plugin으로 이전 | — | |
| 2 | 가역적 동선 (feedback_reversible_motion) | ③ Enter→아래, Shift+Enter→위 | ✅ 준수 — 양방향 이동 보장 | — | |
| 3 | 계산은 unit, 인터랙션은 통합 (feedback_test_strategy) | ⑧ 검증 | ✅ — clearCellValue/cutCellValue는 unit, 키보드 흐름은 통합 | — | |
| 4 | mock 호출 검증 금지 (CLAUDE.md) | ⑧ 검증 | ✅ — DOM/ARIA 상태로 검증 | — | |
| 5 | 파일명 = 주 export 식별자 (feedback_filename_equals_export) | ② cellEdit.ts → export function cellEdit | ✅ 준수 | — | |
| 6 | 설계 원칙 > 사용자 요구 (feedback_design_over_request) | ③ cellEdit이 edit 축 Enter/Delete를 shadow | ✅ — cellEdit은 edit과 다른 설계(셀 vs 노드). shadow는 의도적 대체이지 우회가 아님. edit 축 자체는 미수정 | — | |
| 7 | 이벤트 버블링 가드 (feedback_nested_event_bubbling) | ③ 편집 모드 키 이벤트 | ✅ — contentEditable가 키를 잡으므로 keyMap 미도달, 자연 격리 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | `Grid.tsx` cellClipboardKeyMap 제거 | Grid.tsx를 사용하는 모든 곳이 cellEdit plugin 필요 | 중 | Grid.tsx가 enableEditing일 때 자동으로 cellEdit plugin 포함 → 외부 변경 없음 | |
| 2 | edit 축 Delete, Enter가 cellEdit에 의해 shadow | cellEdit 활성 Grid에서 Delete=행 삭제, Enter=편집 진입 불가 | 중 | Delete→셀 클리어, Enter→아래 이동이 Sheets 표준. 편집 진입은 F2/타이핑/더블클릭으로 대체. 행 삭제는 이 PRD scope 밖 (별도 context menu/행 선택 작업) | |
| 3 | clipboard.ts에 cutCellValue/clearCellValue command 추가 | clipboard plugin 비대화 | 낮 | copyCellValue/pasteCellValue와 같은 패턴, 자연스러운 확장 | |
| 4 | AriaEditable에 enterContinue prop 추가 | 기존 AriaEditable 사용처에 영향 없음 (prop 미전달 시 기존 동작) | 낮 | 기본값 false — opt-in | |
| 5 | 기존 clipboard-overwrite 테스트 | 백로그 #33: Enter keyMap 추가로 1개 실패 상태 | 중 | 이 작업에서 함께 해결 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | edit 축 코드 수정 | ⑤#6 설계 원칙 존중 | cellEdit은 독립 plugin, edit.ts는 건드리지 않는다 | |
| 2 | cellEdit을 Grid.tsx 내부에 하드코딩 | ⑤#1 plugin-owns-keymap | plugin으로 분리해야 다른 Grid 사용처에서도 재사용 가능 | |
| 3 | cellValueBuffer를 cellEdit에 복제 | ⑥#3 clipboard 단일 소스 | clipboard.ts의 buffer를 공유해야 cut→paste 연동 | |
| 4 | rename.ts 구조 변경 | ⑥#4 | enterContinue는 AriaEditable(UI) 레벨 — rename command 자체는 그대로 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 동기 | Grid 셀 모드에서 Mod+X → 셀 값이 클립보드에 복사되고 셀이 빈 문자열 | cellValueBuffer에 원래 값, DOM 셀 텍스트 "" | |
| V2 | S2 동기 | Mod+X 후 다른 셀에서 Mod+V → 대상 셀에 값 붙여넣기 | DOM 셀 텍스트 = 원래 값 | |
| V3 | S3 동기 | Grid 셀 모드에서 Delete → 셀 값 클리어, 행은 그대로 | 행 수 변화 없음, 셀 텍스트 "" | |
| V4 | S4 동기 | 편집 모드에서 Enter → confirm + 아래 행 같은 열로 이동 | aria-rowindex 증가, 셀 모드 (편집 종료) | |
| V5 | S5 동기 | 편집 모드에서 Shift+Enter → confirm + 위 행 같은 열로 이동 | aria-rowindex 감소, 셀 모드 (편집 종료) | |
| V6 | S6 동기 | Mod+X 후 Mod+Z → 셀 값 복원 | DOM 셀 텍스트 = 원래 값 | |
| V7 | S7 동기 | Delete 후 Mod+Z → 셀 값 복원 | DOM 셀 텍스트 = 원래 값 | |
| V8 | 경계#1 | 마지막 행에서 Enter confirm → 이동 없음 | aria-rowindex 변화 없음, 셀 모드 | |
| V9 | 경계#3 | 빈 셀에서 Delete → no-op | store 변경 없음 | |
| V10 | 경계#6 | cellEdit 없는 Grid에서 Delete → 행 삭제 | 행 수 감소 (기존 동작) | |
| V11 | 경계#7 | IME 조합 중 Enter → 조합 계속 | 편집 모드 유지, 값 confirm 안 됨 | |
| V12 | S5a 동기 | 셀 모드에서 Enter → 아래 행 같은 열로 이동 (편집 진입 아님) | aria-rowindex 증가, 셀 모드 유지 | |
| V13a | S5b 동기 | 셀 모드에서 Shift+Enter → 위 행 같은 열로 이동 | aria-rowindex 감소, 셀 모드 유지 | |
| V13 | ⑥#5 | clipboard-overwrite 기존 테스트 통과 확인 | 기존 테스트 green | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8 — 교차 검증 통과
