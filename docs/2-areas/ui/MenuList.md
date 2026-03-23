# MenuList

> Vertical menu with keyboard navigation and activation.

## Demo

```tsx render
<ShowcaseDemo slug="menu-list" />
```

## Usage

```tsx
import { MenuList } from 'interactive-os/ui/MenuList'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    cut: { id: 'cut', data: { label: 'Cut' } },
    copy: { id: 'copy', data: { label: 'Copy' } },
    paste: { id: 'paste', data: { label: 'Paste' } },
  },
  relationships: { __root__: ['cut', 'copy', 'paste'] },
})

<MenuList data={data} onChange={setData} />
```

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| data | AriaData | — | 메뉴 항목 데이터 |
| plugins | Plugin[] | [core()] | 플러그인 배열 |
| onChange | (data: AriaData) => void | — | 데이터 변경 콜백 |
| renderItem | (item, state) => ReactNode | — | 항목 커스텀 렌더러 |

## Keyboard

```tsx render
<ApgKeyboardTable slug="menu-list" />
```

## Accessibility

- pattern: menu
- role: menu
- childRole: menuitem

## Internals

### DOM 구조

```
div[role=menu] container
  └─ div[role=menuitem] item
       └─ chevron (▾/▸)
```

### CSS

- 방식: Global CSS
- 파일: 전역 스타일
