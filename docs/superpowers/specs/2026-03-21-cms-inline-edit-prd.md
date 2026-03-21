# CMS Inline Edit + Detail Panel — PRD

> Discussion: CMS 노드의 텍스트 콘텐츠를 캔버스 인라인(Enter) + 우측 Form 패널 두 경로로 편집. rename 플러그인 경유로 undo 일관성 유지.

## 1. 동기

| # | Given | Data (before) | When | Then | Data (after) | 역PRD |
|---|-------|--------------|------|------|-------------|-------|
| M1 | CMS 캔버스에서 리프 노드(text, badge, stat, step, pattern, link 등)에 포커스됨 | `entities['hero-title'].data.value = { ko: 'Headless ARIA Engine', en: '', ja: '' }` | Enter 키 입력 | 노드 텍스트가 contenteditable로 전환, 전체 선택됨 | `RENAME_ID` entity 생성, `active: true` | |
| M2 | CMS 캔버스에서 컨테이너 노드(section, card, links)에 포커스됨 | spatial parentId = ROOT_ID 또는 section | Enter 키 입력 | 기존 enterChild 동작 유지 (하위 깊이 진입) | spatialParentId 변경 | |
| M3 | 우측 Detail Panel에서 포커스 노드의 필드를 확인하고 싶음 | 캔버스 `canvasFocusedId = 'hero-title'` | 패널이 열려있음 | 해당 노드의 편집 가능 텍스트 필드들이 label+input Form으로 표시 | (읽기 전용 조회) | |
| M4 | Detail Panel Form에서 텍스트를 수정하고 싶음 | `entities['hero-title'].data.value.ko = 'Headless ARIA Engine'` | Form input에서 값 변경 후 blur | confirmRename 실행, 캔버스 텍스트 즉시 반영 | `entities['hero-title'].data.value.ko = '새 제목'` | |

상태: 🟢

## 2. 인터페이스

### 2-A. 캔버스 인라인 편집

| 입력 | Data (before) | 조건 | 결과 | Data (after) | 역PRD |
|------|--------------|------|------|-------------|-------|
| Enter | 노드 포커스됨 | 리프 노드 (children.length === 0) + rename 비활성 | startRename 실행 → contenteditable 전환 | RENAME_ID active: true | |
| Enter | 노드 포커스됨 | 컨테이너 노드 (children.length > 0) | 기존 enterChild (spatial) | spatialParentId 변경 | |
| Enter (편집 중) | contenteditable 활성 | IME 비합성 + 값 변경됨 | confirmRename → 텍스트 갱신, contenteditable 해제 | entity.data[field] = newValue | |
| Enter (편집 중) | contenteditable 활성 | IME 합성 중 | 무시 (합성 완료까지 대기) | 변경 없음 | |
| Escape (편집 중) | contenteditable 활성 | — | cancelRename → 원래 값 복원, contenteditable 해제 | RENAME_ID active: false | |
| blur (편집 중) | contenteditable 활성 | — | confirm (빈값/동일값이면 cancel) | confirmRename 또는 cancelRename | |
| Tab (편집 중) | contenteditable 활성 | — | confirm + rename 종료 | confirmRename | |
| ↑↓←→ (편집 중) | contenteditable 활성 | — | 텍스트 커서 이동 (spatial/CRUD 키 격리됨) | 변경 없음 | |
| Delete (편집 중) | contenteditable 활성 | — | 텍스트 삭제 (CRUD 키 격리됨) | 변경 없음 | |
| 더블클릭 | Editable 영역 | rename 비활성 | startRename 실행 | RENAME_ID active: true | |

### 2-B. Detail Panel (우측 Form)

| 입력 | Data (before) | 조건 | 결과 | Data (after) | 역PRD |
|------|--------------|------|------|-------------|-------|
| 캔버스 포커스 변경 | canvasFocusedId = 이전 노드 | — | 패널 내용이 새 노드의 필드로 갱신 | (읽기) | |
| Form input 값 변경 + blur | entity.data[field] = 이전값 | 값이 변경됨 | confirmRename(nodeId, field, newValue) | entity.data[field] = newValue | |
| Form input 값 변경 + blur | entity.data[field] = 이전값 | 값이 동일하거나 빈값 | 아무 일도 안 함 (불필요한 커맨드 안 쌓음) | 변경 없음 | |
| Form input Enter | entity.data[field] = 이전값 | 값이 변경됨 | confirmRename 실행 (blur와 동일) | entity.data[field] = newValue | |
| 캔버스 undo (Mod+Z) | entity.data[field] = newValue | — | Form도 이전 값으로 갱신 (store 구독) | entity.data[field] = 이전값 | |

