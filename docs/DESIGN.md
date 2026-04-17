# Design System — interactive-os

> SSOT: `src/styles/ax.ts` (축 타입) + `src/styles/ax.css` (CSS 구현)
> 이 문서는 **디자인 철학 + 축 조합 규칙 + CSS 레이어**를 정의한다. 토큰 값은 `tokens.css`가 SSOT.

## 1. 디자인 철학

### 면으로 구분, 선으로 구분 안 함

영역 분리는 bg 차이로. border는 입력 필드/카드 윤곽에만.

### 화면당 주인공 1개

```
hero:   textStyle:'hero' — 페이지당 1개
others: textStyle:'body' 이하
```

### 포인트 컬러는 1개

전체 palette는 무채색. 유일한 채도색 = accent.

### 조연의 후퇴

네비게이션/보조 요소는 본문보다 작고 연하게.

```tsx
// 사이드바 아이템
ax({ textStyle: 'caption', text: 'muted' })

// 본문
ax({ textStyle: 'body', text: 'primary' })
```

### 액션은 오른쪽 끝

```tsx
ax({ layout: 'spread' })  // [라벨 ............... 버튼]
```

### gap — 가로 좁게, 세로 넓게

```tsx
// 가로 배치: 결합감 유지
ax({ layout: 'bar', gap: 'sm' })

// 세로 배치: 섹션 분리
ax({ layout: 'stack', gap: 'lg' })
```

### Depth Ladder — 깊이 사다리

| Depth | 용도 | bg 관계 | Linear 실측 |
|-------|------|--------|------------|
| sunken | 사이드바, 패널 헤더 | 가장 어두운 bg | elevated (헤더, 사이드바) |
| base | 페이지 본문 (기본값, 선언 불필요) | 기준 | 앱 배경 |
| raised | 카드, 부유 툴바 | base보다 밝은 bg | 버튼 (미세한 shadow) |
| overlay | 다이얼로그, 팝업 | 가장 밝은 bg | Dialog, Command Palette (border + shadow) |

**불변량:** 각 depth의 hover 밝기 = 한 단계 위 depth의 기본 밝기.

input surface는 별도: Select, Input (border만, shadow 없음).

inverted surface는 전경/배경 반전 (Tooltip용): `bg=text-primary, color=surface-base`.

```tsx
ax({ surface: 'sunken' })                          // 사이드바
ax({ surface: 'raised', shape: 'lg', padding: 'lg' })  // 카드
ax({ surface: 'overlay', placement: 'center' })     // 모달
```

### 28px 법칙

사이드바 아이템, 탭, 리스트 아이템, 커맨드 아이템 높이 = 모두 28px.
`role: 'control'`의 기본 min-height.

### 타이포 (Linear 실측)

| 용도 | Size | Weight |
|------|------|--------|
| 페이지 제목 | 22px | 600 |
| 섹션 헤더 | 16px | 600 |
| 본문 | 14px | 450 |
| 레이블 | 14px | 500 |
| 캡션 | 12px | 500 |

### 조합 특성 (Linear 실측)

- border 0.5px (극히 얇게)
- shadow는 overlay만
- weight로 위계 (fontSize 점프 최소)
- padding은 자식이 소유 (컨테이너는 radius만)

---

## 2. ax() API

모든 스타일은 `ax()` 함수 하나로 선언한다. `style={}` 금지.

```tsx
// 텍스트 버튼
ax({ role: 'control', surface: 'action', content: 'text', tone: 'accent' })

// 아이콘 버튼
ax({ role: 'control', surface: 'ghost', layout: 'center', content: 'icon' })

// 툴바
ax({ layout: 'bar', gap: 'sm' })

// 본문
ax({ textStyle: 'body', text: 'secondary' })
```

`ax()`는 각 축 값을 `{prefix}-{value}` className으로 변환한다. CSS는 `ax.css`에 정의.

### 시각 축 (11개)

| 축 | 접두사 | 값 | 역할 |
|---|---|---|---|
| **surface** | `sf` | action, input, display, overlay, trap, ghost, placeholder, sunken, base, raised, inverted | 요소의 시각 역할 — bg + border + shadow + 상태 피드백 번들 |
| **textStyle** | `ts` | hero, display, page, section, label, body, caption, code, overline | 타이포 번들 (size + weight + family + line-height) |
| **tone** | `tn` | accent, danger, success, warning, neutral + 각 -dim | 의미 색상 |
| **text** | `tx` | bright, primary, secondary, muted | 전경색 밝기 |
| **weight** | `wt` | medium, semi, bold | textStyle weight 오버라이드 |
| **shape** | `sh` | none, 2xs, xs, sm, md, lg, xl, pill | border-radius (role 축이 없는 요소) |
| **state** | `st` | focused, selected | 조립식 상태 시각 |
| **opacity** | `op` | dim, faint, hidden | 비-disabled 시각적 약화 |
| **motion** | `mo` | pulse, spin, fade-in, slide-up, fade-slide-in, slide-in, scale-in, blink, shimmer | 반복/진입 애니메이션 |
| **content** | `ct` | text, code, bubble, icon | 콘텐츠 유형 — padding 비율 + 레이아웃 어포던스 |
| **interactive** | `ia` | item, tab, check, cell, input, button | 동적 상태 시각 (hover/focus/selected/disabled) |

