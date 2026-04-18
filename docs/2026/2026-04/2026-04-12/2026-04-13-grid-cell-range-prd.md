---
id: 2-areas/axis/prds/2026-04-13-grid-cell-range-prd
type: prd
slug: gridCellRange
title: 'Grid 2D Cell Range Selection — PRD'
tags: [untagged]
created: 2026-04-12
updated: 2026-04-12
summary: 'Discussion: i18n 편집기에서 Shift+←/→ 미작동 발견 → grid 축 공통 미구현 확정 → 키보드 4방향 + Shift+Click + Drag로 2D 사각 셀 영역 선택을 grid 축에 주입. clipboard/Delete가 영역에 작동.'
legacy:
  status: active
  kind: prd
  topics: [2-areas]
  relates: []
  supersedes: []
---
# Grid 2D Cell Range Selection — PRD

> Discussion: i18n 편집기에서 Shift+←/→ 미작동 발견 → grid 축 공통 미구현 확정 → 키보드 4방향 + Shift+Click + Drag로 2D 사각 셀 영역 선택을 grid 축에 주입. clipboard/Delete가 영역에 작동.

## ① 동기

### WHY (discuss FRT 이식)

- **Impact**: 사용자(i18n 번역 편집자, 향후 모든 grid 사용처)가 Google Sheets 멘탈 모델대로 Shift+화살표/Shift+Click/드래그로 셀 범위를 선택하려 하지만 grid에 모델 자체가 없어서 입력이 무시된다. row 범위 복사/삭제는 되지만 "B3:D7 영역만 비우기" 같은 자연스러운 2D 조작이 불가능.
- **Forces**: (1) select 축은 "노드 리스트" 추상이라 cell 개념이 없다 — 억지로 2D를 넣으면 listbox/tree 사용자까지 오염. (2) grid 축은 이미 `colIndex` 1개만 소유 — 2D 범위를 자연스럽게 담을 수 있는 유일한 자리. (3) 제약: 기존 listbox/tree/tab 영향 zero, clipboard·history·selectionFollowsFocus 호환, edit mode에서 Shift+Arrow는 텍스트 선택에 위임.
- **Assets**: grid 축 (axis/navigate.ts:40-93), `SELECTION_ANCHOR_ID` 모델 + `extendTo` 로직 (axis/select.ts:13, 174-190), `selectionCommands.selectRange/setAnchor/clearAnchor`, `clipboardCommands.clearCellValue(nodeId, col)` (plugins/clipboard.ts:235-243), `resolveTargetIds` 분기 지점 (plugins/clipboard.ts:49-51), `history.SKIP_META` 필터 (plugins/history.ts:10-18 — 이미 `__grid_col__` skip), `composePattern` clickMap 레이어, `Aria.Cell` 렌더 지점 (primitives/aria.tsx:183-200). 외부: WAI-ARIA APG Grid 패턴, Google Sheets 키보드 동작.
- **Decision**: **grid 축이 cellRange를 소유**한다 — `__cell_range__` 신규 메타 엔티티 `{anchor:{r,c}, focus:{r,c}}`. 기각 대안 A) select 축을 2D로 확장 → listbox/tree 오염으로 기각. B) 별도 `cellRange` 축 신설 → grid와 cellRange가 rowId/colIdx를 공유해야 하므로 축 분리 이득 없음, 기각. anchor+focus 2점 모델(rect 4점 아님) 채택 — Shift+Click/Drag에서 한 번의 `extendCellTo(r,c)`로 처리 가능, drag backwards 시 min/max 정렬만 하면 됨.
- **Non-Goals**: (1) 비연속 다중 셀 선택(Ctrl+Click으로 여러 rect 추가). Sheets의 2차 기능이고 데이터 모델이 `cells: Rect[]`로 복잡해짐. 단일 rect만 지원. (2) 1행 복사 → N행 paste auto-expand. 별도 PRD. (3) Copy 시 dashed marquee 애니메이션. 시각만, 별도 ticket. (4) 셀 단위 drag & drop(cut-paste). 기존 `dnd` plugin은 row 재정렬 유지.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| 1 | i18n 편집기, B3 셀 focus (cell-mode, colIdx=1) | Shift+→ 3회 | B3:E3 사각 영역이 `aria-selected=true`, anchor=B3, focus=E3 | |
| 2 | B3:E3 선택 상태 | Shift+↓ 2회 | B3:E5 사각 영역으로 확장, anchor=B3 유지, focus=E5 | |
| 3 | B3 focus | Shift+Click F8 | B3:F8 사각 영역, anchor=B3, focus=F8 | |
| 4 | 아무 selection 없음 | B3에서 pointerdown → F8까지 drag → pointerup | B3:F8 사각 영역 확정, anchor=B3, focus=F8 | |
| 5 | B3:D5 선택 상태 | Delete | B3:D5 6셀 전부 빈 문자열, undo 1회로 전체 복구 | |
| 6 | B3:D5 선택 상태 | Cmd+C, 다른 셀 F8 focus, Cmd+V | F8:H10에 값 그대로 paste (1:1) | |
| 7 | B3 focus, cell 편집 중(F2 눌러 edit.active) | Shift+→ | 텍스트 선택이 늘어남, cellRange 변화 없음 | |
| 8 | treegrid row-mode (colIdx=-1) | Shift+↓ | 기존 row range 동작 유지, cellRange 생성 안 됨 | |
| 9 | B3:D5 선택 상태 | → (Shift 없이) | 단일 셀 이동으로 축소, cellRange clear, anchor reset | |
| 10 | B3:E3 선택 상태 (→로 확장) | Shift+← 2회 | B3:C3로 축소 (anchor=B3 유지, focus 역방향 이동) | |
| 11 | focus B3, cellRange 있음 | 해당 row 삭제(crud) | focusRecovery로 focus 이동 + cellRange clear | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `CELL_RANGE_ID` 상수 | `'__cell_range__'` 메타 엔티티 ID, `axis/navigate.ts`에 추가 | |
| `__cell_range__` 엔티티 스키마 | `{ id, anchorRow: string, anchorCol: number, focusRow: string, focusCol: number } \| null` (null=비어있음) | |
| `gridCellRangeCommands` | defineCommands — `setRange(anchor,focus)` / `extendTo(row,col)` / `clearRange()`. 전부 `meta: true` | |
| `gridCtx.cellRange` | ctxFactory가 반환하는 ctx 속성: `{ rect: {r0,c0,r1,c1} \| null, cells: Array<{rowId,col}>, extendCol(dir), extendRow(dir), extendTo(rowId,col), clear() }`. rect는 anchor/focus에서 min/max 정렬 자동 파생 | |
| `anchorCellMiddleware` | grid 축 middleware — standalone `core:focus` (batch 밖) 발동 시 cellRange clear + anchor는 새 focus 셀로 설정. Shift+Arrow batch 안에서는 면제 | |
| grid pattern keyMap 확장 | `Shift+ArrowRight/Left → extendCol`, `Shift+ArrowDown/Up → extendRow`, `Shift+Home/End → extendCol(first/last)`, `Shift+Mod+Home/End → extendTo(first/last cell)` | |
| grid pattern clickKeys 확장 | `Shift+Click → extendCellTo(targetCell)` (기존 `sel.clickKeys` Shift+Click은 row-level이라 grid 한정으로 override) | |
| `cellDragSelect` plugin | `src/interactive-os/plugins/cellDragSelect.ts` 신규. pointerdown(셀) → setAnchor + focus, pointermove(버튼 눌림 + 셀 위) → extendCellTo, pointerup → 해제. dnd plugin은 keyboard-only 유지, cellDragSelect는 pointer-only | |
| `Aria.Cell` `data-in-range` | primitives/aria.tsx의 Aria.Cell에 `isInCellRange(rowId,col)` 계산 + `data-in-range="true"` attr. CSS 선택자용 | |
| `clipboard.resolveCellTargets` | plugins/clipboard.ts — `ctx.cellRange?.cells` 있으면 그것, 없으면 기존 `{focused, colIndex}` 단일 셀로 fallback | |
| `clipboardCommands.clearCellRange(cells)` | `clearCellValue`의 다중 버전. 배열 받아 batch command | |
| `clipboardCommands.copyCellRange(cells)` / `pasteCellRange` | Cut/Copy/Paste 2D. 내부 버퍼는 `{rows: string[][]}` 2D 배열 | |
| `history.SKIP_META`에 `__cell_range__` 추가 | cellRange는 view state, undo 대상 제외 (`__grid_col__`과 동일 취급) | |
| `focusRecovery` 확장 | row 삭제 시 cellRange도 clear하는 middleware 분기 | |
| 테스트: `__tests__/grid-cell-range.integration.test.tsx` | 시나리오 1~11 전체 | |
| 테스트: `__tests__/cell-drag-select.test.tsx` | pointerdown/move/up drag 시나리오 | |
| i18n 편집기 keyMap 문서화 | `PageI18nEditor.tsx`의 `<ul className="page-keys">`에 `Shift+↑↓←→`, `Shift+Click`, `Drag` 행 추가 | |

