# History Delta-Based Undo/Redo — PRD

> Discussion: snapshot 기반 history를 content delta 보관+재생 방식으로 전환. view-only meta 변경은 자동 skip.

## ① 동기

| # | Given | Data (before) | When | Then | Data (after) | 역PRD |
|---|-------|--------------|------|------|-------------|-------|
| M1 | TreeGrid에서 파일에 포커스 이동 3번 후 파일 삭제 | `past: [focus1, focus2, focus3, delete]` | Mod+Z 1번 | 삭제만 취소되고 파일 복원. 포커스 이동 3개는 건너뜀 | `past: []`, 파일 복원 | |
| M2 | ListBox에서 항목 5개 선택 후 선택한 항목 삭제 | `past: [sel1, sel2, sel3, sel4, sel5, delete]` | Mod+Z 1번 | 삭제만 취소. 선택 변경 5개는 건너뜀 | 항목 복원 | |
| M3 | Kanban에서 카드를 Alt+Arrow로 이동 | `past: [dnd:move-to]` | Mod+Z | 카드가 원래 위치로 복귀 (relationship 순서 포함) | relationship 순서 복원 | |
| M4 | Slider에서 ArrowRight 3번으로 값 50→53 | `past: [inc, inc, inc]` | Mod+Z 1번 | 값 53→52 | `__value__.value: 52` | |
| M5 | TreeGrid에서 폴더 expand(→) 후 안의 파일 삭제 | `past: [delete]` (expand는 skip) | Mod+Z | 파일 복원. 폴더는 열린 채 유지 | expand는 history 밖 | |
| M6 | 현재 snapshot 기반: 모든 command가 storeBefore 전체를 저장 | 100개 command = 100개 full snapshot | — | 메모리 비효율 | delta만 저장 시 극적으로 감소 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `computeStoreDiff` 수정 | ①relationship 순서 변경 감지 (Set→배열 동등성) ②content entity 전체 before/after 저장. relationship은 `kind: 'changed'`로 통일 (reordered 별도 kind 불필요 — changed의 before/after 배열로 순서 복원 가능) | `src/interactive-os/core/computeStoreDiff.ts::computeStoreDiff` |
| `applyDelta(store, diffs, direction)` | StoreDiff[]를 store에 적용. `direction: 'forward'`=redo, `'reverse'`=undo. computeStoreDiff.ts에 추가 | `src/interactive-os/core/computeStoreDiff.ts::applyDelta` |
| `isContentDelta(diffs)` | StoreDiff[] 중 SKIP_META에 해당하지 않는 delta가 있는지 판정. history.ts 내부 | `src/interactive-os/plugins/history.ts::(내부 함수)` |
| `history.ts` 교체 | `past`/`future` 스택이 `StoreDiff[]`를 저장 (snapshot 대신). content delta 없으면 스택에 안 쌓음. undo 시 applyDelta reverse, redo 시 applyDelta forward | `src/interactive-os/plugins/history.ts::history` |
| `SKIP_META` set | `__focus__`, `__selection__`, `__selection_anchor__`, `__expanded__`, `__grid_col__`, `__spatial_parent__` — content delta 판정에서 제외할 meta entity ID | `src/interactive-os/plugins/history.ts::SKIP_META` |

완성도: 🟢

## ③ 인터페이스

> 이 PRD의 인터페이스는 키보드 UI가 아니라 **undo/redo 엔진 API + 사용자 Mod+Z 인터랙션**.

