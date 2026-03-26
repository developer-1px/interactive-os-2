# TabList

> Horizontal tab bar with keyboard navigation and selection.

## Demo

```tsx render
<ShowcaseDemo slug="tab-list" />
```

## Usage

```tsx
import { TabList } from 'interactive-os/ui/TabList'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    overview: { id: 'overview', data: { label: 'Overview' } },
    api: { id: 'api', data: { label: 'API' } },
    examples: { id: 'examples', data: { label: 'Examples' } },
  },
  relationships: { __root__: ['overview', 'api', 'examples'] },
})

<TabList data={data} onChange={setData} />
```

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| data | AriaData | — | 탭 항목 데이터 |
| plugins | Plugin[] | [core(), history()] | 플러그인 배열 |
| onChange | (data: AriaData) => void | — | 데이터 변경 콜백 |
| renderItem | (item, state) => ReactNode | — | 항목 커스텀 렌더러 |
| enableEditing | boolean | — | Delete, F2, Alt+←/→ 리오더 활성화 |

## Keyboard

```tsx render
<ApgKeyboardTable slug="tab-list" />
```

## Accessibility

- pattern: tabs
- role: tablist
- childRole: tab

## Internals

### DOM 구조

```
div[role=tablist, display:flex] container
  └─ div[role=tab, aria-selected] item
```

### CSS

- 방식: CSS Modules
- 파일: TabList.module.css
