# /doubt 결과

> Scope 감지: **새 개념 도입** ("이거 다 필요한 건지") → Occam Gate 우선
>
> 대상: `cms-schema.ts` 신규 추가분 — `EditableGroup`, `EditableGroupEntry` 타입, `collectEditableGroups`, `deriveGroupLabel`, `contextualLabel` 함수

---

## Occam Gate — 3가지 질문

### 1. 기존 메커니즘으로 해결 가능한가?

기존 메커니즘은 `fieldsOf(type: string) → EditableField[]` (내부) / `getEditableFields(data) → EditableField[]` (export).

**불가능하다.** `fieldsOf`는 단일 노드의 `nodeSchemas[type].shape`에서 `.describe()`가 붙은 필드만 추출한다. 컨테이너(section, card, stat, step)를 포커스할 때 필요한 것은:

| 요구사항 | fieldsOf로 가능? | 이유 |
|----------|:-:|------|
| 트리 재귀 순회 (자식 → 손자 필드 수집) | X | store 접근 없음. type string만 받는다. |
| 그룹화 (컨테이너 자식별 fieldset 헤더) | X | flat 배열 반환. nodeId 정보 없음. |
| 맥락적 라벨 (text.role → "Title"/"Description") | X | schema.description만 읽음. 같은 type의 여러 노드를 구분 불가. |

`fieldsOf`를 확장하면? 시그니처가 `(store, nodeId, locale)`로 바뀌어야 하고, 기존 호출처(CmsCanvas, CmsInlineEditable)가 모두 깨진다. PRD N5에서도 기존 시그니처 변경 금지.

**→ No. 기존 메커니즘으로 해결 불가.**

### 2. 새 개념이 없으면 어떻게 되는가?

컨테이너 포커스 시 Detail Panel이 빈 상태("No editable fields")로 표시된다. 컨테이너 내 필드를 편집하려면 자식 노드 하나하나를 포커스해야 한다. section 하나에 자식이 10개이면 10번 포커스를 바꿔야 한다.

**→ "그냥 안 된다." 다음 질문으로.**

### 3. 이 변경이 시스템의 개념 수를 줄이는가, 늘리는가?

**늘린다.** 2개 타입 + 3개 함수 = 5개 개념 추가.

재검토:
- 5개 모두 CmsDetailPanel이라는 단일 소비자에 매핑된다.
- `deriveGroupLabel`, `contextualLabel`은 export되지 않는 내부 헬퍼 → 외부 API 표면 증가는 3개(타입 2 + 함수 1).
- `collectEditableGroups`가 내부적으로 기존 `getEditableFields`를 재사용 → 중복 없음.
- 다른 프로젝트에서도 필요한가? → "트리 구조에서 편집 가능 필드를 재귀 수집하여 그룹화"는 모든 CMS/에디터에서 공통 패턴.

**→ 개념 수는 늘지만, 각각이 구체적 역할을 갖고 있어 정당하다. Gate 통과.**

---

## 목록화

| # | 항목 | 역할 |
|---|------|------|
| 1 | `EditableGroupEntry` 타입 | 그룹 내 개별 항목: `EditableField` + `nodeId` (어떤 노드의 어떤 필드인지 추적) |
| 2 | `EditableGroup` 타입 | `groupLabel` + `entries[]`로 Detail Panel의 fieldset 1개를 표현 |
| 3 | `collectEditableGroups()` 함수 | store + nodeId + locale → 트리 순회 → `EditableGroup[]`. CmsDetailPanel의 유일한 데이터 소스 |
| 4 | `deriveGroupLabel()` 함수 (internal) | 컨테이너 노드에서 사람이 읽을 수 있는 그룹 헤더 라벨 도출 |
| 5 | `contextualLabel()` 함수 (internal) | text.role 기반으로 "Text" 대신 "Title"/"Description" 등 맥락적 라벨 반환 |

---

## 필터 체인

### 1. `EditableGroupEntry` 타입

- (1) 쓸모: **있다** — CmsDetailPanel.tsx line 98에서 `DetailField` 컴포넌트의 props 타입. `entry.nodeId`로 각 input이 어떤 노드를 수정할지 결정 (line 106, 133).
- (2) 형태: **맞다** — `EditableField`에 `nodeId`를 추가한 구조. 컨테이너 자식의 필드를 섞을 때 nodeId 추적이 필수.
- (3) 줄일 수 있나: **아니오** — 4개 필드(`nodeId`, `field`, `label`, `isLocaleMap`) 전부 DetailField에서 사용됨.
- (4) 더 적게: `EditableField & { nodeId: string }`으로 intersection 타입 가능하나, `label`이 `contextualLabel`에 의해 오버라이드되므로 실제로는 같은 필드를 다른 값으로 사용. 별도 타입이 의미적으로 정확.
- **판정: 🟢 유지**

