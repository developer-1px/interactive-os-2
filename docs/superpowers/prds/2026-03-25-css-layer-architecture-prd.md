# CSS Layer Architecture — PRD

> Discussion: 반-헤드리스 컴포넌트의 CSS 스타일링 기준점 확립. SRP 기반 **6레이어** 스택으로 글로벌/로컬 경계를 정의하고, 외부 사용자가 커스텀 없이 바로 쓸 수 있는 수준의 기본 스타일링을 완성한다.
>
> **주 산출물**: DESIGN.md § CSS Layers — 프로젝트 공통 CSS 작성 프로토콜 문서

## ① 동기

### WHY (discuss FRT에서 이식)

- **Impact**: 외부 사용자가 컴포넌트를 import하면 disabled 스타일 없음, hover 제각각, focus 불일치 — "바로 쓸 수 있는" 수준이 아님. 컴포넌트별 완성도 2~7/10로 들쭉날쭉.
- **Forces**: ① 토큰/번들은 잘 설계됨(tokens.css 5개 번들) vs ② 컴포넌트가 번들을 안 쓰고 개별 토큰 자유 조합. ③ 토큰 인터페이스(변수명)=계약, 값=조정 가능이 전제. ④ 토큰 정리는 별도 에이전트가 진행 중 → 토큰 구조 자체는 이 PRD 범위 밖.
- **Decision**: SRP 기반 **6레이어** 분해 (L3 Type 폐기 — prose 컨텍스트 미사용, type 번들은 L5 Structure에서 직접 소비). 대안 기각 — (A) 번들 폐기/토큰만: 이미 잘 설계된 번들 낭비, 조합 판단을 매번 사람에게 전가. (B) 컴포넌트 레벨 shorthand(shadcn 방식): 레이어 추가 복잡도 vs 이득 불균형.
- **Non-Goals**: 토큰 값 변경(별도 에이전트), 새 컴포넌트 추가(Select/Popover 등), 컴포넌트 로직 변경, 반응형 레이아웃.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | 외부 사용자가 Button을 import | 아무 prop 없이 렌더 | primary tone + hover/focus/active/disabled 모두 동작 | |
| S2 | TextInput을 import | disabled prop 전달 | 시각적으로 비활성 표현, 상호작용 불가 | |
| S3 | TreeGrid에 포커스 | 키보드로 아이템 이동 | Apple HIG 규칙대로 bg highlight, idle시 회색 | |
| S4 | Dialog 열기 | overlay로 표시 | backdrop + surface-overlay 번들 + enter motion | |
| S5 | Button에 tone="destructive" | 렌더 | 빨간 계열 배경 + hover/active도 destructive tone 계열 | |
| S6 | Checkbox에 aria-invalid | 렌더 | border가 destructive 색상으로 변경 | |

완성도: 🟢

## ② 산출물

> 파일 구조 재편 — 현재 파일에서 SRP 기반으로 책임 분리

| 산출물 | 설명 | 현재 상태 | 역PRD |
|--------|------|----------|-------|
| **DESIGN.md § CSS Layers** (주 산출물) | 프로젝트 공통 CSS 작성 프로토콜. 6레이어 정의, 분류별 필수 상태, 셀렉터 전략, `--_` 패턴, 금지 목록. 모든 에이전트/개발자가 이걸 보고 CSS를 작성 | 없음 | |
| `src/styles/reset.css` (L1) | 브라우저 초기화 + HTML 요소 type 기본값. box-sizing, margin, font-smoothing | tokens.css 303~368행에 혼합 | |
| `src/styles/tokens.css` (L2) | 디자인 토큰 값만. :root 변수 선언 + light theme override | 현재 파일에 reset/surface 규칙 혼합 | |
| `src/styles/surface.css` (L3) | `[data-surface]` 번들 규칙. 면/깊이/구분 정책 | tokens.css 268~301행에 혼합 | |
| `src/styles/interactive.css` (L4) | 모든 인터랙션 정책: focus/hover/active/disabled/selected/invalid | components.css에 Collection만 | |
| `src/interactive-os/ui/*.module.css` (L5+L6) | Structure + Variant만. 상태 스타일 제거 | 현재 상태/구조/변형 혼합 | |