> **border** (`bd`) — subtle, default, strong, dashed, ring, bottom, top, start, end. ring은 box-shadow 기반 미세 경계 (레이아웃 무영향, border-radius 자동 추종). 시각 축이지만 shape와 타입 상호배제 관계로 별도 취급 (아래 타입 제약 참조).

> **recipe** (`rc`) — container, container-sm. 구조 프리셋으로 색칠 축과 조합. 레거시 — role 축으로 이전 중.

### 구조 축 (12개)

| 축 | 접두사 | 값 | 역할 |
|---|---|---|---|
| **placement** | `pl` | above, below, bottom, center, viewport, sticky, anchor-*, float-*, relative, ... | 의도 기반 배치 (position + inset + transform 번들) |
| **layout** | `ly` | row, column, center, bar, spread, stack, scroll, scroll-x, fill, row-fill, wrap, grid-N, self-* | 역할 기반 구조 번들 |
| **gap** | `g` | xs, sm, md, lg, xl, 2xl | 자식 간 간격 |
| **padding** | `pd` | none, xs, sm, md, lg, xl | 안쪽 여백 |
| **width** | `w` | full, auto, fit, sm, md, lg, xl, prose | 너비 |
| **flex** | `fx` | none, auto, 1 | flex 비율 |
| **clamp** | `cl` | 1, 2, 3, 4, pre, scroll | 콘텐츠 제한 (줄 수/높이) |
| **icon** | `ic` | xs, sm, md, lg | SVG 크기 |
| **square** | `sq` | xs, sm, md, lg, xl, 2xl | 정사각 크기 (비-SVG) |
| **role** | `rl` | control, control-group, item, badge | 의미적 역할 — 크기 SSOT |
| **aspect** | `ar` | 1, video, card | 종횡비 |
| **scroll** | `sc` | hidden, y, x, auto | overflow 제어 (layout과 독립) |

> **scroll**은 코드에서 시각 축 블록에 위치하지만 기능상 구조 축이다. 문서에서는 구조 축으로 분류.

### Public / Private 2계층

ax()의 25축은 외부 API 관점에서 **Public 14축** + **Private 11축**으로 분리된다. LLM 시스템 프롬프트·`AriaComponentProps` 등 외부 표면은 Public만 노출하고, Private는 rolePreset 또는 `ax.raw()`를 통해서만 접근한다.

| 계층 | 진입점 | 축 개수 | 축 목록 | SSOT |
|------|--------|---------|---------|------|
| Public | `ax({...})` | 14 | cs, role, surface, tone, textStyle, content, layout, placement, width, flex, clamp, aspect, scroll, interactive | `src/styles/axPublic.ts` |
| Private | `ax.raw({...})` | 11 | padding, gap, shape, border, icon, square, weight, text, opacity, state, motion | `src/styles/axPrivate.ts` |

**rolePreset = 단일 SSOT.** `role × surface (× content|interactive)` 조합이 Private 값을 cascade 주입한다 (cs는 키에 없음 — 외부 크기 입력으로 직교). 조합 변경은 `src/styles/rolePreset.ts` 1곳에서만 일어난다. 현재 seed: `control.action[.text|.icon|.button]`, `control.ghost[.icon|.text|.tab]`, `control.input[.text|.input]`, `item.base`, `item.placeholder`, `control.placeholder`, `badge.display`, `badge.ghost`, `badge.overlay`, `badge.placeholder`. `*.placeholder` 3종은 motion(pulse/spin/shimmer)을 주입하는 상태 role 경로다.

**textStylePreset = 타이포 주입 경로.** `textStyle`은 Public이지만 `weight`/`text`는 Private이므로 `textStylePresetTable`(`src/styles/rolePreset.ts`)이 9종 textStyle을 weight/text로 해석한다. role preset과 병합될 때는 role이 우선한다(더 구체적 의도).

**Escape hatch.** rolePreset에 없는 Private 값이 필요하면 `ax.raw({ padding: 'sm' })`를 써서 명시적으로 노출한다. `ax()`는 Private 키를 받지 않는다(타입 수준 거부).

**마이그레이션 상태.** 현 시점 `ax()`는 Private 키가 들어와도 dev 경고 후 통과시키는 warning-only 모드다. 139 데모 마이그레이션이 끝나면 dev throw + `guardCssAxes` block으로 승격한다.

