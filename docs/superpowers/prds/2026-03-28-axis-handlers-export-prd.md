# 축 handlers 정적 export — PRD

> Discussion: APG Grid 증거 — 같은 키(ArrowRight)가 맥락마다 다른 의미. 축이 keyMap을 소유하면 패턴이 맥락별 바인딩을 결정할 수 없다. handlers를 정적 export하여 패턴이 직접 key→handler 바인딩 구성 가능하게.

## ① 동기

### WHY

- **Impact**: 패턴 작성자가 APG Grid처럼 맥락별 키 바인딩(ArrowRight = 셀 이동 vs 편집 모드 vs 선택 확장)을 표현하려면, 축의 handler를 꺼내 직접 바인딩해야 한다. 현재 handlers가 keyMap 안에 인라인이라 접근 불가.
- **Forces**: (1) 축이 keyMap을 소유하는 v2 설계 (2) 57개 기존 호출부 하위 호환 필수 (3) 점진적 v3 전환 — 한번에 하면 10만 토큰 원복 재발
- **Decision**: 각 축 모듈에서 handler 함수를 named export. 기존 keyMap은 이 handlers를 참조하도록 리와이어. 기각 대안: 인스턴스 메서드 — handlers는 `(ctx) => Command` 순수 함수이므로 인스턴스 불필요.
- **Non-Goals**: (1) 축의 기존 keyMap 제거 (나중) (2) 패턴의 keyMap 재작성 (나중) (3) createPatternContext 해체 (4) config/middleware/visibilityFilter 변경

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | navigate 축이 handlers를 export | 패턴 작성자가 `import { focusNext } from 'axis/navigate'` | `focusNext`를 자신의 keyMap에 직접 바인딩 가능 | |
| S2 | 기존 패턴이 `navigate()` 호출 | 변경 없이 그대로 사용 | 기존과 동일하게 동작 (하위 호환) | |
| S3 | expand 축의 조건부 handler | 패턴이 `expandOrFocusChild`를 import | ArrowRight에 직접 바인딩하여 expand 조건 분기를 패턴이 제어 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `navigate.ts` handlers export | `focusNext`, `focusPrev`, `focusFirst`, `focusLast`, `focusParent`, `focusChild`, `focusNextCol`, `focusPrevCol`, `focusFirstCol`, `focusLastCol` | |
| `select.ts` handlers export | `toggleSelect`, `extendSelectionNext`, `extendSelectionPrev`, `extendSelectionFirst`, `extendSelectionLast` | |
| `expand.ts` handlers export | `expand`, `collapse`, `expandOrFocusChild`, `collapseOrFocusParent` | |
| `activate.ts` handlers export | `activate` | |
| `value.ts` handlers export | `increment`, `decrement`, `incrementBig`, `decrementBig`, `setToMin`, `setToMax` | |
| `dismiss.ts` handlers export | `dismiss` | |
| `checked.ts` handlers export | `toggleCheck` | |
| `popup.ts` handlers export | `openPopup`, `closePopup`, `openAndFocusFirst`, `openAndFocusLast` | |
| `tab.ts` handlers export | `focusNextWrap`, `focusPrevWrap` | |
| 기존 keyMap 리와이어 | 각 축의 keyMap이 인라인 대신 export된 handlers를 참조 | |
| 테스트 | handler export 존재 + 기존 테스트 무변경 통과 | |

완성도: 🟡

## ③ 인터페이스

> 이 PRD의 인터페이스는 키 인터랙션이 아니라 **API export** — handler 함수의 시그니처와 동작.