### 인터페이스 체크리스트

- [x] ↑↓←→: 편집 중 격리됨 (이미 처리). 비편집 시 spatial nav 유지
- [x] Enter: 리프→startRename, 컨테이너→enterChild, 편집 중→confirm
- [x] Escape: 편집 중→cancel
- [x] Tab: 편집 중→confirm
- [x] Space: 편집 중→텍스트 입력 (격리됨)
- [x] Home/End: 편집 중→텍스트 커서 이동 (격리됨)
- [x] Mod+Z: undo (history plugin, 캔버스+패널 양쪽 반영)
- [x] 더블클릭: startRename
- [x] 이벤트 버블링: Detail Panel은 별도 Zone — 캔버스 이벤트와 격리

상태: 🟢

## 3. 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `rename()` 플러그인 CMS 등록 | `sharedPlugins`에 `rename()` 추가 (CmsLayout.tsx) | |
| cmsKeyMap Enter 분기 | 리프(children === 0) → `startRename(focused)`, 컨테이너 → 기존 enterChild | |
| CmsCanvas `Aria.Editable` 적용 | NodeContent 내 텍스트 렌더링을 `<Aria.Editable field="...">` 로 래핑 | |
| `Aria.Editable` placeholder prop | `placeholder` prop 추가 → `data-placeholder` 속성으로 렌더링. CSS `:empty::before`로 표시 | |
| `CmsDetailPanel.tsx` | 새 컴포넌트. canvasFocusedId의 entity를 읽어 타입별 텍스트 필드를 Form으로 표시 | |
| 타입별 필드 매핑 | 엔티티 타입 → 편집 가능 텍스트 필드 목록 (cms-renderers 또는 별도 헬퍼) | |
| 레이아웃 3열 확장 | `cms-body`: sidebar \| canvas-area \| detail-panel. CSS grid 변경 | |

### 타입별 텍스트 필드 매핑

| 타입 | 편집 필드 | LocaleMap? |
|------|----------|-----------|
| text | `value` | ✅ |
| badge | `value` | ✅ |
| cta | `primary`, `secondary` | ✅ |
| stat | `value`, `label` | value: ❌ (plain), label: ✅ |
| step | `num`, `title`, `desc` | num: ❌, title/desc: ✅ |
| pattern | `name` | ✅ |
| link | `label`, `href` | label: ✅, href: ❌ |
| brand | `name`, `license` | ❌ |
| section-label | `value` | ✅ |
| section-title | `value` | ✅ |
| section-desc | `value` | ✅ |
| section | — (읽기전용: variant 표시) | — |
| card | — (컨테이너, 자체 필드 없음) | — |
| icon | — (후속: 아이콘 picker) | — |
| links | — (컨테이너) | — |

### Detail Panel Form 렌더링 규칙

- LocaleMap 필드: 현재 locale의 값만 input에 표시 (i18n Sheet가 전체 locale 담당)
- plain string 필드: 그대로 input에 표시
- 읽기전용 필드 (type, variant): disabled 또는 label로만 표시
- confirmRename의 newValue: LocaleMap 필드면 `{ ...기존맵, [locale]: newValue }`, plain이면 newValue 그대로

상태: 🟢

## 4. 경계

