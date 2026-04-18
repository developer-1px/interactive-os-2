---
id: 2-areas/pattern/prds/ctx-axis-namespace-prd
title: 'createPatternContext 축 namespace 분산 — PRD'
created: 2026-03-30
updated: 2026-04-08
summary: 'Discussion: createPatternContext가 6축을 하드코딩하는 god object. 축이 aria-* 변화 단위로 ctx factory를 소유하고, createPatternContext는 base + merge만 수행하도록 분산.'
legacy:
  status: active
  kind: prd
  topics: [2-areas, focusedid]
  relates: []
  supersedes: []
---
# createPatternContext 축 namespace 분산 — PRD

> Discussion: createPatternContext가 6축을 하드코딩하는 god object. 축이 aria-* 변화 단위로 ctx factory를 소유하고, createPatternContext는 base + merge만 수행하도록 분산.

## ① 동기

### WHY

- **Impact**: createPatternContext에 새 축을 추가하려면 이 파일 + PatternContext 타입을 수정해야 함 — OCP 위반. AxisConfig 제거로 entities/middleware/visibilityFilter는 축이 선언하게 됐지만, ctx 기여분은 여전히 중앙집중.
- **Forces**: 축 = aria-* 변화의 범주 (APG 17패턴 전수 조사 확인). 4 core axis(selected/expanded/checked/value) + 1 base(focus). 하지만 createPatternContext는 이 범주와 무관하게 모든 메서드를 flat으로 나열.
- **Decision**: 각 축이 ctxFactory를 소유하여 자기 namespace를 생성. ctx.grid와 ctx.value가 이미 이 패턴. 기각: 제네릭 타입 합성(handler 호환성 복잡), config flags만 정리(반쪽 OCP 잔존).
- **Non-Goals**: PatternContext를 동적 확장 가능하게 만드는 것 (4 namespace는 고정 타입). focus를 namespace로 감싸는 것 (모든 패턴의 전제). 새 축 추가 (기존 축만 재배치).

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | tree 패턴에 expandConfig() 포함 | handler가 ctx.expanded.toggle() 호출 | aria-expanded 토글, Command 반환 | |
| S2 | listbox 패턴에 selectConfig() 포함 | handler가 ctx.selected.toggle() 호출 | aria-selected 토글, Command 반환 | |
| S3 | checkbox 패턴에 checkedConfig() 포함 | handler가 ctx.checked.toggle() 호출 | aria-checked 토글, Command 반환 | |
| S4 | slider 패턴에 valueRange 설정 | handler가 ctx.value.increment() 호출 | aria-valuenow 증가, Command 반환 | |
| S5 | toolbar 패턴 (expansion 없음) | handler가 ctx.expanded 접근 | undefined — namespace 부재 | |
| S6 | combobox의 Enter | popup 열린 상태 | ctx.selected.toggle() + ctx.popup.close() — 다중 축 변화를 패턴이 명시적 조합 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `axis/types.ts` 수정 | `SelectedNav`, `ExpandedNav`, `CheckedNav`, `PopupNav` 타입 추가. `PatternContext`에서 flat 메서드 → optional namespace | |
| `axis/select.ts` 수정 | `selectedCtx(engine, focusedId, mode) → SelectedNav` factory export | |
| `axis/expand.ts` 수정 | `expandedCtx(engine, focusedId) → ExpandedNav` factory export | |
| `axis/checked.ts` 수정 | `checkedCtx(engine, focusedId) → CheckedNav` factory export | |
| `axis/popup.ts` 수정 | `popupCtx(engine, focusedId) → PopupNav` factory export | |
| `axis/value.ts` 수정 | 기존 ctx.value 유지, factory를 `valueCtx`로 rename하여 일관성 | |
| `axis/activate.ts` 수정 | aria-* 분기 로직 삭제. 순수 이벤트 발화 command만 남김 (base에 잔류) | |
| `pattern/createPatternContext.ts` 수정 | god 메서드 삭제. base(focus + activate + store access) + 축 ctxFactory merge | |
| `pattern/composePattern.ts` 수정 | 축의 ctxFactory 수집하여 AriaPattern에 전달 | |
| pattern/roles/*.ts (12파일) 수정 | handler 호출부 namespace 전환 (ctx.expand() → ctx.expanded.set(true) 등) | |
| plugins/*.ts (3파일) 수정 | clipboard/combobox/useSpatialNav ctx 호출부 전환 | |
| primitives/*.ts (2파일) 수정 | aria.tsx trigger + keymapHelpers ctx 호출부 전환 | |
| ui/*.ts (2파일) 수정 | kanbanPreset + Kanban ctx 호출부 전환 | |
| __tests__/*.ts 수정 | 테스트 ctx 호출부 전환 | |

### PatternContext 타입 구조

```
PatternContext
  ├─ focused: string                         (base)
  ├─ focusNext/Prev/First/Last/Parent/Child  (base)
  ├─ activate(): Command                     (base — 이벤트 발화, aria-* 분기 없음)
  ├─ dispatch/getEntity/getChildren/getParent (base)
  ├─ selected?: SelectedNav                  (optional)
  │   ├─ ids: string[]
  │   ├─ toggle(): Command
  │   ├─ range(ids): Command
  │   ├─ extend(dir): Command
  │   └─ extendTo(targetId, list?): Command
  ├─ expanded?: ExpandedNav                  (optional)
  │   ├─ is: boolean
  │   ├─ set(v: boolean): Command
  │   └─ toggle(): Command
  ├─ checked?: CheckedNav                    (optional)
  │   ├─ is: boolean
  │   └─ toggle(): Command
  ├─ popup?: PopupNav                        (optional)
  │   ├─ isOpen: boolean
  │   ├─ open(): Command
  │   └─ close(): Command
  ├─ grid?: GridNav                          (optional, 기존 유지)
  └─ value?: ValueNav                        (optional, 기존 유지)
```

### ctxFactory 프로토콜

각 축의 `*Config()` 함수가 entities와 함께 ctxFactory도 반환:

```
selectConfig({ mode }) → { entities, middleware, ctxFactory }
expandConfig()         → { entities, visibilityFilter, ctxFactory }
checkedConfig()        → { entities, ctxFactory }
popupConfig()          → { entities, visibilityFilter, ctxFactory }
```

composePattern이 ctxFactory를 수집 → createPatternContext가 호출하여 merge.

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| selectConfig({ mode: 'multiple' }) 포함 | ctx.selected 존재 | `ctx.selected.toggle()` | aria-selected 변화를 축이 소유, namespace가 Command 생성 | selectedIds에 focusedId 토글 | |
| selectConfig({ mode: 'single' }) 포함 | ctx.selected 존재 | `ctx.selected.toggle()` | single mode = replace 동작 | selectedIds = [focusedId]만 | |
| selectConfig 미포함 | ctx.selected === undefined | `ctx.selected?.toggle()` | ctxFactory 미등록 → namespace 부재 | undefined, no-op | |
| expandConfig() 포함 | ctx.expanded 존재, is=false | `ctx.expanded.set(true)` | aria-expanded 변화를 축이 소유 | expandedIds에 focusedId 추가 | |
| expandConfig() 포함 | ctx.expanded 존재, is=true | `ctx.expanded.toggle()` | toggle = set(!is) | expandedIds에서 focusedId 제거 | |
| checkedConfig() 포함 | ctx.checked 존재 | `ctx.checked.toggle()` | aria-checked 변화를 축이 소유 | checkedIds에 focusedId 토글 | |
| popupConfig() 포함 | ctx.popup, isOpen=false | `ctx.popup.open()` | open = popupCommands.open + focus child (batch) | popup 열림 + 첫 자식 포커스 | |
| popupConfig() 포함 | ctx.popup, isOpen=true | `ctx.popup.close()` | close = popupCommands.close + focus trigger (batch) | popup 닫힘 + trigger 포커스 | |
| 어떤 패턴이든 | base | `ctx.activate()` | aria-* 분기 없음, 순수 이벤트 발화. keymapHelpers가 onActivate로 인터셉트 | activateCommands.activate(focusedId) | |
| selectConfig({ mode: 'multiple' }) | ctx.selected 존재 | `ctx.selected.extend('next')` | Shift+Arrow 범위 선택. anchor~target 범위 계산 | anchor 유지, 범위 내 ids selected | |
| selectConfig({ mode: 'multiple' }) | ctx.selected 존재 | `ctx.selected.extendTo(targetId)` | Shift+Click 특정 target까지 범위 | anchor~targetId 범위 selected | |
| ctxFactory들 수집됨 | AriaPattern 생성 시 | createPatternContext가 factory 호출 merge | composePattern이 ctxFactories를 AriaPattern에 전달 | base + namespace 합성된 PatternContext | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| handler가 없는 namespace 메서드 호출 | selectConfig 미포함 | optional chaining으로 자연스러운 no-op | undefined 반환, Command 미생성 | 상태 불변 | |
| 다중 축 동시 변화 (combobox Enter) | selected + popup 존재 | 패턴이 명시적 batch, 축끼리 무관 | `createBatchCommand([ctx.selected.toggle(), ctx.popup.close()])` | 두 aria-* 동시 변화 | |
| `ctx.selected.ids.map()` — ids 배열 보장 | selectConfig 포함 | entity default가 `{ selectedIds: [] }`, null 아님 | 빈 배열이어도 `.map()` 안전 | — | |
| ctxFactory 0개인 패턴 (toolbar) | 어떤 ctxFactory도 없음 | base만으로 동작, toolbar는 focus만 | base 메서드만 존재 | — | |
| overrideFocused (click handler) | click 시 focusedId ≠ clicked id | ctxFactory도 overrideFocused 수신 필수 | factory(engine, overrideFocused) 기준 | namespace.is도 clicked 노드 기준 | |
| activate + namespace 동시 사용 | expanded + activate 존재 | activate=이벤트, expanded=aria-* — 독립 | batch 가능 | aria-expanded 변화 + onActivate 콜백 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 선언적 OCP (feedback_declarative_ocp) | ② ctxFactory | ✅ 준수 — 축이 선언, createPatternContext가 merge | — | |
| 2 | 축은 keyMap 소유 금지 (feedback_axis_no_keymap) | ② ctxFactory | ✅ 준수 — capability만 제공 | — | |
| 3 | ARIA 표준 용어 우선 (feedback_naming_convention) | ② namespace 이름 | ✅ 준수 — selected/expanded/checked/value = aria-* 속성명 | — | |
| 4 | visibilityFilter OCP (feedback_visibility_filter_ocp) | ② ctxFactory 프로토콜 | ✅ 준수 — 동일 패턴 확장 | — | |
| 5 | activate = 이벤트 연동 (discuss 확인) | ② activate.ts | ✅ 준수 — aria-* 분기 삭제, 순수 이벤트 발화 | — | |
| 6 | engine 우회 금지 (feedback_design_over_request) | ③ Command 반환 | ✅ 준수 — 모든 상태 변화는 Command 경유 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | pattern/roles/*.ts 12파일 handler 호출부 | flat→namespace 일괄 변경, 누락 시 런타임 에러 | 높 | 사람과 함께 단계별 확인. typecheck가 누락 감지 | |
| 2 | plugins/clipboard.ts `ctx.selected` | string[]→SelectedNav.ids 변경 | 중 | `ctx.selected?.ids ?? []` 패턴 | |
| 3 | primitives/keymapHelpers.ts activate 인터셉트 | base에 남으므로 영향 작음 | 낮 | 기존 인터셉트 메커니즘 유지 | |
| 4 | __tests__/*.ts createPatternContext 직접 호출 | PatternContextOptions 시그니처 변경 | 중 | config flags → ctxFactories 배열로 대체 | |
| 5 | ui/kanbanPreset.ts `ctx.selected.map()` | string[]→SelectedNav 타입 변경 | 중 | `ctx.selected.ids.map()` 으로 변경 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | createPatternContext에 축별 if-branch | ⑤-1 OCP | ctxFactory merge 루프만 허용 | |
| 2 | activate()에 aria-* 분기 재도입 | ⑤-5 discuss | 순수 이벤트 발화. checked/expanded 분기는 패턴 책임 | |
| 3 | namespace를 non-optional로 | ⑥-1 toolbar | 축 미포함 패턴에서 런타임 에러 | |
| 4 | PatternContext에 flat 메서드 잔류 | ⑥-1 이중 경로 | toggleSelect/expand/collapse/isExpanded/toggleCheck/isChecked/open/close/isOpen 모두 제거 | |
| 5 | 에이전트 자율 일괄 실행 | ⑥-1 높은 심각도 | 사람과 함께 단계별 확인하며 수정 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | S1 동기 | tree ArrowRight → `ctx.expanded.set(true)` | aria-expanded="true", 자식 visible | |
| V2 | S2 동기 | listbox Space → `ctx.selected.toggle()` | aria-selected 토글 | |
| V3 | S3 동기 | checkbox Space → `ctx.checked.toggle()` | aria-checked 토글 | |
| V4 | S4 동기 | slider ArrowRight → `ctx.value.increment()` | aria-valuenow 증가 | |
| V5 | S5 동기 | toolbar에서 ctx.expanded 접근 | undefined (no-op) | |
| V6 | S6 동기 | combobox Enter → selected + popup batch | 선택 + popup 닫힘 동시 | |
| V7 | E1 경계 | expandConfig 미포함에서 ctx.expanded?.toggle() | undefined, 에러 없음 | |
| V8 | E4 경계 | ctxFactory 0개 패턴 (toolbar) | base만으로 동작 | |
| V9 | E5 경계 | click handler overrideFocused | namespace.is가 clicked 노드 기준 | |
| V10 | E6 경계 | activate + expanded 동시 | batch: aria-expanded + onActivate | |
| V11 | ⑦-4 금지 | 기존 flat 메서드 사용 시도 | TypeScript 컴파일 에러 | |
| V12 | 전체 | `pnpm typecheck` | 0 errors | |
| V13 | 전체 | `pnpm test` | 전체 green | |

완성도: 🟢

---

**전체 완성도:** 🟢 구현 완료

## 역PRD

| 항목 | 증거 |
|------|------|
| ctx.expanded | `axis/expand.ts` — `ExpandedNav` factory, `ctx.expanded.toggle()` 사용처 6파일 |
| ctx.selected | `axis/select.ts` — `SelectedNav` factory, `ctx.selected.toggle()` 사용처 |
| ctx.checked | `axis/checked.ts` — `CheckedNav` factory, `ctx.checked.toggle()` 사용처 |
| ctx.popup | `axis/popup.ts` — popup namespace 존재 |
| ctxFactory 프로토콜 | `axis/types.ts` — `CtxFactory` 타입 |
| createPatternContext 단순화 | `composePattern.ts:149` — `collectCtxFactories(required)` |
| flat 메서드 제거 | `toggleSelect`, `expand()`, `collapse()` 등 flat 메서드 grep 0건 (namespace로 전환) |

**실행 방식:** 에이전트 위임 아님. 사람과 함께 단계별 확인하며 점진적 수정.

#kind/prd #topic/pattern
