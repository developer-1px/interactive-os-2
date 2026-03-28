# selectionFollowsFocus + activationFollowsSelection — PRD

> Discussion: APG focus/selection/activation 3개념 분리. 기존 followFocus는 ①→③ 직행으로 ②(selection)를 건너뛰고 있었음. 두 직교 옵션으로 교체.

## ① 동기

### WHY

- **Impact**: RadioGroup, Tabs(automatic)가 APG conformance 🟡. Arrow 키로 포커스 이동 시 aria-selected/aria-checked가 자동 변경되지 않는다. 기존 `followFocus`는 외부 콜백(onActivate)만 호출하고 `__selection__`을 건드리지 않는다.
- **Forces**: (1) activate=select 동일시로 3개념이 뭉쳐있음. (2) `ctx.activate()`가 `onActivate` 등록 시 가로채져서 `selectionCommands.select()`가 실행되지 않음. (3) 기존 소비처(AppShell, PageViewer, AreaSidebar)가 `followFocus + onActivate` 조합에 의존. (4) atomic restructure 필수.
- **Decision**: focus→selection, selection→activation 두 체인을 별도 옵션으로 분리. 기각: "middleware만"(②→③ 분리 불가), "onSelect 콜백 추가"(activationFollowsSelection으로 충분), "리네임만"(우회로 존속).
- **Non-Goals**: `ctx.activate()` 자체의 리팩터링(expand/select 분기). 새 `onSelect` 콜백 추가. per-item opt-out 메커니즘 재설계(별도 후속).

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | RadioGroup에 `selectionFollowsFocus: true` | Arrow 키로 포커스 이동 | `__selection__`이 자동 갱신되어 aria-checked가 변경됨 | |
| S2 | Tabs에 `selectionFollowsFocus: true` + `activationFollowsSelection: true` | Arrow 키로 포커스 이동 | aria-selected 변경 + onActivate 콜백 호출 (패널 전환) | |
| S3 | Listbox에 두 옵션 모두 없음 | Arrow 키로 포커스 이동 | 포커스만 이동, selection 변경 없음 (기존 동작 유지) | |
| S4 | AppShell이 기존 `followFocus + onActivate`를 사용 | 코드를 `selectionFollowsFocus + activationFollowsSelection`으로 전환 | 동일한 동작 (Arrow → 뷰 전환) | |
| S5 | PageViewer가 `followFocus + onActivate`로 프리뷰 전환 | 코드를 새 옵션으로 전환 | 동일한 동작 (Arrow → 프리뷰 전환) | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `axis/select.ts` 수정 | `select()` 옵션에 `selectionFollowsFocus: boolean` 추가. focus 변경 시 `selectionCommands.select(focusedId)` 디스패치하는 middleware 반환 | |
| `axis/activate.ts` 수정 | `activate()` 옵션에 `activationFollowsSelection: boolean` 추가. `followFocus` 옵션 제거 | |
| `pattern/types.ts` 수정 | `AriaPattern.followFocus` 제거, `AriaPattern.selectionFollowsFocus`와 `AriaPattern.activationFollowsSelection` 추가 | |
| `primitives/useAria.ts` 수정 | 기존 followFocus 로직(83-88줄) 제거. `activationFollowsSelection` 로직 추가: `__selection__` 변경 감지 시 `onActivate` 호출 | |
| `primitives/useAriaZone.ts` 수정 | 동일하게 followFocus 로직 제거, activationFollowsSelection 로직 추가 | |
| `primitives/keymapHelpers.ts` 수정 | `ctx.activate()` 가로채기 로직은 유지 — activation은 여전히 Enter/Space/click에서 외부 콜백으로 라우팅 | |
| `pattern/examples/tabs.ts` 수정 | `activate({ followFocus: true })` → `select({ mode: 'single', selectionFollowsFocus: true })` + `activate({ activationFollowsSelection: true })` | |
| `pattern/examples/radiogroup.ts` 수정 | `select({ mode: 'single', selectionFollowsFocus: true })` 추가. activate는 `activationFollowsSelection` 불필요 (외부 행동 없음) | |
| 소비처 전환 (AppShell, PageViewer, AreaSidebar, ActivateDemo, misc/navlist, ui/TreeView, ui/useTreeView) | `followFocus: true` → `selectionFollowsFocus: true` + `activationFollowsSelection: true` | |
| 기존 `follow-focus.test.tsx` 재작성 | 새 옵션 기반으로 테스트 전환 | |
| APG conformance tests 갱신 | RadioGroup, Tabs 🟡 → 🟢 | |