| handler | 시그니처 | 행동 | 왜 이 결과가 나는가 | 역PRD |
|---------|---------|------|-------------------|-------|
| `focusNext` | `(ctx) => Command` | 다음 노드로 포커스 이동 | ctx.focusNext() 위임 | |
| `focusPrev` | `(ctx) => Command` | 이전 노드로 포커스 이동 | ctx.focusPrev() 위임 | |
| `focusFirst` | `(ctx) => Command` | 첫 노드로 포커스 이동 | ctx.focusFirst() 위임 | |
| `focusLast` | `(ctx) => Command` | 마지막 노드로 포커스 이동 | ctx.focusLast() 위임 | |
| `focusParent` | `(ctx) => Command` | 부모 노드로 포커스 이동 | ctx.focusParent() 위임 | |
| `focusChild` | `(ctx) => Command` | 첫 자식으로 포커스 이동 | ctx.focusChild() 위임 | |
| `focusNextCol` | `(ctx) => Command \| void` | 다음 열로 이동 | ctx.grid가 있을 때만 동작 | |
| `focusPrevCol` | `(ctx) => Command \| void` | 이전 열로 이동 | ctx.grid가 있을 때만 동작 | |
| `focusFirstCol` | `(ctx) => Command \| void` | 첫 열로 이동 | ctx.grid가 있을 때만 동작 | |
| `focusLastCol` | `(ctx) => Command \| void` | 마지막 열로 이동 | ctx.grid가 있을 때만 동작 | |
| `toggleSelect` | `(ctx) => Command` | 포커스된 노드 선택 토글 | ctx.toggleSelect() 위임 | |
| `extendSelectionNext` | `(ctx) => Command` | 다음 방향으로 선택 확장 | ctx.extendSelection('next') 위임 | |
| `extendSelectionPrev` | `(ctx) => Command` | 이전 방향으로 선택 확장 | ctx.extendSelection('prev') 위임 | |
| `extendSelectionFirst` | `(ctx) => Command` | 처음까지 선택 확장 | ctx.extendSelection('first') 위임 | |
| `extendSelectionLast` | `(ctx) => Command` | 끝까지 선택 확장 | ctx.extendSelection('last') 위임 | |
| `expand` | `(ctx) => Command` | 노드 확장 | ctx.expand() 위임 | |
| `collapse` | `(ctx) => Command` | 노드 축소 | ctx.collapse() 위임 | |
| `expandOrFocusChild` | `(ctx) => Command` | 확장됨→자식 이동, 아니면→확장 | APG tree ArrowRight 패턴. ctx.isExpanded로 분기 | |
| `collapseOrFocusParent` | `(ctx) => Command` | 확장됨→축소, 아니면→부모 이동 | APG tree ArrowLeft 패턴. ctx.isExpanded로 분기 | |
| `activate` | `(ctx) => Command` | 포커스된 노드 활성화 | ctx.activate() 위임 | |
| `increment` | `(ctx) => Command \| void` | 값 증가 (step만큼) | ctx.value가 있을 때만 동작 | |
| `decrement` | `(ctx) => Command \| void` | 값 감소 (step만큼) | ctx.value가 있을 때만 동작 | |
| `incrementBig` | `(ctx) => Command \| void` | 값 대폭 증가 (step×10) | PageUp 용도. ctx.value가 있을 때만 | |
| `decrementBig` | `(ctx) => Command \| void` | 값 대폭 감소 (step×10) | PageDown 용도. ctx.value가 있을 때만 | |
| `setToMin` | `(ctx) => Command \| void` | 최솟값으로 설정 | ctx.value가 있을 때만 동작 | |
| `setToMax` | `(ctx) => Command \| void` | 최댓값으로 설정 | ctx.value가 있을 때만 동작 | |
| `dismiss` | `(ctx) => Command` | Escape 시 축소/닫기 | ctx.collapse() 위임 | |
| `toggleCheck` | `(ctx) => Command` | 체크 상태 토글 | ctx.toggleCheck() 위임 | |
| `openPopup` | `(ctx) => Command` | 팝업 열기 + 첫 자식 포커스 | ctx.open() + ctx.focusChild() batch | |
| `closePopup` | `(ctx) => Command` | 팝업 닫기 | ctx.close() 위임 | |
| `openAndFocusFirst` | `(ctx) => Command \| void` | 열고 첫 자식 포커스 | menu ArrowDown 패턴. 자식 없으면 void | |
| `openAndFocusLast` | `(ctx) => Command \| void` | 열고 마지막 자식 포커스 | menu ArrowUp 패턴. 자식 없으면 void | |
| `focusNextWrap` | `(ctx) => Command` | 다음 + 끝에서 처음으로 wrap | ctx.focusNext({ wrap: true }) 위임 | |
| `focusPrevWrap` | `(ctx) => Command` | 이전 + 처음에서 끝으로 wrap | ctx.focusPrev({ wrap: true }) 위임 | |