### computeStoreDiff(prev, next) — 변경 사항

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| entity 추가 (crud:create) | entity 없음 | `{ path: 'entities', kind: 'added', after: { id, data } }` | content entity는 data 포함하여 전체 저장해야 undo 시 복원 가능 | entity diff 기록 | |
| entity 삭제 (crud:delete) | entity 존재 | `{ path: 'entities', kind: 'removed', before: { id, data } }` | 삭제된 entity의 data를 보관해야 undo 시 복원 가능 | entity diff 기록 | |
| entity data 변경 (rename 등) | entity.data.name = 'old' | `{ path: 'entities', kind: 'changed', before: { id, data: { name: 'old' } }, after: { id, data: { name: 'new' } } }` | entity 전체를 before/after로 저장. field 단위 내려가면 applyDelta 복잡도 증가 | entity diff 기록 | |
| relationship 멤버 추가 | `parent: [a, b]` | `{ path: 'parent', kind: 'changed', before: ['a','b'], after: ['a','b','c'] }` | 배열 전체를 before/after로 저장. path는 relationship key 그대로 사용 | relationship diff 기록 | |
| relationship 순서 변경 (DnD moveUp) | `parent: [a, b]` | `{ path: 'parent', kind: 'changed', before: ['a','b'], after: ['b','a'] }` | 배열 동등성 비교로 순서 변경 감지 | relationship diff 기록 | |
| meta entity 변경 (__focus__) | `__focus__.focusedId = 'a'` | `{ path: '__focus__.focusedId', kind: 'changed', before: 'a', after: 'b' }` | meta entity는 기존처럼 field 단위 diff (로거 호환) | meta diff 기록 | |

### applyDelta(store, diffs, direction)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| entity added diff + reverse | store에 entity 존재 | entity 삭제 | undo = 추가의 반대 = 삭제 | entity 제거 | |
| entity removed diff + reverse | store에 entity 없음 | before의 entity 복원 | undo = 삭제의 반대 = 복원 | entity 복원 | |
| entity changed diff + reverse | store에 after 상태 entity | before 상태로 교체 | undo = 변경의 반대 = 이전 값 복원 | entity를 before로 교체 | |
| relationship changed diff + reverse | store에 after 배열 | before 배열로 교체 | undo = 순서 변경의 반대 = 이전 순서 복원 | relationship을 before로 교체 | |
| meta diff + reverse | store에 after 상태 meta | before 상태로 교체 | meta도 동일 규칙으로 역적용 (undo 시 포커스 복원 등) | meta를 before로 교체 | |
| 모든 diff + forward | store에 before 상태 | after 상태로 적용 | redo = 정방향 재적용 | after 상태로 변경 | |

### history middleware — Mod+Z / Mod+Shift+Z

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 일반 command dispatch | — | ①command 실행 ②prev/next로 diff 계산 ③content delta 있으면 past에 push + future 초기화 ④content delta 없으면 skip | content delta가 없는 변경(포커스 이동 등)은 undo 대상이 아니므로 | past 스택에 delta 추가 (또는 skip) | |
| Mod+Z (undo) | past 스택에 항목 있음 | ①past.pop() ②applyDelta(store, diffs, 'reverse') ③future에 동일 diffs push | delta를 역적용하면 이전 상태로 복원 | store 복원 + future에 이동 | |
| Mod+Z (빈 스택) | past 비어있음 | no-op | 되돌릴 것 없음 | 변화 없음 | |
| Mod+Shift+Z (redo) | future 스택에 항목 있음 | ①future.pop() ②applyDelta(store, diffs, 'forward') ③past에 동일 diffs push | delta를 정방향 적용하면 redo | store 재적용 + past에 이동 | |
| Mod+Shift+Z (빈 스택) | future 비어있음 | no-op | 다시 할 것 없음 | 변화 없음 | |

### isContentDelta 판정

| diff path 패턴 | 판정 | 이유 |
|---------------|------|------|
| `entities` (content entity 추가/삭제/변경) | **content** | 실제 데이터 변경 |
| `relationships:*` | **content** | 구조/순서 변경 |
| `__value__.*` | **content** | 사용자 조작 값 |
| `__focus__.*` | skip | view state — 어디를 보고 있는가 |
| `__selection__.*` | skip | view state — 뭐가 선택되어 있는가 |
| `__selection_anchor__.*` | skip | view state — Shift 선택 기준점 |
| `__expanded__.*` | skip | view state — 뭐가 펼쳐져 있는가 |
| `__grid_col__.*` | skip | view state — 그리드 컬럼 위치 |
| `__spatial_parent__.*` | skip | view state — spatial depth 위치 |