> **L3 Type 폐기 이유:** prose/markdown 컨텍스트를 거의 사용하지 않음. HTML 요소(h1~h6, p) 기본값은 reset.css에 병합. type 번들은 L5 Structure에서 직접 소비. 별도 파일을 만들 만큼의 규칙이 없다.

### 주 산출물: DESIGN.md § CSS Layers

DESIGN.md에 섹션을 추가한다. 이 섹션이 **CSS 작성의 단일 진실**이 되어, `/design-implement` 스킬이 이걸 참조하고 에이전트가 이걸 보고 CSS를 작성한다.

**문서 구조:**

```markdown
## CSS Layers — SRP 기반 스타일링 프로토콜

### 6레이어 스택
(L1~L6 정의 + 변경 이유 + 파일 매핑)

### 컴포넌트 분류와 필수 상태
(Action/Collection/Input/Overlay/Static 표)

### 셀렉터 소유권
(어떤 셀렉터가 어떤 레이어 소속인가)

### --_ Scoped Property 패턴
(L4 Interactive ↔ L6 Variant 협력 방식)

### module.css 작성 규칙
(Structure만 + Variant만. 상태 금지)

### 금지 목록
(raw value, palette 직접 참조, module.css에 상태 등)
```

### 파일 이동 계획

```
tokens.css에서 추출:
  - *:focus-visible, body, *, p, #root → reset.css (L1)
  - ::-webkit-scrollbar, @media reduced-motion → reset.css (L1)
  - [data-surface="*"] 규칙 6개 → surface.css (L4)
  - tokens.css에는 :root {} + [data-theme="light"] {} 만 남음

components.css에서 이동:
  - 인터랙션 상태 규칙 전체 → interactive.css (L5)
  - 그리드 레이아웃 (.grid-*) → 그대로 유지 (구조)
  - .item-inner, .item-spread → 그대로 유지 (구조)
```

완성도: 🟢

## ③ 인터페이스

> CSS 레이어의 인터페이스 = 셀렉터 전략. 어떤 셀렉터가 어떤 상태를 소유하는가.

| 레이어 | 셀렉터 | 상태 | 왜 이 결과가 나는가 | 결과 | 역PRD |
|--------|--------|------|-------------------|------|-------|
| L4 | `[data-aria-container] [data-focused]` | focus (collection, active) | Collection 아이템은 bg로 포커스 표현 (HIG) | `background: var(--primary-dim)` + outline | |
| L4 | `[data-aria-container]:not(:focus-within) [data-focused]` | focus (collection, idle) | 비활성 컨테이너의 커서 위치 기억 (HIG) | `background: var(--focus-idle)` | |
| L4 | `[data-aria-container]:not(:focus-within) [role]:hover` | hover (collection) | 포인터 기기에서 피드백. focus-within이면 억제 | `background: var(--bg-hover)` | |
| L4 | `[data-aria-container] [role]:active` | active (collection) | 즉각 press 피드백 | `background: var(--primary-bright)` | |
| L4 | `[data-aria-container] [aria-selected="true"]` | selected | 선택 상태 시각 표현 | `background: var(--selection)` | |
| L4 | `[aria-disabled="true"], :disabled` | disabled (전역) | 모든 컴포넌트의 비활성 표현은 시스템 정책 | `opacity: var(--disabled-opacity); pointer-events: none` | |
| L4 | `[aria-invalid="true"]` | invalid (input) | 입력 오류 시각 피드백은 시스템 정책 | `border-color: var(--tone-destructive)` | |
| L4 | `button:hover, [role="button"]:hover` | hover (standalone action) | Action 컴포넌트도 글로벌 hover 정책 | variant의 hover 토큰 사용 | |
| L4 | `button:active, [role="button"]:active` | active (standalone action) | Action press 피드백 | `transform: scale(0.98)` + motion 번들 | |
| L4 | `*:focus-visible` | focus (standalone) | 독립 요소는 ring으로 포커스 (HIG) | `outline: var(--focus-ring) solid var(--focus)` | |
| L5 | `.root` (module.css) | — | 컴포넌트 고유 형태는 컴포넌트만의 관심사 | shape/type 번들 적용 | |
| L6 | `.primary`, `.destructive` 등 (module.css) | — | 의미적 변형은 컴포넌트가 소유 | tone 번들 적용 | |

