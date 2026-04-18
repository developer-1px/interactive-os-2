---
id: 1-projects/cms/prds/meta-editable-ssot-prd
title: '`.meta({ fieldType })` 편집 SSOT — PRD'
status: active
kind: prd
created: 2026-04-14
updated: 2026-04-14
summary: 'Discussion: CMS 캔버스에서 편집 불필요 노드까지 포커스되는 문제. `.meta({ fieldType })`를 편집 가능 여부의 단일 기준(SSOT)으로 격상하고, `isFocusable` visibility filter로 포커스 skip.'
topics: [1-projects]
relates: []
supersedes: []
---
# `.meta({ fieldType })` 편집 SSOT — PRD

> Discussion: CMS 캔버스에서 편집 불필요 노드까지 포커스되는 문제. `.meta({ fieldType })`를 편집 가능 여부의 단일 기준(SSOT)으로 격상하고, `isFocusable` visibility filter로 포커스 skip.

## ① 동기

### WHY

- **Impact**: CMS 편집자가 캔버스에서 화살표/Tab 탐색 시 `cta`, 구조 컨테이너 등 편집 불필요 노드에 포커스가 가서 탐색 효율이 떨어진다.
- **Forces**: `.describe()`가 라벨 + 편집 가능 마킹 두 역할을 겸임 → 분리 불가. `.meta()`는 특수 필드(`icon`/`image`/`url`/`long-text`)에만 사용 중.
- **Assets**: `VisibilityFilter.isFocusable` (engine), `fieldsOf` (cmsSchema), Writer의 `writerLeafFilter` 선례.
- **Decision**: `.meta({ fieldType })`를 편집 SSOT로. 기각 대안: 이중 규칙(`meta` + `isCollectionItem`) — 오컴 위반.
- **Non-Goals**: DOM에서 노드 제거 아님 (렌더링은 유지, 포커스만 skip). fieldType 외 새 meta 속성 도입 아님.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | `text` 노드 (`value`에 `.meta({ fieldType: 'short-text' })`) | 캔버스에서 화살표 탐색 | 포커스 도달, F2로 인라인 편집 가능 | |
| S2 | `cta` 노드 (`.meta()` 필드 없음) | 캔버스에서 화살표 탐색 | cta 자체는 skip, 슬롯 자식(text)에 포커스 도달 | |
| S3 | `section` 노드 (`variant`에 `.meta({ fieldType: 'short-text' })`) | 캔버스에서 화살표 탐색 | 포커스 도달 | |
| S4 | `stat` 노드 (`.meta()` 필드 없음, 슬롯 컨테이너) | 캔버스에서 화살표 탐색 | stat 자체는 skip, 자식(`stat-value`, `text`)에 포커스 | |
| S5 | `.meta()` 필드 있는 노드 선택 후 Detail Panel | Detail Panel 열림 | 해당 노드의 편집 가능 필드 표시 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `cmsSchema.ts` 스키마 변경 | 편집 가능 필드 전수에 `.meta({ fieldType })` 부여 | |
| `cmsSchema.ts` `fieldsOf` 변경 | `.describe()` 기준 → `.meta({ fieldType })` 기준으로 필터링 전환 | |
| CMS visibility filter | `isFocusable(nodeId, store)` — `fieldsOf(data).length > 0`이면 true | |
| `cms-tab-schema.test.ts` 테스트 수정 | `tab-item.label`에 `.meta()` 추가 반영 | |

### `.meta()` 전수 부여 감사표

**부여 대상 (현재 `.meta()` 없는 편집 필드):**

| 노드 | 필드 | fieldType |
|------|------|-----------|
| `badge` | `value` | `short-text` |
| `text` | `value` | `short-text` |
| `stat-value` | `value` | `short-text` |
| `step-num` | `value` | `short-text` |
| `tab-item` | `label` | `short-text` |
| `section` | `variant` | `short-text` |
| `brand` | `name` | `short-text` |
| `brand` | `license` | `short-text` |
| `section-label` | `value` | `short-text` |
| `section-title` | `value` | `short-text` |
| `stat-card` | `value` | `short-text` |
| `stat-card` | `label` | `short-text` |
| `stat-card` | `desc` | `long-text` |
| `pattern` | `name` | `short-text` |
| `link` | `label` | `short-text` |
| `showcase-item` | `label` | `short-text` |
| `showcase-item` | `desc` | `long-text` |
| `quote` | `attribution` | `short-text` |
| `article` | `title` | `short-text` |
| `article` | `category` | `short-text` |
| `article` | `readTime` | `short-text` |
| `hero-image` | `alt` | `short-text` |
| `gallery-item` | `caption` | `short-text` |
| `section-cta` | `label` | `short-text` |
| `value-item` | `title` | `short-text` |

