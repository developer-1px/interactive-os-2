# CSS Layer Architecture — SRP 기반 스타일링 전략 — 2026-03-25

## 배경

interactive-os는 반-헤드리스 UI 라이브러리. 내부 로직(engine/axis/pattern)은 탄탄하나, 컴포넌트 CSS 스타일링에 기준점이 없어 완성도가 2~7/10으로 들쭉날쭉하다. 토큰/번들 정리는 별도 에이전트가 진행 중이며, **토큰 인터페이스(변수명) = 계약, 값 = 조정 가능**이 전제.

이 문서는 "토큰 위에서 컴포넌트 CSS를 어떻게 조립하는가"의 전략을 정의한다.

## 핵심 원칙

**SRP (Single Responsibility Principle)**: 각 CSS 파일/레이어는 **변경 이유가 단 하나**여야 한다.

## 7레이어 스택

```
Global ──────────────────────────────
  L1  Reset          브라우저 초기화
  L2  Tokens         디자인 값 (계약 인터페이스)
  L3  Type           타이포그래피 정책
  L4  Surface        면/깊이/구분 정책
  L5  Interactive    인터랙션 정책

Local ───────────────────────────────
  L6  Structure      컴포넌트 고유 형태
  L7  Variant        컴포넌트 변형 (tone/size)
```

### 각 레이어의 변경 이유 (SRP)

| Layer | 변경 이유 (단 하나) | 스코프 | 현재 파일 |
|-------|-------------------|--------|----------|
| L1 Reset | 브라우저 기본값 정책이 바뀔 때 | Global | (미정) |
| L2 Tokens | 디자인 시스템 값이 바뀔 때 | Global | tokens.css |
| L3 Type | 타이포그래피 정책이 바뀔 때 | Global | (tokens.css에 혼합) |
| L4 Surface | 면/깊이 정책이 바뀔 때 | Global | (tokens.css에 혼합) |
| L5 Interactive | 사용자 입력 반응 정책이 바뀔 때 | Global | components.css (부분) |
| L6 Structure | 이 컴포넌트의 고유 형태가 바뀔 때 | Local | *.module.css |
| L7 Variant | 이 컴포넌트의 변형이 바뀔 때 | Local | *.module.css |

### L5 Interactive — 가장 큰 변화가 필요한 레이어

HIG 원칙에서 추출한 인터랙션 정책. 컴포넌트 종류와 무관하게 **시스템 레벨에서 일관**해야 한다.

| 하위 정책 | HIG 원칙 | 현재 상태 |
|-----------|----------|----------|
| Focus | Collection=bg, Standalone=ring | components.css에 Collection만 |
| Hover | 포인터 기기에서만, focus-within이면 억제 | Collection만, Action/Input은 제각각 |
| Active/Pressed | 즉각 피드백(scale, dim) | Button만 scale(0.98) 하드코딩 |
| Disabled | 상호작용 불가 시각 표현 | 전무 |
| Selected | 선택된 아이템 강조 | components.css에 있음 |
| Invalid | 입력 오류 시각 표현 | 전무 |

**방향**: Interactive를 확장하여 모든 분류의 인터랙션 정책을 글로벌로 올린다. module.css에서는 hover/focus/disabled가 나오지 않는다 — 글로벌 정책에 위임.

### 컴포넌트 분류 (상태 커버리지 기준)

| 분류 | 예시 | 필수 상태 | L5에서 담당 |
|------|------|-----------|------------|
| Action (행동 유발) | Button, Toggle, Switch | hover, active, focus, disabled | focus, hover, active, disabled |
| Collection (목록/탐색) | ListBox, TreeGrid, Menu, Tabs | hover, focus(bg), selected, disabled item | 전부 |
| Input (값 입력) | TextInput, Checkbox, Radio, Slider | hover, focus(ring), disabled, invalid, readonly | focus, disabled, invalid |
| Overlay (떠 있는 것) | Dialog, AlertDialog, Tooltip | surface bundle, enter/exit motion, backdrop | motion 정책 |
| Static (표시만) | Separator, Progress | 상태 없음 또는 최소 | — |

### L6 Structure, L7 Variant — module.css에 남는 것

```css
/* Button.module.css 예시 — Structure + Variant만 */

/* L6: Structure (형태) */
.root {
  border-radius: var(--shape-md-r);
  padding: var(--shape-md-py) var(--shape-md-px);
  font: var(--type-body);
}

/* L7: Variant (변형) */
.primary     { background: var(--tone-primary);     color: var(--tone-primary-fg); }
.destructive { background: var(--tone-destructive); color: var(--tone-destructive-fg); }
.neutral     { background: var(--tone-neutral);     color: var(--tone-neutral-fg); }
```

hover, focus, active, disabled — 전부 L5 Interactive 글로벌 레이어가 처리.

### 글로벌 vs 로컬 경계 원칙

```
L5 Interactive (글로벌) → 상태(state) 스타일: focus, selected, hover, disabled
L6/L7 module.css (로컬) → 구조(structure) + 변형(variant)
```

- Collection 상태: components.css (ARIA role + aria-* 셀렉터)
- Action/Input 상태: Interactive 레이어 확장 (data-interactive 등)
- Overlay 상태: Interactive 레이어의 motion 정책

## 현재 감사 결과 요약

| 컴포넌트 | 완성도 | 핵심 문제 |
|----------|--------|-----------|
| AlertDialog | 2/10 | 거의 비어있음, destructive tone 없음 |
| TreeGrid | 3/10 | focus 디자인 문제, disabled/active 없음 |
| TreeView | 3/10 | hover조차 없음, TreeGrid와 불일치 |
| Toggle | 4/10 | Switch 스펙 미반영, hover/disabled 없음 |
| Dialog | 4/10 | tone 없음, backdrop blur 하드코딩 |
| Checkbox | 5/10 | hover/disabled/indeterminate 없음 |
| TextInput | 5/10 | 44px 높이 미적용, variant 전무 |
| Button | 6/10 | disabled 없음, destructive variant 없음 |
| Tooltip | 6/10 | 구조 OK, animation 없음 |
| components.css | 7/10 | 가장 양호, disabled/motion만 보완 필요 |

### 공통 결함 패턴

1. **:disabled / aria-disabled 스타일 전무** — 단 하나도 없음
2. **Motion 번들 미사용** — 전부 하드코딩 또는 transition 없음
3. **Tone variant 없음** — Button만 accent 1개
4. **Shape/Type 번들 무시** — 개별 토큰 자유 조합
5. **Raw value 사용** — 토큰 계약 위반 (palette primitive 직접 참조 등)

## 열린 질문

- L5 Interactive의 셀렉터 전략: `[data-interactive]`? role 기반? 분류 속성?
- L3 Type / L4 Surface를 tokens.css에서 분리할 것인가, 같은 파일 내 섹션으로 유지할 것인가
- variant 범위: tone은 Action만? Input의 validation state(error/success)도 tone으로 보는가?

## 다음 행동

- 이 전략 기반으로 `/prd` 작성 → 각 레이어별 구현 명세
- L5 Interactive 확장이 최우선 (disabled, invalid, Action hover/active 글로벌화)
- 토큰 에이전트 작업 완료 후, 컴포넌트 CSS를 이 프로토콜 기준으로 전수 점검