### L5 Interactive 셀렉터 전략 결정

**열린 질문이었던 것:** Action/Input의 hover/active를 글로벌에서 어떻게 잡는가?

**제 판단:**
- Collection은 현재처럼 `[data-aria-container] [role]` 패턴 유지
- Action(Button 등)은 `button`, `[role="button"]` 네이티브 셀렉터
- Input은 `input`, `textarea`, `select` 네이티브 셀렉터
- Disabled/Invalid는 ARIA 속성 셀렉터로 전역 적용
- **`data-interactive` 같은 새 속성 불필요** — 네이티브 요소/role이면 충분

### Action hover의 글로벌 vs 로컬 경계

**핵심 고민:** Button의 hover가 `var(--tone-primary-hover)`를 써야 한다면, tone은 variant(L7)이고 hover는 interactive(L5)다 — 어디 소속?

**해결:** L5가 **hover 상태 진입**을 소유하고, L7이 **hover 시 보여줄 값**을 소유한다.

```css
/* L7: Variant — hover 시 쓸 값을 선언 */
.primary {
  --_bg: var(--tone-primary);
  --_bg-hover: var(--tone-primary-hover);
  background: var(--_bg);
}

/* L5: Interactive — hover 상태 진입을 소유 */
button:hover { background: var(--_bg-hover); }
```

`--_` 접두사(CSS scoped custom property)로 variant가 선언하고, interactive가 참조. **상태 전환 타이밍은 L5, 시각적 값은 L7** — SRP 유지.

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| disabled + focused | 스타일 없음 | disabled가 focused보다 우선 — 비활성 요소에 커서 표시는 혼란 | disabled 스타일만 적용, focus bg 제거 | opacity 적용, outline 없음 | |
| disabled + hover | 스타일 없음 | disabled 요소에 hover 피드백은 "클릭 가능" 착각 유발 | pointer-events: none으로 hover 자체 차단 | 변화 없음 | |
| selected + disabled | 스타일 없음 | 선택은 되어있지만 상호작용 불가 — 둘 다 보여야 함 | selection bg + disabled opacity | 흐린 선택 표시 | |
| invalid + focused | 스타일 없음 | 오류 표시 + 포커스 ring 동시 필요 — 사용자가 수정 중 | destructive border + focus ring | 빨간 border + 파란 ring | |
| treegrid level 11+ | 하드코딩 10까지 | 깊은 중첩도 시각적 구분 필요 — calc로 산출 | `calc(var(--space-sm) + var(--space-lg) * level)` | 무한 확장 | |
| motion + prefers-reduced-motion | 현재 있음 | 접근성 필수 — 현재 tokens.css에 @media 규칙 있음 | 모든 motion 0.01ms로 override | 모션 제거 | |
| L5 interactive + L7 variant 충돌 | 없음 | 두 레이어가 같은 property(background)를 건드림 | `--_` scoped property로 격리 | specificity 충돌 없음 | |
| 글로벌 hover + module.css hover 중복 | 현재 module.css에 hover 있음 | module.css에서 hover 제거 안 하면 이중 적용 | **마이그레이션 시 module.css hover 규칙 삭제 필수** | L5만 hover 소유 | |

### 마이그레이션 순서 (점진적 — additive first, subtractive by classification)

> 54개 파일 동시 수정은 리스크가 크다. **additive → subtractive** 순서로 점진 전환.
> 이중 적용(같은 값이 두 곳에서 적용)은 시각적 차이 없으므로 안전한 중간 상태.