### 체인 구조

```
             select axis                    activate axis
focus ──[selectionFollowsFocus]──→ selection ──[activationFollowsSelection]──→ onActivate
  ①        middleware                 ②          useAria/useAriaZone              ③
```

완성도: 🟢

## ③ 인터페이스

> 이 기능은 키보드 인터랙션이 아니라 axis 옵션의 인터페이스다.

### selectionFollowsFocus (select axis)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `core:focus` command 디스패치 | `__focus__` 변경됨 | middleware가 `selectionCommands.select(newFocusedId)` 디스패치 | APG: "selection follows focus" = 포커스가 이동하면 선택이 따라옴 | `__selection__` = [newFocusedId], aria-selected/aria-checked 변경 | |
| `core:focus` command (같은 nodeId) | `__focus__` 변경 없음 | middleware 스킵 | 포커스가 안 움직였으면 selection도 변경 불필요 | 상태 유지 | |
| Shift+Arrow (extendSelection) | batch command | middleware 스킵 | extendSelection은 자체적으로 selection을 관리. 자동 동기화가 개입하면 range selection이 깨짐 | extendSelection이 관리 | |

### activationFollowsSelection (useAria/useAriaZone)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `__selection__` 변경 감지 | onActivate 등록됨 | `onActivate(selectedId)` 호출 | selection 변경이 외부 행동(패널 전환 등)을 트리거해야 하므로 | 외부 콜백 실행 | |
| `__selection__` 변경 감지 | onActivate 미등록 | 아무 일 없음 | 콜백 없으면 외부 행동 없음. 내부 selection 변경은 이미 완료 | 상태 유지 | |
| `__selection__` 변경 없음 | — | 스킵 | selection이 안 바뀌었으면 activation도 불필요 | 상태 유지 | |

