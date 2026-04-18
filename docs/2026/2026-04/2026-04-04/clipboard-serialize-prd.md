---
id: 2-areas/store/prds/clipboard-serialize-prd
type: prd
slug: clipboardSerialize
title: 'Clipboard Serialize/Deserialize — PRD'
tags: [untagged]
created: 2026-04-04
updated: 2026-04-08
summary: 'Discussion: clipboard plugin에 serialize/deserialize 옵션을 추가하여 시스템 클립보드 양방향 통합. Writer는 MD 직렬화 주입.'
legacy:
  status: active
  kind: prd
  topics: [2-areas]
  relates: []
  supersedes: []
---
# Clipboard Serialize/Deserialize — PRD

> Discussion: clipboard plugin에 serialize/deserialize 옵션을 추가하여 시스템 클립보드 양방향 통합. Writer는 MD 직렬화 주입.

## ① 동기

### WHY

- **Impact**: Writer에서 Cmd+C/V가 시스템 클립보드와 소통하지 않아, 외부 텍스트 붙여넣기 불가 + 복사한 내용을 다른 앱에 붙여넣기 불가. 편집기로서 기본 기대치 미충족.
- **Forces**: clipboard plugin은 범용(CMS, TreeGrid 등 공유) — 도메인별 직렬화(MD, JSON 등)를 plugin 내부에 넣을 수 없음. 동시에 useAriaView는 native event를 받지만 직렬화 방법을 모름.
- **Decision**: plugin에 `serialize`/`deserialize` 옵션 주입 + getCutSourceIds 패턴의 side-channel로 primitives 레이어와 소통. 기각: (A) useAriaView에 직렬화 직접 구현 → plugin 경계 위반, (B) Writer 별도 event listener → 이중 처리 충돌.
- **Non-Goals**: HTML→MD 변환(turndown 등)은 이번 범위 밖. text/plain만 지원. rich paste는 후속 PRD.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | Writer에서 heading+paragraph 3개 선택 | Cmd+C → 외부 에디터에서 Cmd+V | 시스템 클립보드에 MD 텍스트가 있고 외부 에디터에 붙여짐 | ✅ clipboard.ts::getSerializedText, useAriaView.ts::handleClipboardEvent |
| S2 | 외부 에디터에서 MD 텍스트 복사 | Writer에서 Cmd+V | MD가 파싱되어 tree에 노드로 삽입 | ✅ clipboard.ts::setExternalClipboard, useAriaView.ts::handleClipboardEvent |
| S3 | Writer 내부에서 노드 copy | 같은 Writer에서 paste | 내부 buffer 사용 (기존 동작 유지, 메타데이터 보존) | ✅ clipboard.ts::clipboardCommands |
| S4 | Writer 내부에서 노드 copy 후 | 외부에서 다른 텍스트 copy → Writer에서 paste | 외부 텍스트가 deserialize되어 삽입 (내부 buffer 무시) | ✅ clipboard.ts::setExternalClipboard |
| S5 | serialize 미제공 CMS에서 copy | paste | 기존 동작 그대로 (시스템 클립보드 미사용) | ✅ clipboard.ts::clipboard (options optional) |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `clipboard.ts` — serialize/deserialize 옵션 | `ClipboardOptions`에 `serialize`, `deserialize` 추가. copy 시 serialize 호출 → module-level `serializedText` 저장. | ✅ clipboard.ts::ClipboardSerializeFn, ClipboardDeserializeFn, ClipboardOptions |
| `clipboard.ts` — `getSerializedText()` | copy 후 직렬화된 텍스트 반환. useAriaView가 읽어서 clipboardData.setData에 사용. | ✅ clipboard.ts::getSerializedText |
| `clipboard.ts` — `setExternalClipboard(text, deserialize)` | 외부 텍스트 → deserialize → clipboardBuffer에 주입. paste 전 호출. | ✅ clipboard.ts::setExternalClipboard |
| `clipboard.ts` — `entriesToStore(entries)` | ClipboardEntry[] → NormalizedData 변환 헬퍼. serialize에 전달할 데이터 생성. | ✅ clipboard.ts::entriesToStore |
| `useAriaView.ts` — handleClipboardEvent 확장 | copy: dispatch 후 getSerializedText() → event.clipboardData.setData. paste: event.clipboardData.getData() → setExternalClipboard() 호출 후 dispatch. | ✅ useAriaView.ts::useAriaView (handleClipboardEvent 내부) |
| `PageWriter.tsx` — serialize/deserialize 주입 | `clipboard({ serialize: (store) => storeToMd(store), deserialize: (text) => mdToStore(text) })` | ✅ PageWriter.tsx::PageWriter |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| Cmd+C (serialize 있음) | 노드 선택됨 | copy command dispatch → serialize(entriesToStore(buffer), fullStore) → serializedText 저장 | plugin이 serialize 옵션을 갖고 있으므로 copy 후 직렬화 실행 | 내부 buffer + serializedText 모두 채워짐 | ✅ clipboard.ts::clipboardCommands (COPY) |
| Cmd+C 후 useAriaView | command dispatched | getSerializedText() → event.clipboardData.setData('text/plain', text) | handleClipboardEvent가 serialize 결과를 native event에 쓰기 | 시스템 클립보드에 MD 텍스트 | ✅ useAriaView.ts::handleClipboardEvent |
| Cmd+X (serialize 있음) | 노드 선택됨 | cut command dispatch → serialize 동일 | cut도 buffer에 저장하므로 serialize 동일 경로 | 내부 buffer(cut mode) + serializedText + 시스템 클립보드 | ✅ clipboard.ts::clipboardCommands (CUT) |
| Cmd+V (deserialize 있음) | 포커스된 노드 있음 | event.clipboardData.getData('text/plain') → serializedText와 비교 | 같으면 내부 copy의 결과 → buffer 우선. 다르면 외부 텍스트 → deserialize 필요 | — | ✅ useAriaView.ts::handleClipboardEvent |
| Cmd+V 내부 텍스트 일치 | clipboardData == serializedText | 기존 paste command 실행 | 내부 buffer가 정확한 subtree이므로 메타데이터 보존 | 내부 buffer에서 삽입 | ✅ clipboard.ts::clipboardCommands (PASTE) |
| Cmd+V 외부 텍스트 | clipboardData != serializedText | deserialize(text) → buffer 교체 → paste command 실행 | 외부 텍스트는 buffer에 없으므로 deserialize로 변환 후 삽입 | 외부 MD가 tree 노드로 삽입 | ✅ clipboard.ts::setExternalClipboard |
| Cmd+C (serialize 없음) | 노드 선택됨 | 기존 동작 그대로, serializedText = null | serialize 미제공이면 side-channel 비활성 | 내부 buffer만, 시스템 클립보드 미사용 | ✅ clipboard.ts::clipboard (serialize optional) |
| Cmd+V (deserialize 없음) | 포커스된 노드 있음 | 기존 동작 그대로 | deserialize 미제공이면 외부 텍스트 무시 | 내부 buffer에서만 paste | ✅ clipboard.ts::hasDeserialize |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| serialize가 예외 throw | copy 시도 | 직렬화 실패가 내부 clipboard를 망가뜨리면 안 됨 | 내부 buffer는 정상 저장, serializedText = null, 시스템 클립보드 미기록 | 기존 동작 fallback | ✅ clipboard.ts (try-catch in COPY handler) |
| deserialize가 null 반환 | 외부 텍스트 paste | 파싱 불가능한 텍스트(이미지, 바이너리 등) | paste 무시 (기존 buffer도 없으면 no-op) | 변화 없음 | ✅ clipboard.ts::setExternalClipboard (null 체크) |
| 빈 문자열 paste | clipboardData가 '' | 빈 텍스트로 노드를 만들 이유가 없음 | paste 무시 | 변화 없음 | ✅ clipboard.ts::setExternalClipboard (빈 문자열 가드) |
| 편집 모드(Aria.Editable)에서 Cmd+C/V | inline 편집 중 | 편집 중 clipboard는 브라우저 기본 텍스트 선택/붙여넣기여야 함 | isEditableElement 가드로 skip — 기존 동작 유지 | 브라우저 기본 동작 | ✅ useAriaView.ts::handleClipboardEvent (isEditable 가드) |
| serialize 제공 + cellEdit 모드 | 셀 편집 중 Cmd+C | 셀 클립보드는 별도 채널(cellValueBuffer) | serialize는 node-level copy에만 적용, cell copy는 기존 경로 | cellValueBuffer만 업데이트 | ✅ clipboard.ts::clipboardCommands (COPY_CELL 별도) |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 선언=등록, 합성 런타임 불변 (feedback_declarative_ocp) | ② serialize/deserialize 옵션 | 준수 — 옵션 주입은 선언적 등록 | — | ✅ clipboard.ts::ClipboardOptions |
| 2 | UI 컴포넌트만 노출, primitives 직접 사용 금지 (feedback_ui_over_primitives) | ② useAriaView 확장 | 준수 — useAriaView는 primitives 내부, Writer는 TreeGrid(ui/)만 사용 | — | ✅ |
| 3 | 모든 OS 상태는 NormalizedData+Command (feedback_all_state_normalized_command) | ② serializedText module var | 주의 — serializedText는 NormalizedData 외부의 transient state. 하지만 getCutSourceIds와 동일 패턴이고 UI 상태가 아닌 직렬화 캐시이므로 허용 | — | ✅ module-level var, getCutSourceIds 동일 패턴 |
| 4 | Plugin은 keyMap까지 소유 (feedback_axis_pattern_principles) | ③ 인터페이스 | 준수 — clipboard plugin의 키바인딩 변경 없음. Cmd+C/V는 native event 경로 | — | ✅ |
| 5 | 설계 원칙 > 사용자 요구 (feedback_design_over_request) | ② clipboard 범용성 | 준수 — serialize/deserialize는 옵션, 미제공 시 기존 동작 100% 유지 | — | ✅ |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | handleClipboardEvent (useAriaView.ts) | copy 이벤트에서 preventDefault 타이밍 변경 시 기존 동작 깨질 수 있음 | 중 | preventDefault는 기존 위치 유지. setData는 preventDefault 전에 호출 | ✅ useAriaView.ts::handleClipboardEvent |
| 2 | clipboard module-level state | getSerializedText 추가 — 기존 resetClipboard에 serializedText 초기화 필요 | 낮 | resetClipboard에 serializedText = null 추가 | ✅ clipboard.ts::resetClipboard |
| 3 | CMS, ListBox 등 기존 clipboard 사용처 | serialize 미제공이므로 영향 없음 | 없음 | — | ✅ |
| 4 | clipboard-overwrite.test.ts, clipboard-undo.integration.test.tsx | 기존 테스트는 serialize 없는 경로이므로 영향 없음 | 없음 | — | ✅ |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---------------|------|------|-------|
| 1 | clipboard.ts에 Writer/MD 도메인 지식 넣기 | ⑤#5 범용성 | serialize/deserialize는 콜백으로만 주입 | ✅ clipboard.ts에 MD 참조 없음 |
| 2 | isEditableElement일 때 serialize 실행 | ④ 편집모드 경계 | inline 편집 중 clipboard는 브라우저 기본 동작 | ✅ useAriaView.ts (isEditable 가드) |
| 3 | deserialize 실패 시 에러 throw | ④ 예외 경계 | 파싱 실패는 silent fallback (paste 무시) | ✅ clipboard.ts::setExternalClipboard (false 반환) |
| 4 | serializedText를 store/command로 관리 | ⑤#3 transient state | 직렬화 캐시는 OS 상태가 아닌 side-channel | ✅ module-level let 변수 |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 | serialize 제공 + multi-select copy → getSerializedText() 확인 | storeToMd 결과와 일치하는 MD 문자열 반환 | ✅ clipboard-serialize.test.ts::"V1: copy with serialize → getSerializedText returns serialized text" |
| V2 | S2 | deserialize 제공 + 외부 텍스트로 paste → tree 확인 | mdToStore 결과가 tree에 삽입됨 | ✅ clipboard-serialize.test.ts::"V2: setExternalClipboard deserializes text into buffer → paste inserts" |
| V3 | S3 | serialize 제공 + 내부 copy → 같은 세션 paste | 내부 buffer 사용, 기존 동작과 동일 결과 | ✅ clipboard-serialize.test.ts::"V3: internal copy → paste uses buffer" |
| V4 | S4 | 내부 copy 후 외부 텍스트 paste | serializedText와 불일치 → deserialize 경로 | ✅ clipboard-serialize.test.ts::"V4: internal copy then setExternalClipboard → paste uses external" |
| V5 | S5 | serialize 미제공 + copy → paste | 기존 동작 100% 유지, getSerializedText() = null | ✅ clipboard-serialize.test.ts::"V5: copy without serialize → getSerializedText returns null" |
| V6 | ④ serialize 예외 | serialize가 throw → copy 결과 확인 | 내부 buffer 정상, serializedText = null | ✅ clipboard-serialize.test.ts::"V6: serialize throws → getSerializedText returns null, buffer intact" |
| V7 | ④ deserialize null | deserialize가 null 반환 → paste | no-op, tree 변화 없음 | ✅ clipboard-serialize.test.ts::"V7: deserialize returns null → setExternalClipboard returns false" |
| V8 | ④ 빈 문자열 | 빈 clipboardData로 paste | no-op | ✅ clipboard-serialize.test.ts::"V8: empty text → setExternalClipboard returns false" |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