완성도: 🟢

## ③ 인터페이스

### 키보드

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `Shift+ArrowRight` | cellRange=null, focus=B3 | grid.extendCol('next') | 첫 Shift+Arrow는 anchor가 없으므로 현재 focus(B3)를 anchor로 잡고 한 칸 오른쪽(C3)을 focus로 설정 | cellRange={a:B3,f:C3}, focus=C3, rect=B3:C3 | |
| `Shift+ArrowRight` (연속) | cellRange={a:B3,f:C3} | extendCol('next') | anchor 유지, focus만 한 칸 이동 | cellRange={a:B3,f:D3}, focus=D3, rect=B3:D3 | |
| `Shift+ArrowLeft` | cellRange={a:B3,f:D3} | extendCol('prev') | reversible — focus를 역방향으로 한 칸, anchor는 그대로. rect가 작아짐 | cellRange={a:B3,f:C3}, focus=C3, rect=B3:C3 | |
| `Shift+ArrowDown` | cellRange={a:B3,f:D3} | extendRow('next') | anchor 유지, focus를 다음 row로. 열은 현재 focusCol 유지 | cellRange={a:B3,f:D4}, focus=D4, rect=B3:D4 | |
| `Shift+Home` | cellRange=null, focus=D3 | extendCol('first') | anchor=D3, focus=A3. rect=A3:D3 (첫 열은 cmsI18nTransform의 col 0이 아니라 initialColIndex=1 기준? → initialColIndex가 1이어도 Shift+Home은 진짜 첫 데이터 열(col 1)까지) | cellRange={a:D3,f:A3}, focus=A3 | |
| `Shift+Mod+End` | cellRange=null, focus=B3 | extendTo(lastRow, lastCol) | 데이터 끝(예: Z99)까지 사각 확장 | cellRange={a:B3,f:Z99}, focus=Z99 | |
| `ArrowRight` (Shift 없음) | cellRange={a:B3,f:D3} | focus.next + anchorCellMiddleware | standalone focus → middleware가 cellRange clear, 새 cell이 단일 focus | cellRange=null, focus=E3 | |
| `Delete` | cellRange={a:B3,f:D5} | clearCellRange(cells) | cellRange의 모든 셀을 빈 문자열로 batch update, history 1건 | cells 6개 비움, cellRange 유지 | |
| `Cmd+C` | cellRange={a:B3,f:D5} | copyCellRange(cells) | 2D 배열로 buffer 저장, cellRange 유지 (Sheets는 copy 후에도 selection 유지) | buffer={rows:[[..3..],[..3..]]} | |
| `Cmd+V` | buffer 2x3, focus=F8 | pasteCellRange at focus | F8을 paste anchor로 잡고 2x3 영역에 값 복사. 붙인 영역이 새 cellRange가 됨 | cellRange={a:F8,f:H9} | |
| `F2` / `Enter` | focus=B3, cellRange 무관 | rename:start → edit.active=true | edit 진입. 이후 Shift+Arrow는 텍스트 선택이 되고 cellRange는 건드리지 않음 (keyMap gating) | edit active, cellRange는 이전 상태 유지 | |

