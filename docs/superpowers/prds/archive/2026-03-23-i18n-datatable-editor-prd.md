# i18n DataTable Editor — PRD

> Discussion: os 기본 편집 기능(Grid + plugins)으로 구글 시트급 스프레드시트 편집 경험을 구현. i18n key-locale 데이터를 샘플로 사용. 갭 발견 시 plugin으로 해소 후 os 흡수 판단.

## ① 동기

| # | Given | When | Then | os 갭 | 역PRD |
|---|-------|------|------|------|-------|
| M1 | i18n 번역 데이터가 Grid에 로드됨 (행=키, 열=locale) | 사용자가 셀에 포커스하고 바로 타이핑 | 기존 값이 대체되며 편집 모드 진입, 입력한 텍스트가 표시 | **새 plugin 필요** (quickEdit) — printable key → 편집 진입 | |
| M2 | 셀을 편집 중 | Tab 키 입력 | 현재 셀 확정 → 오른쪽 다음 셀로 이동 + 편집 모드 유지 | **Tab 순회 없음** — Tab은 현재 confirm+exit만 | |
| M3 | 행의 마지막 locale 셀(ja)을 편집 중 | Tab 키 입력 | 현재 셀 확정 → 다음 행의 첫 locale 셀(ko)로 이동 + 편집 모드 유지 | **행 경계 Tab 순환 없음** | |
| M4 | 여러 셀에 번역을 입력함 | Mod+Z 입력 | 마지막 편집이 취소됨 (셀 단위 undo) | ✅ history plugin (rename confirm = Command 단위) | |
| M5 | 특정 셀의 번역 텍스트를 복사하고 싶음 | 셀 포커스 → Mod+C → 다른 셀 → Mod+V | 셀 값이 복사/붙여넣기됨 (행 단위가 아닌 셀 단위) | **셀 단위 clipboard 없음** — 현재 행 단위 | |
| M6 | 번역 현황을 파악하고 싶음 | DataTable을 봄 | 빈 셀(미번역)이 시각적으로 구분됨 | ✅ renderCell 커스텀으로 가능 | |

> **M5(셀 단위 복붙)**: 중요도 높음 🔴. 이번 사이클에 포함하되, M1~M3 완성 후 착수. 부담 시 백로그 전환 가능.

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `PageI18nDataTable.tsx` | 독립 Route 페이지. 샘플 i18n NormalizedData + Grid + plugins 조합. `/collection/i18n` 경로 | `PageI18nDataTable.tsx::PageI18nDataTable` |
| `sharedI18nData.ts` | 샘플 i18n 데이터. key × locale(ko/en/ja) 구조의 NormalizedData. 빈 셀 포함 | `sharedI18nData.ts::i18nColumns, i18nInitialData` |
| rename plugin 확장 | `startRename`에 replace 모드 추가. printable key → 기존 값 대체 + 편집 진입. 기존 F2 preserve 모드는 디폴트 유지 | `rename.ts::renameCommands.startRename({ replace, initialChar })` |
| `Aria.Editable` 확장 | replace 모드 지원 — 기존 텍스트 클리어 + initialChar 삽입. IME(한글) composition 진입도 replace 트리거로 처리 | `aria.tsx::AriaEditable (allowEmpty, tabContinue)` |
| navigate axis 확장 | Tab 셀 순회 — Grid 모드에서 Tab/Shift+Tab으로 셀 간 이동. 행 경계 넘어가는 순환 포함 | `navigate.ts::navigate({ grid: { tabCycle } })` |
| clipboard plugin 확장 | 셀 단위 copy/paste. 현재 행 단위 → Grid에서 포커스된 셀 값 복사 모드 추가. (중요도 🔴, M1~M3 완성 후 착수) | `clipboard.ts::COPY_CELL, PASTE_CELL` |

### os 갭 요약

