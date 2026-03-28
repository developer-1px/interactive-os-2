# core() 흡수 + pattern/examples 분리 — PRD

> Discussion: plugins/core.ts의 commands+entities를 axis/로 이동하여 L4→L5 역참조 제거. APG 파일을 pattern/roles/로 분리.

## ① 동기

### WHY

- **Impact**: createPatternContext가 plugins/core에서 14개 심볼을 import — L4 Pattern→L5 Plugins 역참조. getVisibleNodes도 L2→L5 역참조. core()는 23개 UI + 30개 테스트에서 필수인데 "선택적 plugin" 위치에 있어 레이어 의미가 모순. 새 axis/pattern 추가 시 "core에 넣을까 axis에 넣을까" 혼란 발생.
- **Forces**: core의 commands+entities는 axis의 나머지 절반 (Emacs minor-mode = keyMap + command). 분리된 이유는 초기 설계에서 "선언(keyMap)"과 "구현(command)"을 다른 레이어로 놓았기 때문. 하지만 모든 UI에서 core()가 필수라는 사실이 이 분리가 잘못됨을 증명.
- **Decision**: core.ts 442줄을 4개 axis 파일(navigate, select, expand, value)에 관심사별 분배. composePattern이 middleware도 합성. core() 함수 삭제. APG 파일을 pattern/roles/로 이동. 기각된 대안: (1) ctx 제거하고 axis가 Command 직접 반환 — 네비게이션 알고리즘 중복, 변경 범위 과대. (2) 관심사별 폴더 재구성(focus/, selection/) — 레이어 경계 소멸, APG 패턴 검증 어려움.
- **Non-Goals**: createPatternContext 로직 변경. PatternContext 인터페이스 변경. spatial/rename plugin 이동(이들은 진짜 선택적 plugin). UI 컴포넌트 API 변경.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | axis/navigate.ts에 focusCommands+FOCUS_ID 존재 | createPatternContext가 focusCommands import | `../axis/navigate`에서 import (L4→L3 정상) | |
| S2 | axis/select.ts에 selectionCommands+middleware 존재 | composePattern이 select axis 포함 pattern 합성 | keyMap + config + middleware 모두 합성 | |
| S3 | axis/expand.ts에 EXPANDED_ID 존재 | getVisibleNodes가 EXPANDED_ID import | `../axis/expand`에서 import (L2→L3 정상) | |
| S4 | core() 함수 삭제됨 | UI 컴포넌트가 useAria 호출 | `plugins: [core()]` 없이도 동작 — axis가 이미 commands 소유 | |
| S5 | APG 파일이 pattern/roles/에 위치 | UI가 listbox behavior import | `../pattern/roles/listbox`에서 import | |
| S6 | 기존 테스트 실행 | pnpm test | 전체 통과 — 동작 변경 0 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| axis/navigate.ts 확장 | +focusCommands, +FOCUS_ID, +gridColCommands, +GRID_COL_ID (core.ts에서 이동) | |
| axis/select.ts 확장 | +selectionCommands, +SELECTION_ID, +SELECTION_ANCHOR_ID, +anchorResetMiddleware, +getSelectedIds (core.ts에서 이동) | |
| axis/expand.ts 확장 | +expandCommands, +EXPANDED_ID, +getExpandedIds (core.ts에서 이동) | |
| axis/value.ts 확장 | +valueCommands, +VALUE_ID, +ValueRange, +clamp, +roundToStep (core.ts에서 이동) | |
| axis/types.ts 수정 | ValueRange import를 `../plugins/core` → `./value`로 변경 | |
| StructuredAxis 확장 | middleware 필드 추가: `{ keyMap, config, middleware? }` | |
| composePattern.ts 수정 | middleware 합성 로직 추가 — axes에서 middleware를 수집하여 compose | |
| pattern/roles/ 디렉토리 | 18개 APG 파일 이동 (listbox, tree, treegrid, grid, menu, tabs, accordion, dialog, alertdialog, combobox, radiogroup, toolbar, switch, slider, spinbutton, disclosure) | |
| plugins/core.ts 삭제 | 전체 내용이 axis/로 이동, 빈 껍데기 | |
| createPatternContext.ts 수정 | import 출처 변경 — `../plugins/core` → `../axis/{navigate,select,expand,value}` | |
| engine/getVisibleNodes.ts 수정 | EXPANDED_ID import를 `../plugins/core` → `../axis/expand`로 변경 | |
| primitives/useAria.ts 수정 | import 출처 변경 + META_ENTITY_IDS에서 core import 제거 | |
| primitives/aria.tsx 수정 | import 출처 변경 | |
| primitives/useAriaView.ts 수정 | import 출처 변경 | |
| primitives/useControlledAria.ts 수정 | import 출처 변경 | |
| plugins/{focusRecovery,typeahead,edit,useSpatialNav}.ts 수정 | import 출처 변경 — `./core` → `../axis/navigate` | |
| UI 컴포넌트 23개 수정 | `import { core }` 제거, `plugins = [core()]` → `plugins = []` 또는 prop 제거 | |
| 테스트 30개 수정 | `import { core }` 제거, `plugins: [core()]` → `plugins: []` | |
| pattern/roles/ 소비자 수정 | `../pattern/listbox` → `../pattern/roles/listbox` 등 (UI 23개 + 테스트 35개) | |

