# CSS Layer Protocol — SRP 기반 스타일링 설계문서 제안 — 2026-03-25 (v2)

## 배경

interactive-os는 반-헤드리스 UI 라이브러리. 내부 로직은 탄탄하나 컴포넌트 CSS에 기준점이 없어 완성도가 들쭉날쭉하다 (2~7/10). 토큰/번들은 잘 설계되어 있고 별도 정리 진행 중이며, 토큰 인터페이스(변수명)=계약, 값=조정 가능이 전제.

**문제:** 토큰이 정리돼도 "컴포넌트 CSS를 어떻게 조립하는가"의 레시피가 없으면 같은 불일치가 반복된다. 재료는 있는데 요리법이 없는 상태.

## 제안: DESIGN.md에 CSS Layers 섹션 추가

프로젝트 공통 CSS 작성 프로토콜을 DESIGN.md에 추가한다. 모든 에이전트/개발자가 컴포넌트 CSS 작성 시 이 문서를 참조한다.

---

## 1. 6레이어 스택 (SRP — 각 레이어의 변경 이유가 단 하나)

```
Global ──────────────────────────────
  L1  Reset          브라우저 초기화 + HTML type 기본값  → reset.css
  L2  Tokens         디자인 값 (계약 인터페이스)          → tokens.css
  L3  Surface        면/깊이/구분 정책                   → surface.css
  L4  Interactive    인터랙션 정책                       → interactive.css

Local ───────────────────────────────
  L5  Structure      컴포넌트 고유 형태                  → *.module.css
  L6  Variant        컴포넌트 변형 (tone/size)           → *.module.css
```

> **L3 Type 폐기:** prose/markdown 컨텍스트를 거의 사용하지 않음. HTML 요소 기본값은 reset.css에 병합. type 번들은 L5 Structure에서 직접 소비.

| Layer | 변경 이유 (단 하나) | 현재 파일 | 문제 |
|-------|-------------------|----------|------|
| L1 Reset | 브라우저 기본값 정책 | tokens.css에 혼합 | SRP 위반 |
| L2 Tokens | 디자인 시스템 값 | tokens.css | surface 규칙 혼합 |
| L3 Surface | 면/깊이 정책 | tokens.css에 혼합 | SRP 위반 |
| L4 Interactive | 인터랙션 정책 | components.css (부분) | Collection만 |
| L5 Structure | 컴포넌트 형태 | *.module.css | 상태와 혼합 |
| L6 Variant | 컴포넌트 변형 | *.module.css | 상태와 혼합 |

## 2. 컴포넌트 분류와 필수 상태

| 분류 | 예시 | 필수 상태 | 담당 레이어 |
|------|------|-----------|------------|
| **Action** | Button, Toggle, Switch | hover, active, focus, disabled, tone variant | L5 + L7 |
| **Collection** | ListBox, TreeGrid, Menu, Tabs | hover, focus(bg), selected, disabled item | L5 전담 |
| **Input** | TextInput, Checkbox, Radio, Slider | hover, focus(ring), disabled, invalid, readonly | L5 + L6 |
| **Overlay** | Dialog, AlertDialog, Tooltip | surface bundle, enter/exit motion, backdrop | L4 + L5 |
| **Static** | Separator, Progress | 없음 또는 최소 | L6만 |

## 3. 글로벌/로컬 경계 원칙

```
L5 Interactive (글로벌) → 상태(state): focus, hover, active, disabled, selected, invalid
L6/L7 module.css (로컬) → 구조(structure) + 변형(variant)
```

**핵심:** module.css에서 hover/focus/active/disabled가 나오지 않는다. 상태는 L5 글로벌 정책에 위임.

## 4. L5 Interactive — 셀렉터 전략

| 대상 | 셀렉터 | HIG 근거 |
|------|--------|----------|
| Collection focus (active) | `[data-aria-container]:focus-within [data-focused]` | 컬렉션 아이템 = bg highlight |
| Collection focus (idle) | `[data-aria-container]:not(:focus-within) [data-focused]` | 비활성 커서 = gray bg |
| Collection hover | `[data-aria-container]:not(:focus-within) [role]:hover` | focus-within이면 억제 |
| Collection active | `[data-aria-container] [role]:active` | 즉각 press 피드백 |
| Standalone focus | `*:focus-visible` | 독립 요소 = outline ring |
| Action hover | `button:hover, [role="button"]:hover` | 네이티브 셀렉터 |
| Action active | `button:active` | 네이티브 셀렉터 |
| Disabled | `[aria-disabled="true"], :disabled` | 전역 정책 |
| Invalid | `[aria-invalid="true"]` | Input 전용 |
| Selected | `[aria-selected="true"]` | ARIA 표준 |

## 5. `--_` Scoped Property 패턴

**문제:** Button hover는 `var(--tone-primary-hover)`를 써야 한다. tone은 L7(Variant)이고 hover는 L5(Interactive) — SRP 충돌.

