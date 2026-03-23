# Kanban

> Board layout with columns and cards, spatial keyboard navigation.

## Demo

```tsx render
<ShowcaseDemo slug="kanban" />
```

## Usage

```tsx
import { Kanban } from 'interactive-os/ui/Kanban'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    todo: { id: 'todo', data: { title: 'To Do' } },
    t1: { id: 't1', data: { title: 'Design mockups' } },
  },
  relationships: {
    __root__: ['todo'],
    todo: ['t1'],
  },
})

<Kanban data={data} onChange={setData} aria-label="Board" />
```

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| data | AriaData | — | 칸반 데이터 |
| plugins | Plugin[] | [core()] | 플러그인 배열 |
| onChange | (data: AriaData) => void | — | 데이터 변경 콜백 |
| aria-label | string | — | 보드 접근성 라벨 |

## Keyboard

```tsx render
<ApgKeyboardTable slug="kanban" />
```

## Accessibility

- pattern: kanban
- role: (커스텀 — useAria() + AriaInternalContext 직접 사용)
- childRole: (column > card)

## Internals

### DOM 구조

```
div.kanban-board(row) container
  └─ div.kanban-column
       ├─ header FocusDiv
       ├─ cards FocusDiv
       └─ Aria.Editable
```

### CSS

- 방식: Global CSS
- 파일: kanban.css
