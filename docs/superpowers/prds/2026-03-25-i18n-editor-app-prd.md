# i18n Editor App — PRD

> Discussion: CMS 데이터 기반 독립 스프레드시트 앱. cellEdit plugin 개밥먹기. 구글 시트로 i18n 편집하듯이 그대로 흉내.

## ① 동기

### WHY

- **Impact**: cellEdit plugin을 실전 앱에서 검증할 기회 없음. CmsI18nSheet는 모달 오버레이라 화면 좁고 cellEdit 미적용. 개밥먹기 목적인 이 프로젝트에 "진짜 쓰는 스프레드시트 앱"이 없음
- **Forces**: i18n 편집은 본질적으로 스프레드시트 — key 열 + 언어별 열. CMS 보조 기능이 아니라 독립 도구가 자연스러움
- **Decision**: `/i18n` 라우트에 독립 앱 생성. CMS store에서 번역 대상을 adapter로 추출해 자체 Grid store로 편집. 기각 대안: (A) CMS 내 탭 전환 → 별도 앱 아님, (B) 분할 패널 → 화면 좁음
- **Non-Goals**: 범용 i18n 파일 편집기 아님 (JSON/YAML import 없음). CMS↔i18n 실시간 싱크 아님 (독립 store). 새 언어 추가 UI 없음

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | 앱 진입 `/i18n` | 페이지 로드 | CMS 데이터에서 번역 가능 필드가 Grid로 표시됨 (key, ko, en, ja 열) | |
| S2 | Grid 셀 모드, ko 열에 "헤드리스 ARIA 엔진" | Delete | 셀 값 클리어 (행 삭제 아님) — cellEdit plugin | |
| S3 | Grid 셀 모드 | Enter | 아래 행으로 이동 (편집 진입 아님) — cellEdit | |
| S4 | Grid 셀 모드, en 열 포커스 | F2 → 값 수정 → Enter | 값 confirm + 아래 행 이동 — enterContinue | |
| S5 | Grid 셀 모드, ko 열 | Mod+C → 아래 이동 → Mod+V | 셀 값 복사 붙여넣기 — cellEdit clipboard | |
| S6 | Grid 셀 모드 | Mod+X → 아래 이동 → Mod+V | 셀 값 잘라내기 + 붙여넣기 — cellEdit | |
| S7 | 편집 후 | Mod+Z | undo — history plugin | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `pages/PageI18nEditor.tsx` | 독립 앱 페이지. CMS store → adapter → Grid(cellEdit+enterContinue). PageI18nDataTable 패턴 기반이나 CMS 실제 데이터 사용 | |
| `router.tsx` 확장 | `/i18n` 라우트 추가 — `lazy(() => import('./pages/PageI18nEditor'))` | |

완성도: 🟢

## ③ 인터페이스