**이미 `.meta()` 있는 필드 (변경 없음):**

| 노드 | 필드 | fieldType |
|------|------|-----------|
| `icon` | `value` | `icon` |
| `pattern` | `icon` | `icon` |
| `link` | `href` | `url` |
| `section-desc` | `value` | `long-text` |
| `value-item` | `icon` | `icon` |
| `value-item` | `desc` | `long-text` |
| `quote` | `text` | `long-text` |
| `article` | `image` | `image` |
| `article` | `icon` | `icon` |
| `showcase-item` | `icon` | `icon` |
| `section-cta` | `href` | `url` |
| `hero-image` | `src` | `image` |
| `gallery-item` | `image` | `image` |

**`.meta()` 안 붙이는 노드/필드 (skip 대상):**

| 노드 | 필드 | 이유 |
|------|------|------|
| `cta` | `primary`, `secondary` | 슬롯 자식이 편집 담당 |
| `text` | `role` | 시스템 필드 |
| `section` | — | `variant`만 `.meta()`, 나머지 없음 |
| `stat` | — | 슬롯 컨테이너, 자체 필드 없음 |
| `step` | — | 슬롯 컨테이너 |
| `links` | — | 컬렉션 컨테이너 |
| `card` | — | 슬롯 컨테이너 |
| `tab-group` | — | 컬렉션 컨테이너 |
| `tab-panel` | — | 슬롯 컨테이너 |
| `image-card` | — | 슬롯 컨테이너 |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 화살표 키 | 포커스가 `text` 노드에 | 다음 노드로 이동 | `isFocusable`이 `fieldsOf(data).length > 0` 체크. `.meta()` 있는 다음 노드로 점프 | `.meta()` 없는 노드 skip, 다음 포커스 가능 노드에 포커스 | |
| 화살표 키 | 포커스가 `cta` 앞 노드에 | 다음 이동 | cta는 `fieldsOf` 빈 배열 → `isFocusable: false` → skip. 자식(슬롯 text)은 `isFocusable: true` | cta skip, cta의 슬롯 자식에 포커스 | |
| F2 | `.meta()` 있는 노드에 포커스 | 인라인 편집 시작 | `getInlineEditableFields` 반환값 ≥ 1 | rename mode 진입 | |
| F2 | `.meta()` 없는 노드 (이론적으로 도달 불가) | — | 포커스 자체가 안 감 | — | |
| Detail Panel 열기 | `.meta()` 있는 노드 선택 | 편집 필드 표시 | `collectEditableGroups` → `getEditableFields` → `.meta()` 기준 필터 | 해당 노드의 `.meta()` 필드만 표시 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 모든 자식이 `.meta()` 없는 컨테이너 | 컨테이너에 포커스 접근 시 | `isFocusable: false`이지만 `shouldDescend`는 기본 true → 자식 순회는 계속 | 컨테이너 skip, 자식도 skip → 해당 서브트리 전체 건너뜀 | 다음 형제/부모 방향으로 포커스 이동 | |
| `expandEntitySlots`가 슬롯 생성하는 노드 | cta → 슬롯 자식 2개 (primary, secondary text) | 슬롯 자식은 `text` 타입 → `text.value`에 `.meta()` 있음 | cta skip → 슬롯 자식에 포커스 가능 | 슬롯 text 노드에 포커스 | |
| `section.variant`에만 `.meta()` | section 노드 | section은 collection item이면서 `fieldsOf` ≥ 1 | section 포커스 가능 | 편집+이동/삭제 모두 가능 | |
| 새 노드 타입 추가 시 `.meta()` 누락 | 새 타입에 `.describe()`만 부여 | `.meta()` 없으면 자동으로 편집 불가+skip | 포커스 불가 — 실수 방지는 테스트로 | 누락 시 해당 노드 편집 불가 | |
| `localeFieldsOf` 호출 (i18n) | 번역 시트 생성 | `fieldsOf` 결과에서 locale 필드 필터 → `.meta()` 있는 locale 필드만 번역 대상 | `.meta()` 없는 cta의 primary/secondary는 i18n 시트에서 제외 | cta 번역은 슬롯 자식(text) 경유 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 데이터 모델 먼저 (feedback_model_first_state) | ② 스키마 변경 | ✅ 준수 — `.meta()`가 데이터 레이어 SSOT | — | |
| 2 | 모든 상태 NormalizedData+Command (feedback_all_state_normalized_command) | ② visibility filter | ✅ 준수 — isFocusable은 store 데이터 기반 판정 | — | |
| 3 | 선언적 OCP (feedback_declarative_ocp) | ② filter 등록 | ✅ 준수 — plugin의 visibilityFilter로 선언, engine 수정 없음 | — | |
| 4 | 설계 > 요청 (feedback_design_over_request) | 전체 | ✅ 준수 — engine 우회 없이 visibilityFilter 경유 | — | |
| 5 | 오컴의 면도날 (feedback_occams_razor) | 전체 | ✅ 준수 — 단일 규칙, 이중 경로 제거 | — | |
| 6 | 축 SSOT (feedback_axis_pattern_principles) | ② filter | ✅ 준수 — visibilityFilter는 axis/plugin 소유 | — | |
| 7 | OS 컴포넌트 Aria 자동 참여 (feedback_os_components_aria_aware) | ③ skip 동작 | ✅ 준수 — skip은 포커스만, DOM 렌더링 유지 | — | |
| 8 | 자동 파생이 시스템의 본질 (feedback_auto_derivation_is_system) | ② fieldsOf | ✅ 준수 — `.meta()` → fieldsOf → isFocusable 자동 파생 체인 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | `fieldsOf` 반환값 변경 → `collectEditableGroups` | `.meta()` 미부여 필드가 Detail Panel에서 사라짐 | 높음 | ② 감사표 기준 전수 `.meta()` 부여로 기존 편집 필드 100% 유지 | |
| 2 | `expandEntitySlots` | `cta` 슬롯 확장 시 `fieldsOf('cta')`가 빈 배열 → `inlineFields.length < 2` → null 반환 → 슬롯 미생성 | 높음 | `expandEntitySlots`의 `inlineFields` 계산을 `.meta()` 기준으로 재확인. cta는 `.meta()` 없으므로 슬롯 미생성 → cta 자식이 별도 엔티티로 존재해야 함 (?) | |
| 3 | `localeFieldsOf` → i18n 번역 시트 | `.meta()` 없는 locale 필드가 번역 시트에서 제외 | 중간 | `.meta()` 전수 부여로 해결. cta는 슬롯 경유 | |
| 4 | `cms-tab-schema.test.ts` | `tab-item.label` 테스트 실패 | 낮음 | `tab-item.label`에 `.meta({ fieldType: 'short-text' })` 부여 | |

