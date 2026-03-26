# Component Styling Rules — PRD

> Discussion: surface 번들을 깊이→인터랙션 모드로 재정의하고, module.css 3블록 레시피 + --_ 패턴으로 모든 컴포넌트의 스타일링 일관성을 강제한다.

## ① 동기

### WHY (discuss FRT에서 이식)

- **Impact**: 12개 module.css가 :hover/:focus/:disabled를 각자 구현, 18+ 파일이 shape 번들 부분 사용, 6개 파일이 display를 module.css에 작성 → 컴포넌트마다 스타일링 패턴이 달라 일관성 부재. LLM이 새 컴포넌트를 만들 때마다 기존 위반을 복제.
- **Forces**: CSS는 개별 속성 언어라 번들을 물리적으로 강제 불가 (제약) + interactive.css가 `[data-aria-container]` 안만 커버하여 독립 컴포넌트(Button, Input)의 상태 스타일이 L4에 자리 없음 (구조 갭).
- **Decision**: surface를 깊이 6종에서 인터랙션 모드 4종(action/input/display/overlay)으로 재정의. bg 깊이는 --_bg로 variant가 주입. 이유: 깊이는 이미 variant의 책임이므로 surface에 남는 건 border+shadow+상태 세트 — 인터랙션 모드와 1:1 대응. 기각 대안: (A) interactive.css를 독립 컴포넌트까지 확장 → surface가 분류를 제공하면서 자연스럽게 채택됨 (B) module.css에 상태 허용+--_ 강제 → L4 SRP 불완전.
- **Non-Goals**: interactive.css의 `[data-aria-container]` 컬렉션 체계는 건드리지 않음. lint 스크립트 작성 안 함 — /design-implement 스킬만으로 강제. 토큰 값 변경 없음 (tokens.css 유지).

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | 새 Button variant 추가 필요 | module.css에 variant 작성 | --_ 변수 선언만으로 완성, :hover/:focus 작성 불필요 — data-surface="action"이 제공 | |
| M2 | 새 Input 컴포넌트 작성 | data-surface="input" 부여 | focus→border, invalid→border 상태가 자동 적용 | |
| M3 | 기존 Button.module.css 확인 | :hover/:active 제거, --_ 패턴 적용 | 동일한 시각적 결과 + L4 SRP 준수 | |
| M4 | Card(정보 표시) 컴포넌트 작성 | data-surface="display" 부여 | 상태 전환 없음, bg+shadow만 | |
| M5 | LLM이 /design-implement로 CSS 작성 | 스킬이 3블록 레시피 + 번들 규칙 강제 | 규칙 준수 코드 자동 생성 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `surface.css` 재작성 | depth 6종 → interaction mode 4종 (action/input/display/overlay). bg 제거, border+shadow+상태 세트 | |
| `interactive.css` 확장 | `[data-surface]` 기반 독립 컴포넌트 상태 전환 추가. 기존 `[data-aria-container]` 섹션 유지 | |
| 12개 module.css 리팩토링 | :hover/:focus/:active/:disabled 제거, --_ 패턴 적용, 3블록 구조로 재구성 | |
| 6개 module.css 구조 분리 | display:flex/grid를 structure.css atomic class로 이동 (TSX className 수정) | |
| 18+ module.css 번들 정합 | --space-* padding → --shape-*-py/px 번들로 교체 | |
| DESIGN.md 갱신 | surface 번들 정의 변경, module.css 3블록 레시피 추가, --_ 풀 추가, 금지 목록 갱신 | |
| /design-implement 스킬 갱신 | 새 규칙 체계를 스킬에 내장 | |
| TSX 파일 수정 | data-surface attr 값 변경 (depth→mode), className에 atomic class 추가 | |

완성도: 🟢

## ③ 인터페이스

> CSS API — 셀렉터, 프로퍼티, 패턴. 인터랙션 UI가 아닌 CSS 작성 규약이므로 키보드 체크리스트 N/A.

### surface.css — 4종 인터랙션 모드

