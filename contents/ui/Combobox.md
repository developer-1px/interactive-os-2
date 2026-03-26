# Combobox

> Input with a filterable dropdown list of options.

## Demo

```tsx render
<ShowcaseDemo slug="combobox" />
```

## Usage

```tsx
import { Combobox } from 'interactive-os/ui/Combobox'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    red: { id: 'red', data: { label: 'Red' } },
    blue: { id: 'blue', data: { label: 'Blue' } },
  },
  relationships: { __root__: ['red', 'blue'] },
})

<Combobox data={data} onChange={setData} placeholder="Pick a color..." />
```

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| data | AriaData | — | 옵션 데이터 |
| plugins | Plugin[] | [core(), comboboxPlugin()] | 플러그인 배열 |
| onChange | (data: AriaData) => void | — | 데이터 변경 콜백 |
| renderItem | (item, state) => ReactNode | — | 항목 커스텀 렌더러 |
| placeholder | string | — | 입력 플레이스홀더 |
| editable | boolean | — | 입력 편집 가능 여부 |
| selectionMode | "single" \| "multiple" | "single" | 선택 모드 |
| creatable | boolean | — | 새 항목 생성 허용 |

## Keyboard

```tsx render
<ApgKeyboardTable slug="combobox" />
```

## Accessibility

- pattern: `combobox({selectionMode})`
- role: combobox (input) + listbox (dropdown)
- childRole: option
- focusStrategy: aria-activedescendant

## Internals

### DOM 구조

```
input[role=combobox] trigger/input
div[role=listbox].combo-dropdown popup
  └─ div[role=option] item
```

### Features

- 그룹 flatten/restore: 검색 시 그룹 평탄화, 검색 해제 시 복원
- create option: creatable=true 시 "Create ..." 옵션 표시
- multiple: selectionMode="multiple" 시 토큰 UI

### CSS

- 방식: Global CSS
- 파일: combobox.css
