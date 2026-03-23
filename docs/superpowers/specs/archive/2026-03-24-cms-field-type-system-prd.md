# CMS Detail Panel Field Type System — PRD

> Discussion: Detail Panel의 모든 필드가 단일 text input → 필드 타입 시스템 도입하여 타입별 Form Control 렌더링. Zod v4 `.meta({ fieldType })` 활용, 첫 배치 long-text + url.

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | CMS 관리자가 section-desc 노드를 선택 | Detail Panel에서 설명 텍스트를 편집하려 함 | 한 줄 text input만 보여 긴 텍스트 편집이 불편 | ✅ textarea 렌더링, Enter=줄바꿈, blur=커밋 |
| M2 | CMS 관리자가 link 노드를 선택 | href 필드에 URL을 입력 | 일반 text input이라 유효하지 않은 URL도 커밋됨, 실수 인지 불가 | ✅ input[url] + isValidUrl + --invalid 시각 피드백 |
| M3 | 디자이너/개발자가 새 콘텐츠 타입을 추가 | 스키마에 노드를 정의 | 필드 타입별 UI가 자동으로 결정되어 별도 렌더러 코드 불필요 | ✅ .meta({ fieldType }) → fieldsOf → DetailField switch |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `FieldType` 타입 | `'short-text' \| 'long-text' \| 'url'` union. 향후 확장 가능. cms-schema.ts에 정의. **long-text의 정의 = 줄바꿈 허용** | |
| `.meta({ fieldType })` | Zod v4 `.meta()` API로 스키마 필드에 타입 선언. `z.globalRegistry.get(schema)`로 읽음 | |
| `EditableField.fieldType` | 기존 인터페이스에 `fieldType: FieldType` 추가. `fieldsOf()` 에서 추출 | |
| `EditableGroupEntry.fieldType` | 그룹 엔트리에도 fieldType 전파. collectEditableGroups 경로 | |
| `DetailField` 분기 | fieldType switch로 타입별 컴포넌트 렌더링. CmsDetailPanel.tsx 내부 | |
| `TextareaField` | long-text용 `<textarea>`. 줄바꿈(`\n`) 허용. Enter/Shift+Enter/Cmd+Enter 모두 줄바꿈. 커밋 = blur만 | |
| `UrlField` | url용 `<input type="url">`. 커밋 시 URL 유효성 표시(빨간 테두리). 잘못된 값도 저장은 허용 | |
| `LocalizedText` 줄바꿈 지원 | long-text 필드 값에 `\n`이 있으면 렌더러에서 줄바꿈 표시. CSS `white-space: pre-line` 적용 | |
| CSS 클래스 | `cms-detail-field__textarea`, `cms-detail-field__input--url` 등. cms.css에 추가 | |

**변경되는 기존 파일:**
- `cms-schema.ts` — FieldType 타입 + `.meta()` 적용 + `fieldsOf()` 수정
- `CmsDetailPanel.tsx` — DetailField 분기 + TextareaField/UrlField 추가
- `cms-renderers.tsx` — long-text 필드의 `\n` 줄바꿈 렌더링 (white-space: pre-line)
- `cms.css` — textarea, url input, pre-line 스타일

**변경되지 않는 것:**
- `rename.ts` (generic update, 타입 무관 — `\n` 포함 문자열도 그대로 저장)
- `CmsInlineEditable.tsx` (인라인 편집은 항상 short-text, 한 줄)
- `collectEditableGroups()` 로직 (fieldType을 전파만, 그룹핑 로직 불변)

**초기 적용 매핑:**

| 노드 타입 | 필드 | fieldType | 이유 |
|----------|------|-----------|------|
| `section-desc` | value | `long-text` | 설명 텍스트, 줄바꿈 필요 |
| `link` | href | `url` | URL 유효성 피드백 필요 |
| 나머지 `.describe()` 필드 | — | `short-text` (기본값) | `.meta()` 없으면 자동 fallback |

완성도: 🟢

## ③ 인터페이스

> Detail Panel Form Control의 사용자 인터랙션

### short-text (기존 동작, 변경 없음)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 클릭 | text input 비포커스 | 포커스 + 커서 배치 | 표준 input 동작 | input 포커스, snapshotRef 캡처 | |
| 문자 입력 | input 포커스 | 텍스트 변경 (로컬) | 표준 input 동작, 아직 커밋 안 됨 | input 값 변경, store 미반영 | |
| Enter | input 포커스 | 커밋 (blur 없이) | 한 줄 텍스트에서 Enter = 입력 완료 | renameCommands.confirmRename 디스패치, store 반영 | |
| blur (Tab, 클릭 이동) | input 포커스 | 커밋 | 포커스 이탈 = 입력 완료 | renameCommands.confirmRename 디스패치, store 반영 | |
| Escape | input 포커스 | N/A (현재 미구현) | — | — | |