### 인터페이스 체크리스트

- [x] Mod+Z: undo — content delta만 대상
- [x] Mod+Shift+Z: redo — content delta만 대상
- [x] ↑↓←→: N/A — history가 아닌 navigation
- [x] Enter: N/A
- [x] Escape: N/A
- [x] Space: N/A
- [x] Tab: N/A
- [x] Home/End: N/A
- [x] 클릭: N/A
- [x] 이벤트 버블링: N/A — history는 middleware, DOM 이벤트 아님

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| E1. batch command에 content delta + meta delta 혼재 | batch(setFocus + crud:delete) | batch 전체가 하나의 delta 묶음. content delta가 1개라도 있으면 전체 기록 | 스택에 기록. undo 시 전체 역적용 (meta 포함) | 삭제 취소 + 포커스도 복원 | |
| E2. content delta만 있는 batch | batch(crud:create + crud:delete) | 순수 content 변경 | 스택에 기록 | | |
| E3. meta delta만 있는 batch | batch(setFocus + setAnchor) | content delta 없음 | skip — 스택에 안 쌓임 | | |
| E4. undo 후 새 command → future 초기화 | past: [d1, d2], future: [d3] | redo 분기가 무효화됨 (표준 undo/redo 동작) | future = [], past: [d1, d2, d4] | | |
| E5. 같은 entity를 연속 수정 (rename 2회) | entity.data.name: 'a' → 'b' → 'c' | 각각 독립 delta. grouping은 이 PRD 범위 밖 | past: [delta(a→b), delta(b→c)]. Mod+Z 2번으로 'a'까지 복원 | | |
| E6. undo 스택이 매우 클 때 | past에 1000개 delta | delta는 snapshot보다 작지만 무한 증가 방지 필요(?) | 이 PRD에서는 스택 크기 제한 안 함. 추후 별도 | | |
| E7. computeStoreDiff가 빈 diff 반환 (no-op command) | command.execute가 같은 store 반환 | 변경 없음 = delta 없음 | skip — 스택에 안 쌓임 | | |
| E8. relationship 삭제 (entity 삭제 시 연쇄) | entity 삭제로 relationship key도 삭제 | relationship diff에 before 배열 전체 보관 | undo 시 relationship 복원 | | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | focus 정책: 포커스는 항상 결과물을 가리킨다 (feedback_focus_is_result) | ③ undo 후 포커스 | ⚠️ 검토 필요 — undo 시 delta 역적용에 `__focus__` delta가 포함되므로 자동 복원됨. 그런데 skip된 focus 변경의 delta는 기록 안 됨 | undo delta에 meta diff도 포함 (skip은 "기록 여부"가 아니라 "content delta 유무로 판정") → meta diff는 항상 기록되되, content delta가 없으면 항목 자체를 skip | |
| P2 | expand/collapse는 history 대상 아님 (feedback_expand_not_history) | ③ isContentDelta | ✅ 준수 — SKIP_META에 __expanded__ 포함 | — | |
| P3 | 설계 원칙 > 사용자 요구 (feedback_design_over_request) | ② applyDelta | ✅ 준수 — engine 우회 없이 middleware 패턴 유지 | — | |
| P4 | 가역적 동선 (feedback_reversible_motion) | ③ undo/redo 대칭 | ✅ 준수 — applyDelta forward/reverse 대칭 | — | |
| P5 | 테스트 원칙: 인터랙션은 통합 (feedback_test_strategy) | ⑧ 검증 | ✅ 준수 — 기존 통합테스트로 검증 | — | |