> Grid 기반 — cellEdit plugin이 키보드 동작을 소유. 이 앱은 Grid + cellEdit 조합의 소비자

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| ↑↓←→ | 셀 모드 | 셀 간 이동 | navigate 축 (Grid 기본) | 포커스 이동 | |
| Enter | 셀 모드 | 아래 행 이동 | cellEdit plugin keyMap | 아래 행 포커스, 셀 모드 유지 | |
| Shift+Enter | 셀 모드 | 위 행 이동 | cellEdit plugin keyMap | 위 행 포커스 | |
| F2 | 셀 모드, 편집 가능 열 | 편집 진입 | edit 축 keyMap (cellEdit 미shadow) | 편집 모드 | |
| 타이핑 | 셀 모드, 편집 가능 열 | replace 모드 편집 진입 | replaceEditPlugin | 편집 모드, 값 대체 | |
| Enter | 편집 모드 | confirm + 아래 이동 | AriaEditable enterContinue | 아래 행 셀 모드 | |
| Shift+Enter | 편집 모드 | confirm + 위 이동 | AriaEditable enterContinue | 위 행 셀 모드 | |
| Tab | 편집 모드 | confirm + 오른쪽 셀 + 편집 | AriaEditable tabContinue | 오른쪽 셀 편집 모드 | |
| Escape | 편집 모드 | cancel — 값 복원 | AriaEditable 기본 | 셀 모드, 원래 값 | |
| Delete | 셀 모드 | 셀 값 클리어 | cellEdit → clearCellValue | 셀 값 "" | |
| Mod+X | 셀 모드 | 셀 값 cut | cellEdit → cutCellValue | 값→버퍼, 셀→"" | |
| Mod+C | 셀 모드 | 셀 값 copy | cellEdit → copyCellValue | 값→버퍼 | |
| Mod+V | 셀 모드 | 셀 값 paste | cellEdit → pasteCellValue | 버퍼→셀 | |
| Mod+Z | 어디서든 | undo | history plugin | 이전 상태 | |
| Home/End | 셀 모드 | 첫/마지막 열 | navigate 축 | N/A — 기존 동작 | |
| key 열 클릭 | 셀 모드 | 해당 행 포커스만 (편집 불가) | key 열은 읽기 전용 — Editable 미렌더 | 포커스만 이동 | |
| 더블클릭 | 편집 가능 열 | 편집 진입 | AriaEditable 기본 | 편집 모드 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| key 열에서 F2 | 셀 모드, key 열 포커스 | key는 식별자 — 편집 불가. Editable 미렌더이므로 rename 시작해도 UI 변화 없음 | F2 무시 (Editable 없으면 rename 시작해도 커서 표시 안 됨) | 셀 모드 유지 | |
| CMS 데이터에 번역 필드 없는 노드 | 페이지 로드 | adapter가 localeFieldsOf로 필터 — type에 locale 필드가 없으면 skip | Grid에 표시 안 됨 | 정상 | |
| 빈 셀에서 Delete | 셀 모드, 값 "" | clearCellValue no-op (cellEdit PRD 경계#3) | store 변경 없음 | 그대로 | |
| 마지막 행 Enter | 셀 모드 | focusNext가 같은 노드 반환 | 이동 없음 | 그대로 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 레이어 = 라우트 (feedback_layer_equals_route) | ② `/i18n` 라우트 = 독립 앱 | ✅ 별도 라우트 = 별도 앱 레이어 | — | |
| 2 | 하나의 앱 = 하나의 store (feedback_one_app_one_store) | ② 자체 Grid store (CMS store와 독립) | ✅ adapter로 초기 데이터 변환 후 독립 store | — | |
| 3 | 파일명 = 주 export (feedback_filename_equals_export) | ② PageI18nEditor.tsx → export default PageI18nEditor | ✅ | — | |
| 4 | os 검증 전략 (feedback_os_validation_strategy) | ① cellEdit 실전 검증 | ✅ 날코딩 아닌 os(Grid+cellEdit) 사용 | — | |
| 5 | barrel export 금지 (CLAUDE.md) | ② 직접 import | ✅ | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | router.tsx | 새 라우트 추가 — 기존 라우트 영향 없음 | 낮 | lazy import으로 번들 분리 | |
| 2 | CmsI18nSheet 중복 | 같은 데이터를 두 곳에서 편집 가능 | 낮 | 용도 다름: CmsI18nSheet=CMS 내 빠른 편집, i18n Editor=전체 화면 집중 편집. 공존 허용 | |
| 3 | cmsI18nAdapter import | i18n Editor가 CMS adapter에 의존 | 낮 | adapter는 순수 함수, 의존 방향 문제 없음 (pages → pages/cms 참조) | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | CMS store를 직접 참조/공유 | ⑤#2 독립 store | adapter로 변환 후 자체 store 사용 | |
| 2 | CmsI18nSheet 수정 또는 삭제 | ⑥#2 공존 | 기존 CMS 내 모달은 그대로 유지 | |
| 3 | cellEdit/clipboard 커스텀 재구현 | ⑤#4 os 검증 | Grid enableEditing이 자동 포함하는 cellEdit 그대로 사용 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 동기 | `/i18n` 접근 → Grid 렌더링 | role="grid" 존재, 행 수 = CMS 번역 필드 수, 4열 (key+3 locale) | |
| V2 | S2 동기 | 셀 모드 Delete → 셀 클리어 | 행 수 유지, 셀 텍스트 "" | |
| V3 | S3 동기 | 셀 모드 Enter → 아래 행 이동 | 포커스 행 변경, 편집 모드 아님 | |
| V4 | S4 동기 | F2 → 수정 → Enter → 아래 이동 | 값 변경 확인, 포커스 아래 행 | |
| V5 | S5 동기 | Mod+C → 아래 → Mod+V | 대상 셀 = 복사 값 | |
| V6 | S7 동기 | 편집 후 Mod+Z | 이전 값 복원 | |
| V7 | 경계#1 | key 열에서 F2 → 편집 불가 | 편집 UI 없음 | |
| V8 | 경계#4 | 마지막 행 Enter → 이동 없음 | 같은 행 유지 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8 — 교차 검증 통과