### 2. `EditableGroup` 타입

- (1) 쓸모: **있다** — CmsDetailPanel.tsx line 76 `DetailGroup` props, line 61 `.map()` 반복.
- (2) 형태: **맞다** — `groupLabel` + `entries[]`. Detail Panel의 `<fieldset>` + `<legend>` 1:1 매핑.
- (3) 줄일 수 있나: **아니오** — 2개 필드만 있음. 이미 최소.
- **판정: 🟢 유지**

### 3. `collectEditableGroups()` 함수

- (1) 쓸모: **있다** — CmsDetailPanel.tsx line 19, `useMemo` 내에서 유일한 데이터 소스.
- (2) 형태: **맞다** — `(store, nodeId, locale) → EditableGroup[]`. cms-schema.ts에 위치 (스키마 파생물).
- (3) 줄일 수 있나: 검토. 현재 75줄 (line 170–245). leaf 분기 / container 분기 / sub-container 분기로 나뉜다. 깊이 2 제한으로 재귀가 아닌 2단 for 루프 → 코드가 명시적. 줄이면 가독성이 떨어진다.
- **판정: 🟢 유지**

### 4. `deriveGroupLabel()` 함수 (internal)

- (1) 쓸모: **있다** — `collectEditableGroups` 내부에서 2곳 호출 (line 221, 240).
- (2) 형태: section → variant 대문자화, 기타 → 자식 text의 title/label role에서 라벨 추출, 최종 fallback → type. 25줄.
- (3) 줄일 수 있나: section 분기 삭제하면 fallback이 "section"으로 표시 → variant("features", "stats")보다 정보량 감소. 유지.
- **판정: 🟢 유지**

### 5. `contextualLabel()` 함수 (internal)

- (1) 쓸모: **있다** — `collectEditableGroups` 내부에서 2곳 호출 (line 214, 231). "Text" 대신 "Title"/"Description"/"Label"/"Subtitle"을 반환.
- (2) 형태: data.type + data.role 기반 switch. 13줄.
- (3) 줄일 수 있나: 이미 13줄. subtitle/title 순서 주석까지 있어 의도가 명확.
- (4) 더 적게: `deriveGroupLabel`과 병합 가능? → 책임이 다르다. `deriveGroupLabel`은 컨테이너의 그룹 헤더, `contextualLabel`은 개별 필드의 라벨 오버라이드. 분리가 맞다.
- **판정: 🟢 유지**

---

## Chesterton's Fence

모든 항목이 🟢이므로 Fence 검사 대상(🔴/🟡) 없음.

도입 이유 확인: PRD `docs/superpowers/specs/2026-03-22-cms-detail-panel-container-prd.md`에서 M1(컨테이너 포커스 시 자식 필드 수집), M2(그룹별 fieldset 렌더링), V10(의미 있는 그룹 라벨)이 명시적 요구사항. `PROGRESS.md` line 271에도 완료 기록.

---

## 변경

| 항목 | 판정 | 이유 | 검증 |
|------|------|------|------|
| (해당 없음) | — | 5개 신규 항목 모두 Gate + 필터 통과 | — |

## 🟢 유지 (5건)

- **타입 2건** (`EditableGroupEntry`, `EditableGroup`) — 컨테이너 → 자식 필드의 그룹 구조를 표현. CmsDetailPanel에서 직접 소비.
- **함수 1건 (export)** (`collectEditableGroups`) — 트리 순회 + 그룹 수집. `fieldsOf`로 대체 불가한 핵심 파생 함수.
- **함수 2건 (internal)** (`deriveGroupLabel`, `contextualLabel`) — 라벨 도출 헬퍼. 각각 다른 책임(그룹 헤더 vs 필드 라벨). export 아님 → API 표면 증가 없음.

## Before → After

- 항목 수: 5 → 5 (변경 없음)
- 외부 API 증가: +3 (타입 2 + 함수 1)
- 내부 헬퍼 증가: +2 (export 없음)

---

## 결론

> "기존 fieldsOf로 충분하지 않았을까?"

**충분하지 않다.** `fieldsOf(type) → EditableField[]`는:
1. store를 모른다 (트리 순회 불가)
2. nodeId를 반환하지 않는다 (여러 노드의 필드 혼합 시 출처 추적 불가)
3. schema.description만 읽는다 (같은 type의 여러 인스턴스를 role로 구분 불가)

새 함수 `collectEditableGroups`는 내부적으로 기존 `getEditableFields`를 3곳에서 재사용하며, 그 위에 트리 순회 + 그룹화 + 맥락적 라벨이라는 레이어를 추가한다. 기존 API를 변경하지 않으면서 새로운 문제(컨테이너 편집)를 풀었다.

5개 개념 모두 유지. 제거/축소 대상 없음.
