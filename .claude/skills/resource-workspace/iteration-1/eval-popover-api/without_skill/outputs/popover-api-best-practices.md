# Popover API Best Practices

작성일: 2026-03-22

Popover API의 핵심 개념, 베스트 프랙티스, 접근성 고려사항을 정리한 참고 문서.
aria 프로젝트의 native-first 접근과 직접 관련된 내용을 중심으로 구성.

---

## 1. 핵심 개념

### popover 속성값 3가지

| 값 | Light dismiss | 다른 auto 닫기 | 다중 표시 | 용도 |
|---|---|---|---|---|
| `auto` (기본) | O (Esc, 외부 클릭) | O | 제한적 (중첩만) | 메뉴, 콤보박스, 드롭다운 |
| `manual` | X | X | 무제한 | 토스트, 영구 알림 |
| `hint` | O (Esc, 외부 클릭) | X (auto 닫지 않음) | hint끼리만 교체 | 툴팁, 정보 힌트 |

**핵심 차이**: `hint`는 열려있는 `auto` popover를 닫지 않는다. 메뉴 내 툴팁에 적합.

### Top Layer 렌더링

- popover는 브라우저 top layer에 렌더링 -> z-index 충돌 없음
- 부모의 `position`, `overflow` 영향 받지 않음
- 프레임 경계를 넘을 수 없음 (보안 제약)

### 중첩 규칙 (auto만 해당)

중첩은 3가지 메커니즘으로 성립:
1. **DOM 조상 관계**: popover 안에 다른 popover
2. **Anchor 참조**: anchor 요소가 다른 popover 내부에 있을 때
3. **선언적 트리거**: popover 내부 버튼이 다른 popover를 가리킬 때

`manual` popover는 중첩하지 않으며, 다른 요소를 강제로 닫지 않는다.

---

## 2. HTML 선언적 API

### 기본 패턴

```html
<!-- 선언적 토글 (JS 불필요) -->
<button popovertarget="menu">Open Menu</button>
<div id="menu" popover="auto">
  <ul role="menu">
    <li role="menuitem"><a href="#">Option 1</a></li>
    <li role="menuitem"><a href="#">Option 2</a></li>
  </ul>
</div>
```

### popovertargetaction

```html
<button popovertarget="info" popovertargetaction="show">Show</button>
<button popovertarget="info" popovertargetaction="hide">Hide</button>
<button popovertarget="info" popovertargetaction="toggle">Toggle</button> <!-- 기본값 -->
```

### interestfor (실험적)

hover/focus로 popover를 열 수 있는 선언적 속성. JS 이벤트 핸들러 대체 목표.

```html
<button interestfor="tooltip-id">Hover me</button>
<div id="tooltip-id" popover="hint" role="tooltip">설명 텍스트</div>
```

> aria 프로젝트 Tooltip 컴포넌트가 이미 `interestfor` + `popover="hint"` 조합을 사용 중.
> 현재는 `onMouseEnter`/`onMouseLeave` fallback과 병행.

---

## 3. JavaScript API

```js
const popover = document.getElementById('my-popover')

popover.showPopover()     // 표시
popover.hidePopover()     // 숨기기
popover.togglePopover()   // 토글

// 속성 읽기/쓰기
element.popover            // "auto" | "manual" | "hint" | null
button.popoverTargetElement // 대상 popover 요소
button.popoverTargetAction  // "show" | "hide" | "toggle"
```

### 이벤트

```js
// 상태 변경 후 (애니메이션, 로깅)
popover.addEventListener('toggle', (e) => {
  console.log(e.newState) // "open" | "closed"
})

// 상태 변경 전 (차단 가능)
popover.addEventListener('beforetoggle', (e) => {
  if (shouldPrevent()) e.preventDefault()
})
```

---

## 4. CSS Anchor Positioning

popover와 함께 사용하면 JS positioning 라이브러리 (Floating UI 등) 없이 위치 지정 가능.

### 기본 패턴

```css
/* 앵커 지정 */
.trigger {
  anchor-name: --my-trigger;
}

/* popover 위치 */
.popover {
  position: fixed;
  position-anchor: --my-trigger;
  inset: unset;                         /* UA 스타일 리셋 필수 */
  position-area: bottom span-all;       /* 앵커 아래, 수평 확장 */
  position-try-fallbacks: flip-block;   /* 공간 부족시 위로 */
}
```

### 핵심 속성 정리

| 속성 | 역할 | 예시 |
|---|---|---|
| `anchor-name` | 앵커 이름 등록 | `--my-anchor` |
| `position-anchor` | 대상 앵커 참조 | `--my-anchor` |
| `position-area` | 9셀 그리드 기반 위치 | `bottom`, `top center` |
| `anchor()` | 앵커 가장자리 기준 위치 | `top: anchor(bottom)` |
| `anchor-size()` | 앵커 크기 기준 사이징 | `width: anchor-size(width)` |
| `position-try-fallbacks` | 오버플로 시 대체 위치 | `flip-block`, `flip-inline` |
| `position-visibility` | 앵커 벗어나면 숨기기 | `anchors-visible` |

### 자동 뒤집기 키워드

```css
.popover {
  position-area: bottom;
  position-try-fallbacks: flip-block;   /* 상하 뒤집기 */
  /* 또는 flip-inline (좌우), flip-block flip-inline (양방향) */
}
```

### 커스텀 fallback

