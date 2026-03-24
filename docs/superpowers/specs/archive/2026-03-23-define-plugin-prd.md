# definePlugin 아키텍처 — PRD

> Discussion: clipboard singleton canAcceptFn이 CmsLayout import 시 전역 오염 → 비-CMS 페이지 paste 위치 버그. 근본 원인은 Plugin 인터페이스에 의존 선언/능력 공유 메커니즘 부재. definePlugin 팩토리로 intercepts/requires 추가, zodSchema 플러그인으로 middleware 기반 canAccept 주입, crud에 focusRecovery 번들.

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | CmsLayout이 `clipboard({ canAccept: cmsCanAccept })`로 module-level canAcceptFn을 세팅한 상태 | 다른 페이지(/plugin/history)에서 Ctrl+V | paste가 CMS 스키마 판정을 사용하여 모든 타입을 거부 → ROOT fallback → 마지막에 append. 커서 뒤가 아님 | |
| M2 | clipboard() 옵션 없이 사용하는 페이지가 10개 | CmsLayout이 App.tsx에서 static import됨 | canAcceptFn 전역이 cmsCanAccept로 오염 — 10개 페이지 전부 영향 | |
| M3 | 개발자가 zodSchema 없이 crud + clipboard 조합 사용 | paste 실행 | legacy 경로(leaf=형제뒤, container=마지막자식) 자동 적용. canAccept 관여 없음 | |
| M4 | 개발자가 crud()를 넣었으나 focusRecovery()를 빠뜨림 | 노드 삭제 후 | 포커스가 사라진 노드에 남음 — 키보드 탐색 불가 | |
| M5 | zodSchema 플러그인을 넣었으나 clipboard 플러그인을 빠뜨림 | engine 생성 시 | console.warn으로 누락 감지 — 조용한 실패 방지 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `definePlugin` 함수 | `core/definePlugin.ts`. PluginConfig → Plugin 변환. requires의 middleware 합성, name/intercepts 메타 부착 | `src/interactive-os/core/definePlugin.ts::definePlugin` |
| `Plugin` 인터페이스 확장 | `core/types.ts`에 `name?: string`, `intercepts?: readonly string[]` 추가. 기존 Plugin과 하위호환 (optional) | `src/interactive-os/core/types.ts::intercepts` |
| clipboard TYPE 상수 | `plugins/clipboard.ts`에서 `PASTE`, `CUT`, `COPY` as const export. command.type에 사용 | `src/interactive-os/plugins/clipboard.ts::COPY, CUT, PASTE` |
| `paste` 시그니처 확장 | `paste(targetId, canAccept?, canDelete?)` — canAccept 미전달 시 legacy 경로 | `src/interactive-os/plugins/clipboard.ts::clipboard` |
| `canAcceptFn`/`canDeleteFn` 전역 제거 | module-level let 변수 삭제. paste command 내부에서 인자로 받은 canAccept 사용 | `src/interactive-os/plugins/clipboard.ts::clipboard` |
| `zodSchema` 플러그인 | `plugins/zodSchema.ts`. childRules(Zod) → canAccept/canDelete 자동 파생. middleware로 PASTE/CUT 가로채기 | `src/interactive-os/plugins/zodSchema.ts::zodSchema` |
| `crud` + `focusRecovery` 번들 | `crud(options?)` 내부에서 `focusRecovery(options)` middleware 합성. `requires: [focusRecovery]` | `src/interactive-os/plugins/crud.ts::crud` + `src/interactive-os/plugins/focusRecovery.ts::focusRecovery` |
| engine intercepts 검증 | `createCommandEngine`에서 plugins의 intercepts vs 제공된 command types 교차 검증 | `src/interactive-os/core/createCommandEngine.ts::createCommandEngine` |
| 기존 10개 플러그인 definePlugin 전환 | 모든 플러그인 팩토리를 definePlugin으로 래핑 | (각 plugins/*.ts 파일) |

완성도: 🟢

## ③ 인터페이스

> 비-UI 작업. 입력 = 개발자의 플러그인 조합, 결과 = engine 동작.

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `plugins: [clipboard(), zodSchema(childRules)]` | engine 생성 | zodSchema middleware가 PASTE/CUT을 intercept하도록 등록 | zodSchema가 intercepts: [PASTE, CUT] 선언 + middleware 제공 | paste 시 childRules 기반 canAccept 판정 적용 | |
| `plugins: [clipboard()]` (zodSchema 없음) | engine 생성 | clipboard만 등록. canAccept 없음 | 아무도 PASTE를 intercept하지 않으므로 | paste 시 legacy 경로 (leaf=형제뒤, container=마지막자식) | |
| `plugins: [crud()]` | engine 생성 | crud가 focusRecovery middleware를 자동 번들 | crud의 requires에 focusRecovery 포함 → definePlugin이 middleware 합성 | 노드 삭제 후 포커스 자동 복구 | |
| `plugins: [zodSchema(childRules)]` (clipboard 없음) | engine 생성 | engine이 intercepts 검증 | zodSchema.intercepts에 PASTE가 있지만 어떤 plugin도 PASTE command를 제공하지 않음 | console.warn 출력 | |
| `clipboard({ canAccept: fn })` (deprecated) | engine 생성 | deprecated 경고 출력 후 기존 동작 유지 | 전환 기간 하위호환 — canAccept를 paste command에 바인딩 | 기존과 동일하게 동작하되 경고 표시 | |
| `paste(targetId)` canAccept 미전달 | paste command 실행 | findPasteTarget에 canAccept=undefined 전달 | canAccept가 undefined이면 legacy 분기 | legacy 경로 동작 | |
| `paste(targetId, canAccept)` canAccept 전달 | paste command 실행 | findPasteTarget에 canAccept 전달 | canAccept가 존재하면 walk-up schema 분기 | schema 기반 paste 위치 결정 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| E1: 두 플러그인이 같은 command type을 intercept | zodSchema + 커스텀 플러그인 둘 다 PASTE intercept | middleware 순서 = plugins 배열 순서. 명시적 순서 보장 | 배열 순서대로 middleware 체이닝. 먼저 등록된 것이 먼저 실행 | 예측 가능한 순서 | |
| E2: crud()와 focusRecovery() 둘 다 명시 | `[crud(), focusRecovery()]` | crud가 이미 focusRecovery를 번들. 중복 middleware는 2회 실행 → 무해(멱등) | focusRecovery middleware가 2번 실행되나 결과 동일 | 정상 동작 (멱등) | |
| E3: definePlugin 미사용 legacy 플러그인과 혼용 | `[core(), definePlugin({name:'crud',...})]` | Plugin 인터페이스 하위호환. name/intercepts는 optional | legacy 플러그인은 검증 스킵, definePlugin 플러그인만 검증 | 정상 혼용 | |
| E4: requires 순환 의존 | A requires B, B requires A | 무한 루프 방지 필요 | definePlugin에서 requires를 flat하게 병합. 중복 middleware 제거 | 에러 없이 동작 | |
| E5: childRules 빈 객체로 zodSchema 생성 | `zodSchema({})` | childRules가 비어있으면 모든 canAccept가 false → 기존 legacy와 다름 | canAccept가 모든 타입을 거부 → ROOT fallback | 의도된 동작이 아닐 수 있으나 스키마대로 | |
| E6: clipboard 플러그인 없이 paste command 직접 호출 | `clipboardCommands.paste('id')` 직접 dispatch | clipboard가 plugins에 없어도 commands import는 가능 | command는 실행되지만 buffer가 비어있을 수 있음 | 빈 buffer → no-op | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | Plugin은 keyMap까지 소유 (feedback_plugin_owns_keymap) | ② clipboard keyMap | ⚠️ 주의 — clipboard는 native event 경로라 keyMap 적용 대상 아님. 하지만 이번 범위에서 keyMap 제거는 하지 않음 (백로그). deprecated 경고만 | — | |
| P2 | focusRecovery는 불변 조건 (feedback_focus_recovery_invariant) | ② crud 번들 | ✅ 준수 — crud()가 focusRecovery를 자동 포함. 누락 불가능 | — | |
| P3 | paste는 canAccept 스키마로 결정 (feedback_paste_schema_routing) | ② zodSchema | ✅ 준수 — zodSchema가 childRules에서 canAccept 파생. 미제공 시 legacy 유지 | — | |
| P4 | 설계 원칙 > 사용자 요구, engine 우회 금지 (feedback_design_over_request) | ② canAcceptFn 전역 제거 | ✅ 준수 — 전역 상태 우회 제거, 정상 경로(인자 전달)로 전환 | — | |
| P5 | 파일명 = 주 export 식별자 (feedback_filename_equals_export) | ② definePlugin.ts, zodSchema.ts | ✅ 준수 — definePlugin.ts → export function definePlugin, zodSchema.ts → export function zodSchema | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | `Plugin` 인터페이스 (types.ts) | name, intercepts 필드 추가. 기존 플러그인에 영향 없음 (optional) | 낮 | 허용 | |
| S2 | `clipboard()` 팩토리 시그니처 | `clipboard({ canAccept })` deprecated. 기존 CmsLayout에서 사용 중 | 높 | CmsLayout을 `zodSchema(childRules)` + `clipboard()`로 교체. deprecated 경고로 전환 기간 제공 | |
| S3 | `clipboardCommands.paste` 시그니처 | `paste(targetId)` → `paste(targetId, canAccept?, canDelete?)`. 기존 호출은 canAccept 미전달 → legacy 동작 | 중 | 하위호환 — 기존 호출 수정 불필요 | |
| S4 | `findPasteTarget` 내부 | canAcceptFn 전역 참조 → 인자로 변경. 내부 함수이므로 외부 영향 없음 | 낮 | 허용 | |
| S5 | `crud()` 팩토리 | focusRecovery middleware 자동 포함. 기존에 `[crud(), focusRecovery()]` 둘 다 넣던 곳은 중복 | 중 | 멱등이므로 중복 허용. 점진적으로 focusRecovery() 제거 | |
| S6 | `createCommandEngine` | intercepts 검증 로직 추가. 기존 동작에 영향 없음 (검증은 warn만) | 낮 | 허용 | |
| S7 | clipboard-overwrite.test.ts | canAcceptFn 전역이 사라지므로 테스트에서 clipboard({canAccept}) 대신 zodSchema 또는 paste 인자 직접 전달로 변경 필요 | 높 | 테스트 수정 | |
| S8 | 10개 페이지의 plugins 배열 | CmsLayout만 변경 필요 (zodSchema 추가). 나머지 9개는 변경 없음 | 낮 | CmsLayout만 수정 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| F1 | module-level canAcceptFn/canDeleteFn 유지 | ⑥ S2/S4 | singleton 오염의 근본 원인. 제거해야 함 | |
| F2 | clipboard 플러그인 안에 Zod/CMS 타입 분기 | ⑤ P3 | clipboard는 OS 레벨(L3). 도메인 판정은 zodSchema 플러그인으로 분리 | |
| F3 | focusRecovery를 끌 수 있는 옵션 | ⑤ P2 | focusRecovery는 불변 조건. CRUD 있으면 반드시 동작 | |
| F4 | intercepts에 매직 스트링 사용 | ② TYPE 상수 | 컴파일 타임 의존 감지를 위해 상수 import 필수 | |
| F5 | clipboard keyMap 제거 (이번 범위) | 백로그 | Aria onPaste 핸들러 추가가 선행되어야 함. 이번은 deprecated 경고만 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| T1 | ①M1 | zodSchema 없이 clipboard만 사용 → paste | legacy 경로: 커서 뒤에 insert | `clipboard-overwrite.test.ts::overwrites text value when pasting text on text (same type)` |
| T2 | ①M1 | zodSchema(childRules) + clipboard → CMS 타입 paste | canAccept 기반 insert/overwrite/reject | `clipboard-overwrite.test.ts::inserts card into section (collection insert)` |
| T3 | ①M2 | 여러 페이지가 각각 다른 plugins 조합 사용 | 각 페이지의 paste 동작이 독립 (singleton 오염 없음) | `clipboard-overwrite.test.ts::rejects paste when types do not match (text on icon)` |
| T4 | ①M3 | zodSchema 없이 legacy paste on leaf | 포커스된 항목 바로 뒤에 insert | `clipboard-undo.integration.test.tsx::paste position: always after cursor, not at end` |
| T5 | ①M4 | crud() 사용 시 focusRecovery 미등록 | 자동 번들되어 삭제 후 포커스 복구 동작 | `clipboard-undo.integration.test.tsx::Delete removes item, focus recovers, Mod+Z restores` |
| T6 | ①M5 | zodSchema만 넣고 clipboard 안 넣음 | engine 생성 시 console.warn | — (warn 검증 테스트 미확인) |
| T7 | ④E1 | 두 플러그인이 같은 type intercept | plugins 배열 순서대로 middleware 체이닝 | — |
| T8 | ④E2 | crud()와 focusRecovery() 둘 다 명시 | 중복이지만 멱등 — 정상 동작 | — |
| T9 | ④E3 | legacy 플러그인과 definePlugin 혼용 | 정상 혼용, legacy는 검증 스킵 | — |
| T10 | ⑥S2 | `clipboard({ canAccept })` deprecated 호출 | 경고 출력 + 기존 동작 유지 | `clipboard-overwrite.test.ts::supports boolean canAccept for backward compatibility` |
| T11 | ⑥S7 | 기존 clipboard-overwrite 테스트 전부 | 전부 통과 (하위호환) | `clipboard-overwrite.test.ts` (전체) |
| T12 | ①M1 | 기존 paste 위치 테스트 (legacy 경로) | 전부 통과 | `clipboard-undo.integration.test.tsx::copy → paste inserts after cursor, Mod+Z undoes` |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
