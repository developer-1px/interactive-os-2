# Tooltip 컴포넌트 — PRD

> Discussion: tooltip은 UI 시스템이면 당연히 갖춰야 하는 기능. engine 밖 독립 컴포넌트로, 네이티브 `popover="hint"` + `interestfor` API를 사용. 순수 텍스트 tooltip만 (toggletip/hover card 범위 밖). Chromium 전용, fallback은 별도 과제.

## 1. 동기

| # | Given | Data (before) | When | Then | Data (after) | 역PRD |
|---|-------|--------------|------|------|-------------|-------|
| 1 | trigger 요소에 보조 설명이 필요함 | `<button>💾</button>` — 아이콘만으로 의미 불명확 | trigger에 hover 또는 focus | tooltip이 표시되어 보조 설명 제공 | trigger에 `interestfor={id}` 연결, `<span popover="hint" role="tooltip">` 표시 상태 | |
| 2 | tooltip이 표시된 상태 | tooltip visible | Escape 또는 blur 또는 mouseout | tooltip 숨김 | popover hidden 상태 | |
| 3 | 스크린리더 사용자가 trigger에 도달 | trigger에 `aria-describedby` 없음 | `<Tooltip>` 래핑 | 스크린리더가 trigger의 보조 설명을 읽음 | trigger에 `aria-describedby={id}`, tooltip에 `id` + `role="tooltip"` | |

상태: 🟢

## 2. 인터페이스

| 입력 | Data (before) | 조건 | 결과 | Data (after) | 역PRD |
|------|--------------|------|------|-------------|-------|
| hover (mouseenter) | tooltip hidden | trigger 위에 마우스 진입 | 브라우저가 delay 후 tooltip 표시 | popover="hint" showPopover | |
| hover (mouseleave) | tooltip visible | trigger에서 마우스 이탈 | 브라우저가 tooltip 숨김 | popover hidePopover | |
| focus | tooltip hidden | trigger에 키보드 포커스 | 브라우저가 tooltip 표시 | popover="hint" showPopover | |
| blur | tooltip visible | trigger에서 포커스 이탈 | 브라우저가 tooltip 숨김 | popover hidePopover | |
| Escape | tooltip visible | 키 입력 | 브라우저가 tooltip 숨김 (light dismiss) | popover hidePopover | |
| ↑↓←→ | — | — | N/A — tooltip은 포커스를 받지 않음 | — | |
| Enter | — | — | N/A — trigger의 기본 동작에 위임 | — | |
| Space | — | — | N/A — trigger의 기본 동작에 위임 | — | |
| Tab | tooltip visible | Tab 키 | trigger blur → tooltip 숨김, 다음 요소로 포커스 이동 | popover hidePopover | |
| Home/End | — | — | N/A | — | |
| 클릭 | — | — | N/A — trigger의 기본 동작에 위임. tooltip 표시/숨김에 관여 안 함 | — | |
| 더블클릭 | — | — | N/A | — | |

> 이벤트 버블링: tooltip은 top-layer (popover)에 렌더되므로 trigger DOM 트리와 격리됨. 버블링 이슈 없음.

> 모든 show/hide 동작은 브라우저 `interestfor` + `popover="hint"` 내장 동작. JS 이벤트 핸들러 0개.

상태: 🟢

## 3. 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `src/interactive-os/ui/Tooltip.tsx` | `<Tooltip content={string}>` 컴포넌트. cloneElement로 trigger에 `interestfor` + `aria-describedby` 주입. useId()로 ID 생성 | |
| `src/interactive-os/ui/Tooltip.css` | tooltip 스타일. CSS Anchor Positioning으로 trigger 아래 배치. 디자인 토큰 사용 (`var(--surface-3)` + `var(--shadow-md)` elevation 쌍, `var(--text-primary)` 등) | |

### 컴포넌트 API

```tsx
interface TooltipProps {
  content: string
  children: React.ReactElement  // trigger — 단일 요소
}
```

### DOM 출력 구조

