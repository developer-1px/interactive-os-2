# Plugin keyMap original 핸들러 주입 — PRD

> Discussion: L4→L5 역참조 2개(spatial, rename) 제거. plugin keyMap 핸들러에 `original` 파라미터를 주입하여 기존 axis 핸들러와 합성/교체를 선택 가능하게 한다.

## ① 동기

### WHY

- **Impact**: `checkLayerDeps.mjs`가 역참조 2개를 보고한다. createPatternContext(L4)가 `plugins/spatial`과 `plugins/rename`(L5)을 직접 import하여 레이어 의존 방향이 역전된다. 레이어 경계가 코드에서 강제되지 않으면 의존이 다시 증가한다.
- **Forces**: spatial(공간 네비게이션)과 rename(인라인 편집)은 plugin급 기능이라 axis/로 승격할 수 없다. 그러나 현재 `expand({ mode: 'enter-esc' })`의 axis keyMap이 `ctx.enterChild()`, `ctx.exitToParent()`, `ctx.startRename()`을 호출하여 이 메서드들이 ctx(L4)에 하드코딩되어 있다.
- **Decision**: plugin이 자체 keyMap에서 command를 호출하는 기존 패턴(history, edit, crud, dnd)을 따른다. 단, 같은 키에 axis 핸들러가 이미 존재할 수 있으므로, plugin keyMap 핸들러가 `(ctx, original?)` 시그니처로 기존 핸들러를 받아 합성/교체를 선택한다. 기각 대안: ctx 확장 주입(OCP) — 불필요한 새 추상화, middleware의 `next` 관용구와 동일한 패턴이 이미 있으므로 기각.
- **Non-Goals**: PatternContext 타입의 전면 리팩터링. axis keyMap 시그니처 변경. 기존 plugin keyMap 핸들러 수정(optional parameter이므로 하위호환).

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | spatial plugin이 `Enter` keyMap을 등록하고, expand axis도 `Enter`를 갖는 패턴 | 사용자가 Enter 누름 | spatial의 핸들러가 실행되며, `original`을 통해 expand 핸들러도 호출 가능 | |
| S2 | spatial plugin이 `Escape` keyMap을 등록 | 사용자가 Escape 누름 | spatial의 exitToParent 실행, `original` 호출 안 하면 기존 동작 교체 | |
| S3 | rename이 edit plugin keyMap(`F2`, `Enter`)으로만 동작 | F2 누름 | renameCommands.startRename 실행 — ctx.startRename 경유 없이 | |
| S4 | plugin이 없는 기본 listbox 패턴 | Enter 누름 | 기존 axis keyMap 그대로 동작, original 관련 코드 무영향 | |
| S5 | `checkLayerDeps.mjs` 실행 | — | 역참조 0개 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `useAriaView.ts` — `collectPluginKeyMaps` 수정 | plugin keyMap merge 시 같은 키의 기존(behavior) 핸들러를 `original`로 감싸서 전달 | |
| `axis/types.ts` — `PluginKeyMapHandler` 타입 추가 | `(ctx: PatternContext, original?: () => Command \| void) => Command \| void` | |
| `plugins/spatial.ts` — keyMap 추가 | `Enter`(enterChild), `Escape`(exitToParent) 핸들러를 spatial() definePlugin에 등록 | |
| `axis/expand.ts` — `enter-esc` mode keyMap 축소 | `Enter`/`Escape`에서 ctx.enterChild/exitToParent/startRename 호출 제거, expand 본연 동작만 남김 | |
| `axis/types.ts` — `PatternContext`에서 제거 | `enterChild`, `exitToParent`, `startRename` 메서드 제거 | |
| `pattern/createPatternContext.ts` — import 제거 | `plugins/spatial`, `plugins/rename` import 및 관련 메서드 구현 제거 | |
| `engine/types.ts` — `Plugin.keyMap` 타입 확장 | 핸들러 시그니처를 `(ctx, original?) => ...` 허용하도록 | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| Enter | spatial plugin 있음, 자식 노드 있음 | spatial keyMap: `(ctx, original?) => { enterChild + focusChild }` | spatial이 Enter를 override하여 zone 진입 동작 수행. original(expand 핸들러)을 호출하지 않음 — zone 진입이 expand보다 우선 | spatial parent entity 생성, 포커스 자식으로 이동 | |
| Enter | spatial plugin 있음, 자식 노드 없음 (leaf) | spatial keyMap: original 있으면 위임 | leaf에서는 zone 진입 불가, 기존 동작(rename 등)이 적절 | original의 동작 수행 | |
| Escape | spatial plugin 있음, spatial parent 존재 | spatial keyMap: `(ctx) => exitToParent` | 부모 zone으로 복귀가 Escape의 spatial 의미 | spatial parent를 grandparent로 갱신, 포커스 부모로 이동 | |
| Escape | spatial plugin 있음, spatial parent 없음 (root) | spatial keyMap: original 있으면 위임 | root에서는 exit 불가, 기존 Escape 동작 위임 | original의 동작 수행 | |
| F2 | edit plugin 있음 | edit keyMap: `(ctx) => renameCommands.startRename(ctx.focused)` | edit plugin이 이미 이 경로로 동작 중 — 변경 없음 | rename entity 생성 | |
| Enter | plugin 없음, expand arrow mode | axis keyMap: `(ctx) => expand/collapse` | plugin keyMap 없으므로 behavior keyMap이 그대로 실행, original 주입 로직 미작동 | expand/collapse | |
| Mod+Z | history plugin 있음 | history keyMap: `(ctx) => historyCommands.undo()` | 기존 plugin keyMap — original 안 쓰는 handler, 하위호환 | undo 실행 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 같은 키에 behavior + 2개 plugin이 keyMap 등록 | `Enter`에 axis, pluginA, pluginB 모두 등록 | plugin merge 순서(배열 순서)가 우선순위. 마지막 plugin이 이기고, 앞 plugin의 핸들러가 그 plugin의 original이 됨 | 마지막 plugin 핸들러에 (pluginA 핸들러를 감싼 original) 전달 | 체이닝 가능 | |
| plugin keyMap에 original 안 쓰는 기존 핸들러 | history `Mod+Z` 핸들러 `(ctx) => ...` | optional parameter이므로 기존 코드 무변경 | 정상 동작 | 하위호환 | |
| behavior에 해당 키 없고 plugin만 등록 | plugin이 `F5` 등록, behavior에 `F5` 없음 | original이 없으면 undefined, plugin은 `original?.()` 패턴으로 안전 처리 | plugin 핸들러만 실행, original은 undefined | 정상 | |
| ctx.enterChild/exitToParent/startRename 제거 후 | 외부에서 ctx.enterChild 호출하는 코드 | 타입에서 제거되므로 컴파일 에러로 포착 | 컴파일 실패 → 수정 강제 | — | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | Plugin은 keyMap까지 소유 (feedback_plugin_owns_keymap) | ② spatial에 keyMap 추가 | ✅ 준수 — spatial이 Enter/Escape keyMap 소유 | — | |
| 2 | 선언적 OCP (feedback_declarative_ocp) | ② collectPluginKeyMaps 수정 | ✅ 준수 — plugin이 keyMap을 선언, merge 런타임 불변 | — | |
| 3 | ARIA 표준 용어 우선 (feedback_naming_convention) | ② PluginKeyMapHandler | ✅ 준수 — `original`은 decorator/middleware 표준 용어 | — | |
| 4 | 설계 원칙 > 요구 충족 (feedback_design_over_request) | 전체 | ✅ 준수 — engine 우회 없이 레이어 경계 복원 | — | |
| 5 | 가역적 동선 (feedback_reversible_motion) | ③ Enter/Escape | ✅ 준수 — Enter로 진입, Escape로 복귀 | — | |
| 6 | 중첩 이벤트 버블링 가드 (feedback_nested_event_bubbling) | ③ keyMap 핸들러 | 해당 없음 — keyMap은 key dispatch, DOM 이벤트 아님 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | `expand({ mode: 'enter-esc' })` keyMap | Enter/Escape 핸들러에서 spatial/rename 관련 코드 제거 → enter-esc mode가 spatial plugin 없이 동작 변경 | 중 | enter-esc mode는 spatial을 전제하므로, spatial plugin을 함께 사용하는 것이 사용 계약. expand의 enter-esc에서 expand 본연 동작(toggle)만 남기고, spatial이 override | |
| 2 | `PatternContext` 타입 축소 | enterChild/exitToParent/startRename 제거 → 외부 소비자 컴파일 에러 | 중 | PatternContext는 axis/types.ts에 정의, 외부(os 밖)에서 사용 여부 확인 필요. 현재 소비처는 expand.ts axis 내부뿐 | |
| 3 | `collectPluginKeyMaps` merge 로직 변경 | 단순 `Object.assign` → original 감싸기 로직 추가 | 낮 | 기존 핸들러는 `(ctx)` 시그니처로 original 무시, 동작 동일 | |
| 4 | edit plugin의 `F2`/`Enter` → `renameCommands.startRename` | 이미 이 경로로 동작 중 — 변경 없음 | 없음 | — | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | spatial/rename을 axis/로 이동 | ⑤ #1 — plugin급 유지 | 선택적 기능은 plugin 레이어에 있어야 한다 | |
| 2 | ctx에 새 plugin 메서드 추가 | ⑥ #2 — 닫힌 바구니 재발 | 이번에 제거하는 패턴을 다시 만들면 안 된다 | |
| 3 | original 호출을 강제 | ④ 체이닝 경계 | plugin이 교체/합성을 자유 선택해야 한다 — 강제하면 middleware의 next와 다른 의미 | |
| 4 | 기존 plugin keyMap 시그니처 `(ctx)` 깨기 | ⑥ #3 — 하위호환 | optional parameter로만 확장, 기존 코드 무변경 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S5 | `node scripts/checkLayerDeps.mjs` 실행 | 역참조 0개, exit 0 | |
| V2 | S1 | spatial plugin + expand enter-esc mode: Enter 키 → 자식 있는 노드에서 | zone 진입 + 포커스 자식 이동 | |
| V3 | S2 | spatial plugin: Escape 키 → spatial parent 존재 시 | 부모 zone 복귀 + 포커스 부모 이동 | |
| V4 | S3 | edit plugin: F2 키 | rename 시작 (기존 테스트 통과) | |
| V5 | S4 | plugin 없는 기본 listbox: 방향키 | 기존 동작 그대로 (회귀 없음) | |
| V6 | ④-1 | 같은 키에 behavior + plugin 등록 | plugin 핸들러 실행, original로 behavior 접근 가능 | |
| V7 | ④-2 | 기존 history plugin `Mod+Z` | 하위호환 — 동작 변경 없음 | |
| V8 | S1 | `pnpm typecheck` | 타입 에러 0개 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8 — 교차 검증 통과