```css
@position-try --above-end {
  position-area: top end;
}

.popover {
  position-area: bottom start;
  position-try-fallbacks: --above-end, flip-block;
}
```

### 브라우저 지원

| 브라우저 | Anchor Positioning |
|---|---|
| Chrome/Edge | 125+ |
| Firefox | 147+ |
| Safari | 26+ |

Feature detection:
```css
@supports (anchor-name: --test) {
  /* anchor positioning 사용 */
}
```

---

## 5. 접근성 (Accessibility)

### 브라우저가 자동으로 제공하는 것

1. **`aria-expanded`**: `popovertarget` 버튼에 자동 설정 (Chrome, Edge, Firefox, Safari)
2. **`aria-details`**: popover가 트리거 직후가 아닐 때 관계 설정 (Chrome, Edge, Firefox)
3. **`role="group"`**: 명시적 role 없으면 자동 할당 (Chrome, Edge, Firefox)
4. **포커스 복원**: popover 닫히면 트리거 요소로 포커스 반환
5. **탭 순서 재배치**: popover 콘텐츠가 트리거 직후에 탭 순서 삽입

### 브라우저가 제공하지 않는 것 (개발자 책임)

- 시맨틱 role 할당 (`role="menu"`, `role="tooltip"`, `role="dialog"` 등)
- 키보드 패턴 (화살표 키 네비게이션, 포커스 트래핑)
- 포커스 관리 (autofocus 이외)
- ARIA 속성 (aria-label, aria-describedby 등)

### Best Practice

```html
<!-- 좋은 예: 시맨틱 요소 + popover -->
<dialog popover="auto">...</dialog>
<menu popover="auto">...</menu>

<!-- 나쁜 예: generic div + ARIA role -->
<div popover="auto" role="dialog">...</div>  <!-- <dialog> 사용 권장 -->
```

> OpenUI 설계 원칙: "시맨틱은 요소가 제공하고, 동작은 속성이 부여한다."
> `<div popover>` 대신 의미에 맞는 요소에 `popover` 속성을 추가.

### 툴팁 접근성

```html
<button aria-describedby="tip-1" interestfor="tip-1">
  Action
</button>
<span id="tip-1" popover="hint" role="tooltip">
  설명 텍스트
</span>
```

- `role="tooltip"` 명시
- `aria-describedby`로 트리거와 연결
- 키보드 포커스로도 표시 가능해야 함

---

## 6. CSS 애니메이션 패턴

### 진입/퇴장 애니메이션

```css
[popover] {
  /* 초기 상태 (display: none에서 전환) */
  opacity: 0;
  transform: translateY(-4px);
  transition:
    opacity 150ms ease-out,
    transform 150ms ease-out,
    overlay 150ms allow-discrete,
    display 150ms allow-discrete;
}

[popover]:popover-open {
  opacity: 1;
  transform: translateY(0);
}

/* display: none -> block 전환 시작점 */
@starting-style {
  [popover]:popover-open {
    opacity: 0;
    transform: translateY(-4px);
  }
}
```

### ::backdrop 스타일링

```css
[popover]::backdrop {
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
}
```

---

## 7. 패턴별 사용 가이드

| 패턴 | popover 타입 | 추가 속성 | 비고 |
|---|---|---|---|
| 드롭다운 메뉴 | `auto` | `role="menu"`, 화살표 키 | light dismiss 자연스러움 |
| 콤보박스 리스트 | `auto` | `role="listbox"` | 입력과 동기화 |
| 툴팁 | `hint` | `role="tooltip"`, `aria-describedby` | auto를 닫지 않음 |
| 토스트/알림 | `manual` | `role="status"`, `aria-live` | 자동 닫기 타이머 필요 |
| 비모달 대화상자 | `auto` | `<dialog popover>` | 시맨틱 요소 활용 |
| Teaching UI | `manual` | 단계별 네비게이션 | 명시적 닫기 버튼 |

---

## 8. aria 프로젝트 현재 적용 상태

`src/interactive-os/ui/Tooltip.tsx`에서 다음 조합을 사용 중:

- `popover="hint"` + `role="tooltip"` + `aria-describedby`
- CSS Anchor Positioning (`anchor-name`, `position-anchor`, `position-area`, `position-try-fallbacks`)
- `interestfor` 속성 (실험적, fallback으로 `onMouseEnter`/`onFocus` 병행)
- `showPopover()`/`hidePopover()` JS 호출 (300ms 딜레이)

이 구현은 Popover API의 native-first 접근을 잘 따르고 있으며,
`interestfor`가 안정화되면 JS 이벤트 핸들러를 제거할 수 있다.

### 향후 개선 가능성

- `interestfor` 안정화 시 `onMouseEnter`/`onMouseLeave`/`onFocus`/`onBlur` 제거
- CSS `interest-delay` 속성으로 JS setTimeout 대체
- `@starting-style` + `allow-discrete` 애니메이션 추가

---

## 참고 출처

- [MDN: Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)
- [MDN: popover attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/popover)
- [MDN: CSS Anchor Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning)
- [Chrome: Anchor Positioning API](https://developer.chrome.com/blog/anchor-positioning-api)
- [web.dev: Popover API](https://web.dev/blog/popover-api)
- [OpenUI: Popover Explainer](https://open-ui.org/components/popover.research.explainer/)
- [Hidde de Vries: Popover Accessibility](https://hidde.blog/popover-accessibility/)