완성도: 🟢

## ③ 인터페이스

> 비-UI 리팩토링이므로 키보드/마우스 인터페이스 변경 없음. 코드 인터페이스 변경만 기술.

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| select() 호출 | keyMap+config만 반환 | keyMap+config+middleware 반환 | anchorResetMiddleware는 selection 관심사 — select axis가 소유하는 게 자연스럽다 | StructuredAxis에 middleware 포함 | |
| composePattern(...axes) | keyMap+config만 합성 | keyMap+config+middleware 모두 합성 | axis가 middleware를 소유하면 composePattern이 수집·합성해야 한다 | AriaPattern에 middleware 포함 (?) | |
| useAria({ behavior, plugins }) | plugins에 core() 필수 | plugins에 core() 불필요 | commands+entities가 axis에 있으므로 별도 등록 불필요 | core 없이도 focus/select/expand 동작 | |
| import { listbox } from 'pattern/listbox' | pattern/ 직접 | pattern/roles/에서 import | APG는 composePattern의 사용 예시이지 본문이 아님 | import 경로 변경 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| plugins: [] (빈 배열) | core() 없으면 focus 불가 | axis에 commands가 있으므로 core() 없이도 동작해야 | focus/select/expand 정상 동작 | ARIA 속성 + 키보드 동작 모두 정상 | |
| plugins: [history()] (core 없이 다른 plugin만) | 현재 core() 없으면 동작 불가 | history는 command dispatch를 감싸는 진짜 plugin — core 독립적이어야 | history가 focus/expand 등 undo 정상 처리 | undo/redo 동작 | |
| anchorResetMiddleware가 select axis에 있는데 select를 안 쓰는 pattern (dialog) | middleware 없음 | select axis가 없으면 middleware도 없다 — 정상. anchor 자체가 없으니 reset도 불필요 | dialog는 middleware 0개 | 영향 없음 | |
| 외부 plugin이 focusCommands import | plugins/{focusRecovery,typeahead,useSpatialNav,edit}가 core에서 import | plugin(L5)이 axis(L3)를 import하는 건 정상 하향 의존 | import 경로만 변경 | L5→L3 정상 | |
| combobox pattern이 selectionCommands 직접 import | pattern/combobox.ts:6 | combobox는 pattern(L4)이고 select axis(L3)를 import — 정상 | `../axis/select`에서 import | L4→L3 정상 | |
| useAria가 focusCommands 등 직접 import (onClick 처리용) | primitives/useAria.ts:12 | primitives(L6)가 axis(L3) import — 정상 하향 | `../axis/navigate`에서 import | L6→L3 정상 | |
| pattern/roles/ 내 파일이 상대경로 참조 | listbox.ts: `import { composePattern } from './composePattern'` | examples/로 이동 후 `../composePattern` | 한 단계 위로 | import 경로 수정 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 선언적 OCP: 선언=등록, 합성 런타임 불변 (feedback_declarative_ocp) | ③ composePattern middleware 합성 | ✅ 준수 — axis 선언 시 middleware 포함, composePattern이 합성. 런타임 변경 없음 | — | |
| 2 | 원자적 restructure 필수 (feedback_atomic_restructure) | ② 전체 산출물 | ✅ 준수 — 한 커밋에 전부 이동. 점진적 전환 금지 | — | |
| 3 | Pattern=APG 검증용, 외부 소비 아님 (feedback_pattern_apg_only) | ② pattern/roles/ | ✅ 준수 — examples/로 분리하여 "본문 vs 예시" 명확화 | — | |
| 4 | 파일명 = 주 export 식별자 (CLAUDE.md) | ② axis 파일 확장 | ✅ 준수 — navigate.ts의 주 export는 여전히 navigate. commands는 부 export | — | |
| 5 | ARIA 표준 용어 우선 (feedback_naming_convention) | ② entity ID, command 이름 | ✅ 준수 — 이름 변경 없음, 위치만 이동 | — | |
| 6 | Plugin은 keyMap까지 소유 (feedback_plugin_owns_keymap) | ② core → axis 이동 | ✅ 준수 — core의 commands가 axis의 keyMap과 합류하므로 "keyMap + commands = 한 단위" 달성 | — | |
| 7 | 테스트 원칙: 계산=unit, 인터랙션=통합 (CLAUDE.md) | ⑧ 검증 | ✅ 준수 — 기존 통합 테스트 그대로 사용, import만 변경 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | UI 컴포넌트 23개의 plugins 기본값 | `plugins = [core()]`가 `plugins = []`로 변경 — 외부 소비자가 core()를 명시적으로 넘기던 경우 | 중 | core export를 re-export하거나 deprecation 경고. 단, 현재 외부 소비자 없음(내부 프로젝트) → 직접 삭제 | |
| 2 | pattern/ import 경로 58개 변경 | 경로 오타 시 빌드 실패 | 낮 | tsc --noEmit으로 즉시 검증 | |
| 3 | anchorResetMiddleware 위치 변경 | select axis가 없는 pattern에서 middleware 누락 | 낮 | select 안 쓰면 anchor도 없으므로 영향 0. ④ 경계에서 확인 완료 | |
| 4 | plugins/core.ts 삭제 | 다른 plugin이 `./core`에서 import | 낮 | 4개 파일 import 경로 변경 (focusRecovery, typeahead, edit, useSpatialNav) | |
| 5 | axis/types.ts의 ValueRange import | `../plugins/core` → `./value` | 낮 | 경로 변경만 | |
| 6 | pattern/types.ts의 ValueRange import | `../plugins/core` → `../axis/value` | 낮 | 경로 변경만 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | 점진적 전환 (core.ts를 남긴 채 일부만 이동) | ⑤-2 원자적 restructure | re-export 지옥, 두 곳에서 같은 심볼 제공 | |
| 2 | createPatternContext 로직 변경 | ① Non-Goals | 이번 스코프는 "이동"이지 "재설계"가 아님 | |
| 3 | PatternContext 인터페이스 변경 | ① Non-Goals | axis keyMap 핸들러가 ctx를 통해 호출하는 계약 유지 | |
| 4 | spatial/rename commands를 axis로 이동 | ① Non-Goals | 이들은 진짜 선택적 plugin — 모든 UI에서 쓰지 않음 | |
| 5 | command type 문자열 변경 (예: 'core:focus' → 'navigate:focus') | ⑥-3 middleware | anchorResetMiddleware가 `command.type === 'core:focus'`로 판별. 변경하면 middleware 파손 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | ①S1 | createPatternContext의 import가 axis/에서 온다 | `../axis/navigate`, `../axis/select`, `../axis/expand`, `../axis/value`에서 import. `../plugins/core` import 0개 | |
| V2 | ①S2 | select axis가 middleware를 반환하고 composePattern이 합성한다 | `select()` 반환값에 middleware 존재. composePattern 결과의 middleware가 anchorReset 동작 수행 | |
| V3 | ①S3 | getVisibleNodes가 axis/expand에서 EXPANDED_ID import | `../axis/expand`에서 import. `../plugins/core` import 0개 | |
| V4 | ①S4 | UI 컴포넌트가 core() 없이 동작 | ListBox, TreeView 등이 `plugins: []`에서도 focus/select/expand 정상 | |
| V5 | ①S5 | pattern/roles/에서 APG import | `import { listbox } from '../pattern/roles/listbox'` 성공 | |
| V6 | ①S6 | 전체 테스트 통과 | `pnpm test` 0 failures | |
| V7 | ④E1 | plugins: [] 빈 배열에서 키보드 동작 | ArrowDown으로 focus 이동 정상 | |
| V8 | ④E2 | history() plugin만 사용 시 undo | focus 이동 후 Ctrl+Z로 복귀 | |
| V9 | ④E3 | dialog (select axis 없음)에서 middleware 부재 | dialog에서 Escape 동작 정상, anchor 관련 에러 없음 | |
| V10 | ⑤-2 | plugins/core.ts 파일이 존재하지 않는다 | `ls src/interactive-os/plugins/core.ts` → not found | |
| V11 | ⑦-5 | command type 문자열 불변 | `grep 'core:focus'` axis/navigate.ts에서 발견 | |
| V12 | 전체 | TypeScript 컴파일 | `pnpm typecheck` 에러 0 | |
| V13 | 전체 | lint | `pnpm lint` 에러 0 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
