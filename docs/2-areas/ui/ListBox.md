# ListBox

> Keyboard-navigable list with single or multi-select support.

## Demo

```tsx render
<ShowcaseDemo slug="listbox" />
```

## Usage

```tsx
import { ListBox } from 'interactive-os/ui/ListBox'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    apple: { id: 'apple', data: { label: 'Apple' } },
    banana: { id: 'banana', data: { label: 'Banana' } },
    cherry: { id: 'cherry', data: { label: 'Cherry' } },
  },
  relationships: { __root__: ['apple', 'banana', 'cherry'] },
})

<ListBox data={data} onChange={setData} />
```

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| data | AriaData | — | 리스트 항목 데이터 |
| plugins | Plugin[] | [core(), history()] | 플러그인 배열 |
| onChange | (data: AriaData) => void | — | 데이터 변경 콜백 |
| renderItem | (item, state) => ReactNode | — | 항목 커스텀 렌더러 |
| enableEditing | boolean | — | Delete, F2, Alt+↑↓ 리오더 활성화 |

## Keyboard

```tsx render
<ApgKeyboardTable slug="listbox" />
```

## Accessibility

- pattern: listbox
- role: listbox
- childRole: option

## Internals

### DOM 구조

```
div[role=listbox] container
  └─ div[role=option] item
```

### CSS

- 방식: CSS Modules
- 파일: ListBox.module.css