| data-surface | border | shadow | 상태 세트 (interactive.css가 제공) | 왜 이 조합인가 |
|---|---|---|---|---|
| `action` | none | none | hover→`--_bg-hover`, active→`--_bg-active`, focus-visible→ring, disabled→opacity | 버튼/토글은 bg 변화로 피드백. border 없음 = 면 자체가 행동 대상 |
| `input` | `1px solid var(--border-default)` | none | focus→`--_border-focus`, invalid→`--_border-invalid`, disabled→opacity | 입력 필드는 경계(border)가 정체성. 상태도 border로 표현 |
| `display` | optional (variant) | optional (variant) | 없음 | 정보 표시만. 인터랙션 불필요 |
| `overlay` | `1px solid var(--border-default)` | `var(--shadow-lg)` | enter/exit motion, backdrop | 떠 있는 레이어. shadow로 깊이 표현, 진입/퇴장 모션 |

### interactive.css — [data-surface] 상태 전환 규칙

| 셀렉터 | 프로퍼티 | 값 | 왜 |
|--------|---------|---|---|
| `:where([data-surface="action"]:hover)` | background | `var(--_bg-hover)` | variant가 주입한 hover 값 사용. variant 없으면 동작 안 함 (안전) |
| `:where([data-surface="action"]:active)` | background | `var(--_bg-active, var(--_bg-hover))` | active 미지정 시 hover로 fallback |
| `:where([data-surface="action"]:focus-visible)` | outline | `2px solid var(--focus)` | 독립 요소 = ring (Apple HIG) |
| `:where([data-surface="action"]:focus-visible)` | outline-offset | `-2px` | inset ring — 레이아웃 영향 없음 |
| `:where([data-surface="action"]:disabled)` | opacity | `0.4` | 컬렉션 disabled와 동일 값 |
| `:where([data-surface="action"]:disabled)` | pointer-events | `none` | 클릭 차단 |
| `:where([data-surface="input"]:focus)` | border-color | `var(--_border-focus, var(--focus))` | variant가 커스텀 focus 색 지정 가능, 기본은 --focus |
| `:where([data-surface="input"][aria-invalid="true"])` | border-color | `var(--_border-invalid, var(--tone-destructive-base))` | 에러 표시. 기본값 destructive |
| `:where([data-surface="input"]:disabled)` | opacity | `0.4` | 동일 disabled 정책 |
| `:where([data-surface="overlay"])` | transition | `opacity var(--motion-enter-duration) var(--motion-enter-easing)` | 진입 모션 |

### module.css 3블록 레시피

| 블록 | 내용 | 규칙 | 왜 |
|------|------|------|---|
| **Block 1: base** (.root) | 공유 형태 — shape 번들 + type 번들 + motion 번들 + --_ 참조 | 번들은 세트로. `background: var(--_bg)`, `color: var(--_fg)` | variant 값과 형태를 분리. 상태는 여기 없음 — data-surface가 제공 |
| **Block 2: variant** | --_ 변수 선언만 | background/color 직접 작성 금지. `--_bg`, `--_bg-hover`, `--_fg` 등 | 값과 전환을 분리. variant가 바뀌면 상태도 자동 변경 |
| **Block 3: size** | shape+type 번들 override | 번들 세트로 교체 | sm이면 shape-xs + type-caption 세트 |

### --_ 네이밍 풀 (닫힌 체계)

| 변수 | surface | 용도 | fallback |
|------|---------|------|----------|
| `--_bg` | all | 기본 배경 | 없음 (필수) |
| `--_bg-hover` | action | 호버 배경 | 없음 |
| `--_bg-active` | action | 누름 배경 | `--_bg-hover` |
| `--_fg` | all | 기본 전경 | 없음 (필수) |
| `--_fg-hover` | action | 호버 전경 | `--_fg` |
| `--_border` | input | 기본 테두리 | `--border-default` |
| `--_border-focus` | input | 포커스 테두리 | `--focus` |
| `--_border-invalid` | input | 에러 테두리 | `--tone-destructive-base` |