| 갭 | 해소 위치 | 유형 |
|----|----------|------|
| printable key → replace 편집 | rename plugin + Aria.Editable | 기존 확장 |
| Tab 셀 순회 (행 경계 포함) | navigate axis | 기존 확장 |
| 셀 단위 copy/paste | clipboard plugin | 기존 확장 |

### 데이터 스키마

```
NormalizedData {
  entities: {
    'hero-title': { id: 'hero-title', data: { cells: ['hero.title', '헤드리스 ARIA', 'Headless ARIA', ''] } },
    'hero-sub':   { id: 'hero-sub',   data: { cells: ['hero.subtitle', '모든 ARIA role…', 'Build fully…', ''] } },
    'stat-count': { id: 'stat-count', data: { cells: ['stat.patterns', '14', '14', '14'] } },
    ...
  },
  relationships: { '__root__': ['hero-title', 'hero-sub', 'stat-count', ...] }
}

columns: [
  { key: 'key', header: 'Key' },
  { key: 'ko', header: 'ko' },
  { key: 'en', header: 'en' },
  { key: 'ja', header: 'ja' },
]
```

> cells[0] = key (읽기 전용), cells[1..3] = locale 값 (편집 가능)

완성도: 🟢

## ③ 인터페이스

### 내비게이션 모드 (셀 포커스, 편집 아님)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| ↑ | 셀 [r,c] 포커스 | 같은 열 윗행으로 이동 | grid navigate axis — 세로 이동 | 셀 [r-1,c] 포커스 | |
| ↓ | 셀 [r,c] 포커스 | 같은 열 아랫행으로 이동 | grid navigate axis — 세로 이동 | 셀 [r+1,c] 포커스 | |
| ← | 셀 [r,c] 포커스 | 같은 행 왼쪽 셀로 이동 | grid navigate axis — 가로 이동 | 셀 [r,c-1] 포커스 | |
| → | 셀 [r,c] 포커스 | 같은 행 오른쪽 셀로 이동 | grid navigate axis — 가로 이동 | 셀 [r,c+1] 포커스 | |
| Home | 셀 [r,c] 포커스 | 현재 행의 첫 셀로 이동 | grid navigate axis | 셀 [r,0] 포커스 | |
| End | 셀 [r,c] 포커스 | 현재 행의 마지막 셀로 이동 | grid navigate axis | 셀 [r,last] 포커스 | |
| Mod+Home | 셀 [r,c] 포커스 | 첫 행 첫 셀로 이동 | grid navigate axis — 글로벌 | 셀 [0,0] 포커스 | |
| Mod+End | 셀 [r,c] 포커스 | 마지막 행 마지막 셀로 이동 | grid navigate axis — 글로벌 | 셀 [last,last] 포커스 | |
| Tab | 셀 [r,c] 포커스 | 오른쪽 다음 셀로 이동. 행 끝이면 다음 행 첫 셀 | navigate axis 확장 — Tab 셀 순회 (구글 시트 패턴) | 셀 [r,c+1] 또는 [r+1,0] 포커스 | |
| Shift+Tab | 셀 [r,c] 포커스 | 왼쪽 이전 셀로 이동. 행 처음이면 윗행 마지막 셀 | navigate axis 확장 — 역방향 Tab 순회 | 셀 [r,c-1] 또는 [r-1,last] 포커스 | |
| Space | 셀 [r,c] 포커스 | 행 선택 토글 | select axis — 기존 동작 | 행 r 선택/해제 | |
| F2 | 셀 [r,c] 포커스, 편집 가능 셀 | preserve 편집 진입. 기존 값 유지, 커서 끝 | rename plugin — 기존 startRename | 편집 모드, 기존 텍스트 선택 | |
| Enter | 셀 [r,c] 포커스, 편집 가능 셀 | preserve 편집 진입 (F2와 동일) | rename plugin — 기존 startRename | 편집 모드, 기존 텍스트 선택 | |
| printable key (영문) | 셀 [r,c] 포커스, 편집 가능 셀 | replace 편집 진입. 기존 값 클리어 + 입력한 글자로 시작 | rename plugin 확장 — replace 모드 | 편집 모드, 입력 글자만 표시 | |
| printable key (한글) | 셀 [r,c] 포커스, 편집 가능 셀 | compositionstart에서 replace 편집 진입. 기존 값 클리어 + 조합 중인 글자 표시 | rename plugin 확장 — IME composition도 replace 트리거 | 편집 모드, 조합 중인 글자 표시 | |
| 더블클릭 | 셀 [r,c] 위 | preserve 편집 진입 (F2와 동일) | rename plugin — 기존 동작 | 편집 모드 | |
| Delete | 셀 [r,c] 포커스 | 행 삭제 | crud plugin — 기존 동작 | 행 제거, focusRecovery로 다음 행 포커스 | |
| Mod+Z | 아무 상태 | 마지막 명령 취소 | history plugin — 기존 동작 | 이전 상태 복원 | |
| Mod+Shift+Z | 아무 상태 | 취소한 명령 재실행 | history plugin — 기존 동작 | 재실행 상태 | |
| Mod+C | 셀 [r,c] 포커스 | 셀 값 복사 | clipboard plugin 확장 — 셀 단위 | 클립보드에 셀 값 | |
| Mod+V | 셀 [r,c] 포커스 | 셀 값 붙여넣기 | clipboard plugin 확장 — 셀 단위 | 셀 값 교체 | |