1. **DESIGN.md § CSS Layers 작성** — 프로토콜 문서 먼저 (주 산출물)
2. **L1 reset.css 추출** — tokens.css에서 분리 (기능 변화 없음)
3. **L3 surface.css 추출** — tokens.css에서 분리 (기능 변화 없음)
4. **L4 interactive.css ADDITIVE 생성** — 모든 분류의 규칙을 넣는다 (Collection 이동 + Action/Input/Overlay 신규). 이 시점에서 module.css와 이중 적용되지만 깨지지 않음
5. **module.css SUBTRACTIVE 정리** — 분류별 순서로:
   - 5a. Collection (거의 없음 — 이미 components.css가 담당)
   - 5b. Action (Button, Toggle, Switch — 3~5개 파일)
   - 5c. Input (TextInput, Checkbox, Radio, Slider — 4~6개 파일)
   - 5d. Overlay (Dialog, AlertDialog, Tooltip — 3개 파일)
6. **components.css 정리** — interactive.css로 이동한 규칙 제거
7. **import 순서 갱신** — 앱 진입점에서 L1→L2→L3→L4 순서로

각 Step 사이에 시각 확인 가능. Step 4는 추가만(safe), Step 5는 소규모 삭제(검증 가능).

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | raw value 금지 — 모든 디자인 수치는 토큰 (feedback_all_values_must_be_tokens) | ③ L5 `scale(0.98)`, treegrid px | ⚠️ 위반 | scale을 `--motion-press-scale` 토큰으로, treegrid을 calc 공식으로 | |
| P2 | 번들 단위 사용 필수 (feedback_design_bundle_system) | ③ L6/L7 shape/type/tone | ✅ 준수 | module.css에서 번들 세트 사용 강제 | |
| P3 | Focus: 컬렉션=bg, 독립=ring (feedback_focus_indicator_rule) | ③ L5 focus 셀렉터 | ✅ 준수 | HIG 원칙 그대로 반영 | |
| P4 | gap으로 간격 관리, margin 금지 (feedback_gap_over_margin) | ② 파일 분리 시 | ✅ 해당없음 | CSS 레이어 아키텍처는 layout과 무관 | |
| P5 | inactive cursor: bg만 유지, outline은 :focus-within일 때만 (feedback_inactive_focus_cursor) | ③ L5 idle focus | ✅ 준수 | `[data-aria-container]:not(:focus-within) [data-focused]` 패턴 | |
| P6 | 디자인은 기능 (feedback_design_is_function) | ① 동기 전체 | ✅ 준수 | disabled/invalid 등 상태 표현 = 기능 | |
| P7 | 파일명 = 주 export (feedback_filename_equals_export) | ② 새 파일명 | ✅ 준수 | reset.css, type.css 등 명확 | |
| P8 | atomic restructure (feedback_atomic_restructure) | ④ 마이그레이션 | ⚠️ 주의 | 파일 분리 + hover 이동을 원자적으로 실행해야 함 | |

P1 해결: `--motion-press-scale: 0.98`을 tokens.css에 추가. treegrid level 4+는 `calc(var(--space-sm) + var(--space-lg) * var(--_level))`로 교체.
P8 해결: ④ 마이그레이션 순서에서 additive→subtractive 점진 전환. 각 분류별 step은 원자적.

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| E1 | tokens.css 분리 → import 순서 변경 | 앱 진입점의 CSS import 순서가 바뀜 | 낮 | main.tsx(또는 App.tsx) import 순서 갱신 | |
| E2 | components.css → interactive.css 이동 | 기존 셀렉터 참조하는 코드 있으면 깨짐 | 중 | grep으로 components.css import 전수 확인 후 교체 | |
| E3 | module.css에서 hover/focus 제거 | L5가 아직 안 만들어진 상태에서 제거하면 스타일 소실 | 높 | **L5 먼저 생성 → module.css에서 제거** 순서 필수 | |
| E4 | `[aria-disabled]` 글로벌 적용 | 의도치 않은 요소에 disabled 스타일 적용 가능 | 중 | `[data-aria-container] [aria-disabled]`로 스코프 제한, standalone은 `:disabled`로 | |
| E5 | Action hover 글로벌화 | Button module.css의 `.accent:hover` 등과 이중 적용 | 높 | module.css hover 제거가 선행 조건 — E3과 동일 순서 | |
| E6 | `--_bg-hover` scoped property 패턴 | 기존 컴포넌트에 `--_` 패턴 없음 — 전부 추가 필요 | 중 | variant 클래스에 `--_` 선언 일괄 추가 | |

