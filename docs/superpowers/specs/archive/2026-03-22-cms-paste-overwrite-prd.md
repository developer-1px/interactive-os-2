# CMS Paste Overwrite — PRD

> Discussion: CMS paste를 collection(insert) vs slot(overwrite/거부)으로 분기. childRules의 z.array 래핑으로 collection 여부를 Zod 타입에서 읽고, 같은 type이면 .describe() 필드 덮어쓰기, 불일치면 거부.

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | card-A의 text(title:"Hello")를 복사한 상태 | card-B의 text(title:"World")에 포커스 후 Ctrl+V | card-B의 text value가 "Hello"로 교체됨. 노드 id/위치 불변 | |
| M2 | section-A의 card를 복사한 상태 | section-B에 포커스 후 Ctrl+V | card가 section-B의 자식으로 끼워넣기됨 (현행 유지) | |
| M3 | card-A의 text(title)를 복사한 상태 | card-B의 icon에 포커스 후 Ctrl+V | 붙여넣기 거부 (type 불일치: text ≠ icon) | |
| M4 | section을 복사한 상태 | card 내부의 text에 포커스 후 Ctrl+V | section은 card/section을 건너뛰고 ROOT에 insert (현행 유지) | |
| M5 | card 내부의 text(slot 노드)에 포커스 후 Ctrl+X | — | 잘라내기 거부. 부모의 childRule이 non-array(slot)이면 cut 차단 | |
| M6 | card 내부의 text(slot 노드)에 포커스 후 Delete/Backspace | — | 삭제 거부. 같은 판정 — slot 노드는 삭제 불가 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `childRules` 스키마 분기 | collection: `z.array(union)` — section, links, tab-group. slot: `union` 그대로 — card, step, stat, tab-item, tab-panel | `cms-schema.ts::childRules` |
| `CanAcceptFn` 반환 타입 | `boolean` → `'insert' \| 'overwrite' \| false`. clipboard.ts에서 export | `clipboard.ts::CanAcceptResult` |
| `cmsCanAccept` 판정 로직 | `rule instanceof z.ZodArray` → 내부 element로 safeParse → `'insert'`. non-array rule → safeParse 성공 시 `'overwrite'`, 실패 시 `false`. ROOT(!parentData?.type) → `'insert'` | `cms-schema.ts::cmsCanAccept` |
| `findPasteTarget` 반환 확장 | 기존 `{ pasteInto, insertIndex }` → `{ pasteInto, insertIndex, mode: 'insert' \| 'overwrite' }` | `clipboard.ts::findPasteTarget` |
| paste command overwrite 분기 | mode=overwrite일 때: `updateEntityData(store, targetId, editableFields)`. source의 `.describe()` 필드만 추출하여 target에 merge. 새 노드 생성 안 함 | `clipboard.ts::findPasteTarget` (overwrite 분기) |
| cut/delete 차단 | 부모의 childRule이 non-array(slot)인 노드는 cut·delete 거부. `canDelete` 판정을 CMS가 제공, clipboard·crud 플러그인이 사용 | `cms-schema.ts::cmsCanDelete`, `clipboard.ts::CanDeleteFn` |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| Ctrl+C | collection 자식(예: section 내 card)에 포커스 | 복사 | collection 자식은 독립 엔티티, 복사 자유 | 클립보드에 subtree 저장. store 불변 | |
| Ctrl+C | slot 자식(예: card 내 text)에 포커스 | 복사 | slot이어도 값 복사는 구조에 영향 없음 | 클립보드에 subtree 저장. store 불변 | |
| Ctrl+X | collection 자식에 포커스 | 잘라내기 | collection 자식은 삭제 가능한 독립 엔티티 | 클립보드에 저장 + cutSourceIds 설정. store 불변 (paste 시 삭제) | |
| Ctrl+X | slot 자식에 포커스 | 거부 (no-op) | 부모의 childRule이 non-array → 삭제 불가 → cut 불가 | store·클립보드 불변 | |
| Ctrl+V | collection 컨테이너에 포커스, 클립보드에 호환 타입 | insert | canAccept → 'insert'. 부모가 array rule이므로 자식 추가 허용 | 새 노드가 자식으로 삽입 | |
| Ctrl+V | slot 자식에 포커스, 클립보드에 같은 type | overwrite | canAccept → 'overwrite'. 같은 type이므로 값 교체 안전 | target의 .describe() 필드가 source 값으로 교체. id/위치 불변 | |
| Ctrl+V | slot 자식에 포커스, 클립보드에 다른 type | 거부 (no-op) | canAccept → false. type 불일치로 값 교체 불가 | store 불변 | |
| Ctrl+V | cut 모드 클립보드 + overwrite 대상 | insert (collection 대상만 도달 가능) | slot에서 cut 차단 → cut 클립보드에는 collection 자식만 담김 → overwrite 대상에 도달할 일 없음 | 현행 cut-paste insert 동작 유지 | |
| Delete/Backspace | collection 자식에 포커스 | 삭제 | collection 자식은 독립 엔티티, 삭제 허용 | 노드 제거 (현행 유지) | |
| Delete/Backspace | slot 자식에 포커스 | 거부 (no-op) | 부모의 childRule이 non-array → 구조적 자식 → 삭제 불가 | store 불변 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| E1: 복수 선택 copy 후 overwrite 대상에 paste | 클립보드에 [text, text] 2개 | overwrite는 1:1 교체만 의미. 복수→단일은 모호 | 첫 번째 entry만 overwrite. 나머지 무시 | target의 값이 첫 번째 source 값으로 교체 | |
| E2: childRules에 없는 타입의 노드에 paste | 부모가 childRules에 키 없음 (예: badge) | rule 없음 = 자식 불가 = leaf. 현행 동작: false 반환 | canAccept → false, 조상으로 walk-up (현행 유지) | |
| E3: ROOT 레벨 노드에 대한 delete | section에 포커스 후 Delete | ROOT의 childRule은 array(collection) → 삭제 허용 | section 삭제 (현행 유지) | |
| E4: overwrite 시 source에 describe 필드가 없음 | source가 빈 data(type만 있음) | 교체할 값이 없으면 target을 건드릴 이유 없음 | no-op | store 불변 | |
| E5: tab-panel 내 section의 자식에 대한 cut/delete | tab-panel→section→card 구조에서 card 포커스 | section은 collection(array rule) → card는 삭제 가능 | cut/delete 허용 (현행 유지) | |
| E6: Ctrl+D (duplicate) slot 노드 | card 내 text에 포커스 후 Ctrl+D | duplicate = copy+paste. paste가 overwrite → 자기 자신 덮어쓰기 = 실질적 no-op | store 불변 (같은 값으로 교체) | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | paste는 스키마 호환성으로 결정 (feedback_paste_schema_routing) | ② cmsCanAccept | ✅ 준수 | — | |
| P2 | 설계 원칙 > 사용자 요구, engine 우회 금지 (feedback_design_over_request) | ② overwrite 로직 | ✅ 준수 — updateEntityData는 engine 내부 함수, command.execute 안에서 호출 | — | |
| P3 | CMS에서 디자인 변경 불가 (feedback_no_design_in_cms) | ③ overwrite 범위 | ✅ 준수 — .describe() 필드(콘텐츠)만 교체, 구조/레이아웃 불변 | — | |
| P4 | 타입별 분기 금지, 정규화 트리 순회 (feedback_normalization_solves_ui) | ② canDelete 판정 | ⚠️ 주의 — canDelete가 Zod array 판정을 사용하므로 타입별 분기 없음. 단, 이 판정 함수가 CMS 도메인에 위치해야 함 (clipboard 플러그인 안에 CMS 로직 금지) | — | |
| P5 | canAccept 미제공 시 기존 동작 유지 (feedback_paste_schema_routing) | ② CanAcceptFn | ✅ 준수 — canAccept 미제공 시 기존 boolean 경로 유지. 반환 타입 확장은 하위호환 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | `CanAcceptFn` 타입 시그니처 | boolean → union 변경. canAccept를 사용하는 모든 곳에 영향 | 높 | 기존 boolean 반환도 호환되도록 — `boolean \| 'insert' \| 'overwrite'`. true='insert', false=false로 매핑 | |
| S2 | `findPasteTarget` 반환 구조 | mode 필드 추가. paste command 내부에서만 사용하므로 외부 영향 없음 | 낮 | 허용 | |
| S3 | Ctrl+D (duplicate) 동작 변경 | CmsCanvas/CmsSidebar에서 copy→paste 조합. slot 대상이면 자기 덮어쓰기=no-op | 중 | 허용 — 의미상 정확. slot을 복제하는 것 자체가 무의미 | |
| S4 | crud 플러그인 delete | canDelete 판정 추가 필요. 현재 crud는 무조건 삭제 허용 | 높 | crud 플러그인에 canDelete 옵션 추가, CMS에서 주입 | |
| S5 | undo/redo (history) | overwrite는 updateEntityData 사용 → command.execute/undo 안에서 동작 → history 자동 지원 | 낮 | 허용 — 추가 작업 없음 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| F1 | clipboard 플러그인 안에 CMS 타입 분기 넣기 | ⑤ P4 | clipboard는 범용. array/non-array 판정은 canAccept 반환값으로만 전달 | |
| F2 | overwrite 시 type/role 등 구조 필드 교체 | ⑤ P3 | 구조 변경 = 디자인 변경. .describe() 필드(콘텐츠)만 교체 | |
| F3 | CanAcceptFn 기존 boolean 반환 깨기 | ⑥ S1 | 하위호환. true→'insert', false→false로 내부 매핑 | |
| F4 | slot 노드 삭제를 허용하는 코드 경로 | ⑥ S4 | cut/delete/paste 모두 canDelete 판정 통과 필수 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| T1 | ①M1 | copy text(title:"Hello") → paste on text(title:"World") | target value = "Hello", id/위치 불변 | `clipboard-overwrite.test.ts::"overwrites text value when pasting text on text (same type)"` |
| T2 | ①M2 | copy card → paste on section | card가 section 자식으로 insert | `clipboard-overwrite.test.ts::"inserts card into section (collection insert)"` |
| T3 | ①M3 | copy text → paste on icon | no-op (type 불일치) | `clipboard-overwrite.test.ts::"rejects paste when types do not match (text on icon)"` |
| T4 | ①M4 | copy section → paste on card 내 text | section이 ROOT에 insert (walk-up) | `clipboard-overwrite.test.ts::"walks up to ROOT when pasting section on slot child"` |
| T5 | ①M5 | Ctrl+X on slot 노드 (card 내 text) | no-op (cut 거부) | `clipboard-overwrite.test.ts::"blocks cut on slot nodes (non-array parent)"` |
| T6 | ①M6 | Delete on slot 노드 | no-op (delete 거부) | `clipboard-overwrite.test.ts::"blocks delete on slot nodes via canDelete"` |
| T7 | ④E1 | 복수 선택 copy → overwrite 대상에 paste | 첫 번째 entry만 overwrite | `clipboard-overwrite.test.ts::"overwrites with first entry when multiple items copied"` |
| T8 | ④E3 | Delete on ROOT 레벨 section | section 삭제 (collection 자식) | `clipboard-overwrite.test.ts::"allows delete on collection children (ROOT section)"` |
| T9 | ④E6 | Ctrl+D on slot 노드 | no-op (자기 값으로 자기 덮어쓰기) | `clipboard-overwrite.test.ts::"duplicate on slot node is effectively no-op"` |
| T10 | ⑥S1 | canAccept가 boolean 반환하는 기존 코드 | 하위호환 — true='insert' 매핑 | `clipboard-overwrite.test.ts::"supports boolean canAccept for backward compatibility"` |
| T11 | ⑥S5 | overwrite 후 Ctrl+Z | 원래 값으로 복원 | `clipboard-overwrite.test.ts::"undo restores original value after overwrite"` |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