**해결:** L7이 값을 선언하고, L5가 상태 전환만 소유한다.

```css
/* L7: Variant — hover 시 쓸 값을 선언 */
.primary {
  --_bg: var(--tone-primary-base);
  --_bg-hover: var(--tone-primary-hover);
  --_fg: var(--tone-primary-foreground);
  background: var(--_bg);
  color: var(--_fg);
}

.destructive {
  --_bg: var(--tone-destructive-base);
  --_bg-hover: var(--tone-destructive-hover);
  --_fg: var(--tone-destructive-foreground);
  background: var(--_bg);
  color: var(--_fg);
}

/* L5: Interactive — 상태 전환 타이밍만 소유 */
button:hover { background: var(--_bg-hover); }
button:active { transform: scale(var(--motion-press-scale)); }
```

**원칙:** 상태 전환 타이밍은 L5, 시각적 값은 L7. `--_` 접두사로 스코프.

## 6. module.css 작성 규칙

```css
/* Button.module.css — Structure(L6) + Variant(L7)만 */

/* L6: Structure */
.root {
  border-radius: var(--shape-md-radius);
  padding: var(--shape-md-py) var(--shape-md-px);
  font-size: var(--type-body-size);
  font-weight: var(--type-body-weight);
  font-family: var(--type-body-family);
  line-height: var(--type-body-line-height);
  transition: background var(--motion-instant-duration) var(--motion-instant-easing);
}

/* L7: Variant (tone) */
.primary {
  --_bg: var(--tone-primary-base);
  --_bg-hover: var(--tone-primary-hover);
  --_fg: var(--tone-primary-foreground);
  background: var(--_bg);
  color: var(--_fg);
}

.destructive { ... }
.neutral { ... }

/* ❌ 금지 — 아래는 L5 Interactive의 책임 */
/* .root:hover { } */
/* .root:focus { } */
/* .root:disabled { } */
```

## 7. 금지 목록

| # | 금지 | 이유 |
|---|------|------|
| N1 | module.css에 :hover/:focus/:active/:disabled 작성 | L5 Interactive의 SRP 위반 |
| N2 | tokens.css에 셀렉터 규칙 (값 외) | L2는 값만. 규칙은 L3~L5 |
| N3 | 하드코딩 transition duration/easing | `--motion-*` 번들 필수 |
| N4 | palette primitive 직접 참조 (`--blue-600`) | semantic 토큰만 (`--tone-primary-hover`) |
| N5 | 개별 토큰 자유 조합 (번들 무시) | shape/type/tone/motion 번들 단위 사용 |
| N6 | raw value (px, hex, s) | 토큰 인터페이스 = 계약 |

## 8. 현재 감사 결과 (참고)

| 컴포넌트 | 완성도 | 핵심 문제 |
|----------|--------|-----------|
| AlertDialog | 2/10 | 거의 비어있음, destructive tone 없음 |
| TreeGrid | 3/10 | focus 디자인 문제, disabled/active 없음 |
| TreeView | 3/10 | hover조차 없음 |
| Toggle | 4/10 | Switch 스펙 미반영 |
| Dialog | 4/10 | tone 없음, backdrop 하드코딩 |
| Checkbox | 5/10 | hover/disabled/indeterminate 없음 |
| TextInput | 5/10 | 44px 미적용, variant 전무 |
| Button | 6/10 | disabled 없음, destructive 없음 |
| Tooltip | 6/10 | 구조 OK, animation 없음 |
| components.css | 7/10 | 가장 양호, disabled/motion 보완 필요 |

**공통 결함:** disabled 전무, motion 번들 미사용, tone variant 없음, 번들 무시, raw value 사용.

## 9. 실행 순서 (점진적 — additive first, subtractive by classification)

> 54개 파일 동시 수정은 리스크가 크다. additive → subtractive 순서로 점진 전환.

1. DESIGN.md § CSS Layers 작성 ← **이 문서의 목표**
2. L1 reset.css 추출 (tokens.css에서, 기능 변화 없음)
3. L3 surface.css 추출 (tokens.css에서, 기능 변화 없음)
4. L4 interactive.css **ADDITIVE 생성** — 모든 분류의 규칙을 넣는다 (이중 적용 허용, 깨지지 않음)
5. module.css **SUBTRACTIVE 정리** — 분류별 순서로:
   - 5a. Collection (거의 없음)
   - 5b. Action (Button, Toggle, Switch)
   - 5c. Input (TextInput, Checkbox, Radio, Slider)
   - 5d. Overlay (Dialog, AlertDialog, Tooltip)
6. components.css에서 이동한 규칙 제거
7. import 순서 갱신

## 다음 행동

- 이 제안 승인 시 → DESIGN.md에 § CSS Layers 섹션 작성
- `/design-implement` 스킬이 이 섹션을 참조하도록 연결
- 파일 분리(Step 2~5)는 별도 PRD로 분리 가능