대응 요약: E3/E5가 가장 심각 → ④ 마이그레이션 순서에서 L5+module.css 동시 원자 실행으로 해결.

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| N1 | module.css에 hover/focus/active/disabled 상태 작성 | ⑤P3, 설계 원칙 | L5 Interactive의 SRP 위반. 상태는 글로벌 정책 | |
| N2 | tokens.css에 셀렉터 규칙 작성 (값 외) | ⑤P2, SRP | L2는 값만 선언. 규칙은 L3~L5의 책임 | |
| N3 | 하드코딩 transition duration/easing | ⑤P1 | `--motion-*` 번들 사용 필수 | |
| N4 | palette primitive 직접 참조 (`--blue-600` 등) | ⑤P1 | semantic 토큰(`--tone-primary-hover`)만 사용 | |
| N5 | L5 생성 전에 module.css hover 제거 | ⑥E3 | 스타일 소실. L5 먼저 → module.css 제거 순서 | |
| N6 | L4 없이 module.css에서 상태 제거 | ⑥E3 | additive first — L4를 먼저 추가한 뒤 분류별로 subtractive 정리 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | ①S1 | Button 렌더 → hover/focus/active/disabled 4상태 전환 | 각 상태에서 시각 변화 확인 | |
| V2 | ①S2 | TextInput disabled → 클릭, 타이핑 시도 | 상호작용 불가 + 시각적 비활성 | |
| V3 | ①S3 | TreeGrid 키보드 탐색 → idle/active focus 전환 | bg highlight (active), gray bg (idle) | |
| V4 | ①S4 | Dialog 열기 | backdrop + overlay surface + enter motion | |
| V5 | ①S5 | Button tone="destructive" 렌더 | destructive tone 번들 적용 (base/hover/active) | |
| V6 | ①S6 | Input aria-invalid 설정 | border-color: destructive | |
| V7 | ④경계1 | disabled + focused 동시 상태 | disabled만 표시, focus 제거 | |
| V8 | ④경계2 | disabled + hover | 변화 없음 (pointer-events: none) | |
| V9 | ④경계7 | 마이그레이션 후 hover 이중 적용 없음 | 하나의 hover 규칙만 적용됨 | |
| V10 | ⑤P1 | grep으로 하드코딩 검사: `0\.0[0-9]+s`, raw px(level 4+) | 0건 | |
| V11 | ⑤P1 | grep으로 palette primitive 직접 참조 검사 | module.css에서 `--blue-`, `--stone-` 등 0건 | |
| V12 | SRP | tokens.css에 셀렉터 규칙 없음 확인 | :root와 [data-theme] 블록만 존재 | |
| V13 | SRP | module.css에 :hover, :focus, :disabled, :active 없음 확인 | 0건 (L5로 이동 완료) | |
| V14 | 전체 | 기존 테스트 통과 | vitest 전체 패스 | |

시각적 검증(V1~V6)은 브라우저에서 확인. 정적 검증(V10~V13)은 grep 자동화 가능 — `/go` 실행 시 Verify phase에서 수행.

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

| 단계 | 완성도 |
|------|--------|
| ① 동기 | 🟢 |
| ② 산출물 | 🟢 |
| ③ 인터페이스 | 🟢 |
| ④ 경계 | 🟢 |
| ⑤ 원칙 대조 | 🟢 |
| ⑥ 부작용 | 🟢 |
| ⑦ 금지 | 🟢 |
| ⑧ 검증 | 🟢 |