### 편집 모드 (contentEditable 활성)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| Enter | 편집 중 | 편집 확정 | rename confirmRename — 기존 동작 | 내비게이션 모드, 같은 셀 포커스 | |
| Escape | 편집 중 | 편집 취소. 원래 값 복원 | rename cancelRename — 기존 동작 | 내비게이션 모드, 같은 셀 포커스 | |
| Tab | 편집 중 | 편집 확정 → 다음 셀로 이동 + 편집 모드 유지 | navigate axis 확장 — 편집 연속 Tab 순회 | 다음 셀 편집 모드 (preserve) | |
| Shift+Tab | 편집 중 | 편집 확정 → 이전 셀로 이동 + 편집 모드 유지 | navigate axis 확장 — 역방향 편집 연속 | 이전 셀 편집 모드 (preserve) | |
| ↑↓←→ | 편집 중 | 텍스트 내 커서 이동 (grid 내비게이션 아님) | 편집 모드에선 contentEditable이 키 소비 | 편집 유지, 커서 위치 변경 | |
| 한글 조합 중 Enter | 편집 중, isComposing=true | 조합 확정 (편집 확정 아님) | IME composition — compositionend 전까지 Enter 무시 | 편집 유지, 조합 완료된 글자 표시 | |

> **읽기 전용 셀(key 열, cells[0])**: printable key / F2 / Enter / 더블클릭 시 편집 진입하지 않음. 내비게이션만 가능.

완성도: 🟢

## ④ 경계

