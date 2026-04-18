---
id: 2-areas/styles/axLlmPrompt
title: 'ax() 디자인 시스템 — LLM Guide'
status: active
kind: note
created: 2026-04-17
updated: 2026-04-17
summary: 'ARIA OS UI를 생성할 때 사용하는 시스템 프롬프트. 이 문서에 적힌 **Public 14축만** 사용한다. 여기 없는 키(padding, gap, shape, border, icon, square, weight, text, opacity, state, motion)는 절대 `ax()` 호출에 넣지 않는다. 필요할 때는 `ax.raw()` 참조.'
topics: [2-areas]
relates: []
supersedes: []
---
# ax() 디자인 시스템 — LLM Guide

> ARIA OS UI를 생성할 때 사용하는 시스템 프롬프트. 이 문서에 적힌 **Public 14축만** 사용한다.
> 여기 없는 키(padding, gap, shape, border, icon, square, weight, text, opacity, state, motion)는 절대 `ax()` 호출에 넣지 않는다. 필요할 때는 `ax.raw()` 참조.

## 왜 "3축이 아니라 14축"인가

초기 Discussion은 Public을 `cs/role/surface` **3축**으로 축소하는 것을 이상형으로 제시했다. 실측 결과는 **14축**이다 — 차이는 "축소 실패"가 아니라 **CSS 평면 제거가 본질**이었기 때문이다.

- **축소 대상(Private 11축)**: padding/gap/shape/border/icon/square/weight/text/opacity/state/motion. 이들은 CSS 속성 1:1 매핑으로 LLM이 24차원 조합 오류를 일으키던 주범. rolePreset이 role×surface로 주입하여 LLM 시야에서 제거.
- **흡수 불가능한 직교 축(Public 11축 유지)**: `layout/placement/width/flex/clamp/aspect/scroll`(구조), `tone`(의미색), `textStyle`(타이포 번들), `content`(콘텐츠 유형), `interactive`(동적 상태). 이들은 의미 축 자체이거나 부모-자식 관계를 표현하므로 role로 흡수되지 않는다.
- **신규 3축(cs/role/surface)**: 의도 계층의 SSOT. 여기에 위 11개 직교 축이 더해져 Public 14축이 된다.

즉 "3축 축소"가 아니라 "CSS 하위축 11개를 rolePreset 뒤로 숨기고, 의도·구조·상태 축은 외부 표면에 유지"가 정확한 기술이다.

## 사용법

```tsx
import { ax } from '@/styles/ax'

<button className={ax({ role: 'control', surface: 'action', cs: 'md' })}>
  저장
</button>
```

- `ax()`는 Public 14축만 받는다.
- `role × surface`가 정해지면 내부 rolePreset 테이블이 패딩·간격·shape·weight·text 같은 Private 값을 자동 주입한다. `cs`는 외부 입력(크기)으로 preset과 직교.
- 반환값은 className 문자열. `style={}` 금지.

---

## Public 14축

각 축의 값은 아래 리터럴 중 하나만 허용한다.

### 1. `cs` — 크기 스케일 (size scale)
`'xs' | 'sm' | 'md' | 'lg' | 'xl'`
컨트롤·아이템·뱃지의 크기급. role과 함께 주면 rolePreset이 크기 Private 값을 주입한다.

### 2. `role` — 의미적 역할 (크기 SSOT)
`'control' | 'control-group' | 'item' | 'badge'`
버튼·입력 등 컨트롤은 `control`, 리스트/트리 행은 `item`, 라벨/상태 칩은 `badge`.

### 3. `surface` — 시각 역할 (bg/border/shadow 번들)
`'action' | 'input' | 'display' | 'overlay' | 'trap' | 'ghost' | 'placeholder' | 'sunken' | 'base' | 'raised' | 'inverted'`
정적 외형. 버튼 = `action`, 폼 입력 = `input`, 모달 = `overlay`, 툴팁 = `inverted`, 사이드바 = `sunken`, 카드 = `raised`.

### 4. `tone` — 의미 색상
`'accent' | 'danger' | 'success' | 'warning' | 'neutral' | 'accent-dim' | 'danger-dim' | 'success-dim' | 'warning-dim' | 'neutral-dim'`
전체 UI에서 채도색은 `accent` 하나. 경고/에러/성공 상태에만 나머지를 쓴다.

### 5. `textStyle` — 타이포 번들 (size+weight+line-height)
`'hero' | 'display' | 'page' | 'section' | 'label' | 'body' | 'caption' | 'code' | 'overline'`
페이지당 `hero` 1회. 본문 = `body`, 보조 텍스트 = `caption`.

### 6. `content` — 콘텐츠 유형 (padding 비율)
`'text' | 'code' | 'bubble' | 'icon'`
텍스트 버튼 = `text`, 코드 셀 = `code`, 채팅 말풍선 = `bubble`, 아이콘 컨테이너 = `icon`.

### 7. `layout` — 구조 번들 (display+flex/grid+align+justify)
`'row' | 'center' | 'bar' | 'spread' | 'stack' | 'scroll' | 'scroll-x' | 'fill' | 'row-fill' | 'wrap' | 'grid-2' | 'grid-3' | 'grid-4' | 'grid-5' | 'grid-7' | 'table' | 'self-start' | 'self-end' | 'self-center'`
가로 정렬 = `bar`, 세로 스택 = `stack`, 양끝 배치 = `spread`, 채움 = `fill`.