풀 확장 시 이 표에 등록 필수.

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| variant 미지정 (data-surface="action"만) | --_bg 미정의 | CSS custom property는 미정의 시 initial value → transparent. 안전한 기본값 | hover/active 반응 없음, 시각적으로 투명 | 깨지지 않되 의미 없음 — 개발 중 즉시 인지 | |
| action + input 동시 부여 | 불가능 | data-surface는 단일 값 attr. "action-input"은 정의되지 않음 | 매칭 안 됨 → 상태 없음 | CSS 레벨에서 구조적으로 차단 | |
| 기존 data-surface="raised" 사용처 | PageThemeCreator에서 6종 showcase | depth 6종이 사라짐. showcase가 깨짐 | ThemeCreator의 surface specimen을 4종으로 교체 | showcase 업데이트 | |
| Kanban card — hover+focus가 module.css에 복잡하게 정의 | .card:hover, .card:focus, .card[aria-selected] | Kanban card는 컬렉션 아이템([data-aria-container] 안) — interactive.css가 담당 | module.css에서 상태 스타일 제거, interactive.css 기본값 사용 | 컬렉션 정책 통일 | |
| SplitPane separator — :hover, :focus-visible 특수 동작 | 리사이즈 핸들. hover 시 배경으로 영역 표시 | separator는 action surface — hover→bg로 영역 힌트 | data-surface="action" + --_bg-hover로 동일 효과 | 패턴 통일 | |
| MarkdownViewer a:hover — 텍스트 decoration | underline on hover | prose 스타일은 컴포넌트 스타일링 규칙 범위 밖 — HTML element 스타일 | 예외로 유지. data-surface 적용 대상 아님 (HTML 기본 요소) | module.css에 :hover 잔류 허용 (예외) | |
| CodeBlock .code-token:hover — 토큰 하이라이트 | :global selector로 hover bg | 코드 토큰은 의미론적 컴포넌트가 아님 — syntax highlight의 일부 | 예외로 유지 | module.css에 :hover 잔류 허용 (예외) | |
| display surface에 bg 필요한 경우 (Card) | Card는 배경+shadow 필요 | display는 bg를 surface.css에서 제공하지 않음 (--_bg로 이동) | variant에서 --_bg: var(--surface-raised) 선언. shadow는 module.css에 직접 | variant가 깊이 결정 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 모든 디자인 수치는 토큰 필수 (feedback_all_values_must_be_tokens) | ③ interactive.css 상태 전환 | ✅ 준수 — 모든 값이 토큰 또는 --_ 변수 | — | |
| 2 | margin 금지, gap으로 간격 (feedback_gap_over_margin) | ② module.css 리팩토링 | ✅ 준수 — 리팩토링 대상에 margin 제거 포함 | — | |
| 3 | 구조/디자인 분리 (feedback_css_structure_design_split) | ② 6개 module.css 구조 분리 | ✅ 준수 — display:flex/grid를 className으로 이동 | — | |
| 4 | :where() 래핑 (feedback_where_for_aria_defaults) | ③ interactive.css [data-surface] 셀렉터 | ✅ 준수 — 모든 셀렉터 :where() 래핑 | — | |
| 5 | 같은 역할 = 같은 디자인 (feedback_same_role_same_design) | ② 전체 | ✅ 준수 — 3블록 레시피가 같은 분류의 컴포넌트에 동일 구조 강제 | — | |
| 6 | component class는 item-{part} 패턴 (feedback_component_class_convention) | ③ module.css class 네이밍 | ✅ 준수 — base는 .root, variant/size는 역할명 | — | |
| 7 | Focus 규칙: 컬렉션→bg, 독립→ring (feedback_focus_indicator_rule) | ③ action surface focus-visible | ✅ 준수 — action은 ring, [data-aria-container]는 기존 bg 유지 | — | |
| 8 | 선언적 OCP (feedback_declarative_ocp) | ② surface 재정의 | ✅ 준수 — data-surface 선언 = 상태 세트 등록, interactive.css는 합성 런타임 불변 | — | |
| 9 | 토큰 축 약어 규칙 (feedback_token_abbreviation_rule) | ③ --_ 네이밍 | ✅ 준수 — bg, fg는 CSS 통용 약어 | — | |
| 10 | Parent-enforced containment (feedback_parent_enforced_containment) | ② 구조 분리 | ✅ 준수 — 레이아웃은 structure.css 유지 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | surface.css — depth 6종 제거 | data-surface="raised" 등 기존 사용처 깨짐 | 높 | PageThemeCreator showcase 업데이트. 기존 depth 사용처를 variant --_bg로 이전 | |
| 2 | 12개 module.css — :hover/:focus 제거 | 시각적 회귀 가능성 | 높 | 컴포넌트별 before/after 스크린샷 비교 필수 | |
| 3 | 6개 TSX — className에 atomic class 추가 | JSX 변경 범위 | 중 | display 제거 + className 추가는 동일 PR에서 원자적 실행 | |
| 4 | interactive.css — 새 [data-surface] 섹션 추가 | 기존 [data-aria-container] 섹션과 셀렉터 충돌 가능 | 중 | data-surface는 [data-aria-container] 밖 요소에만 부여. 둘이 동시에 붙는 경우 없음 — 경계④에서 커버 | |
| 5 | DESIGN.md — surface 정의 변경 | 기존 문서 참조 깨짐 | 낮 | DESIGN.md 갱신은 코드 변경과 동시 | |
| 6 | /design-implement 스킬 — 규칙 변경 | 스킬 참조하는 기존 DESIGN.md 내용 불일치 | 낮 | 스킬 갱신은 DESIGN.md 갱신과 동시 | |
| 7 | MarkdownViewer, CodeBlock — 예외 :hover 잔류 | "module.css에 :hover 없어야 한다"는 규칙과 예외 공존 | 낮 | DESIGN.md 금지 목록에 "HTML 기본 요소/syntax highlight 예외" 명시 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | module.css에 :hover/:focus/:active/:disabled 작성 | ⑤#8 선언적 OCP | data-surface가 상태 제공. 예외: HTML 기본 요소(a:hover), syntax highlight | |
| 2 | variant에 background/color 직접 작성 | ⑤#8 선언적 OCP | --_ 변수 선언만. 값과 전환 분리 | |
| 3 | 번들 부분 사용 (shape-md-radius + space-sm padding) | ⑤#1 토큰 필수 | radius를 쓰면 같은 세트의 py/px도 | |
| 4 | module.css에 display:flex/grid | ⑤#3 구조/디자인 분리 | structure.css atomic class 사용 | |
| 5 | data-surface와 data-aria-container 동시 부여 | ⑥#4 셀렉터 충돌 | 컬렉션 아이템은 [data-aria-container]가 담당, 독립은 [data-surface] | |
| 6 | --_ 풀에 없는 scoped property 무단 추가 | ③ 닫힌 체계 | DESIGN.md --_ 풀 테이블에 등록 후 사용 | |
| 7 | surface depth 값 (base/sunken/raised 등) 직접 사용 | ⑥#1 depth 제거 | depth는 variant --_bg가 결정 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①M1 | Button.module.css에 :hover/:active 없고, data-surface="action" + --_ 패턴 사용 | hover 시 bg 변경, active 시 bg 변경 — 기존과 동일 시각 결과 | |
| V2 | ①M2 | TextInput에 data-surface="input", :focus 없음 | focus 시 border 변경 — 기존과 동일 | |
| V3 | ①M3 | 리팩토링 전후 Button 스크린샷 비교 | 시각적 차이 없음 | |
| V4 | ④E1 | variant 미지정 Button (--_bg 없음) | 투명 배경, hover 반응 없음 — 깨지지 않음 | |
| V5 | ④E3 | PageThemeCreator surface showcase | 4종 인터랙션 모드로 업데이트, 깨지지 않음 | |
| V6 | ④E4 | Kanban card hover/focus | interactive.css 컬렉션 정책으로 통일, 기존과 유사 시각 결과 | |
| V7 | ④E5 | SplitPane separator hover | data-surface="action" + --_bg-hover로 동일 효과 | |
| V8 | ④E6 | MarkdownViewer a:hover | 예외 유지, underline 동작 | |
| V9 | ①M5 | /design-implement 스킬로 새 컴포넌트 CSS 작성 | 3블록 레시피 + 번들 준수 + --_ 패턴 자동 적용 | |
| V10 | ④E8 | display surface Card에 bg+shadow | variant --_bg: var(--surface-raised) + module.css shadow 직접 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8 — 교차 검증 통과
