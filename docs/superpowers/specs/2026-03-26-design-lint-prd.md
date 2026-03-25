# Design Lint — PRD

> Discussion: LLM이 spacing 값은 알지만 관계 규칙(암묵지)이 없어 "구린" UI를 만든다. 좋은 디자인 공식화는 불가하지만, 나쁜 디자인(위반)은 열거·측정 가능. 브라우저에서 JS로 위반 감지 → LLM 자가 수정 루프.

## ① 동기

### WHY

- **Impact**: LLM이 UI를 생성하면 spacing 값(8pt grid)은 맞지만 관계 규칙(internal≤external, depth별 밀도, 역할별 간격)을 모른다. 결과물이 "동작은 하지만 구려 보인다". 사람이 매번 시각 검토·교정해야 한다.
- **Forces**: 좋은 디자인의 공식화는 불가(암묵지, CHI'24 논문 확인) vs 나쁜 디자인은 boolean 판정 가능(위반 감지). 범용이어야 함(특정 프로젝트 토큰·구조에 비의존). 브라우저 렌더링 결과에서만 측정 가능(정적 CSS 분석 불가).
- **Decision**: 위반 감지(design lint) 방향. 순수 DOM/CSSOM API로 렌더링 결과 측정. 기각 대안: ① Playwright 전용(범용성↓, 셋업 비용), ② 서비스 내장(프로덕션 번들 오염), ③ 좋은 디자인 생성 시도(암묵지라 공식화 불가)
- **Non-Goals**: 미감 점수 매기기("얼마나 좋은가"), 디자인 자동 생성/교정, 프로젝트 특화 토큰 검증(기존 score:design이 담당), 접근성 감사(axe/lighthouse가 담당)

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | LLM이 Card 컴포넌트를 생성했고, card padding(24px)이 card 간 gap(16px)보다 크다 | lint 실행 | `internal-gt-external` 위반 리포트: element, actual padding, actual gap, severity:error | |
| M2 | 페이지에 interactive 요소가 36×28px로 렌더링됨 | lint 실행 | `touch-target-too-small` 위반: 최소 44×44 필요, actual 36×28 | |
| M3 | 중첩 구조에서 자식 컨테이너 gap(32px) > 부모 컨테이너 gap(16px) | lint 실행 | `depth-inversion` 위반: child gap은 parent gap 이하여야 함 | |
| M4 | 텍스트가 부모 경계에 padding 0으로 붙어 있음 | lint 실행 | `content-border-collision` 위반: 텍스트와 경계 사이 gap > 0 필요 | |
| M5 | 위반 0건인 깨끗한 페이지 | lint 실행 | 빈 violations 배열, score: 100% | |
| M6 | Claude in Chrome에서 javascript_tool로 스크립트 주입 | 실행 | LLM-readable 텍스트 리포트 반환, LLM이 바로 수정 가능 | |

완성도: 🟡

## ② 산출물

> 구조, 관계, 이름 — **규칙은 단일 소스, 실행 환경만 분리**

### 아키텍처

```
scripts/designLintRules.mjs        ← 규칙 함수 단일 소스 (순수 DOM/CSSOM)
  ├─ scripts/designScoreVisual.mjs ← Playwright runner (CI, 전 라우트, JSON 출력)
  └─ scripts/designLint.mjs        ← Browser runner (주입용, LLM-readable 출력)
```

기존 `designScoreVisual.mjs`의 V1~V4 규칙을 `designLintRules.mjs`로 추출하고, 신규 4규칙을 추가한다. 두 runner 모두 같은 규칙 함수를 호출한다.

### 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `designLintRules.mjs` | 규칙 함수 모음. 각 규칙은 `(root) => Violation[]`. 순수 DOM/CSSOM만 사용 — Playwright `page.evaluate()`와 브라우저 콘솔 양쪽에서 동작 | |
| `designLint.mjs` | Browser runner. 규칙 실행 + formatReport(). javascript_tool 주입 시에는 이 파일을 문자열로 주입 | |
| `designScoreVisual.mjs` (수정) | 기존 Playwright runner. 규칙 로직을 designLintRules에서 import하도록 리팩터 | |
| `Violation` 타입 | `{rule, selector, message, expected, actual, severity}` | |
| `formatReport(violations)` | Violation[]을 LLM-readable 텍스트로 변환. designLint.mjs에 포함 | |

### 규칙 목록 (8개 — 기존 4 + 신규 4)

**기존 (designScoreVisual에서 이관):**

| ID | 규칙 | 측정 방법 | severity |
|----|------|----------|----------|
| `alignment-axis-overflow` | 고유 정렬 축(x/y 좌표)이 과다 | getBoundingClientRect로 자식들의 left 좌표 수집, 8px grid snap 후 고유값 수. ratio > 0.4이면 위반 | warning |
| `decoration-overload` | 요소에 동시 장식 3개 이상 (border+shadow+bg+outline) | getComputedStyle로 4가지 장식 속성 중 활성 수 카운트 | warning |
| `content-border-collision` | 텍스트/아이콘이 부모 경계에 붙음 (padding=0) | 텍스트 노드의 rect vs 가장 가까운 배경 있는 조상의 rect. 차이 ≤ 0 | error |
| `focus-no-feedback` | focus 상태에서 시각 변화 없음 | element.focus() 전후 computedStyle diff | warning |

**신규:**

| ID | 규칙 | 측정 방법 | severity |
|----|------|----------|----------|
| `internal-gt-external` | 컨테이너 padding > 해당 컨테이너 간 gap | getComputedStyle padding vs 부모의 gap (gap 없으면 margin으로 fallback) | error |
| `depth-inversion` | 자식 컨테이너 gap > 부모 컨테이너 gap | DOM 트리 순회, 각 depth의 gap 비교 | error |
| `same-role-different-spacing` | 동일 role 요소들의 padding/gap 불일치 | role별 그룹핑 후 padding/gap 분산 측정 | warning |
| `touch-target-too-small` | interactive 요소 44×44px 미만 | getBoundingClientRect on button/a/input/[role] | error |

### 실행 환경

| 환경 | runner | 출력 | 트리거 |
|------|--------|------|--------|
| Claude in Chrome | designLint.mjs (문자열 주입) | LLM-readable 텍스트 | `javascript_tool` |
| 브라우저 콘솔 | designLint.mjs (복붙) | LLM-readable 텍스트 | 수동 |
| Playwright CI | designScoreVisual.mjs | JSON | `pnpm score:design-visual` |

완성도: 🟡

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `designLint()` 호출 (인자 없음) | 페이지 렌더링 완료 | document.body 기준 전체 스캔 | body가 가장 넓은 범위의 기본값 | violations 배열 반환 | |
| `designLint(element)` 호출 | 특정 컴포넌트만 검사하고 싶음 | element 하위만 스캔 | 전체 스캔은 느릴 수 있고, 특정 영역만 수정 후 재검증이 흔함 | 해당 서브트리의 violations만 반환 | |
| `designLint({rules: ['touch-target-too-small']})` | 특정 규칙만 실행하고 싶음 | 지정 규칙만 실행 | 수정 후 해당 규칙만 재검증하는 것이 효율적 | 지정 규칙의 violations만 반환 | |
| violations 결과를 LLM이 읽음 | 위반 리포트 존재 | formatReport()가 텍스트 생성 | LLM은 JSON보다 자연어 텍스트를 더 잘 이해하고 행동으로 옮김 (feedback: rec_llm_readable) | LLM이 CSS 수정 가능한 형태의 텍스트 | |

### 출력 포맷

```
// formatReport() 출력 예시

Design Lint: 3 violations (2 errors, 1 warning)

[ERROR] content-border-collision
  → <p class="title"> in <div class="card">
  → Text touches parent boundary (horizontal padding: 0px)
  → Fix: Add padding to parent or wrap with padded container

[ERROR] touch-target-too-small
  → <button class="icon-btn"> (32×32px)
  → Interactive element below 44×44px minimum
  → Fix: Increase size or add padding to reach 44×44

[WARNING] alignment-axis-overflow
  → 7 unique X positions found (threshold: 5)
  → Elements may not be aligned to a consistent grid
  → Fix: Align elements to fewer columns

Score: 5/8 rules passed
```

완성도: 🟡

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 빈 페이지 (body에 자식 없음) | root에 요소 없음 | 검사할 대상이 없으면 위반도 없다 | violations: [], score: 100% | 정상 완료 | |
| hidden 요소 (display:none, visibility:hidden) | 요소가 렌더링되지 않음 | 보이지 않는 요소는 시각 위반 판정 불가 — rect가 0×0 | 스캔 대상에서 제외 | 해당 요소 스킵 | |
| iframe 내부 콘텐츠 | cross-origin iframe | 보안 정책으로 접근 불가 | iframe 내부는 스캔하지 않음 | iframe 스킵, 경고 메시지 | |
| 수천 개 요소 페이지 | 대규모 DOM | 성능 문제 — 전수 스캔은 느릴 수 있음 | 요소 수 > 1000이면 경고 + 계속 실행. 타임아웃 없음 (브라우저가 관리) | 결과 반환 (느릴 수 있음) | |
| SVG/Canvas 내부 요소 | 비-HTML 렌더링 | getComputedStyle이 의미 없거나 다르게 동작 | SVG/Canvas 내부는 스캔 제외 | 스킵 | |
| 의도적 padding:0 (hero image, full-bleed) | 디자인 의도로 경계 밀착 | img, video, svg, canvas는 콘텐츠 특성상 경계 밀착이 정상 | 미디어 요소는 content-border-collision 면제 | 면제 처리 | |
| position:fixed/sticky 요소 | DOM 트리와 시각 위치 불일치 | getBoundingClientRect는 시각 위치 반환하므로 정상 측정 가능 | 정상 스캔 | 위반 판정 가능 | |
| focus-no-feedback 측정 시 side effect | element.focus()가 스크롤/상태 변경 유발 | 측정 후 원래 focus를 복원해야 페이지 상태를 오염시키지 않음 | 측정 전 activeElement 저장, 측정 후 복원 | 원래 포커스 복원 | |

완성도: 🟡

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 디자인은 장식이 아니라 기능 (feedback_design_is_function) | ② 규칙 목록 | ✅ 준수 — 규칙이 장식이 아닌 기능적 위반(간격, 크기, 위계)을 감지 | — | |
| 2 | REC 출력은 LLM-readable 텍스트 (feedback_rec_llm_readable) | ③ 출력 포맷 | ✅ 준수 — formatReport()가 자연어 텍스트, Fix 제안 포함 | — | |
| 3 | 토큰이 아닌 값은 위반 (feedback_all_values_must_be_tokens) | ② 규칙 목록 | N/A — 범용 도구이므로 프로젝트 토큰 검증은 범위 밖 (기존 score:design R6이 담당) | — | |
| 4 | 관측 도구 먼저 검증 (feedback_observation_tool_bias) | ④ focus 측정 | ✅ 준수 — focus-no-feedback 규칙은 side effect 복원 필수, false positive 주의 | — | |
| 5 | gap으로 간격 관리, margin 금지 (feedback_gap_over_margin) | ② internal-gt-external | 🟡 주의 — 범용 도구이므로 외부 사이트에서는 margin 기반 레이아웃이 정상. gap 없으면 margin으로 fallback 측정 | 규칙 설명에 "gap 우선, 없으면 margin" 명시 | |
| 6 | 테스트 셀렉터: role > data-* (feedback_test_selector_convention) | ② same-role-different-spacing | ✅ 준수 — role 속성으로 그룹핑 | — | |
| 7 | 포커스는 항상 결과물을 가리킨다 (feedback_focus_is_result) | 전체 | ✅ 준수 — 이 도구의 결과물이 곧 LLM의 다음 행동을 결정 | — | |

완성도: 🟡

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | 기존 score:design / score:design-visual과 규칙 중복 | 같은 위반을 두 곳에서 다르게 판정할 수 있음 | 중 | 허용 — 범용 lint는 프로젝트 비의존, score:design은 프로젝트 특화. 겹치는 규칙이 있어도 컨텍스트가 다름 | |
| 2 | focus-no-feedback 측정 시 페이지 포커스 변경 | 사용자가 보고 있는 페이지의 포커스가 움직임 | 중 | ④에 이미 반영 — activeElement 저장/복원 | |
| 3 | 대규모 DOM에서 성능 | 스크립트 실행 중 페이지 응답 지연 | 낮 | ④에 이미 반영 — 경고만, 타임아웃 없음 | |

완성도: 🟡

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | DOM을 수정하지 않는다 (읽기 전용) | ⑥-2 side effect | lint는 관찰만 해야 함. DOM 수정은 LLM이 별도로 수행 | |
| 2 | 프로젝트 특화 토큰/클래스를 참조하지 않는다 | ① Non-Goals | 범용 도구. var(--) 이름이나 .class 이름에 의존하면 안 됨 | |
| 3 | 네트워크 요청을 하지 않는다 | 보안 | 주입 스크립트가 외부 통신하면 안 됨 | |
| 4 | alert/confirm/prompt를 호출하지 않는다 | Claude in Chrome 제약 | 브라우저 모달이 뜨면 MCP 확장이 멈춤 | |
| 5 | console.log로 결과를 출력하지 않는다 | feedback_rec_llm_readable | return으로 값을 반환. javascript_tool이 반환값을 읽음 | |

완성도: 🟡

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | M1 | padding 24px 컨테이너가 gap 16px 부모 안에 있을 때 | `internal-gt-external` error 1건 | |
| V2 | M2 | 32×32px 버튼 존재 | `touch-target-too-small` error 1건, actual: 32×32 | |
| V3 | M3 | 자식 gap 32px > 부모 gap 16px | `depth-inversion` error 1건 | |
| V4 | M4 | padding:0인 div 안에 텍스트 | `content-border-collision` error 1건 | |
| V5 | M5 | 위반 없는 깨끗한 페이지 | violations: [], 8/8 passed | |
| V6 | M6 | Chrome에서 javascript_tool로 실행 | 텍스트 리포트 반환, 에러 없음 | |
| V7 | ④-hidden | display:none 요소 | 해당 요소 스킵, 위반 미보고 | |
| V8 | ④-media | img가 부모에 full-bleed | content-border-collision 면제 | |
| V9 | ④-focus | focus 측정 후 | 원래 activeElement로 복원 | |
| V10 | ④-empty | 빈 body | violations: [], score: 100% | |

완성도: 🟡

---

**전체 완성도:** 🟢 8/8 (교차 검증 통과, 구현 가능)