완성도: 🟡

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| grid 없는 패턴에서 focusNextCol 사용 | ctx.grid = undefined | grid handler는 grid 맥락에서만 의미 있음 | void 반환 (no-op) | 변경 없음 | |
| value 없는 패턴에서 increment 사용 | ctx.value = undefined | value handler는 value 맥락에서만 의미 있음 | void 반환 (no-op) | 변경 없음 | |
| popup 닫힌 상태에서 closePopup 사용 | ctx.isOpen = false | 이미 닫혀있음 | void 반환 (no-op) | 변경 없음 | |
| expandOrFocusChild — 자식 없는 노드 | ctx.isExpanded = false, children = [] | expand는 자식 유무와 무관하게 동작 (expandable 패턴) | expand 실행 | expanded = true | |
| 기존 축 함수 호출 결과가 동일한가 | navigate() 반환의 keyMap.ArrowDown | 리와이어 후 동일 handler 참조 | 기존과 동일한 Command 반환 | 무변경 | |

완성도: 🟡

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 축은 keyMap 소유 금지 (feedback_axis_no_keymap) | ② 전체 | **방향 일치** — 이 PRD가 해당 원칙 달성의 첫 단계 | — | |
| P2 | ARIA 표준 용어 우선 (feedback_naming_convention) | ③ handler 이름 | 준수 — focusNext, expand, collapse 등 APG 용어 사용 | — | |
| P3 | 선언적 OCP (feedback_declarative_ocp) | ② 리와이어 | 준수 — export 추가만, 기존 선언 구조 불변 | — | |
| P4 | Pattern은 조립 블록 (feedback_pattern_is_block_not_abstraction) | ① 동기 | 준수 — handlers가 노출되면 패턴이 더 자유롭게 조립 | — | |

완성도: 🟡

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| E1 | 9개 축 파일 전체 | 모듈 export surface 증가 | 낮 | 의도적 확장 — 허용 | |
| E2 | 축 내부 keyMap | 인라인→참조 리와이어 시 클로저 캡처 차이 | 중 | handler가 순수 함수(ctx만 의존)이므로 클로저 없음. 단, value의 bigStep(step×10)은 현재 축 옵션에서 계산 — 정적 handler에서는 ctx.value.step×10으로 해결 | |
| E3 | barrel export (index.ts) | handlers가 barrel에 추가되면 tree-shaking 영향 | 낮 | barrel에 추가하지 않음 — 직접 import 경로 사용 | |

완성도: 🟡

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| X1 | 기존 축의 keyMap 제거 | ① Non-Goals | 하위 호환 — 나중에 별도 작업 | |
| X2 | handler에 축 옵션 의존 | ⑥ E2 | 정적 export는 순수 함수여야 함. 옵션 의존은 ctx를 통해 해결 | |
| X3 | barrel export에 handlers 추가 | ⑥ E3 | tree-shaking 보존 | |
| X4 | handler 이름에 자체 발명 용어 | ⑤ P2 | ARIA/APG 표준 용어만 사용 | |

완성도: 🟡

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 | navigate에서 focusNext를 import하여 직접 호출 | `(mockCtx) => Command { type: 'focusNext' }` | |
| V2 | S2 | 기존 97개+ 통합/적합성 테스트 전체 실행 | 전부 통과 (하위 호환) | |
| V3 | S3 | expand에서 expandOrFocusChild import, isExpanded=true 시 | focusChild Command 반환 | |
| V4 | S3 | expand에서 expandOrFocusChild import, isExpanded=false 시 | expand Command 반환 | |
| V5 | ④-grid | focusNextCol을 grid 없는 ctx에서 호출 | void 반환 | |
| V6 | ④-value | increment를 value 없는 ctx에서 호출 | void 반환 | |
| V7 | ② 리와이어 | navigate() 반환의 keyMap.ArrowDown === focusNext (참조 동일) | true — 같은 함수 참조 | |
| V8 | ② popup | openAndFocusFirst를 자식 없는 ctx에서 호출 | void 반환 | |
| V9 | ② value | incrementBig가 step×10만큼 증가 | ctx.value.increment(step*10) Command | |

완성도: 🟡

---

**전체 완성도:** 🟡 8/8 (AI 초안 완료, 사용자 확인 필요)
