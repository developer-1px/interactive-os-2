---
id: 2-areas/store/prds/store-slots-prd
title: 'Store Slots 정규화 — PRD'
created: 2026-03-31
updated: 2026-04-08
summary: 'Discussion: children(array) + slots(named object props) 이원 정규화로 모든 웹 콘텐츠를 예외 없이 표현. 복합 콘텐츠 drill down 지원.'
legacy:
  status: active
  kind: prd
  topics: [2-areas]
  relates: []
  supersedes: []
---
# Store Slots 정규화 — PRD

> Discussion: children(array) + slots(named object props) 이원 정규화로 모든 웹 콘텐츠를 예외 없이 표현. 복합 콘텐츠 drill down 지원.

## ① 동기

### WHY

- **Impact**: quote/value-item/article/showcase-item 등 복합 콘텐츠 노드에서 Enter 시 drill down이 안 되고 rename이 잘못 진입함. 다수 editable fields가 entity.data에 평탄화되어 spatial nav이 leaf로 취급.
- **Forces**: store가 array 관계(relationships)만 정규화. object의 named props는 정규화 대상이 아님. children = array 의미론(CRUD/순서) 유지해야 함.
- **Decision**: NormalizedData에 `slots: Record<parentId, Record<name, childId>>` 추가. DOM(children+attributes) = JSON(array+object) 동형. Enter 핸들러 분기 등 별도 메커니즘(B안)은 정규화 원칙 위반으로 기각.
- **Non-Goals**: 기존 children(array) 의미론 변경. slots에 CRUD(추가/삭제/순서변경) 지원. 기존 card/stat Slot 패턴 변경 (이미 relationships로 동작 중).

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | CMS에서 quote 노드에 포커스 | Enter | quote 내부 필드(text, attribution)로 drill down, 첫 필드에 포커스 | |
| M2 | quote 내부 text 필드에 포커스 | Escape | quote로 복귀 | |
| M3 | value-item 노드에 포커스 | Enter | value-item 내부 필드(icon, title, desc)로 drill down | |
| M4 | text 노드(단일 필드)에 포커스 | Enter | 기존대로 rename 진입 | |
| M5 | 개발자가 새 복합 노드 Zod 스키마 추가 | store 초기화 | editable fields가 자동으로 slots에 정규화 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `store/types.ts` 수정 | `NormalizedData`에 `slots: Record<string, Record<string, string>>` 추가 (parentId → slotName → childId) | |
| `store/createStore.ts` 수정 | `getSlots(store, parentId)` 함수. `getSlotChildren(store, parentId)` (slot 값들을 배열로). `addSlotEntity`/`removeEntity` slots 정리 | |
| `engine/getVisibleNodes.ts` 수정 | DFS 순회 시 children 후 slots도 walk | |
| `plugins/spatial.ts` 수정 | enterChild에서 children 없으면 slots 진입. slots 내부에서 ↑↓ 이동 | |
| `cms-schema.ts` 수정 | Zod object의 editable fields 2개+ → slot 규칙 자동 파생. 기존 card/stat Slot도 slots로 이관 | |
| `cms-store.ts` 수정 | store 초기화 시 모든 고정 슬롯(card icon/title/desc, quote text/attribution 등)을 slots에 배치. relationships에서 제거 | |
| `CmsCanvas.tsx` 수정 | Enter keyMap: slots 있으면 drill down, slots 없고 editable 1개 → rename | |

**구조 관계:**
- `NormalizedData.relationships` = array 의미론 (CRUD/순서) — section→[card, text, ...], tab-group→[tab-item, ...]
- `NormalizedData.slots` = object 의미론 (수정만) — card→{icon, title, desc}, quote→{text, attribution}
- `getChildren` = relationships만. `getSlotChildren` = slots만. `getAllDescendants`(?) = 양쪽 합산 (삭제 시 재귀 수거용)
- card/stat의 기존 Slot children → slots로 이관. relationships에서 제거

완성도: 🟢

## ③ 인터페이스

> store 구조 + 순회 + 키보드 동작 3계층. slots는 세로 배치(필드 목록).

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| Enter on quote | quote 포커스, slots 있음 | enterChild → 첫 slot에 포커스 | slots 있으면 drill down 대상. children과 동일 spatial 메커니즘 | text 슬롯 포커스 | |
| ↓ on quote/text | text 슬롯 포커스 | 다음 슬롯(attribution) | slots 내 순서 = Zod schema 필드 순서 | attribution 포커스 | |
| ↑ on quote/attribution | attribution 포커스 | 이전 슬롯(text) | 역방향 순회 | text 포커스 | |
| Escape on slot 내부 | 슬롯 포커스 | exitToParent → 부모 복귀 | 기존 spatial 메커니즘 동일 | quote 포커스 | |
| Enter on text(단일 필드) | children 없음, slots 없음 | rename 진입 | children·slots 없고 editable 1개 → 기존 rename | rename 모드 | |
| Enter on card | card 포커스, slots:{icon,title,desc} | drill down → 첫 slot | card도 slots 이관 — 동일 메커니즘 | icon 포커스 | |
| Delete on slot 내부 | 슬롯 포커스 | no-op | slots는 고정, CRUD 불가. cmsCanDelete가 false 반환 | 상태 유지 | |
| Mod+Arrow on slot 내부 | 슬롯 포커스 | no-op | slots 순서 변경 불가 | 상태 유지 | |
| 클릭 on 슬롯 노드 | 다른 곳 포커스 | spatial parent 설정 + 슬롯 포커스 | 기존 handleNodeClick 동일 경로 | 슬롯 포커스 | |