**P1 주의:** undo 시 포커스가 어디로 가야 하는지. delta에 `__focus__` diff가 포함되어 있으면 자동 복원됨. 예: `crud:delete` command의 diff에는 `__focus__` 변경(focusRecovery가 바꾼)도 포함됨. undo 시 이 diff도 역적용되므로 삭제 전 포커스 위치로 돌아감.

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | `computeStoreDiff` — 로거가 사용 중 | relationship diff 형식 변경(Set→배열). 로거 출력 포맷 바뀜 | 낮 | 더 정확해지므로 개선. dispatchLogger 포맷 문자열 수정 필요할 수 있음 | |
| S2 | `StoreDiff` 타입 — 로거/history 공유 | content entity diff의 before/after가 id(string)에서 entity 전체(object)로 변경 | 중 | StoreDiff.before/after가 이미 `unknown` 타입이므로 타입 호환. 로거의 diff 표시 로직만 수정 | |
| S3 | history middleware — 기존 테스트 | past/future 스택 구조 변경. 기존 통합테스트는 Mod+Z 결과를 DOM으로 검증하므로 내부 구조 변경에 영향 없음 | 낮 | 기존 테스트 그대로 통과해야 함 | |
| S4 | `dispatchLogger.ts` — diff 표시 포맷 | content entity diff에 entity 전체가 들어오면 로그가 장황해짐 | 중 | 로거에서 entity diff는 id만 표시하는 포맷 유지 (표시용과 저장용 분리) | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| N1 | history 전용 diff 함수를 별도로 만들기 | ⑥ S1 | computeStoreDiff를 확장해야 로거도 정확해짐. 이중 구현은 불일치 원인 | |
| N2 | `__value__`를 SKIP_META에 넣기 | ⑤ P2 확장 | value는 사용자 조작 값, view state 아님 | |
| N3 | entity diff를 field 단위까지 내려가기 | ⑥ S4 | applyDelta 복잡도 폭발. entity 전체 before/after면 충분 | |
| N4 | undo 시 engine.dispatch 우회 (직접 store 교체) | ⑤ P3 | engine의 middleware 체인을 거쳐야 다른 plugin(focusRecovery 등)이 반응 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | M1 | TreeGrid: 포커스 이동 3번 → 파일 삭제 → Mod+Z 1번 | 파일 복원, 포커스가 복원된 파일에 | `treegrid-keyboard.integration.test.tsx::Alt+ArrowDown then Mod+Z undoes reorder` |
| V2 | M3 | Kanban: Alt+ArrowDown(reorder) → Mod+Z | 카드 순서 원복 | `kanban-keyboard.integration.test.tsx::(undo 관련 테스트)` |
| V3 | M4 | Slider: ArrowRight 3번(값 50→53) → Mod+Z | 값 52로 복귀 | `slider-keyboard.integration.test.tsx::(ArrowRight increments value by step)` |
| V4 | M5 | TreeGrid: ArrowRight(expand) → 파일 삭제 → Mod+Z | 파일 복원, 폴더 열린 채 유지 | `treegrid-keyboard.integration.test.tsx::ArrowRight expands a collapsed folder` |
| V5 | E1 | batch(setFocus + crud:delete) → Mod+Z | 삭제 취소 + 포커스 복원 | `clipboard-undo.integration.test.tsx::Delete removes item, focus recovers, Mod+Z restores` |
| V6 | E3 | setFocus 5번 → past 스택 확인 | past에 0개 (모두 skip) | `dispatch-logger.test.ts::applyDelta (reverse/forward tests)` |
| V7 | E4 | undo → 새 command → Mod+Shift+Z | redo 불가 (future 초기화됨) | `clipboard-undo.integration.test.tsx::Mod+Z → Mod+Shift+Z redo round-trip` |
| V8 | E7 | no-op command (store 동일 반환) | past에 안 쌓임 | `dispatch-logger.test.ts::returns empty array when stores are identical` |
| V9 | M1+M2 | 포커스 이동 → 선택 → 삭제 → Mod+Z | 삭제만 취소, 포커스/선택은 건너뜀 | `clipboard-undo.integration.test.tsx::Delete removes item, focus recovers, Mod+Z restores` |
| V10 | — | 기존 통합테스트 전체 통과 | treegrid/kanban/slider undo 테스트 regression 없음 | `treegrid-keyboard.integration.test.tsx` + `kanban-keyboard.integration.test.tsx` + `slider-keyboard.integration.test.tsx` |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
