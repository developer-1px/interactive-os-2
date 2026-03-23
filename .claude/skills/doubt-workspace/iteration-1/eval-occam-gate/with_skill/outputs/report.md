# /doubt 결과 (1라운드 수렴)

> 대상: `cms-schema.ts` 신규 추가분 — `EditableGroup`, `EditableGroupEntry` 타입, `collectEditableGroups`, `deriveGroupLabel`, `contextualLabel` 함수

## Occam Gate 사전 판정

**질문: 기존 `fieldsOf`/`getEditableFields`로 해결 가능한가?**

`fieldsOf`는 **단일 노드의 편집 가능 필드**를 반환한다. 컨테이너(section, card, stat, step)를 포커스하면 자식 트리를 재귀 순회하여 **여러 노드의 필드를 그룹으로 수집**해야 한다. 이 문제는 `fieldsOf`의 시그니처(`type: string → EditableField[]`)로는 해결 불가능하다 — store 접근, 트리 순회, nodeId 추적이 필요하다.

→ **Gate 통과**: 기존 메커니즘으로 해결 불가능. 새 함수가 필요한 이유가 있다.

**질문: 새 개념이 없으면 어떻게 되는가?**

→ 컨테이너를 포커스하면 Detail Panel이 빈 상태가 된다. PRD M1/M2 시나리오가 불가능.

**질문: 시스템 개념 수를 줄이는가, 늘리는가?**

→ 늘린다 (2타입 + 3함수). 단, CmsDetailPanel에서 소비자가 명확하고, 1:1 대응이 있다.

---

## 라운드 요약

| Round | 🔴 제거 | 🟡 축소 | ↩️ 자기교정 | 수렴? |
|:-----:|:------:|:------:|:---------:|:----:|
| 1     | 0      | 1      | —         | 🟢   |

---

## 목록화 (대상 항목 7건)

| # | 항목 | 역할 |
|---|------|------|
| 1 | `EditableGroupEntry` 타입 | 그룹 내 개별 필드 항목: nodeId를 포함하여 어떤 노드의 어떤 필드인지 추적 |
| 2 | `EditableGroup` 타입 | groupLabel + entries 배열로 Detail Panel fieldset 1개를 표현 |
| 3 | `collectEditableGroups()` 함수 | store + nodeId → 트리 순회 → EditableGroup[] 반환, CmsDetailPanel의 유일한 데이터 소스 |
| 4 | `deriveGroupLabel()` 함수 | 컨테이너 노드에서 사람이 읽을 수 있는 그룹 헤더 라벨을 도출 |
| 5 | `contextualLabel()` 함수 | text 노드의 role 기반으로 "Text" 대신 "Title"/"Description" 등 맥락적 라벨 반환 |
| 6 | imports (NormalizedData, getChildren, localized, Locale, LocaleMap) | collectEditableGroups가 store를 순회하기 위한 의존성 |
| 7 | 기존 `getEditableFields` 호출 (내부) | collectEditableGroups가 각 노드의 필드를 얻기 위해 기존 함수를 재사용 |

---

## 필터 체인

### 1. `EditableGroupEntry` 타입

- ① 쓸모: **있다** — CmsDetailPanel.tsx에서 DetailField 컴포넌트의 props 타입으로 직접 사용 (line 98). 기존 `EditableField`와 다른 점은 `nodeId`를 포함한다는 것. 컨테이너에서 여러 노드의 필드를 섞어서 보여주려면 각 entry가 어떤 노드의 것인지 알아야 한다.
- ② 형태: 맞다 — `EditableField`를 확장하여 `nodeId`를 추가한 형태.
- ③ 줄일 수 있나: 아니오 — 필수 필드만 있다.
- **판정: 🟢 유지**

### 2. `EditableGroup` 타입

- ① 쓸모: **있다** — CmsDetailPanel.tsx DetailGroup 컴포넌트의 props 타입 (line 76).
- ② 형태: 맞다 — groupLabel + entries, 최소 구조.
- ③ 줄일 수 있나: 아니오.
- **판정: 🟢 유지**

### 3. `collectEditableGroups()` 함수

- ① 쓸모: **있다** — CmsDetailPanel.tsx line 19에서 useMemo 내부에서 호출. 유일한 호출처이지만 PRD의 핵심 기능.
- ② 형태: 맞다 — store + nodeId + locale → EditableGroup[]. cms-schema.ts에 위치하는 것도 적합 (스키마 파생물).
- ③ 줄일 수 있나: **예 — 아래 세부 분석 참조**
- **판정: 🟡 축소 후보**

**세부**: 현재 `collectEditableGroups`는 3단계 깊이(노드 → 자식 → 손자)를 명시적으로 순회한다. 재귀라고 주석에 써 있지만 실제로는 재귀가 아닌 2단계 loop이다. 이것은 CMS 트리의 최대 깊이가 3이라는 도메인 제약에 맞으므로 과잉처리는 아니다. 다만 함수 본문이 75줄로 **분량이 아닌 복잡도 측면에서** 축소 여지가 있다 — 내부 loop가 headerEntries/subEntries로 분기하는데, 이 로직은 현재 수준에서 충분히 읽을 수 있다. 강제 축소보다는 현 상태 유지가 낫다.

→ 재검토: 과잉처리(Lean Muda)인가? 아니다 — PRD V2/V8/V12가 이 복잡도를 요구한다. **🟡 → 🟢 유지로 상향**.

### 4. `deriveGroupLabel()` 함수

