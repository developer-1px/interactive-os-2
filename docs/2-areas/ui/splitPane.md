# SplitPane

> Ratio 기반 리사이즈 가능한 분할 컨테이너. 수평/수직 방향, 키보드/포인터 리사이즈 지원.

## Demo

```tsx render
<ShowcaseDemo slug="splitpane" />
```

## Usage

```tsx
import { SplitPane } from 'interactive-os/ui/SplitPane'

<SplitPane direction="horizontal" sizes={[0.5, 0.5]} onResize={setSizes}>
  <LeftPanel />
  <RightPanel />
</SplitPane>
```

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| direction | `'horizontal' \| 'vertical'` | 필수 | 분할 방향 |
| sizes | `number[]` | 필수 | 각 pane의 비율 (합계 = 1) |
| onResize | `(sizes: number[]) => void` | 필수 | 리사이즈 콜백 |
| children | `React.ReactNode` | 필수 | pane 내용 |
| minRatio | `number` | `0.1` | pane 최소 비율 (10%) |

## Keyboard

separator에 포커스 시 (`role="separator"`, `tabIndex=0`):

| 키 | horizontal | vertical | 설명 |
|----|-----------|----------|------|
| `ArrowRight` | 오른쪽 확장 (+2%) | — | STEP = 0.02 |
| `ArrowLeft` | 왼쪽 확장 (+2%) | — | |
| `ArrowDown` | — | 아래 확장 (+2%) | |
| `ArrowUp` | — | 위 확장 (+2%) | |
| `Home` | 최소화 (minRatio) | 최소화 (minRatio) | 현재 pane을 minRatio로 |
| `End` | 최대화 (1 - minRatio) | 최대화 (1 - minRatio) | 현재 pane을 최대로 |

## Accessibility

- pattern: 없음 (자체 키보드 핸들러)
- role: `separator`
- ARIA 속성: `aria-orientation`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label`
- 포인터 드래그 + 키보드 동등 접근성

## Internals

### DOM 구조

```
div.splitPane (flex-row | flex-col)
  div.pane (width/height = sizes[i] * 100%)
  div[role="separator"].separator.separatorH|V
  div.pane (flex: 1, 마지막 pane)
```

- 자식 1개 이하일 때 separator 없이 직접 렌더링
- 드래그 중 직접 DOM 업데이트 (성능), pointerup 시 React 상태 동기화

### CSS

- 방식: CSS Modules
- 파일: SplitPane.module.css
- separator 커서: `col-resize` (horizontal) / `row-resize` (vertical)
- separator 배경: `--border-default`, hover 시 `--focus`
- motion: `--motion-instant-duration` + `--motion-instant-easing`