> 상세 설계·불변식·마이그레이션 플랜: [`docs/2-areas/styles/prds/ax-public-private-split-prd.md`](./2-areas/styles/prds/ax-public-private-split-prd.md)
> LLM 시스템 프롬프트(Public 14축만): [`docs/2-areas/styles/axLlmPrompt.md`](./2-areas/styles/axLlmPrompt.md)

### 타입 제약

```ts
// 단면 border + shape 조합 금지 (타입으로 강제)
type Axes =
  | (AxesBase & { border?: BorderFull; shape?: Shape })
  | (AxesBase & { border?: BorderSide; shape?: never })
```

### 어떤 축을 써야 하나?

```
배치(위치)가 필요? → placement
자식 정렬이 필요? → layout + gap
크기 제어가 필요?
  ├─ 버튼/입력 등 컨트롤? → role: 'control' (크기 SSOT)
  ├─ SVG? → icon
  ├─ 정사각 비-SVG? → square
  └─ 너비만? → width / flex
배경/테두리가 필요?
  ├─ 인터랙티브 요소? → interactive (hover/focus/selected 자동)
  └─ 정적 외형? → surface + tone
텍스트 스타일? → textStyle + text
  └─ weight만 다르게? → weight 오버라이드
콘텐츠 유형별 패딩?  → content
줄 수 제한?         → clamp
스크롤?
  ├─ flex+scroll 통합? → layout: 'scroll' / 'scroll-x'
  └─ overflow만?      → scroll: 'y' / 'hidden' 등
```

---

## 3. 축 조합 규칙

### R1. role 축이 크기 SSOT

`role: 'control'`이 min-height, padding, font-size를 소유한다. shape/padding을 별도 선언하지 않는다.

```tsx
// ✅ role이 크기 결정
ax({ role: 'control', surface: 'action', content: 'text' })

// ❌ role 없이 수동 크기 조합
ax({ surface: 'action', padding: 'sm', shape: 'md' })
```

### R2. surface = 정적 시각, interactive = 동적 상태

surface는 bg/border/shadow의 정적 외형. interactive는 hover/focus/selected/disabled의 동적 응답.

```tsx
// 리스트 아이템: interactive로 hover/selected 자동
ax({ interactive: 'item' })

// 독립 버튼: surface + interactive 조합
ax({ role: 'control', surface: 'action', interactive: 'button' })
```

### R3. content가 padding 비율 결정

| content | inline:block 비율 | 용도 |
|---------|-----------------|------|
| `text` | 2:1 | 텍스트 버튼, 라벨 |
| `code` | inline만, block 0 | 코드 행, 테이블 셀 |
| `icon` | 1:1 정사각 | 아이콘 컨테이너 |
| `bubble` | max-width:80% + margin-left:auto | 채팅 말풍선 |

> **textStyle + text 빈번 조합**: textStyle이 타이포 번들, text가 전경색. 거의 항상 함께 선언한다. 예: `ax({ textStyle: 'body', text: 'secondary' })`.

### R4. layout:scroll vs scroll 축

| 필요 | 사용 |
|------|------|
| flex column + overflow-y:auto | `layout: 'scroll'` |
| flex row + overflow-x:auto | `layout: 'scroll-x'` |
| overflow만 제어 (display 불변) | `scroll: 'y'` / `scroll: 'hidden'` 등 |

### R5. placement — 의도로 배치

position/inset/transform을 직접 쓰지 않는다. 의도를 선언한다.

```tsx
// 드롭다운
ax({ placement: 'anchor-below' })

// 모달 백드롭
ax({ placement: 'viewport' })

// 고정 헤더
ax({ placement: 'sticky' })
```

---

## 4. CSS Layer 스택

```
@layer reset, tokens, base, component, recipe, state;
```

| Layer | 파일 | 역할 |
|-------|------|------|
| reset | `reset.css` | 브라우저 기본값 정책 |
| tokens | `tokens.css` | 디자인 토큰 값 |
| base | `structure.css`, `ax.css` | 축 클래스, 레이아웃 atomic |
| component | `*.module.css` | 컴포넌트 고유 형태 (last-mile) |
| recipe | `ax.css` (rc-*) | 레시피 프리셋 |
| state | `interactive.css` | 인터랙션 상태 (`:where()` 래핑) |

### module.css = last-mile만

ax() 축으로 표현 불가능한 CSS만 module.css에 작성한다. 예: 복잡한 grid template, 특수 animation keyframe.

**module.css 금지 목록:**

| 금지 | 대신 |
|------|------|
| display:flex/grid | ax() layout 축 |
| :hover/:focus/:disabled | interactive.css / ax({ interactive }) |
| padding/margin 직접 값 | ax() padding/gap 축 |
| background/color 직접 값 | ax() surface/tone/text 축 |
| position/inset | ax() placement 축 |
