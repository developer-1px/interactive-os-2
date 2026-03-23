# Occam Gate Analysis: collectEditableGroups vs fieldsOf

## Question

cms-schema.ts에 EditableGroup, EditableGroupEntry 타입과 collectEditableGroups, deriveGroupLabel, contextualLabel 함수가 새로 추가되었다. 기존 fieldsOf(내부) / getEditableFields(export)로 충분했을까?

## Summary Verdict

**새 추상화는 정당하다.** fieldsOf는 단일 노드의 편집 가능 필드를 반환하는 함수이고, collectEditableGroups는 트리 구조를 재귀 순회하여 컨테이너 노드의 자식 필드를 그룹화하는 함수다. 두 함수는 서로 다른 문제를 풀고 있으며, collectEditableGroups가 내부적으로 getEditableFields를 재사용하는 구조로 되어 있어 중복도 없다.

## Detailed Analysis

### 1. fieldsOf가 하는 일 (기존)

```
fieldsOf(type: string) → EditableField[]
```

- Zod schema의 `.describe()`를 읽어 `{ field, label, isLocaleMap }` 배열을 반환
- **단일 노드**, **단일 깊이** 전용
- 사용처: getEditableFields (export wrapper), localeFieldsOf, CmsCanvas 인라인 편집, CmsInlineEditable

### 2. collectEditableGroups가 푸는 문제 (신규)

```
collectEditableGroups(store, nodeId, locale) → EditableGroup[]
```

fieldsOf로는 해결할 수 없는 3가지 문제를 풀고 있다:

| # | 문제 | fieldsOf로 가능? | 이유 |
|---|------|-----------------|------|
| 1 | **트리 재귀 순회** — section 포커스 시 자식(card, stat, step)과 손자(text, icon)의 필드를 모두 수집 | 불가 | fieldsOf는 nodeSchemas[type]의 shape만 읽는다. store 트리 구조(parentId-children 관계)를 알지 못한다. |
| 2 | **그룹화** — 컨테이너 자식별로 fieldset 그룹 헤더를 생성 (예: "Normalized Store" 그룹 아래 title+desc) | 불가 | fieldsOf는 flat 배열만 반환. nodeId 정보가 없어 어떤 노드의 필드인지 구별 불가. |
| 3 | **컨텍스트 라벨링** — text 노드가 여러 개일 때 schema의 generic "Text" 대신 role 기반 라벨(Title, Description) 부여 | 불가 | fieldsOf는 schema.description만 읽는다. 같은 type의 노드가 여러 개 있을 때 구별하려면 실제 data.role을 봐야 한다. |

### 3. 새 함수들의 역할 분리

| 함수 | 책임 | export 여부 |
|------|------|------------|
| `collectEditableGroups` | 트리 순회 + 그룹 조립 (orchestrator) | export |
| `deriveGroupLabel` | 컨테이너 노드의 대표 라벨 결정 (section variant / 자식 text label) | internal |
| `contextualLabel` | text 노드의 role 기반 라벨 재정의 | internal |

deriveGroupLabel과 contextualLabel은 internal 헬퍼로, collectEditableGroups의 내부 로직을 분리한 것이다. 독립 export되지 않으므로 외부 API 표면을 늘리지 않는다.

### 4. fieldsOf 확장으로 대체 가능했을까?

가능한 대안을 검토한다:

**대안 A: fieldsOf에 재귀 수집 로직 추가**
- fieldsOf의 시그니처가 `(type: string) → EditableField[]`에서 `(store, nodeId, locale) → ???`로 바뀌어야 한다.
- 기존 호출처(CmsCanvas, CmsInlineEditable, localeFieldsOf) 전부 회귀한다.
- PRD ⑦ 금지 N5에서 명시적으로 금지한 이유와 일치한다.

**대안 B: CmsDetailPanel.tsx에서 fieldsOf를 반복 호출하며 직접 그룹화**
- 뷰 컴포넌트에 트리 순회 + 그룹 라벨 결정 로직이 들어간다.
- cms-schema.ts의 "단일 소스" 원칙에 위배된다 (스키마 파생 로직이 뷰로 유출).
- 테스트 시 React 컴포넌트를 렌더링해야만 그룹화 로직을 검증할 수 있다.

두 대안 모두 fieldsOf의 원래 설계 의도(단일 노드 필드 추출)를 훼손하거나, 관심사 분리를 깨뜨린다.

### 5. 실제 사용 현황

| 파일 | 사용하는 것 | 용도 |
|------|-----------|------|
| CmsDetailPanel.tsx | collectEditableGroups, EditableGroup, EditableGroupEntry | 컨테이너 포커스 시 그룹별 Form 렌더링 |
| CmsCanvas.tsx | getEditableFields | 인라인 편집 가능 여부 판단 |
| CmsInlineEditable.tsx | getEditableFields | 인라인 편집 필드 매핑 |

collectEditableGroups는 CmsDetailPanel에서만 사용되지만, 이것이 문제가 되지 않는다. Detail Panel의 컨테이너 편집은 명확한 단일 책임이고, PRD에 12개 검증 시나리오가 정의된 독립적 기능이다.

### 6. EditableGroupEntry가 EditableField과 별도 타입인 이유

```typescript
// 기존
interface EditableField { field: string; label: string; isLocaleMap: boolean }

// 신규
interface EditableGroupEntry { nodeId: string; field: string; label: string; isLocaleMap: boolean }
```

유일한 차이는 `nodeId` 필드다. 컨테이너의 자식 필드를 수집하면 여러 노드의 필드가 섞이므로, 각 필드가 어떤 노드에 속하는지 알아야 confirmRename 시 올바른 nodeId를 전달할 수 있다. 기존 EditableField에는 이 정보가 없다 (단일 노드 전제이므로 불필요했다).

## Conclusion

| 기준 | 판정 |
|------|------|
| 중복 여부 | 없음 -- collectEditableGroups가 getEditableFields를 내부 호출 |
| 기존 API 변경 여부 | 없음 -- fieldsOf, getEditableFields 시그니처 그대로 유지 |
| 새 export 수 | 3개 (collectEditableGroups, EditableGroup, EditableGroupEntry) |
| 새 internal 함수 수 | 2개 (deriveGroupLabel, contextualLabel) |
| fieldsOf 확장으로 대체 가능? | 불가 -- 트리 순회, 그룹화, 컨텍스트 라벨링은 단일 노드 필드 추출과 다른 문제 |

**결론: 새 추상화는 fieldsOf가 풀지 못하는 구체적인 문제(트리 재귀 + 그룹화 + 컨텍스트 라벨)를 풀며, 기존 API를 건드리지 않는다. Occam's razor 위반 아님.**