완성도: 🟡 — ⑥-2 `cta` 슬롯 확장 부작용 확인 필요 (아래 참조)

### ⑥-2 상세: `cta` 슬롯 확장

현재 `expandEntitySlots`는 `fieldsOf`에서 inline-editable 필드가 2개 이상이면 슬롯을 생성한다. `.meta()` 전환 후 `cta`는 `fieldsOf` 빈 배열 → 슬롯 미생성.

**현재 cta 데이터 흐름:**
1. `cmsStore`의 `expandAllSlots`가 cta를 처리
2. `expandEntitySlots('cta-1', { type: 'cta', primary: {...}, secondary: {...} })` 호출
3. 현재: 2개 inline 필드 → 슬롯 자식 생성 (`cta-1-primary`, `cta-1-secondary`)
4. 변경 후: 0개 inline 필드 → null → **슬롯 미생성**

**대응:** cta의 `primary`/`secondary`에 `.meta()` 를 안 붙이므로 슬롯이 생성되지 않는다. cta 자체가 skip이고 슬롯 자식도 없으면 cta 콘텐츠에 접근 불가. → **cta의 `primary`/`secondary`는 부모 section 선택 시 `collectEditableGroups`를 통해 Detail Panel에서 편집.** 이를 위해 `collectEditableGroups`가 cta 자식의 필드를 수집할 때 `.meta()` 없어도 `.describe()` 기준으로 수집하는 별도 경로가 필요한가?