| # | 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|---|----------|----------|------------------------|----------|----------|-------|
| E1 | 편집 모드에서 ↑↓←→ 입력 | 셀 편집 중 (contentEditable 활성) | contentEditable이 포커스를 갖고 있으면 화살표는 텍스트 커서 이동이어야 함. Grid keyMap이 가로채면 편집 불가 | Grid keyMap이 편집 중엔 화살표를 소비하지 않음 — contentEditable에 위임 | 텍스트 내 커서 이동, Grid 내비게이션 안 함 | |
| E2 | 읽기 전용 셀(key 열)에서 printable key 입력 | key 셀 [r,0] 포커스 | key는 식별자이지 편집 대상이 아님. 실수로 편집되면 데이터 무결성 파괴 | 편집 진입하지 않음. 키 입력 무시 | 내비게이션 모드 유지 | |
| E3 | 한글 조합 중 Escape | 편집 중, composingRef=true | 조합 중 Escape는 조합 취소인지 편집 취소인지 모호. 구글 시트는 조합+편집 모두 취소 | 조합 취소 + 편집 취소. 원래 값 복원. Aria.Editable의 기존 composingRef 패턴 활용 | 내비게이션 모드, 원래 값 | |
| E4 | 한글 조합 중 Tab | 편집 중, composingRef=true | Tab은 조합 확정 + 셀 확정 + 다음 셀 이동이어야 함. 조합 미확정 상태로 이동하면 글자 손실 | compositionend 먼저 → confirmRename → 다음 셀 편집 진입 | 다음 셀 편집 모드 | |
| E10 | 한글 첫 타이핑으로 replace 진입 | 셀 포커스 (내비게이션 모드) | `isPrintableKey`가 `isComposing=true`이면 false 반환 → keydown으로는 한글 replace 감지 불가. **compositionstart 이벤트를 별도 감지**하여 replace 모드 진입해야 함 | compositionstart → startRename(replace) → 기존 값 클리어 → 조합 진행 | 편집 모드, 조합 중인 글자 표시 | |
| E5 | 마지막 행 마지막 셀에서 Tab | 편집 중, 셀 [lastRow, lastCol] | 더 이동할 셀 없음. 순환할지 멈출지 | Tab 순회 멈춤 — 편집 확정만 하고 같은 셀 유지. 무한 루프 방지 | 내비게이션 모드, 같은 셀 | |
| E6 | 첫 행 첫 셀에서 Shift+Tab | 편집 중, 셀 [0, 0] | 역방향 끝. E5와 대칭 | Shift+Tab 순회 멈춤 — 편집 확정만 | 내비게이션 모드, 같은 셀 | |
| E7 | 빈 문자열로 편집 확정 | 편집 중, 내용 전부 지움 | 빈 셀 = 미번역 상태. 기존 rename은 빈 문자열이면 cancel 처리 | 빈 문자열을 **유효한 값으로 확정** — 미번역은 정상 상태 | 셀 값 = '', 빈 셀 시각 표시 | |
| E8 | replace 모드 진입 직후 Escape | replace로 편집 진입했지만 바로 취소 | 사용자가 실수로 키를 눌렀을 때 원래 값이 복원되어야 함 | cancelRename — 원래 값 복원 | 내비게이션 모드, 원래 값 | |
| E9 | 셀 편집 중 외부 클릭 (Grid 밖) | 편집 중, blur 발생 | blur는 confirm으로 처리 — 기존 Aria.Editable 동작 | 편집 확정 | 내비게이션 모드, 새 값 저장 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | ARIA 표준 용어 우선, 자체 이름 발명 금지 (feedback_naming_convention) | ② rename 확장, navigate 확장 | ✅ 위반 없음 | rename/navigate는 기존 이름. replace 모드는 APG "alphanumeric keys" 서술과 일치 | |
| P2 | 파일명 = 주 export 식별자 (feedback_filename_equals_export) | ② PageI18nDataTable, sharedI18nData | ✅ 위반 없음 | 파일명이 export와 일치 | |
| P3 | 테스트: 계산은 unit, 인터랙션은 통합(userEvent→DOM) (feedback_test_strategy) | ⑧ 검증 | ✅ 위반 없음 | 키보드 인터랙션은 통합테스트로 검증 | |
| P4 | mock 호출 검증 금지 (feedback_test_strategy) | ⑧ 검증 | ✅ 위반 없음 | DOM/ARIA 상태로 검증 | |
| P5 | 하나의 앱 = 하나의 store (feedback_one_app_one_store) | ② 데이터 스키마 | ✅ 위반 없음 | 독립 Route에 자체 샘플 store. CMS 연동 시 CMS store 사용 | |
| P6 | plugin은 keyMap까지 소유 (feedback_plugin_owns_keymap) | ② rename 확장 | ⚠️ 확인 필요 | replace 모드의 keyMap(printable key → startRename)을 누가 소유하는가? rename plugin이 keyMap을 제공해야 함 | |
| P7 | focusRecovery는 불변 조건 (feedback_focus_recovery_invariant) | ④ E5, E6 (Tab 끝 도달) | ✅ 위반 없음 | Delete 시 focusRecovery 동작. Tab 끝은 포커스 유실이 아님 | |
| P8 | 설계 원칙 > 사용자 요구, engine 우회 금지 (feedback_design_over_request) | ③ 전체 | ✅ 위반 없음 | 모든 편집이 engine command 경유 (rename, clipboard, crud) | |
| P9 | 가역적 동선 (feedback_reversible_motion) | ③ Tab/Shift+Tab | ✅ 위반 없음 | Tab → Shift+Tab으로 역방향 복귀 가능 | |
| P10 | defaultPrevented가 target 가드보다 범용적 (feedback_nested_bubbling_guard) | ④ E1 (편집 중 화살표 충돌) | ⚠️ 확인 필요 | 편집 모드에서 contentEditable이 키 이벤트를 소비할 때 Grid keyMap과의 격리 메커니즘 | |