### long-text (새 타입)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 클릭 | textarea 비포커스 | 포커스 + 커서 배치 | 표준 textarea 동작 | textarea 포커스, snapshotRef 캡처 | |
| 문자 입력 | textarea 포커스 | 텍스트 변경 (로컬) | 표준 textarea 동작 | textarea 값 변경, store 미반영 | |
| Enter | textarea 포커스 | **줄바꿈 삽입** | long-text = 줄바꿈 허용이 정의. 멀티라인 편집의 기본 동작 | textarea에 `\n` 추가, store 미반영 | |
| Shift+Enter | textarea 포커스 | **줄바꿈 삽입** | Enter와 동일. 사용자 습관 차이를 수용 | textarea에 `\n` 추가, store 미반영 | |
| Cmd+Enter | textarea 포커스 | **줄바꿈 삽입** | Enter와 동일. 사용자 습관 차이를 수용 | textarea에 `\n` 추가, store 미반영 | |
| blur (Tab, 클릭 이동) | textarea 포커스 | **커밋** | blur = 유일한 커밋 트리거. Enter가 줄바꿈이므로 | renameCommands.confirmRename 디스패치, `\n` 포함 문자열 저장 | |
| Escape | textarea 포커스 | N/A (현재 미구현) | — | — | |

### url (새 타입)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 클릭 | url input 비포커스 | 포커스 + 커서 배치 | 표준 input 동작 | input 포커스, snapshotRef 캡처 | |
| 문자 입력 | url input 포커스 | 텍스트 변경 (로컬) | 표준 input 동작 | input 값 변경, store 미반영 | |
| Enter | url input 포커스 | 커밋 | short-text와 동일. 한 줄 입력 | renameCommands.confirmRename 디스패치 | |
| blur | url input 포커스 | 커밋 + 유효성 표시 | 커밋 후 URL 패턴 검증. 저장은 허용하되 시각 피드백 | store 반영 + 유효하지 않으면 빨간 테두리 | |
| Escape | url input 포커스 | N/A | — | — | |

### 렌더러 (캔버스) — long-text 줄바꿈 표시

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| store에 `\n` 포함 값 | 캔버스 렌더링 | `white-space: pre-line`으로 줄바꿈 표시 | `\n`은 콘텐츠. 입력한 줄바꿈이 캔버스에 반영되어야 편집 결과를 확인 가능 | 줄바꿈이 시각적으로 표시됨 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| E1: `.meta()` 없는 기존 필드 | fieldType 정보 없음 | 하위호환. 기존 스키마를 건드리지 않아도 동작해야 함 | `fieldsOf()`가 기본값 `'short-text'` 반환 | 기존과 동일한 text input 렌더링 | |
| E2: long-text에 빈 문자열 커밋 | textarea 비어있음, blur | 빈 텍스트도 유효한 콘텐츠. 현재 short-text와 동일하게 빈 값은 커밋 스킵 | 커밋 스킵 (snapshotRef와 동일) | store 변경 없음 | |
| E3: url에 불완전한 값 (예: "http://") | 작업 중간 상태 | 작업 흐름 차단 금지. 저장 후 나중에 완성 가능해야 함 | 저장 허용 + 빨간 테두리 경고 표시 | store 반영, 시각적 경고 | |
| E4: long-text 값에 `\n`만 있음 | 줄바꿈만 입력 | `.trim()`하면 빈 문자열 → 커밋 스킵. 의미 있는 콘텐츠 아님 | 커밋 스킵 | store 변경 없음 | |
| E5: undo/redo로 long-text 값 복원 | textarea에 이전 값 | rename plugin의 undo가 `\n` 포함 문자열을 복원 | textarea에 줄바꿈 포함 값 표시 | 정상 복원 (rename plugin은 값 타입 무관) | |
| E6: locale 전환 시 long-text | ko에 줄바꿈 있는 값 → en으로 전환 | LocaleMap이므로 locale별 독립. en에 줄바꿈 없을 수 있음 | en locale의 값 표시 (줄바꿈 유무 무관) | textarea 값 교체 | |
| E7: url 유효성 검증 기준 | 다양한 URL 형식 | 엄격한 정규식보다 `URL` 생성자 try/catch가 실용적. 상대 경로, mailto 등도 고려 | `new URL(value)` 성공 → 유효, 실패 → 경고 | 시각적 피드백만, 저장은 항상 허용 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 디자인 변경 불가 (memory: feedback_no_design_in_cms) | 전체 | ✅ 미위반 | — 필드 타입은 콘텐츠 편집 UI, 디자인 변경 아님 | |
| P2 | Rich text 기각 (memory: feedback_no_richtext) | ② TextareaField | ✅ 미위반 | — long-text는 plain text + 줄바꿈. bold/italic 미포함 | |
| P3 | 스키마 = 단일 소스 (memory: project_cms_zod_schema) | ② `.meta()` | ✅ 미위반 | — fieldType이 스키마에 선언, 별도 레지스트리 없음 | |
| P4 | rename plugin 경로 유지 | ③ 커밋 로직 | ✅ 미위반 | — 모든 타입이 renameCommands.confirmRename 사용 | |
| P5 | 파일명 = 주 export 식별자 (CLAUDE.md) | ② 새 파일 | ✅ 미위반 | — 새 파일 생성 없음. 기존 파일 내 컴포넌트 추가 | |
| P6 | UI SDK: 표준 UI 어휘, 완성품 (memory: feedback_ui_sdk_principles) | ② Form Control | ✅ 미위반 | — textarea, input[url]은 표준 HTML form control | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | `fieldsOf()` 반환 타입 변경 | EditableField에 fieldType 추가 → 이 타입을 사용하는 곳 모두 영향 | 중 | 기본값 `'short-text'`로 하위호환. 타입 에러는 컴파일 타임에 잡힘 | |
| S2 | `EditableGroupEntry` 타입 변경 | collectEditableGroups 소비자에 fieldType 전파 | 낮 | CmsDetailPanel만 소비. 영향 범위 좁음 | |
| S3 | `cms-renderers.tsx` LocalizedText | `white-space: pre-line` 추가 시 기존 short-text 노드에도 영향 가능 | 중 | long-text 필드를 가진 노드의 렌더러에만 적용. 전역 적용 금지 | |
| S4 | `cms.css` 스타일 추가 | 새 클래스 추가만, 기존 클래스 수정 없음 | 낮 | 충돌 없음 | |
| S5 | i18n 번역 시트 (localeFieldsOf) | long-text 필드의 `\n`이 번역 시트에 노출 | 낮 | localeFieldsOf는 필드명만 반환, 값 형식 무관 | |

