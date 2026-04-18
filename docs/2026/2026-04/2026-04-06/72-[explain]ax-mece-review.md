---
id: '2-areas/styles/72-[explain]ax-mece-review'
title: 'ax() 24축 MECE 검토 — 2026-04-06'
status: active
kind: explain
created: 2026-04-06
updated: 2026-04-11
topics: [2-areas, explain]
relates: []
supersedes: []
---
# ax() 24축 MECE 검토 — 2026-04-06

## 배경

ax()는 "시각 6축 + 구조 6축 = 12축, 이게 전부"로 시작했지만, 현재 **시각 14축 + 구조 10축 = 24축**으로 성장했다. 축이 늘어나면서 원래의 MECE 경계가 흐려졌는지 검토한다.

## 현재 축 목록

### 시각 축 (14)

| 축 | 프리픽스 | 소유 CSS 속성 | 값 수 |
|----|---------|--------------|-------|
| surface | sf | cursor, border, background, transition, 상태정책 | 8 |
| controlSize | cs | min-height, min-width, border-radius, font-size | 3 |
| textStyle | ts | font-size, weight, family, line-height, letter-spacing | 9 |
| tone | tn | --_bg, --_fg, --_bg-hover, --_bg-active | 10 |
| text | tx | color | 8 |
| weight | wt | font-weight | 3 |
| state | st | background, outline (수동 적용) | 2 |
| opacity | op | opacity, pointer-events | 3 |
| shape | sh | border-radius | 6 |
| motion | mo | animation (@keyframes) | 9 |
| content | ct | --pd-ratio (padding inline 비율) | 1 |
| border | bd | border (전체/단면) | 7 |
| scroll | sc | overflow | 4 |
| interactive | ia | hover/focus/selected/disabled 상태 응답 (CSS selectors) | 6 |

### 구조 축 (10)

| 축 | 프리픽스 | 소유 CSS 속성 | 값 수 |
|----|---------|--------------|-------|
| placement | pl | position, inset, transform, z-index | 10 |
| layout | ly | display, flex-direction, align, justify, overflow, grid | 16 |
| gap | g | gap | 6 |
| padding | pd | padding-block, padding-inline | 6 |
| width | w | width, max-width | 8 |
| flex | fx | flex | 3 |
| clamp | cl | white-space, overflow, text-overflow, -webkit-line-clamp | 5 |
| icon | ic | width, height (SVG) | 4 |
| size | sz | width, height (비-SVG 정사각) | 6 |
| aspect | ar | aspect-ratio | 3 |

## MECE 위반 분석

### 1. 중복 소유: scroll ↔ layout:scroll

**문제:** overflow를 두 축이 소유한다.

- `layout: 'scroll'` → `display:flex; flex-direction:column; overflow-y:auto; min-width:0; min-height:0; scrollbar-gutter:stable`
- `scroll: 'y'` → `overflow-y:auto; overflow-x:hidden`

`layout:scroll`은 "스크롤 패널"이라는 **구조 번들**이고, `scroll` 축은 **순수 overflow 제어**다. 그러나 둘 다 overflow-y:auto를 세팅하므로 동시 사용 시 의미가 불분명하다.

**판정:** 역할은 다르나(번들 vs 단일 속성), CSS 속성 소유권이 겹친다. → **경계 문서화 필요**

### 2. 중복 소유: icon ↔ size

**문제:** 둘 다 `width + height`를 정사각으로 세팅한다.

- `icon: 'sm'` → `width: var(--icon-sm); height: var(--icon-sm)` (SVG용)
- `size: 'sm'` → `width: var(--space-sm); height: var(--space-sm)` (비-SVG용: avatar, dot, swatch)

**차이점:** 토큰이 다르다. icon은 `--icon-*` 토큰(SVG 최적화 크기), size는 `--space-*` 토큰(스페이싱 스케일).

**판정:** 토큰 분리가 의미 있다면 유지 가능하나, 사용자 입장에서 "정사각 크기를 설정한다"는 동일한 의도에 두 축을 선택해야 하는 인지 비용이 있다. → **병합 검토**

### 3. 겹침: text ↔ tone

**문제:** 둘 다 전경색을 세팅한다.

- `tone: 'accent'` → `--_fg: var(--tone-primary-foreground)` → surface가 `color: var(--_fg)`로 소비
- `text: 'accent'` → `color: var(--tone-primary-base)` (직접)

**역할 차이:**
- tone = surface와 협력하여 bg+fg를 **번들**로 제공 (버튼 배경+글자색)
- text = 배경 없이 **텍스트만** 색칠 (단독 텍스트, 링크)

**문제 시나리오:** `ax({ surface: 'action', tone: 'accent', text: 'danger' })` — tone이 세팅한 `--_fg`와 text가 세팅한 `color`가 경쟁. text의 직접 color가 이긴다. 의도적인가?

