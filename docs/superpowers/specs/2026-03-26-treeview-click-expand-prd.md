# TreeView Parent Click — expand + onActivate 동시 수행 PRD

> Discussion: TreeView에서 onActivate 콜백 존재 시 parent 클릭의 expand 동작이 사라지는 버그. APG 예제 1, 2는 parent 클릭 = expand toggle + select. APG 준수가 목표.

## ① 동기

### WHY

- **Impact**: TreeView에 onActivate를 연결한 소비자(Viewer Explorer, AreaSidebar 등)에서 folder 클릭 시 expand가 동작하지 않는다. 사용자가 folder를 클릭해도 아무 시각 변화가 없어 Arrow key를 추가로 눌러야 한다. APG File Directory 예제(1, 2)의 기대 동작과 불일치.
- **Forces**: (1) `useAria.ts:217-224`에서 onActivate 존재 시 `ctx.activate()` 전체를 바이패스하고 콜백만 호출. (2) `ctx.activate()`가 parent→expand, leaf→select 분기를 내장. (3) 키보드(Enter) 경로도 `keymapHelpers.ts`에서 동일하게 `ctx.activate`를 몽키패치로 교체.
- **Decision**: 클릭 경로에서 parent node일 때 expand를 먼저 수행하고 onActivate도 호출한다. APG 예제 1의 `handleClick` 참조 — expand toggle + select 둘 다 수행. 키보드(Enter/Space) 경로는 APG 예제 1에서 Enter = select(expand 아님)이므로 현재 동작 유지. Navigation(예제 3)처럼 parent 클릭 시 expand를 원하지 않는 도메인은 기존대로 onActivate만 호출되도록 opt-out 가능.
- **Non-Goals**: (1) `ctx.activate()` 자체의 의미론 변경 (accordion, disclosure에 영향). (2) Enter/Space 키 동작 변경. (3) select 축 동작 변경.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | TreeView에 onActivate 연결, folder 'A'가 collapsed | folder 'A'를 **클릭** | folder 'A'가 expanded + onActivate('A') 호출 | |
| S2 | TreeView에 onActivate 연결, folder 'A'가 expanded | folder 'A'를 **클릭** | folder 'A'가 collapsed + onActivate('A') 호출 | |
| S3 | TreeView에 onActivate 연결, leaf 'B' 존재 | leaf 'B'를 **클릭** | onActivate('B') 호출, expand 변화 없음 | |
| S4 | TreeView에 onActivate 연결, folder 'A'가 collapsed | folder 'A'에서 **Enter** 키 | onActivate('A') 호출, expand 변화 **없음** (APG: Enter = default action, Arrow = expand) | |
| S5 | Navigation tree (`activate({ onClick: true, expandOnClick: false })`), parent 'About' | parent 'About'를 **클릭** | onActivate('About') 호출, expand 변화 **없음** | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `activate.ts` — `ActivateOptions.expandOnClick` 추가 | `boolean` (기본값 true). true면 클릭 시 parent node expand toggle을 onActivate와 독립적으로 수행. `AxisConfig.expandOnParentClick`으로 전파 | |
| `axis/types.ts` — `AxisConfig.expandOnParentClick` 추가 | activate 축의 expandOnClick이 composePattern을 거쳐 AriaPattern에 도달하는 경로 | |
| `composePattern.ts` — `expandOnParentClick` 전파 | mergedConfig → AriaPattern 변환에 포함 | |
| `useAria.ts` 클릭 핸들러 수정 | onActivate 존재 + `expandOnParentClick` true + node가 parent → expand dispatch **후** onActivate 호출 | |
| `useAriaView.ts` 클릭 핸들러 수정 | useAria.ts와 동일한 수정 (Aria 컴포넌트 직접 사용 경로) | |
| `tree.ts` — `activate({ onClick: true })` 유지 | expandOnClick 기본값 true이므로 tree pattern 코드 변경 없음 | |
| `treeview.integration.test.tsx` 테스트 추가 | V1~V8 시나리오 검증 | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| parent node **클릭** (onActivate 있음, expandOnParentClick: true) | collapsed | expand toggle + onActivate 호출 | APG 예제 1: 클릭 = expand + select. expand는 engine 책임, onActivate는 소비자 콜백 — 독립 관심사이므로 둘 다 수행 | expanded, onActivate 호출됨 | |
| parent node **클릭** (onActivate 있음, expandOnParentClick: true) | expanded | collapse toggle + onActivate 호출 | 동일 원칙의 역방향 | collapsed, onActivate 호출됨 | |
| leaf node **클릭** (onActivate 있음) | — | onActivate 호출 | leaf에는 children 없으므로 expand 대상 없음 | onActivate 호출됨 | |
| parent node **Enter** (onActivate 있음) | collapsed | onActivate 호출, expand 없음 | APG 예제 1: Enter/Space = select. expand는 Arrow key 전담. 키보드 경로(`keymapHelpers.ts`)는 변경하지 않음 | onActivate 호출됨, collapsed 유지 | |
| parent node **클릭** (expandOnParentClick: false) | collapsed | onActivate 호출, expand 없음 | Navigation tree(APG 예제 3) 등 parent 자체가 activatable인 도메인. 소비자가 activate 축 선언으로 opt-out | onActivate 호출됨, collapsed 유지 | |
| parent node **Shift+클릭** | collapsed | selection 동작만 (range select) | modifier 키 → selection 전용, activate/expand 스킵. 기존 hasModifier guard 유지 | selection 변경, collapsed 유지 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| onActivate 없는 TreeView에서 parent 클릭 | collapsed | onActivate 없으면 기존 `ctx.activate()` 경로 — expand toggle. 새 코드는 onActivate 분기에만 진입, 이 경로는 불변 | expand toggle (기존 동작 유지) | expanded | |
| accordion/disclosure에서 parent 클릭 | collapsed | `activate({ toggleExpand: true })`를 사용하는 별도 패턴. 이들은 `expandOnParentClick`과 무관 — `ctx.activate()` 경로를 타며, 이번 수정은 onActivate 분기만 건드림 | expand toggle (기존 동작 유지) | expanded | |
| chevron 클릭 (TreeView.tsx toggleProps) | collapsed | chevron은 `TreeView` UI가 `expandCommands.toggleExpand`를 직접 dispatch하는 별도 경로. `defaultPrevented`로 row 클릭과 격리됨 | expand toggle (기존 동작 유지) | expanded | |
| defaultPrevented된 클릭 이벤트 | — | 이벤트 버블링 가드, 기존 `if (event.defaultPrevented) return` 유지 | 아무 동작 안 함 | 변경 없음 | |
| useAriaView.ts의 클릭 경로 (Aria 컴포넌트 직접 사용) | collapsed | useAriaView에도 동일한 onActivate 바이패스 로직 있음 (210-223줄). 동일하게 수정 필요 | expand toggle + onActivate | expanded | |
| children 판별 | — | expand 여부를 판단하려면 해당 node에 children이 있는지 확인 필요. `getChildren(engine.getStore(), id).length > 0`으로 판별 | parent면 expand, leaf면 skip | — | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | ARIA 표준 용어 우선 (feedback_naming_convention) | ② 옵션명 | 미위반 — `expandOnClick` / `expandOnParentClick`은 동작을 직접 서술하는 명칭 | — | |
| 2 | 설계 원칙 > 사용자 요구, engine 우회 금지 (feedback_design_over_request) | ③ 클릭 경로 | **현재 위반** — onActivate가 engine의 expand를 우회. 이번 수정으로 해소 | 클릭 시 engine expand를 먼저 수행 | |
| 3 | 선언적 OCP, 중간 해석 계층 금지 (feedback_declarative_ocp) | ② opt-out 옵션 | 미위반 — activate 축 옵션(`expandOnClick: false`)으로 선언적 제어 | — | |
| 4 | accordion/disclosure 패턴 보호 | ④ 경계 | 미위반 — `ctx.activate()` 자체를 수정하지 않음, 클릭 핸들러 레벨에서만 수정 | — | |
| 5 | Plugin은 keyMap까지 소유 (feedback_plugin_owns_keymap) | ③ Enter 키 | 미위반 — Enter 키 동작은 변경하지 않음 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | `useAria.ts` getNodeProps 클릭 핸들러 | 모든 activateOnClick 패턴의 클릭 동작이 영향받을 수 있음 | 높 | 변경을 `behavior.expandOnParentClick && onActivate 존재 && node가 parent`로 한정, 3중 조건 guard | |
| 2 | `useAriaView.ts` 클릭 핸들러 | 동일한 로직 중복 존재 | 중 | 두 파일 동시 수정, 동일한 guard 적용 | |
| 3 | `pointer-interaction.test.tsx` 기존 테스트 | onActivate 없는 tree 클릭 → 동작 변경 없음 | 낮 | 회귀 테스트로 확인 | |
| 4 | Viewer Explorer (PageViewer.tsx) | folder 클릭 시 expand가 새로 발생 + onActivate도 호출 | 중 | 자연스러운 개선 — folder 클릭 = expand는 사용자가 원래 기대하는 동작 | |
| 5 | AreaSidebar | followFocus 사용 중, 클릭 시 expand 추가 발생 | 중 | followFocus는 포커스 이동 시 onActivate 호출. 클릭 → expand + focus 이동 → onActivate. 자연스러운 흐름 | |
| 6 | `keymapHelpers.ts` 몽키패치 | Enter/Space 경로 — 이번 범위 밖 | 낮 | 변경 없음 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | `ctx.activate()` 자체의 분기 로직 수정 | ⑥-1 | accordion, disclosure, switch 등이 ctx.activate()에 의존. 클릭 핸들러 레벨에서만 수정 | |
| 2 | Enter/Space 키 동작 변경 | ⑤-5, ① Non-Goals | APG 예제 1: Enter = select, Arrow = expand. 키보드 경로는 현행 유지 | |
| 3 | onActivate 없는 경우의 기존 클릭 동작 변경 | ⑥-3 | pointer-interaction.test 회귀 방지. 새 코드는 onActivate 분기에서만 동작 | |
| 4 | `keymapHelpers.ts` 몽키패치 제거 | ⑥-6 | 키보드 경로의 onActivate 인터셉트는 APG에 부합하는 의도된 동작 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①S1 | onActivate 있는 TreeView, collapsed folder 클릭 | aria-expanded="true" + onActivate 호출됨 | |
| V2 | ①S2 | onActivate 있는 TreeView, expanded folder 클릭 | aria-expanded="false" + onActivate 호출됨 | |
| V3 | ①S3 | onActivate 있는 TreeView, leaf 클릭 | onActivate 호출됨, aria-expanded 속성 없음 | |
| V4 | ①S4 | onActivate 있는 TreeView, collapsed folder에서 Enter | onActivate 호출됨, aria-expanded="false" 유지 | |
| V5 | ①S5 | expandOnClick: false 옵션, parent 클릭 | onActivate 호출됨, aria-expanded 변화 없음 | |
| V6 | ④경계1 | onActivate 없는 TreeView, parent 클릭 | aria-expanded="true" (기존 동작 회귀 확인) | |
| V7 | ④경계2 | accordion에서 parent 클릭 | expand toggle (기존 동작 회귀 확인) | |
| V8 | ④경계5 | Aria 컴포넌트 직접 사용 + onActivate + tree pattern | 클릭 시 expand + onActivate (useAriaView 경로) | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

### 교차 검증

1. **동기 ↔ 검증**: S1→V1, S2→V2, S3→V3, S4→V4, S5→V5 — 전 시나리오 커버 ✅
2. **인터페이스 ↔ 산출물**: 클릭 핸들러 수정(useAria, useAriaView) + activate 축 옵션 + composePattern 전파 — 인터페이스 행과 1:1 매칭 ✅
3. **경계 ↔ 검증**: 경계1→V6, 경계2→V7, 경계5→V8 — 주요 경계 커버 ✅
4. **금지 ↔ 출처**: 4개 금지 모두 ⑤/⑥에서 파생, 출처 유효 ✅
5. **원칙 대조 ↔ 전체**: ⑤-2 위반이 이번 수정으로 해소, 새 위반 없음 ✅