### 기존 ctx.activate() 가로채기 (유지)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| Enter/Space 키 | onActivate 등록됨 | keymapHelpers가 `ctx.activate()`를 가로채서 `onActivate(focusedId)` 호출 | 명시적 activation(Enter/Space)은 기존대로 외부 콜백 | onActivate 호출 | |
| Enter/Space 키 | onActivate 미등록 | `ctx.activate()` 실행 → expand 또는 select | 콜백 없으면 기본 동작 (expand/select) | 상태 변경 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| selectionFollowsFocus + extendSelection(Shift+Arrow) | multi-select listbox | extendSelection은 batch command로 focus+selection을 함께 관리. middleware가 개입하면 range가 깨짐 | batch command에서는 selectionFollowsFocus middleware 스킵 | extendSelection이 selection 관리 | |
| selectionFollowsFocus + selectOnClick | 클릭으로 포커스 이동 | 클릭 시 focus 변경 → middleware → select. selectOnClick도 select. 이중 디스패치? | selectOnClick이 이미 select를 하므로, middleware의 select는 동일 값 → 멱등. 문제 없음 | 한 번만 select | |
| activationFollowsSelection + 초기 렌더 | 컴포넌트 마운트 시 초기 selection 설정 | 마운트 시 onActivate가 불필요하게 호출되면 안 됨 | prevSelection 비교로 "변경"만 감지. 초기값은 변경이 아님 | 마운트 시 콜백 안 호출 | |
| 두 옵션 모두 OFF | 기존 listbox, tree 등 | 기존 동작과 완전히 동일해야 함 | 변경 없음 | 기존 동작 유지 | |
| per-item opt-out (entity.data.followFocus=false) | 기존 소비처 | 기존 followFocus 제거 시 이 메커니즘도 제거됨 | 소비처에서 해당 아이템을 data로 분기하거나, `__selection__` onChange에서 필터 | 소비처 레벨에서 처리 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | ARIA 표준 용어 우선 (feedback) | ② `selectionFollowsFocus` | 준수 — APG 공식 용어 "selection follows focus" | — | |
| P2 | atomic restructure 필수 (feedback) | ② 소비처 전환 | 준수 — followFocus 제거 + 소비처 전환 + 테스트 갱신을 한 커밋에 | — | |
| P3 | Plugin은 keyMap까지 소유 (feedback) | ② select/activate axis | 준수 — middleware는 axis 내부, keyMap 변경 없음 | — | |
| P4 | 선언적 OCP (feedback) | ② composePattern | 준수 — 옵션은 선언, 합성 런타임 불변 | — | |
| P5 | activate=select 분리가 올바른가 (discuss 결론) | ③ 인터페이스 | 준수 — selectionFollowsFocus는 select, activationFollowsSelection은 activate. 관심사 분리 | — | |
| P6 | 기존 동작 보존 (discuss 제약) | ④ 경계 "두 옵션 OFF" | 준수 — 옵션 OFF = 기존과 동일 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| B1 | `pattern/types.ts` — AriaPattern 인터페이스 | `followFocus` 필드 제거 → 타입 에러 | 중 | atomic restructure로 전 소비처 동시 전환 | |
| B2 | `useAria.ts` 83-88줄 followFocus 로직 | 제거 후 activationFollowsSelection 로직으로 교체 — 로직 위치 변경 | 중 | 기존 follow-focus.test.tsx를 새 옵션 기반으로 재작성하여 동작 보존 검증 | |
| B3 | `useAriaZone.ts` 222-227줄 | 동일 | 중 | 동일 | |
| B4 | AppShell, PageViewer, AreaSidebar | `followFocus: true` → 두 옵션 조합으로 전환 | 중 | 전환 후 기존 동작 보존 수동 검증 | |
| B5 | `entity.data.followFocus=false` per-item opt-out | 메커니즘 제거됨 | 낮 | 현재 사용처: AppShell의 theme 항목만. 소비처 레벨에서 onActivate 내부 분기로 대체 | |
| B6 | `follow-focus.test.tsx` | 전면 재작성 | 낮 | 새 옵션 기반 테스트로 교체 | |
| B7 | APG conformance tests (radiogroup, tabs) | 🟡→🟢 변경 예정 | 긍정적 | 수정 후 재실행 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---------------|------|------|-------|
| F1 | `followFocus`를 남겨두고 새 옵션과 공존 | ⑤ P2 atomic + discuss 결론 | 두 이름 공존 = 영구 혼동 | |
| F2 | selectionFollowsFocus를 activate axis에 놓기 | ⑤ P5 관심사 분리 | selection 동기화는 select axis의 책임 | |
| F3 | batch command(extendSelection)에서 selectionFollowsFocus middleware 실행 | ④ 경계 | range selection이 깨짐 | |
| F4 | 초기 마운트 시 activationFollowsSelection으로 onActivate 호출 | ④ 경계 | 마운트 시 불필요한 부작용 | |
| F5 | 점진적 전환 (일부 파일만 새 옵션, 나머지 구 옵션) | ⑤ P2 atomic | 중간 상태에서 타입 에러 + 혼재 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 동기 | RadioGroup: Arrow → aria-checked 자동 변경 | conformance test 🟢 | |
| V2 | S2 동기 | Tabs automatic: Arrow → aria-selected 변경 + onActivate 호출 | conformance test 🟢 | |
| V3 | S3 동기 | Listbox: Arrow → 포커스만, selection 변경 없음 | conformance test 유지 🟢 | |
| V4 | S4 동기 | AppShell: 기존 네비게이션 동작 보존 | 수동 검증 + 기존 test 통과 | |
| V5 | S5 동기 | PageViewer: 기존 프리뷰 전환 동작 보존 | 수동 검증 + 기존 test 통과 | |
| V6 | 경계 | Shift+Arrow(extendSelection) 시 middleware 스킵 | extended-selection.test.tsx 기존 테스트 통과 | |
| V7 | 경계 | 초기 마운트 시 onActivate 미호출 | follow-focus 테스트에 마운트 시나리오 포함 | |
| V8 | 경계 | 두 옵션 모두 OFF → 기존 동작 완전 동일 | 전체 test suite 통과 (1016 tests) | |
| V9 | 경계 | per-item opt-out 소비처(AppShell theme) 동작 보존 | AppShell 수동 검증 | |
| V10 | 전체 | 타입 에러 0개 | `pnpm typecheck` 통과 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

### 교차 검증

| # | 검증 | 결과 |
|---|------|------|
| 1 | 동기 ↔ 검증: S1→V1, S2→V2, S3→V3, S4→V4, S5→V5 | ✅ |
| 2 | 인터페이스 ↔ 산출물: select axis에 middleware, activate axis에 config, useAria/useAriaZone에 감지 로직 | ✅ |
| 3 | 경계 ↔ 검증: extendSelection→V6, 마운트→V7, OFF→V8, per-item→V9 | ✅ |
| 4 | 금지 ↔ 출처: F1~F5 모두 ⑤/④에서 파생 | ✅ |
| 5 | 원칙 대조 ↔ 전체: 위반 없음 | ✅ |

교차 검증 통과.