**판정:** 역할은 다르나, 동시 사용 시 우선순위 규칙이 암묵적이다. → **동시 사용 금지 규칙 또는 우선순위 문서화 필요**

### 4. 분할 소유: shape ↔ controlSize (border-radius)

**문제:** border-radius를 두 축이 나눠 소유한다.

- `controlSize: 'md'` → `border-radius: 8px` (+ min-height, min-width, font-size)
- `shape: 'md'` → `border-radius: var(--shape-md-radius)` (= 10px)

**분할 기준:** "컨트롤이면 cs, 비-컨트롤이면 shape". 그러나:
- 이 기준이 타입 시스템에 강제되지 않음 (둘 다 동시 선언 가능)
- 같은 `md`인데 값이 다름 (cs:md=8px, sh:md=10px)

**판정:** MECE하려면 border-radius의 소유자가 하나여야 한다. 현재는 use-case 파티셔닝(컨트롤/비컨트롤)으로 분리했지만, 타입 레벨 배타 제약이 없다. → **타입 레벨 배타 제약 또는 소유권 단일화 검토**

### 5. 역할 모호: state ↔ interactive

**문제:** 둘 다 "상태에 따른 시각 변화"를 담당한다.

- `state: 'focused'` → 수동으로 적용. `background: var(--tone-primary-dim); outline: ...`
- `interactive: 'item'` → CSS 셀렉터가 자동으로 hover/focus/selected/disabled 시각을 관리

**핵심 차이:**
- state = **명령적** (이 요소에 지금 이 상태를 보여라)
- interactive = **선언적** (이 요소는 이런 종류의 인터랙티브 요소다, 상태 시각은 CSS가 처리)

**판정:** 개념적으로 다르나, 같은 CSS 속성(background, outline)을 세팅하므로 충돌 가능. state가 interactive 내부에서만 쓰이는 보조 메커니즘인지, 독립 축인지 불명확. → **사용 시나리오 분류 필요**

### 6. 축 자격 의문: content

**문제:** 값이 `'text'` 하나뿐이다.

```css
.ct-text { --pd-ratio: 2; }
```

이것은 padding 축의 modifier에 불과하다. 독립 축이 되려면 자기만의 CSS 속성군을 소유하고, 복수의 의미 있는 값을 가져야 한다.

**반론:** 향후 `'icon'` (1:1 비율), `'mixed'` (1.5:1) 등 확장 가능성이 있다면 축 자격이 있다.

**판정:** 현재는 **축이라기보다 padding의 modifier**. 확장 계획이 없다면 padding에 흡수하거나, 확장한다면 값을 더 추가해야 한다. → **확장 여부에 따라 결정**

### 7. 축 자격 의문: weight

**문제:** textStyle이 이미 font-weight를 번들하는데, weight가 별도 축으로 오버라이드한다.

**사용 시나리오:** "body 텍스트인데 이 단어만 bold" — textStyle은 유지하면서 weight만 변경.

**판정:** **오버라이드 축**으로서 역할이 명확하다. textStyle의 다른 번들 속성(font-size, family, line-height, letter-spacing)은 유지하면서 weight만 교체하는 것은 실제 빈번한 패턴. → **유지 타당**

### 8. 혼합 관심사: layout의 self-*

**문제:** layout 축에 부모 관심사(row, column, grid-*)와 자식 관심사(self-start, self-end, self-center)가 섞여 있다.

- `layout: 'row'` → 이 요소가 **컨테이너**로서 자식을 어떻게 배치하는가
- `layout: 'self-center'` → 이 요소가 **자식**으로서 부모 안에서 어디에 위치하는가

**판정:** 하나의 축에 부모/자식 관심사가 혼재. 동시 사용 불가(`layout`은 단일 값). "row이면서 self-center"를 표현할 수 없다. → **self-* 분리 또는 별도 축(align?) 검토**

## 요약: 이슈 우선순위

| 우선순위 | 이슈 | 제안 방향 |
|---------|------|----------|
| **높음** | layout:self-* 혼합 관심사 | self-* 분리 (동시 사용 불가 문제) |
| **높음** | text ↔ tone 전경색 경쟁 | 동시 사용 규칙 명문화 |
| **중간** | scroll ↔ layout:scroll 중복 | 소유권 경계 문서화 |
| **중간** | shape ↔ controlSize 분할 | 타입 레벨 배타 제약 |
| **중간** | state ↔ interactive 역할 | 사용 시나리오별 가이드 |
| **낮음** | icon ↔ size 중복 | 토큰 차이가 의미 있으면 유지 |
| **낮음** | content 축 자격 | 확장 계획에 따라 결정 |

## 다음 행동

- 위 이슈들을 하나씩 discuss하며 해결 방향 확정
- 확정된 변경사항을 PRD로 작성 후 실행