### 포인터

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `Click(B3)` | 무관 | focus(B3) + cellRange clear (middleware) | standalone focus는 anchor/range 초기화 | focus=B3, cellRange=null | |
| `Shift+Click(D5)` | focus=B3 | grid.clickKeys["Shift+Click"] → extendCellTo(D5) | 기존 focus=B3를 anchor로, D5를 focus로. `sel.clickKeys`의 row-level Shift+Click을 grid에서 override | cellRange={a:B3,f:D5}, focus=D5 | |
| `pointerdown(B3)` | 무관 | cellDragSelect: focus(B3) + cellRange clear + dragStart | drag 시작은 click과 동일하게 anchor 리셋 | focus=B3, cellRange=null, drag active | |
| `pointermove(D5)` (button down) | drag active, anchor=B3 | cellDragSelect: extendCellTo(D5) | drag 중 매 move마다 focus를 커서 위 셀로, anchor 유지 | cellRange={a:B3,f:D5}, focus=D5 | |
| `pointerup` | drag active | drag end, cellRange/focus 그대로 | drag 종료는 상태를 확정만 | drag inactive, cellRange 유지 | |
| `pointerleave(document)` | drag active | drag end (취소 아님, 마지막 extend 유지) | 창 밖으로 드래그해도 마지막 focus 유지 — Sheets 동작 | drag inactive | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| treegrid row-mode (initialColIdx=-1) | colIdx=-1, cellRange 기능 비활성 | row-mode는 행 단위 선택이 자연스럽고 2D 개념 없음. grid 축 ctx는 `colIdx<0`이면 cellRange ctx를 null로 반환 | Shift+Arrow는 기존 sel 축의 1D row range로 위임, cellRange 미생성 | cellRange=null 유지 | |
| `edit.active === true` | 셀 편집 중 | 편집 중 Shift+Arrow는 브라우저 네이티브 텍스트 선택. grid keyMap이 가로채면 편집 UX 파괴 | grid pattern keyMap 전체가 `if (ctx.edit?.active) return` gating | cellRange 변화 없음 | |
| Shift+Arrow로 첫 열(col 0 = key column) 침범 시도 | i18n에서 col 0는 read-only key | read-only 열은 clipboard write/Delete의 대상이 되면 안 됨. 그러나 **선택** 자체는 허용(복사는 가능). clearCellRange에서 col 0 제외 | Shift+←가 col 1에서 멈춤(cmsI18nTransform 기준)? → 아니오, 선택은 col 0까지 허용. Delete/Paste만 col 0 제외 | cellRange {a:col1, f:col0} 가능, Delete는 col1~만 비움 | |
| Shift+→가 마지막 열 넘어감 | focusCol = lastCol | 경계에서 멈춤 (APG 표준). wrap 금지 | focus/cellRange 변화 없음, 이벤트 consumed | 동일 상태 유지 | |
| Drag 중 스크롤 가장자리 도달 | pointer near edge | auto-scroll은 별도 개선 (Non-Goal에 가깝지만 기본은 있어야). 1차 구현은 scroll 없이, 보이는 영역에 한정 | 보이는 마지막 셀이 focus로 고정 | cellRange up to last visible | |
| 1 셀만 선택 (Click) | focus=B3 | 단일 셀은 cellRange 없는 상태와 의미적으로 같음. rect={a:B3,f:B3}가 아니라 cellRange=null로 유지 | Click은 cellRange clear, Shift+Click/Shift+Arrow 시에만 생성 | cellRange=null | |
| cellRange 존재 중 외부 클릭 (grid 밖) | blur | grid가 포커스를 잃으면 cellRange 유지? Sheets는 유지. 재진입 시 마지막 선택 복원 | blur 시 cellRange 유지, focus만 이동 | cellRange 유지 | |
| row 삭제 (crud delete) — cellRange 안의 row | anchorRow 또는 focusRow가 삭제됨 | 손상된 참조 방지. focusRecovery가 focus 복구할 때 cellRange도 clear | cellRange=null로 리셋 + focus는 fallback 노드 | cellRange=null | |
| undo (Cmd+Z) | 방금 Delete로 6셀 비움 | 6셀 content 복구. cellRange는 history skip이므로 복원 안 됨(Sheets와 동일) | 6셀 값 복구, cellRange 현재 상태 유지 | content 복구 | |
| Shift+Click 시 대상 cell이 다른 treegrid depth | rowIdx 범위 내이면 전부 선택 | visible node 순서 기준 rect. depth 상관 없음 | rect 내 모든 visible row × col 범위 | cellRange 확정 | |
| cellDragSelect vs dnd 충돌 | row drag handle vs 셀 본체 | dnd는 row drag handle(특정 DOM)에만 반응, cellDragSelect는 셀 본체 pointerdown에 반응. 타겟 분리로 충돌 없음 | 각자 독립 작동 | N/A | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 축 SSOT / 패턴 정체성 (feedback_axis_pattern_principles) | ② grid 축이 cellRange 소유 | ✅ 준수 | grid 축이 cell 개념의 SSOT. select 축은 1D 유지 | |
| 2 | OCP — 선언 = 등록, 합성 런타임 불변 (feedback_declarative_ocp, feedback_ocp_not_record_map) | ② gridCellRangeCommands, keyMap | ✅ 준수 | defineCommands 기반, keyMap은 pattern 조립 시 확장. switch/거대 Record 없음. cellDragSelect는 별도 파일 | |
| 3 | 모든 OS 상태 = NormalizedData + Command (feedback_all_state_normalized_command) | ② `__cell_range__` 엔티티, gridCellRangeCommands | ✅ 준수 | useState 없음, 전부 store command. drag 중 임시상태도 엔티티로 | |
| 4 | Click map 선언화 (feedback_click_map_needed) | ③ clickKeys "Shift+Click" | ✅ 준수 | grid pattern의 clickKeys에 선언적으로 추가 | |
| 5 | Focus/Selection/Activation 3개념 분리 (feedback_apg_three_concepts) | ② | ✅ 준수 | focus=active cell, cellRange=selection, activation=F2/Enter로 edit 진입. 별개 축 | |
| 6 | Reversible motion (feedback_reversible_motion) | ③ Shift+ArrowLeft로 축소 | ✅ 준수 | Shift+→ 확장 후 Shift+← 축소 가능. 시나리오 10 | |
| 7 | Auto derivation (feedback_auto_derivation_is_system) | ② rect 자동 파생 | ✅ 준수 | anchor+focus 2점만 저장, rect/cells는 ctx에서 자동 파생 (min/max 정렬) | |
| 8 | Model first (feedback_model_first_state) | ② 엔티티 스키마 먼저 | ✅ 준수 | `{anchor, focus}` 2점 모델 확정이 설계 출발점 | |
| 9 | UI over primitives (feedback_ui_over_primitives) | `Aria.Cell`의 data attribute | ✅ 준수 | pages/i18n은 I18nGrid(ui/)를 쓰고, data-in-range는 primitive 레이어에서만 추가 | |
| 10 | Meta는 core:* commands만 (feedback_meta_is_core_only) | gridCellRangeCommands의 `meta: true` | ⚠️ 주의 | command type prefix를 `core:cell-range-*`로 — axis는 core 영역이므로 OK | |
| 11 | TreeGrid row/cell dual mode (feedback_treegrid_row_cell_mode) | ④ treegrid row-mode 경계 | ✅ 준수 | colIdx=-1에서 cellRange 비활성. 기존 row range(sel 축)로 위임 | |
| 12 | Design over request (feedback_design_over_request) | 전체 | ✅ 준수 | "i18n에서만 고쳐줘"가 아니라 grid 축 공통 수정 | |
| 13 | Expand≠history (feedback_expand_not_history) 유비 | ② `__cell_range__` SKIP_META | ✅ 준수 | view state는 history 제외. SKIP_META에 추가 | |
| 14 | selection follows focus 호환 | ⑥ listbox/tree 영향 | ✅ 준수 | cellRange는 grid pattern에만 주입, select 축 middleware 건드리지 않음 | |
| 15 | 판단 우선순위: 프로젝트 규약 > 표준 (feedback_judgment_priority) | 전체 | ✅ 준수 | APG와 프로젝트 axis 구조 충돌 없음. 프로젝트 feedback(axis SSOT/OCP) 우선 적용 | |

