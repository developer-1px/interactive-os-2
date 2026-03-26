# NavList

> Vertical navigation list with keyboard navigation and followFocus activation.

## Demo

```tsx render
<ShowcaseDemo slug="navlist" />
```

## Usage

```tsx
import { NavList } from 'interactive-os/ui/NavList'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    home: { id: 'home', data: { label: 'Home' } },
    about: { id: 'about', data: { label: 'About' } },
  },
  relationships: { __root__: ['home', 'about'] },
})

<NavList data={data} onActivate={(id) => navigate(id)} />
```

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| data | NormalizedData | — | 네비게이션 항목 데이터 |
| plugins | Plugin[] | [core()] | 플러그인 배열 |
| onChange | (data: NormalizedData) => void | — | 데이터 변경 콜백 |
| onActivate | (nodeId: string) => void | — | 항목 활성화 콜백 |
| renderItem | (props, item, state) => ReactElement | defaultRenderItem | 항목 커스텀 렌더러 |
| renderGroupLabel | (label: string) => ReactNode | defaultRenderGroupLabel | 그룹 라벨 렌더러 |
| initialFocus | string | — | 초기 포커스 대상 노드 ID |
| aria-label | string | — | 리스트 접근성 라벨 |

## Keyboard

```tsx render
<ApgKeyboardTable slug="navlist" />
```

## Accessibility

- pattern: navlist (listbox 기반, Space 키 제거)
- role: listbox
- childRole: option
- aria-selected: focused 상태에 연동
- aria-orientation: vertical

## Internals

### DOM 구조

```
div[role=listbox][aria-orientation=vertical] container
  ├─ div[role=option] item (그룹 없는 경우)
  └─ div[role=group][aria-label] group (그룹 있는 경우)
       ├─ div.groupLabel
       └─ div[role=option] item
```

### CSS

- 방식: CSS Modules
- 파일: NavList.module.css