```html
<!-- trigger (children에 속성 주입) -->
<button interestfor="tooltip-:r1:" aria-describedby="tooltip-:r1:">Save</button>

<!-- tooltip (trigger 옆 sibling) -->
<span id="tooltip-:r1:" popover="hint" role="tooltip" class="tooltip">
  저장합니다
</span>
```

상태: 🟢

## 4. 경계

| 조건 | Data (before) | 예상 동작 | Data (after) | 역PRD |
|------|--------------|----------|-------------|-------|
| content가 빈 문자열 | `content=""` | tooltip 요소를 렌더하지 않음. trigger에 interestfor/aria-describedby 주입 안 함 | children만 렌더 | |
| children이 단일 요소가 아님 (Fragment 등) | `<Tooltip><><a/><b/></></Tooltip>` | `Children.only`로 런타임 에러. 단일 요소만 허용 | — | |
| trigger가 disabled 요소 | `<button disabled>` | 브라우저 interestfor 동작에 위임 — disabled 요소는 focus 불가하므로 hover만 동작 | — | |
| 매우 긴 텍스트 | `content="100자 이상..."` | CSS max-width로 줄바꿈. 단순 텍스트이므로 스크롤 없음 | — | |
| 여러 Tooltip이 동시 존재 | 화면에 tooltip trigger 10개 | popover="hint"는 다른 hint를 자동으로 닫음 → 항상 1개만 표시 | — | |

상태: 🟢

## 5. 금지

| # | 하면 안 되는 것 | 이유 | 역PRD |
|---|---------------|------|-------|
| 1 | JS 이벤트 핸들러(onMouseEnter, onFocus 등) 직접 바인딩 | 네이티브 `interestfor`가 모든 입력 모달리티를 접근성 있게 처리. JS 핸들러는 네이티브 동작과 충돌 위험 | |
| 2 | useState로 show/hide 상태 관리 | popover API가 상태를 소유. React 상태와 이중 관리하면 불일치 발생 | |
| 3 | floating-ui / popper 등 positioning 라이브러리 도입 | CSS Anchor Positioning으로 해결. 라이브러리는 fallback 과제에서 검토 | |
| 4 | tooltip 내부에 인터랙티브 요소 (링크, 버튼 등) | 순수 텍스트 tooltip 스코프. 인터랙티브 필요하면 toggletip/popover (별도 과제) | |
| 5 | engine(useAria) 연동 | tooltip은 비포커스 위젯. engine의 포커스 노드 모델과 무관 | |
| 6 | role="tooltip"을 trigger가 아닌 다른 요소에 연결 | aria-describedby는 trigger가 소유. 다른 요소에 걸면 스크린리더가 연관성 파악 불가 | |

상태: 🟢

## 6. 검증

| # | 시나리오 | 예상 결과 | 역PRD |
|---|---------|----------|-------|
| 1 | `<Tooltip content="저장"><button>💾</button></Tooltip>` 렌더 | trigger에 `interestfor`, `aria-describedby` 속성. sibling에 `popover="hint"`, `role="tooltip"`, 동일 `id` | |
| 2 | content="" 빈 문자열 | tooltip span 렌더 안 됨. trigger에 interestfor/aria-describedby 없음 | |
| 3 | 브라우저에서 trigger hover | tooltip 표시됨 (브라우저 내장 delay 후) | |
| 4 | tooltip 표시 상태에서 Escape | tooltip 숨김 | |
| 5 | 키보드로 trigger focus | tooltip 표시 | |
| 6 | Tab으로 trigger에서 이탈 | tooltip 숨김 | |
| 7 | 동시에 여러 trigger 존재 시 하나만 hover | hint popover 특성상 이전 tooltip 자동 닫힘, 1개만 표시 | |
| 8 | 스크린리더 (VoiceOver) | trigger focus 시 보조 설명으로 tooltip content 읽힘 | |

> 검증 1~2: 통합 테스트 (DOM 속성 검증)
> 검증 3~8: `/reproduce`로 실제 브라우저 확인 (interestfor 동작은 jsdom 미지원)

상태: 🟢

---

**전체 상태:** 🟢 6/6