| 조건 | Data (before) | 예상 동작 | Data (after) | 역PRD |
|------|--------------|----------|-------------|-------|
| 리프지만 편집 가능 필드 없음 (icon, 향후) | `{ type: 'icon', value: 'database' }` | Enter 무시 (startRename 안 함). 인라인 편집 불가 | 변경 없음 | |
| section 노드에서 Enter | `{ type: 'section', variant: 'hero' }` | enterChild (기존 동작) | spatialParentId 변경 | |
| 인라인 편집 중 다른 노드 클릭 | RENAME_ID active: true, nodeId: X | blur → confirm/cancel → 클릭 대상으로 포커스 이동 | 편집 확정 후 새 노드 포커스 | |
| Detail Panel에서 편집 중 캔버스 포커스 변경 | Form에 미저장 값 있음 | blur 발생 → 자동 커밋 → 패널 새 노드로 갱신 | 이전 노드 값 확정, 새 노드 표시 | |
| canvasFocusedId가 빈 문자열 (초기 상태) | 아무 노드도 포커스 안됨 | Detail Panel 빈 상태 ("노드를 선택하세요" 등) | — | |
| undo로 rename 되돌림 | entity.data[field] = newValue | 캔버스 텍스트 + Detail Panel Form 모두 이전 값으로 갱신 | entity.data[field] = 이전값 | |
| LocaleMap 필드에서 빈 locale 편집 | `{ ko: '값', en: '', ja: '' }`, locale: 'en' | 인라인: fallback 값을 초기값으로 표시 (사용자가 보던 텍스트 유지). 확정 시 해당 locale에 저장 | `{ ko: '값', en: '새 값', ja: '' }` | |
| LocaleMap 필드가 비어있고 편집 안 함 | `{ ko: '값', en: '', ja: '' }`, locale: 'en' | contenteditable에 placeholder 표시 (fallback 텍스트, 반투명). 편집 시작하면 placeholder 사라짐 | 변경 없음 | |

상태: 🟢

## 5. 금지

| # | 하면 안 되는 것 | 이유 | 역PRD |
|---|---------------|------|-------|
| N1 | Detail Panel에서 디자인 속성(className, variant, role) 변경 | "CMS에서 디자인 변경 불가" 핵심 가치. 콘텐츠만 수정 | |
| N2 | Form에서 직접 store mutation (engine 우회) | undo/redo history가 끊김. FloatingToolbar의 실수 반복 금지 | |
| N3 | 컨테이너 노드(section, card, links)에서 Enter → 인라인 편집 | enterChild와 충돌. 컨테이너는 구조 탐색용 | |
| N4 | Detail Panel에서 노드 타입 변경 (card→step 등) | 타입 변환은 이 PRD 범위 밖 | |
| N5 | Rich text 편집 (bold, italic 등) | plain text 편집만. 확정된 원칙 | |
| N6 | Detail Panel에서 다국어 전체 편집 | i18n Sheet의 역할. Panel은 현재 locale만 | |

상태: 🟢

## 6. 검증

| # | 시나리오 | 예상 결과 | 역PRD |
|---|---------|----------|-------|
| V1 | 리프 노드 포커스 → Enter → 텍스트 입력 → Enter | contenteditable 출현 → 텍스트 변경 → contenteditable 사라짐, DOM 텍스트 갱신 | |
| V2 | 리프 노드 포커스 → Enter → Escape | 원래 텍스트 복원, contenteditable 사라짐 | |
| V3 | 컨테이너 노드(section) 포커스 → Enter | enterChild 동작 (하위 깊이 진입), 인라인 편집 안 열림 | |
| V4 | 인라인 편집 완료 후 Mod+Z | 텍스트가 이전 값으로 복원 | |
| V5 | 캔버스에서 노드 포커스 → Detail Panel에 해당 필드 표시 | 타입별 올바른 필드 목록 + 현재 locale 값 | |
| V6 | Detail Panel input 수정 → blur | 캔버스 텍스트 즉시 갱신 | |
| V7 | Detail Panel 수정 후 Mod+Z | 캔버스 + Panel 모두 이전 값 복원 | |
| V8 | 인라인 편집 중 IME 합성 → Enter | 합성 완료까지 confirm 안 됨 | |
| V9 | canvasFocusedId 없음 (초기) | Detail Panel 빈 상태 표시 | |
| V10 | 더블클릭으로 인라인 편집 진입 | contenteditable 출현, 전체 선택 | |
| V11 | 빈 locale 필드에서 Aria.Editable 표시 | placeholder 텍스트(fallback)가 반투명으로 보임 | |
| V12 | placeholder 표시 중 Enter → 편집 시작 | placeholder 사라지고 fallback 값이 초기값으로 들어감 | |

상태: 🟢

---

**전체 상태:** 🟢 6/6
