# Active Zone — PRD

> Discussion: Aria zone 빈 영역 클릭 시 해당 zone이 유일한 active zone이 되어 키보드 작동. OS active window 모델을 engine 레벨에서 구현.

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | ActivityBar에 여러 nav item이 있고, 사용자가 이전에 특정 item에 포커스를 둔 상태 | separator나 빈 여백을 클릭 | 마지막 focusedId 아이템이 DOM focus를 받고 키보드(↑↓) 작동 | ✅ 구현됨 — onPointerDown에서 focusedId로 focus() |
| M2 | 화면에 ActivityBar와 TreeGrid 두 zone이 있고, TreeGrid가 현재 active | ActivityBar의 빈 영역을 클릭 | ActivityBar가 active zone이 되고, TreeGrid는 inactive(outline 제거, cursor 위치 background만 유지) | ✅ 구현됨 — DOM focus 이동으로 :focus-within 자동 전환 |
| M3 | 사용자가 zone 밖(body)을 클릭하여 focus가 유실된 상태 | 이전에 사용하던 zone의 빈 영역을 클릭 | 마지막 focusedId로 즉시 복구 | ✅ 구현됨 — body blur 후 클릭 시 복구 테스트 통과 |
| M4 | aria-activedescendant 모드 zone | 빈 영역을 클릭 | 컨테이너 자체가 tabIndex=0이므로 기존 동작 유지 (변경 없음) | ✅ 변경 없음 — 분기 조건으로 제외 |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `lastActiveContainer` 싱글턴 | `useAriaView.ts` 모듈 스코프 `let lastActiveContainer: HTMLElement \| null`. React 상태 아님 — 리렌더 전파 없음 | ❌ 미구현 — /simplify에서 dead code로 제거. 소비자 없이 쓰기만 하므로 YAGNI 적용 |
| `containerProps` 확장 | roving-tabindex/natural-tab-order containerProps에 `onPointerDown` + `onFocusIn` 핸들러 추가 | `src/interactive-os/hooks/useAriaView.ts`::`containerProps` — `onPointerDown` 핸들러 (L264). 🔀 onFocusIn은 싱글턴 제거로 미구현 |
| DOM focus sync 보강 | 기존 `focusIsOrphaned` 분기에서 `lastActiveContainer` 참조하여 복구 판단 | ❌ 미변경 — 싱글턴 없으므로 참조 불가. F1(금지) 준수. 클릭 핸들러가 직접 focus() 호출 |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| zone 빈 영역 pointerdown | zone inactive, focusedId 존재 | focusedId 엘리먼트에 `.focus()` 호출 | 빈 영역은 focusable이 아니므로, 가장 최근 포커스 아이템으로 위임. OS에서 패널 클릭 시 마지막 활성 요소로 복귀하는 것과 동일 | zone active, focusedId에 DOM focus, outline 표시 | ✅ 일치 |
| zone 빈 영역 pointerdown | zone 이미 active, focusedId에 focus | 아무것도 안 함 | 이미 active — 중복 작업 불필요 | 변경 없음 | ✅ el === activeElement 가드로 구현 |
| Item 클릭 | zone inactive | 기존 onFocus 핸들러가 처리 + lastActiveContainer 갱신 | Item 클릭은 자체 focus 이벤트 발생 → onFocusIn 버블링으로 싱글턴 갱신 | zone active, 클릭한 item에 focus | 🔀 Item 클릭은 기존 onFocus가 처리 (일치). lastActiveContainer 갱신은 미구현 (싱글턴 제거) |
| zone 내 비-Item 요소(separator, group label) pointerdown | zone inactive | focusedId 엘리먼트에 `.focus()` | separator는 Item이 아니므로 자체 focus 불가. zone 진입 의도이므로 마지막 포커스로 위임 | zone active | ✅ 일치 |
| nested Aria 컨테이너 내부 클릭 | 바깥 zone inactive | 안쪽 zone만 활성화, 바깥 zone은 무시 | `event.target.closest('[data-aria-container]') !== currentTarget` — 가장 가까운 컨테이너가 자신이 아니면 무시 | 안쪽 zone만 active | ✅ 일치 |
| ↑↓←→ | zone active, focusedId에 focus | 기존 keyMap 동작 | 변경 없음 — 키보드 핸들링은 기존 로직 | 포커스 이동 | ✅ 변경 없음 |
| Tab (zone 밖에서) | focus가 body에 있음 | 브라우저 기본 Tab 동작 | zone 밖에서는 브라우저에 위임. 우리가 가로채면 접근성 위반 | 브라우저가 다음 focusable로 이동 | ✅ 변경 없음 |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| focusedId가 없는 zone 클릭 | 데이터는 있지만 초기 focus 미설정 | focus 대상이 없으면 `.focus()` 호출 불가 | 아무것도 하지 않음 (빈 zone은 활성화 대상 아님) | 변경 없음 | ✅ `if (!focusedId) return`으로 구현 |
| focusedId 엘리먼트가 DOM에 없음 | CRUD로 삭제된 직후 | focusRecovery 플러그인이 처리해야 할 영역. active zone은 포커스 대상 선택 책임이 아님 | lastActiveContainer만 갱신, focus 호출은 스킵 | lastActiveContainer 갱신됨 | 🔀 el이 null이면 아무것도 안 함 (singlton 없으므로 갱신도 없음). 동작 결과는 동일 (focus 스킵) |
| isKeyMapOnly zone | keyMap만 있고 포커스 관리 안 함 | keyMap-only는 포커스 전략이 없으므로 active zone 대상 아님 | onPointerDown/onFocusIn 핸들러 추가 안 함 | 변경 없음 | ✅ isKeyMapOnly 분기에서 핸들러 미포함 |
| autoFocus=false zone에서 body 유실 후 클릭 | focus body, autoFocus false | 클릭은 사용자의 명시적 진입 의도 — autoFocus와 무관하게 복구 | focusedId로 `.focus()` | zone active | ✅ 구현 + 테스트 통과 |
| 같은 zone을 연속 클릭 | 이미 active, focusedId에 focus | 이미 active이므로 중복 작업 불필요 | 아무것도 안 함 (el === document.activeElement 가드) | 변경 없음 | ✅ container.querySelector 후 el === activeElement면 focus 안 함 (암시적) |
| natural-tab-order zone | 모든 item이 tabIndex=0 | 모든 아이템이 자연 탭 순서에 있으므로 빈 영역 클릭 시에도 위임 필요 | roving-tabindex와 동일하게 focusedId로 `.focus()` | zone active | ⚠️ 코드상 동작하지만 전용 테스트 없음 |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | nested 버블링 가드: defaultPrevented가 target 가드보다 범용적 (feedback_nested_bubbling_guard) | ③ nested Aria 클릭 | ✅ 미위반 — pointerdown에서 closest('[data-aria-container]') 가드 사용, defaultPrevented 패턴과 동일한 "가장 가까운 소유자만 처리" 원리 | — | ✅ 일치 |
| P2 | focusRecovery는 불변 조건 (feedback_focus_recovery_invariant) | ④ focusedId DOM 없음 | ✅ 미위반 — active zone은 focusRecovery 영역을 침범하지 않음. 포커스 대상 선택은 focusRecovery 책임, active zone은 "어떤 zone이 active인가"만 추적 | — | ✅ 일치 |
| P3 | 설계 원칙 > 요구 충족, engine 우회 금지 (feedback_design_over_request) | ② 싱글턴 설계 | ✅ 미위반 — engine/store를 우회하지 않음. 싱글턴은 DOM 참조 하나, engine 상태와 독립 | — | ✅ 일치 (싱글턴 제거로 더 경량) |
| P4 | inactive cursor: background만 유지, outline은 :focus-within일 때만 (feedback_inactive_focus_cursor) | ① M2 | ✅ 미위반 — 기존 CSS 셀렉터 `[data-aria-container]:focus-within [data-focused]`가 이미 이 동작을 보장. 코드 변경 불필요 | — | ✅ 일치 |
| P5 | 테스트 원칙: 인터랙션은 통합 (CLAUDE.md) | ⑧ 검증 | ✅ 해당 — 검증 시나리오는 userEvent → DOM/ARIA 상태로 작성 | — | ✅ 일치 |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | `containerProps` 반환값 (useAriaView) | 기존에 roving-tabindex containerProps가 `{ tabIndex: -1 }` 만 반환하던 것에 핸들러 추가. containerProps를 spread하는 모든 곳에 영향 | 낮 | 추가된 핸들러(onPointerDown, onFocusIn)는 기존에 없던 것이므로 충돌 없음. aria.tsx의 AriaRoot가 유일한 소비자 | 🔀 onPointerDown만 추가됨 (onFocusIn 없음). 영향 범위 동일 |
| S2 | DOM focus sync useEffect | `focusIsOrphaned && !autoFocus` 분기 동작 변경 — lastActiveContainer가 자신이면 autoFocus 무관하게 복구 | 중 | autoFocus=false인 zone에서 의도치 않은 자동 복구 방지: **클릭 시에만** 복구, useEffect 내부에서는 기존 autoFocus 가드 유지. 클릭 핸들러가 직접 `.focus()` 호출하므로 useEffect 변경 불필요 | ✅ useEffect 미변경 — F1 준수 |
| S3 | 기존 테스트 (nested-aria-bubbling 등) | onPointerDown 핸들러 추가로 기존 테스트의 DOM 이벤트 흐름에 영향 가능 | 낮 | pointerdown은 기존 테스트에서 사용하지 않는 이벤트. 기존 click/focus/keydown 테스트에 영향 없음 | ✅ 692 테스트 전체 통과 |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| F1 | DOM focus sync useEffect 수정 | ⑥ S2 | 클릭 핸들러가 직접 `.focus()` 호출하므로 useEffect 변경 불필요. 건드리면 autoFocus=false zone에서 의도치 않은 복구 발생 | ✅ 준수 |
| F2 | lastActiveContainer를 React state/context로 만들기 | ⑤ P3 | 리렌더 전파 불필요한 DOM 참조를 React 상태로 올리면 과잉. 모든 zone이 매 클릭마다 리렌더 | ✅ 준수 (싱글턴도 제거하여 더 경량) |
| F3 | focusedId 선택 로직을 active zone에 넣기 | ⑤ P2 | 포커스 대상 선택은 focusRecovery의 책임. active zone은 "어떤 컨테이너가 active인가"만 추적 | ✅ 준수 |
| F4 | zone 밖 Tab 키 가로채기 | ③ Tab 행 | 브라우저 기본 Tab 동작을 가로채면 접근성 위반 | ✅ 준수 |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①M1 | toolbar zone에서 빈 영역(separator)을 pointerdown → focusedId 아이템 확인 | `document.activeElement`가 focusedId 엘리먼트, ArrowDown으로 다음 아이템 이동 가능 | `activeZone.integration.test.tsx`::`pointerdown on empty area focuses the focusedId item` + `keyboard works after empty area activation` |
| V2 | ①M2 | zone A에서 item 포커스 → zone B의 빈 영역 pointerdown | zone B의 focusedId에 focus. zone A의 `[data-focused]`에 outline 없음 (`:focus-within` 이탈) | `activeZone.integration.test.tsx`::`clicking zone B empty area moves focus away from zone A` |
| V3 | ①M3 | zone에서 작업 후 body 클릭(focus 유실) → 같은 zone 빈 영역 pointerdown | focusedId로 즉시 복구 | `activeZone.integration.test.tsx`::`pointerdown recovers focus after body loss` |
| V4 | ④ focusedId 없음 | focusedId가 빈 zone의 빈 영역 pointerdown | focus 이동 없음, 에러 없음 | `activeZone.integration.test.tsx`::`does nothing when focusedId is empty` |
| V5 | ④ nested | 바깥 Aria 안에 안쪽 Aria가 있을 때, 안쪽 zone의 빈 영역 pointerdown | 안쪽 zone만 active, 바깥 zone은 영향 없음 | `activeZone.integration.test.tsx`::`nested: inner zone empty area activates only inner zone` |
| V6 | ④ isKeyMapOnly | keyMap-only zone의 빈 영역 pointerdown | 아무 동작 없음 (핸들러 미부착) | `activeZone.integration.test.tsx`::`keyMap-only zone does not respond to empty area pointerdown` |
| V7 | ④ autoFocus=false | autoFocus=false zone, body에 focus 유실 상태에서 빈 영역 pointerdown | 클릭은 명시적 의도이므로 focusedId로 복구 | `activeZone.integration.test.tsx`::`autoFocus=false zone still responds to explicit click` |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