완성도: 🟢

## ⑥ 부작용

| # | 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|---------------|-----------|--------|------|-------|
| 1 | `plugins/clipboard.ts` `resolveTargetIds` | 기존 row-selection paste 경로가 cellRange 분기 추가로 변경됨. 기존 테스트가 깨질 가능성 | High | cellRange가 null이면 이전 동작 100% 유지. 분기는 early return 스타일로. `clipboard-multiselect.integration.test.tsx` 재실행 필수. 추가 cell-range 테스트는 신규 파일로 | |
| 2 | `plugins/history.ts` `SKIP_META` | `__cell_range__` 추가로 undo 스택이 cellRange 변경을 무시 | Low | 의도된 동작(Sheets와 동일). 테스트로 명시 | |
| 3 | `pattern/roles/grid.ts` keyMap | Shift+Arrow가 sel 축의 row-level에서 grid 축의 cell-level로 "격상"됨. 기존 grid 사용자가 row range를 기대했다면 행동 변화 | Medium | grid는 본래 2D가 자연스러움. row-level Shift+Arrow는 listbox 유산. treegrid row-mode에서만 기존 동작 유지(경계 #1). 문서화 필수 | |
| 4 | `pattern/roles/treegrid.ts` | treegrid가 row-mode(-1)↔cell-mode(0+) 전환 시 cellRange 일관성 | Medium | colIdx<0이면 cellRange ctx=null, colIdx=0+이면 cellRange 활성화. 전환 순간 cellRange clear | |
| 5 | `plugins/dnd.ts` | pointerdown 이벤트 경쟁 | Medium | dnd는 row drag handle DOM에만 바인딩, cellDragSelect는 cell 본체. 타겟 분리로 이벤트 독립 | |
| 6 | `plugins/focusRecovery.ts` | row 삭제 시 cellRange dangling reference | Low | focusRecovery에 cellRange clear 분기 추가 | |
| 7 | `primitives/aria.tsx` Aria.Cell | 모든 셀 렌더에 `isInCellRange` 계산 비용 | Low | rect를 ctx에서 1번 계산 후 각 cell 렌더에서 O(1) 비교 | |
| 8 | `__tests__/extended-selection.test.tsx` | 기존 Shift+Arrow row-range 테스트가 listbox 대상이면 영향 없음, grid 대상이면 의미 변경 | Medium | grep 후 grid 대상은 cell-range로 업데이트, listbox는 유지 | |
| 9 | `__tests__/grid-apg.conformance.test.tsx` | APG 표준 준수 테스트가 cell selection 부재로 skip되고 있었을 가능성 | Low | 해당 시나리오 활성화/보강 | |
| 10 | `__tests__/pointer-interaction.test.tsx` | Shift+Click이 이제 2D | Medium | grid 대상은 cell-level 단언으로 수정 | |
| 11 | `PageI18nEditor.tsx` keyMapOverride | `Delete`가 `clipboardCommands.clearCellValue(focused, col)` 단일 셀만 처리. cellRange 무시 | High | `ctx.cellRange?.cells`가 있으면 `clearCellRange(cells)`, 없으면 기존 단일 셀 경로. keyMapOverride 수정 또는 grid pattern에서 기본 Delete 핸들러 제공 | |
| 12 | ax() `interactive: 'cell'`의 시각 상태 | `.selected` 1단계만 존재, range highlight 없음 | Medium | CSS에서 `[data-in-range="true"]` 규칙 추가. `.focused`(cursor, 진한)과 `.in-range`(연한 배경) 구분. accent_budget 원칙 준수: range=neutral bg tint, focus=accent outline | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---------------|------|------|-------|
| 1 | `select` 축에 2D 확장 추가 | ⑤#1, ⑥#3 | listbox/tree/tab이 cell 개념 없이 select 축만 쓴다. 2D 오염되면 전 영역 영향. grid 축 소유로 격리 | |
| 2 | `cellRange` 상태를 `useState`로 컴포넌트 안에 저장 | ⑤#3 | 엔진 우회. NormalizedData+Command로만 | |
| 3 | `rect` 또는 `cells` 배열을 엔티티에 저장 | ⑤#7 | anchor+focus 2점만 저장, 파생은 ctx에서 매번 계산. duplicate state 방지 | |
| 4 | `pages/i18n`에서 pointerdown 이벤트에 `addEventListener` 직접 부착 | CLAUDE.md os 기반 개발 규칙 | KeyMap/clickKeys/cellDragSelect plugin 선언만 | |
| 5 | grid pattern keyMap에 `if (ctx.edit?.active)` 없이 Shift+Arrow 바인딩 | ④ edit mode 경계 | 편집 중 텍스트 선택을 가로채면 UX 파괴 | |
| 6 | Shift+Arrow가 wrap around (마지막 열에서 다음 행으로) | ④ 마지막 열 경계, APG 표준 | APG Grid 표준은 경계 정지. wrap은 Tab의 역할 | |
| 7 | Click(Shift 없음)이 cellRange를 유지 | ④ 단일 셀 시나리오 | Click은 selection reset (Sheets 동작) | |
| 8 | cellRange 변경 command를 `meta: false`로 선언 | ⑤#13, ⑥#2 | history 오염. view state는 meta | |
| 9 | dnd plugin과 cellDragSelect가 같은 DOM 타겟 공유 | ⑥#5 | 이벤트 경쟁 → 예측 불가. dnd=row handle, cellDragSelect=cell 본체 | |
| 10 | treegrid row-mode(colIdx=-1)에서 cellRange 생성 | ④ treegrid 경계, ⑤#11 | row-mode는 2D 의미 없음. grid ctx가 null 반환으로 차단 | |
| 11 | Delete/Paste가 read-only 열(i18n col 0) 쓰기 | ④ read-only 경계 | 데이터 무결성. clearCellRange/pasteCellRange 내부에서 col 0 제외 | |
| 12 | `selectedIds`와 `cellRange`를 동시에 사용하는 UI | ⑥#1 | 두 개념 혼용 시 "뭘 복사하나" 모호. grid는 cellRange 전용, listbox는 selectedIds 전용 | |
| 13 | cellRange를 JSX prop drilling으로 전달 | CLAUDE.md os 규칙 | ctx에서 읽어야 함. Aria.Cell이 ctx 구독 | |
| 14 | 1차 구현에서 auto-scroll/marquee/multi-rect 구현 | ① Non-Goals | 스코프 이탈, 별도 PRD | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| 1 | ①#1 | i18n 편집기에서 B3 focus → Shift+→ 3회 | `[data-in-range="true"]` 셀이 B3,C3,D3,E3. focus=E3 | |
| 2 | ①#2 | B3:E3 상태 → Shift+↓ 2회 | in-range 셀 12개(3행×4열), focus=E5 | |
| 3 | ①#3 | B3 focus → Shift+Click(F8) | rect=B3:F8, 30셀 in-range | |
| 4 | ①#4 | B3 pointerdown → D5로 move → pointerup | rect=B3:D5, drag 중 각 move마다 in-range 업데이트 | |
| 5 | ①#5 | B3:D5 선택 → Delete | 6셀(col 1~3) 빈 문자열, col 0(key)은 유지. undo 1회로 전체 복구 | |
| 6 | ①#6 | B3:D5 copy → F8 focus → paste | F8:H10에 2x3 값, cellRange=F8:H10 | |
| 7 | ①#7, ④edit.active | B3에서 F2 → Shift+→ | 편집 input 안의 텍스트 selection 증가, cellRange 미생성 | |
| 8 | ①#8, ④treegrid | TreeGrid row-mode에서 Shift+↓ | 기존 row range 동작 (extended-selection.test.tsx 패턴), cellRange=null | |
| 9 | ①#9, ④Click | B3:D5 상태 → D3 click | cellRange=null, focus=D3 | |
| 10 | ①#10 reversible | B3:E3 상태 → Shift+← 2회 | rect=B3:C3, focus=C3, anchor=B3 유지 | |
| 11 | ①#11, ④row delete | B3:D5 상태 → row 3 삭제 | cellRange=null, focus=fallback row, 에러 없음 | |
| 12 | ④ 마지막 열 경계 | lastCol focus → Shift+→ | 이벤트 consumed, cellRange/focus 불변 | |
| 13 | ④ col 0 경계 | B3:C3 상태 → Shift+← 2회 | rect=A3:B3 허용(선택은 가능), Delete 시 col 0 제외하고 col 1만 비움 | |
| 14 | ⑥#5 dnd 공존 | row drag handle click → drag | dnd가 작동, cellDragSelect 무반응 | |
| 15 | ⑥#5 dnd 공존 | cell 본체 drag | cellDragSelect 작동, dnd 무반응 | |
| 16 | ⑥#2 history | B3:D5 Delete → Cmd+Z → Cmd+Shift+Z | content undo/redo, cellRange는 undo 대상 아님 | |
| 17 | APG conformance | `grid-apg.conformance.test.tsx` 재실행 | 기존 통과 + Shift+Arrow cell range 신규 통과 | |
| 18 | 리그레션 | `clipboard-multiselect.integration.test.tsx` 재실행 | 전부 통과 (row-level selection 경로 무변화) | |
| 19 | 리그레션 | `extended-selection.test.tsx`, `pointer-interaction.test.tsx` 재실행 | listbox 대상 통과, grid 대상은 cell-level로 수정된 단언 통과 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

**교차 검증**:
- 동기 ↔ 검증: 시나리오 11개 전부 검증 #1~#11로 1:1 매핑 ✅
- 인터페이스 ↔ 산출물: keyMap/clickKeys/cellDragSelect/ctx 모두 ② 산출물에 존재 ✅
- 경계 ↔ 검증: edit/treegrid/last col/col 0/row delete/undo 경계 모두 검증 #7,#8,#11,#12,#13,#16 커버 ✅
- 금지 ↔ 출처: 14개 금지 전부 ④⑤⑥ 출처 명시 ✅
- 원칙 대조 ↔ 전체: meta prefix 주의 1건 외 전부 준수, 수정 없이 설계 유지 ✅

**주요 추측(?) 항목**: 없음. 전부 기존 코드베이스와 APG 표준에서 도출.

#kind/prd #topic/axis