### 8. `placement` — 의도 기반 배치
`'above' | 'below' | 'bottom' | 'bottom-center' | 'center' | 'top-start' | 'top-end' | 'viewport' | 'sticky' | 'anchor-below' | 'anchor-below-start' | 'anchor-above' | 'anchor-end' | 'anchor-start' | 'relative' | 'float-top-start' | 'float-top-center' | 'float-bottom-center' | 'float-bottom'`
드롭다운 = `anchor-below`, 모달 백드롭 = `viewport`, 고정 헤더 = `sticky`.

### 9. `width`
`'full' | 'auto' | 'fit' | 'sm' | 'md' | 'lg' | 'xl' | 'prose'`
본문 폭 = `prose`, 풀 폭 = `full`.

### 10. `flex`
`'none' | 'auto' | '1'`
남은 공간 채움 = `'1'`, 고정 = `'none'`.

### 11. `clamp` — 콘텐츠 제한
`'1' | '2' | '3' | '4' | 'pre' | 'scroll'`
n줄 이후 말줄임 = 숫자, 공백 보존 = `pre`.

### 12. `aspect` — 종횡비
`'1' | 'video' | 'card'`

### 13. `scroll` — overflow 제어
`'hidden' | 'y' | 'x' | 'auto'`
`layout: 'scroll'`이 display까지 바꾸는 것과 달리, `scroll`은 overflow만 바꾼다.

### 14. `interactive` — 동적 상태
`'item' | 'tab' | 'check' | 'cell' | 'input' | 'button'`
hover/focus/selected/disabled를 자동 부여. 리스트 아이템 = `item`, 탭 = `tab`, 체크 = `check`.

---

## 조합 원칙

1. **role이 패딩·간격·shape·weight·text를 자동 결정**한다. rolePreset 테이블(`src/styles/rolePreset.ts`)이 `role × surface (× content|interactive)`를 Private 값으로 cascade 해석한다. `cs`는 preset 키에 포함되지 않으며 외부 크기 입력으로 그대로 흐른다. 현재 seed로 등록된 조합:
   - `control.action` / `.text` / `.icon` / `.button` — 기본 액션 버튼
   - `control.ghost` / `.icon` / `.text` / `.tab` — 투명 버튼
   - `control.input` / `.text` / `.input` — 폼 입력
   - `item.base` — 리스트 아이템
   - `badge.display` / `badge.ghost` / `badge.overlay` — 뱃지
2. **`role × surface` 조합으로 의도를 완결**한다. `cs`로 크기를, `tone`으로 의미색을, `interactive`로 동적 상태를 얹는다.
3. **`textStyle`은 role과 직교**한다. 타이포 의도는 언제나 textStyle로 선언한다 (예: `{ role: 'control', textStyle: 'label' }`).
4. **`layout` / `placement` / `width` / `flex` / `scroll`은 구조 축**이다. role이 흡수하지 못한다. 부모의 배치 의도를 표현할 때 함께 쓴다.
5. **14축 밖은 절대 `ax()`에 넣지 않는다.** 필요하면 `ax.raw({ padding: 'sm' })`로 명시적 escape. 단, 이는 예외 경로이며 기본은 rolePreset 확장이다.

---

## 금지

- `padding`, `gap`, `shape`, `border`, `icon`, `square`, `weight`, `text`, `opacity`, `state`, `motion` — 이 키들을 `ax()` 호출에 넣지 않는다. 이들은 Private 축으로, rolePreset이 자동 주입하거나 `ax.raw()`로만 접근한다.
- `style={...}` 직접 지정 금지.
- `className`을 수동 문자열로 조립 금지. 반드시 `ax()` 통과.

---

## 일반 패턴

### 1) 텍스트 버튼

```tsx
<button className={ax({ role: 'control', surface: 'action', cs: 'md', content: 'text', tone: 'accent', interactive: 'button' })}>
  저장
</button>
```

### 2) 폼 입력

```tsx
<input className={ax({ role: 'control', surface: 'input', cs: 'md', interactive: 'input', width: 'full' })} />
```

### 3) 리스트 아이템

```tsx
<li className={ax({ role: 'item', surface: 'base', cs: 'md', interactive: 'item', layout: 'bar' })}>
  …
</li>
```

### 4) 상태 뱃지

```tsx
<span className={ax({ role: 'badge', surface: 'display', cs: 'sm', tone: 'success' })}>
  Active
</span>
```

### 5) 카드 패널

```tsx
<section className={ax({ surface: 'raised', layout: 'stack', width: 'md' })}>
  …
</section>
```

### 6) 타이포 — textStyle이 weight/text를 주입

```tsx
// page 제목 — textStyle이 weight:'semi' + text:'bright' 주입
<h1 className={ax({ textStyle: 'page' })}>대시보드</h1>

// 본문 — textStyle이 text:'primary' 주입
<p className={ax({ textStyle: 'body' })}>…</p>

// 보조 캡션 — textStyle이 text:'secondary' 주입
<span className={ax({ textStyle: 'caption' })}>2026-04-18</span>
```

textStyle은 role과 직교한다. role이 있으면 role의 weight/text가 우선한다(더 구체적).

---

## 체크리스트 — 생성 직전 확인

- [ ] 넣은 키가 전부 위 14축에 들어있는가?
- [ ] `role: 'control'`을 썼다면 `padding`/`shape`/`gap`을 추가로 넣지 않았는가? (rolePreset 자동 처리)
- [ ] `style={}` 또는 임의 className을 섞지 않았는가?
- [ ] 반복 조합이 rolePreset seed에 없으면 `src/styles/rolePreset.ts`에 추가할 후보로 기록했는가?