- ① 쓸모: **있다** — collectEditableGroups 내부에서 2곳 호출 (line 219, 238).
- ② 형태: 맞다 — private helper, export되지 않음.
- ③ 줄일 수 있나: 아니오 — section variant 처리 + children 탐색 + fallback의 3분기가 각각 필요.
- **판정: 🟢 유지**

### 5. `contextualLabel()` 함수

- ① 쓸모: **있다** — collectEditableGroups 내부에서 2곳 호출 (line 212, 229). "Text" 대신 "Title"/"Description" 등 의미 있는 라벨을 제공.
- ② 형태: **의문** — 이 함수가 cms-schema.ts에 있어야 하는가?
  - 스키마의 `.describe()`가 "Text"라는 범용 라벨을 제공하고, contextualLabel이 role 기반으로 오버라이드한다.
  - 대안: `.describe()`를 role별로 다르게 설정? → 불가능 — 같은 text 스키마가 title/desc/label 등 여러 역할로 사용됨.
  - 결론: 스키마 파생 로직이므로 cms-schema.ts 위치 적합.
- ③ 줄일 수 있나: section-label/section-title/section-desc 3줄은 text의 role 기반 분기와 패턴이 중복되지만, 서로 다른 노드 타입이므로 병합 불가.
- **판정: 🟢 유지**

### 6. imports

- ① 쓸모: **있다** — collectEditableGroups의 의존성. 전부 사용됨.
- ② 형태: **의문** — 파일 상단이 아닌 line 106-109에 mid-file import가 있다. 이것은 코드 스타일 문제이지 기능 문제는 아니다.
- **판정: 🟡 축소 후보 (스타일)** — import를 파일 상단으로 이동하면 가독성 향상. 단, 이번 분석은 read-only이므로 제안만.

### 7. 기존 `getEditableFields` 재사용

- ① 쓸모: **있다** — collectEditableGroups가 각 노드의 필드를 얻기 위해 3곳에서 호출 (line 177, 197, 207).
- 기존 함수 시그니처 변경 없이 재사용 = PRD N5 금지사항 준수.
- **판정: 🟢 유지**

---

## Chesterton's Fence

| 항목 | 왜 만들었는지 아는가? | 이유가 아직 유효한가? | 판정 |
|------|---------------------|---------------------|------|
| EditableGroupEntry | PRD M1: 컨테이너 포커스 시 자식 필드를 nodeId별로 추적해야 함 | 유효 — CmsDetailPanel에서 각 entry가 다른 노드를 가리킴 | 🟢 |
| EditableGroup | PRD M2: section 레벨에서 그룹별 fieldset 렌더링 | 유효 — DetailGroup 컴포넌트가 직접 소비 | 🟢 |
| collectEditableGroups | PRD M1/M2/M3: 컨테이너→자식 재귀 수집이 핵심 기능 | 유효 — fieldsOf로는 불가능 | 🟢 |
| deriveGroupLabel | PRD V10: 그룹 헤더에 의미 있는 라벨 필요 | 유효 — "stat"보다 "APG Patterns"이 사용자에게 유의미 | 🟢 |
| contextualLabel | PRD: text 노드의 "Text" 라벨로는 title/desc 구분 불가 | 유효 — 같은 스키마에서 role 기반 분화 | 🟢 |

---

## 🔴 제거 (총 0건)

없음.

## 🟡 축소/병합 제안 (총 1건)

- **mid-file imports (line 106-109)**: 파일 상단으로 이동하면 가독성 향상. 기능 변경 없음. (round 1, 스타일)

## 🟢 유지 (5건 — 핵심 질문 대상)

| 항목 | 존재 이유 |
|------|----------|
| `EditableGroupEntry` | `EditableField` + `nodeId`. 컨테이너에서 여러 노드의 필드를 섞을 때 nodeId 추적 필수. |
| `EditableGroup` | groupLabel + entries. Detail Panel fieldset 1:1 매핑. |
| `collectEditableGroups` | store 트리 순회 → 그룹 수집. `fieldsOf`는 단일 노드 전용이라 대체 불가. |
| `deriveGroupLabel` | 컨테이너 → 사람이 읽을 수 있는 헤더 라벨 도출. private helper. |
| `contextualLabel` | text.role 기반 라벨 오버라이드. 스키마 `.describe()`로는 불가능한 맥락적 분화. |

## 📊 Before → After (누적)

- 항목 수: 5 → 5 (변경 없음)
- **결론**: 5개 신규 항목 모두 유지. `fieldsOf`로는 "단일 노드 필드 추출"만 가능하고, 컨테이너 포커스 시 "트리 순회 + 그룹화 + nodeId 추적 + 맥락적 라벨"이라는 본질적으로 다른 문제를 풀기 위해 새 추상이 필요했다. 개념 수가 늘었지만 각각 1:1로 소비자(CmsDetailPanel)에 매핑되며, PRD 8단 검증을 모두 통과한 설계다.

---

### 핵심 답변

> "기존 fieldsOf로 충분하지 않았을까?"

**충분하지 않다.** `fieldsOf(type) → EditableField[]`는:
1. store를 모른다 (트리 순회 불가)
2. nodeId를 반환하지 않는다 (여러 노드의 필드를 섞을 때 출처 불명)
3. 그룹핑 개념이 없다 (fieldset 렌더링 불가)

이 세 가지 갭을 메우려면 `fieldsOf`를 변경하거나 새 함수를 만들어야 하는데, PRD N5에서 기존 시그니처 변경을 금지했으므로(기존 leaf 편집 회귀 방지), 새 함수가 올바른 선택이다.