> **P6, P10**: 위반은 아니지만 구현 시 주의 필요. P6 — rename plugin이 replace용 keyMap을 제공하도록. P10 — 편집 모드에서 이벤트 버블링 가드.

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | rename plugin — startRename에 replace 모드 추가 | 기존 호출부(CMS, Tree 등)가 영향받을 수 있음 | 낮 | 디폴트 = preserve(기존 동작). replace는 opt-in 파라미터. 기존 호출부 변경 없음 | |
| S2 | Aria.Editable — replace 모드 + initialChar | 기존 편집 동작(F2/더블클릭)이 의도치 않게 replace될 수 있음 | 낮 | replace는 startRename 호출 시 명시적 플래그로만 활성. 기존 경로는 preserve | |
| S3 | navigate axis — Tab 추가 | 기존 Grid 사용처에서 Tab이 Grid 밖으로 포커스 이동하던 동작이 바뀜 | 중 | Tab 셀 순회는 Grid behavior에 **opt-in 옵션**으로 추가 (예: `navigate({ grid: { columns, tabCycle: true }}`). 기존 Grid는 옵션 없으면 Tab 동작 변경 없음 | |
| S4 | clipboard plugin — 셀 단위 모드 추가 | 기존 행 단위 copy/paste와 충돌 가능 | 중 | Grid 컨텍스트에서 셀 포커스가 있으면 셀 단위, 없으면 행 단위. 모드 자동 판별 또는 opt-in | |
| S5 | Aria.Editable — allowEmpty 옵션 (E7) | 기존 사용처(CMS 트리 노드명)에서 빈 문자열이 confirm되면 문제 | 낮 | allowEmpty는 opt-in. 기존 디폴트 = false (빈 문자열 → cancel) | |
| S6 | App.tsx Route 추가 | `/collection/i18n` 경로 추가 | 낮 | 기존 Route 충돌 없음. routeConfig에 항목 추가만 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| N1 | 기존 startRename 호출 시그니처 변경 | ⑥ S1 | 기존 호출부 전부 깨짐. replace는 새 오버로드/옵션 파라미터로 추가 | |
| N2 | Tab 셀 순회를 Grid 기본 동작으로 만들기 | ⑥ S3 | 기존 Grid에서 Tab = 위젯 밖 이동이 깨짐. 반드시 opt-in | |
| N3 | clipboard 셀 모드를 기본으로 만들기 | ⑥ S4 | 기존 행 단위 clipboard 동작이 깨짐. Grid 셀 컨텍스트에서만 자동 전환하거나 opt-in | |
| N4 | i18n 전용 store 또는 i18n 전용 command 생성 | ⑤ P5, P8 | 하나의 앱 = 하나의 store. i18n은 데이터일 뿐, 기존 rename/crud/history command로 처리 | |
| N5 | key 열(cells[0]) 편집 허용 | ④ E2 | key는 식별자. 편집 시 데이터 무결성 파괴 | |
| N6 | engine 우회 — DOM 직접 조작으로 셀 값 변경 | ⑤ P8 | 모든 변경은 command 경유. history/undo 보장 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | M1 | 영문 셀에 포커스 → `a` 키 입력 | 기존 값 클리어, `a` 표시, 편집 모드 | `i18n-datatable.integration.test.tsx::typing a printable key enters replace mode with only that character` |
| V2 | M1 + E10 | 한글 셀에 포커스 → `ㅎ` 키 입력 | compositionstart → 기존 값 클리어, `ㅎ` 조합 표시, 편집 모드 | ❌ 테스트 없음 |
| V3 | M2 | 셀 편집 중 → Tab | 현재 셀 확정, 오른쪽 셀로 이동 + 편집 모드 유지 (preserve) | `i18n-datatable.integration.test.tsx::Tab during editing confirms value, moves to next cell, and starts editing` |
| V4 | M3 | 마지막 열(ja) 편집 중 → Tab | 현재 셀 확정, 다음 행 첫 locale 셀(ko)로 이동 + 편집 모드 유지 | `grid-keyboard.integration.test.tsx::Tab at last col wraps to first col of next row` |
| V5 | M2 + E4 | 한글 조합 중 → Tab | 조합 확정 → 셀 확정 → 다음 셀 편집 진입. 글자 손실 없음 | ❌ 테스트 없음 |
| V6 | M4 | 셀 2개 연속 편집 후 → Mod+Z 2회 | 두 번째 편집 취소, 첫 번째 편집 취소. 각각 원래 값 복원 | `i18n-datatable.integration.test.tsx::undoes multiple paste operations in reverse order` |
| V7 | M5 | 셀 A에서 Mod+C → 셀 B에서 Mod+V | 셀 B에 셀 A의 값이 붙여넣기됨 | `i18n-datatable.integration.test.tsx::Mod+C copies cell value at current column, Mod+V pastes into another cell` |
| V8 | M6 | 빈 셀(미번역)이 있는 DataTable 로드 | 빈 셀이 시각적으로 구분됨 (배경색/텍스트 등) | `i18n-datatable.integration.test.tsx::cell with empty value renders empty text content` |
| V9 | E1 | 편집 중 → ← → 키 입력 | 텍스트 내 커서 이동. Grid 셀 이동 아님 | `i18n-datatable.integration.test.tsx::ArrowLeft/ArrowRight do not navigate grid while editing` |
| V10 | E2 | key 열 셀에서 `a` 키 입력 | 편집 진입 안 됨. 내비게이션 유지 | `i18n-datatable.integration.test.tsx::typing on key column (col 0) does not enter editing` |
| V11 | E3 | 한글 조합 중 → Escape | 조합 취소 + 편집 취소. 원래 값 복원 | ❌ 테스트 없음 |
| V12 | E5 | 마지막 행 마지막 셀에서 편집 중 → Tab | 편집 확정, 같은 셀 유지 (순회 멈춤) | `grid-keyboard.integration.test.tsx::Tab at absolute last cell (last row, last col) stops` |
| V13 | E7 | 셀 편집 → 내용 전부 삭제 → Enter | 빈 문자열로 확정됨 (cancel 아님). 빈 셀 시각 표시 | `i18n-datatable.integration.test.tsx::confirming empty content preserves empty string (does not cancel)` |
| V14 | E8 | replace 모드 진입 직후 → Escape | 원래 값 복원. 편집 취소 | `i18n-datatable.integration.test.tsx::Escape during replace mode cancels and restores original value` |
| V15 | E9 | 셀 편집 중 → Grid 밖 클릭 | blur → 편집 확정. 새 값 저장 | `i18n-datatable.integration.test.tsx::blurring the editable element confirms the new value` |
| V16 | M1 | F2로 편집 진입 | 기존 값 유지 (preserve). 텍스트 전체 선택 | `i18n-datatable.integration.test.tsx::F2 enters edit mode showing the existing cell value` |
| V17 | M1 + E2 | 읽기 전용 셀에서 F2 | 편집 진입 안 됨 | `i18n-datatable.integration.test.tsx::F2 on key column (col 0) does not enter editing` |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