→ **아니다.** 오컴 단일 규칙을 유지하려면 cta의 `primary`/`secondary`에도 `.meta({ fieldType: 'short-text' })`를 붙여야 한다. 그러면 `fieldsOf('cta').length === 2` → cta 포커스 가능이 되어 원래 의도와 충돌.

→ **해결:** cta에 `.meta()` 붙이되, `isFocusable` 판정을 `fieldsOf`가 아니라 `getInlineEditableFields`(Form-only 제외) 기준으로 하면? 아니, cta의 primary/secondary는 `short-text`라 Form-only가 아님.

→ **최종 판단:** cta는 슬롯 확장이 유지되어야 한다. `primary`/`secondary`에 `.meta({ fieldType: 'short-text' })` 부여 → `expandEntitySlots`가 2개 슬롯 생성 → 슬롯 자식(text 타입)이 포커스. cta 자체의 `isFocusable`은 `expandEntitySlots`가 non-null인 노드 = "슬롯 확장 노드"로 판정하여 skip.

→ **isFocusable 규칙 수정:**
```
isFocusable(nodeId) =
  fieldsOf(data).length > 0
  && expandEntitySlots(nodeId, data) === null   // 슬롯 확장 노드가 아닌 경우만
```

이렇게 하면 단일 규칙(`meta`)은 유지하면서 슬롯 확장 노드는 자동 skip.

완성도: 🟢 (수정 반영)

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---------------|------|------|-------|
| 1 | `fieldsOf`에서 `.describe()` 기준 유지 | ⑤-5 오컴 | 이중 기준은 편집 가능 판정 혼란 | |
| 2 | engine(`getVisibleNodes`)에 CMS 전용 로직 삽입 | ⑤-3 OCP | visibilityFilter로 선언, engine 불변 | |
| 3 | 컴포넌트 레벨에서 `focusable` prop으로 우회 | ⑤-4 설계>요청 | engine bypass 금지 | |
| 4 | `.meta()` 누락 필드를 `.describe()` fallback으로 살리기 | ⑤-5 오컴 | SSOT 훼손 | |
| 5 | skip 노드를 DOM에서 제거 | ⑤-7 Aria 참여 | 렌더링 유지, 포커스만 skip | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 | `text` 노드에 화살표로 포커스 이동 | 포커스 도달 | |
| V2 | S2 | `cta` 노드 방향으로 화살표 이동 | cta skip, 슬롯 자식 text에 포커스 | |
| V3 | S3 | `section` 노드에 포커스 이동 | 포커스 도달 (`variant`에 `.meta()` 있음) | |
| V4 | S4 | `stat` 노드 방향으로 이동 | stat skip, `stat-value`/`text` 자식에 포커스 | |
| V5 | S5 | `.meta()` 있는 노드 선택 → Detail Panel | 해당 필드 편집 UI 표시 | |
| V6 | ④-1 | 모든 자식이 `.meta()` 없는 서브트리 | 서브트리 전체 skip, 다음 형제로 이동 | |
| V7 | ④-4 | 새 노드 타입 `.meta()` 누락 | 해당 노드 포커스 불가 | |
| V8 | ⑥-1 | `.meta()` 부여 후 Detail Panel | 기존 편집 가능 필드 100% 유지 | |
| V9 | ⑥-2 | cta 슬롯 확장 | `expandEntitySlots('cta')` non-null, 슬롯 자식 생성됨 | |
| V10 | ⑥-3 | i18n 번역 시트 | `.meta()` 있는 locale 필드 전부 포함 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

## 교차 검증

| 검증 | 결과 |
|------|------|
| ① 동기 ↔ ⑧ 검증 | ✅ S1~S5 전부 V1~V5로 커버 |
| ③ 인터페이스 ↔ ② 산출물 | ✅ fieldsOf 변경 + visibility filter가 인터페이스 동작 뒷받침 |
| ④ 경계 ↔ ⑧ 검증 | ✅ ④ 4개 경계 → V6, V7, V9, V10으로 커버 |
| ⑦ 금지 ↔ 출처 | ✅ 5개 금지 전부 ⑤/⑥ 출처 유효 |
| ⑤ 원칙 ↔ 전체 | ✅ 위반 없음, 새 위반 없음 |