완성도: 🟡

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| F1 | `white-space: pre-line`을 전역/공통 클래스에 적용 | ⑥ S3 | 기존 short-text 노드 레이아웃이 깨질 수 있음. section-desc 등 long-text 노드에만 적용 | |
| F2 | URL 유효성 실패 시 커밋 차단 | ④ E3 | 작업 중간 상태 저장을 막으면 편집 흐름 파괴 | |
| F3 | textarea에서 Enter로 커밋 | ③ long-text | long-text = 줄바꿈 허용이 정의. Enter 커밋은 이 정의와 모순 | |
| F4 | `.meta()` 없는 필드를 에러 처리 | ④ E1 | 하위호환 파괴. 기존 스키마 전체 수정 강제 | |
| F5 | bold/italic 등 rich text 마크업 도입 | ⑤ P2 | rich text 기각 원칙. 향후 별도 PRD로 검토 | |

완성도: 🟡

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①M1 | section-desc 노드 선택 → Detail Panel에 textarea 표시 | textarea 렌더링, 여러 줄 표시 | |
| V2 | ①M1 | textarea에 줄바꿈 입력(Enter) → blur | `\n` 포함 값이 store에 저장됨 | |
| V3 | ①M1 | 줄바꿈 포함 값이 캔버스에 표시 | `white-space: pre-line`으로 줄바꿈 시각 표시 | |
| V4 | ①M2 | link 노드 선택 → href 필드에 유효 URL 입력 → blur | 정상 커밋, 경고 없음 | |
| V5 | ①M2 | href에 "abc" (유효하지 않은 URL) 입력 → blur | 저장은 되지만 빨간 테두리 경고 표시 | |
| V6 | ①M3 | `.meta()` 없는 기존 필드 (예: badge.value) | 기존과 동일한 text input 렌더링 (하위호환) | |
| V7 | ④E5 | long-text 편집 후 Ctrl+Z (undo) | 이전 값(`\n` 포함) 복원, textarea에 정상 표시 | |
| V8 | ④E6 | long-text 편집 후 locale 전환 (ko → en) | en locale의 값 표시 (줄바꿈 유무 독립) | |
| V9 | ④E4 | textarea에 줄바꿈만 입력 후 blur | trim 결과 빈 문자열 → 커밋 스킵 | |
| V10 | ④E7 | href에 "mailto:a@b.com" 입력 | `new URL()` 성공 → 유효, 경고 없음 | |

완성도: 🟡

---

**전체 완성도:** 🟢 8/8

**교차 검증:**
1. 동기 ↔ 검증: ✅ M1→V1,V2,V3 / M2→V4,V5 / M3→V6
2. 인터페이스 ↔ 산출물: ✅ 모든 Form Control이 산출물에 대응
3. 경계 ↔ 검증: ✅ E1~E7 모두 V시나리오에 커버
4. 금지 ↔ 출처: ✅ F1~F5 모두 출처 유효
5. 원칙 대조 ↔ 전체: ✅ 위반 없음