완성도: 🟢

## ④ 경계

**JSON 규칙:** array=children, object=slots. rename은 object에 editable string field가 유일할 때만.

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| B1: editable field 1개 object (text, step-num) | Enter | 유일한 string prop → rename이 자연스러움 | rename 진입 (기존 동작 유지) | rename 모드 | |
| B2: editable field 2개+ object (quote, link, card) | Enter | 2개+ → 어느 필드를 rename할지 모호, drill down이 올바름 | slots drill down | 첫 slot 포커스 | |
| B3: 부모 삭제 시 slots 자식 | removeEntity(quote) | 부모 삭제 시 slots 내 entity도 재귀 수거 | slots 내 모든 entity 함께 제거 | 빈 상태 | |
| B4: card slots 이관 후 getChildren | getChildren(card) | card의 icon/title/desc가 relationships→slots 이관 | getChildren(card) = []. getSlotChildren(card) = [icon,title,desc] | 정상 분리 | |
| B5: slots 내부 Escape 연타 | 슬롯→부모→상위 | 일반 spatial exitToParent 체인 | 정상 계층 탈출 | ROOT 도달 시 정지 | |
| B6: undo/redo 시 slots | slots 변경 후 undo | history plugin이 store 전체 스냅샷 → slots 포함 | undo/redo 정상 | 이전 상태 복원 | |
| B7: paste into slot parent | 슬롯 부모에 paste | canAccept가 false (non-array) | no-op | 상태 유지 | |
| B8: 슬롯 내부 Delete/Mod+D | 슬롯 노드 포커스 | slots는 고정, cmsCanDelete false | no-op | 상태 유지 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 정규화 트리 순회, 타입별 분기 금지 (memory) | ② | ✅ slots도 트리 순회 편입 | — | |
| P2 | 데이터 모델 먼저 → 상태관리 소멸 (memory) | ② | ✅ object props가 모델에 반영 | — | |
| P3 | children = array 의미론 유지 (discuss) | ② | ✅ relationships 불변 | — | |
| P4 | store command + plugin (CLAUDE.md) | ③ | ✅ cmsCanDelete가 slots에 false | — | |
| P5 | 원자적 restructure (memory) | ⑥ | ✅ card/stat relationships→slots 원자적 이관 | — | |
| P6 | focusRecovery 불변 조건 (memory) | ③④ | ✅ slots 자식 삭제 불가, 부모 삭제 시 재귀 수거 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | NormalizedData 타입 변경 | 모든 store 소비자가 slots 필드 인식해야 함. createStore 초기화 시 slots 기본값 {} 필수 | 높 | createStore에서 `slots: {}` 자동 초기화. 기존 코드는 relationships만 읽으므로 호환 | |
| S2 | card/stat의 children이 relationships→slots 이관 | getChildren(card) = [] 로 변경. card 렌더러가 getChildren으로 자식 읽고 있으면 깨짐 | 높 | CmsCanvas renderNode에서 card의 children 순회를 getSlotChildren으로 전환. 원자적 교체 | |
| S3 | getVisibleNodes DFS 확장 | slots 순서가 visible 노드 순서에 영향 | 중 | slots 순서 = Zod schema 필드 순서 (선언 순). 기존 children 순서 유지 | |
| S4 | cms-store.ts 초기화 데이터 구조 변경 | 기존 relationships에서 card→[icon,title,desc] 제거, slots에 card→{icon,title,desc} 추가 | 중 | 데이터 마이그레이션 함수 또는 초기화 시 자동 변환 | |
| S5 | DetailPanel이 entity.data에서 필드 읽음 | slots로 펼쳐진 필드는 entity.data가 아니라 별도 entity | 높 | DetailPanel이 slots 자식 entity의 data를 읽도록 전환 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| X1 | slots에 CRUD(add/remove/move) 동작 | ⑤P3 | slots = 고정 구조. array 의미론은 children만 | |
| X2 | getChildren에 slots 병합 | ⑥S2 | children과 slots는 의미론이 다름. 혼합하면 CRUD 가드 깨짐 | |
| X3 | card/stat 이관을 점진적으로 | ⑤P5 | 원자적 교체만. 중간 상태(relationships+slots 둘 다)에 card 존재하면 이중 렌더 | |
| X4 | slots 자식 entity에 parentId를 relationships에 기록 | ⑥S1 | slots 관계는 slots 맵에만. getParent는 relationships + slots 양쪽 탐색 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①M1 | quote에서 Enter | text 슬롯에 포커스, spatial parent = quote | |
| V2 | ①M2 | quote/text에서 Escape | quote로 복귀 | |
| V3 | ①M3 | value-item에서 Enter | icon 슬롯에 포커스 | |
| V4 | ①M4 | text 노드(단일 필드)에서 Enter | rename 진입 | |
| V5 | ④B1 | step-num(editable 1개)에서 Enter | rename 진입 (slots 아닌 기존 경로) | |
| V6 | ④B2 | link(2개 필드)에서 Enter | slots drill down | |
| V7 | ④B3 | quote 삭제 | quote + slots 내 entity 모두 제거 | |
| V8 | ④B4 | card에서 Enter (slots 이관 후) | icon 슬롯에 포커스 (기존 동작 유지) | |
| V9 | ④B7 | 슬롯 부모에 paste | no-op | |
| V10 | ④B8 | 슬롯 내부에서 Delete | no-op | |
| V11 | ①M5 | 새 Zod object 추가 후 store 초기화 | 자동 slots 정규화 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

---

**전체 완성도:** 🟢 1/8 — ① 동기

#kind/prd #topic/store
