# Component Design Checklist

> shadcn/ui v4 구조 추출 + 우리 토큰 매핑. 레퍼런스·체크리스트·디자인 가이드 3역할.
> **갱신 시점:** 컴포넌트 디자인 패스 완료 시 상태 갱신.
> **상태:** ⬜ 미구현 / 🟡 부분 / 🟢 완료 / — 해당 없음

## 범례

- **Parts**: 컴포넌트를 구성하는 하위 요소 (root, trigger, content, item…)
- **States**: 상태별 시각 변화 (hover, focus, selected, disabled, invalid, open/close)
- **Variants**: 시각적 변형 (outline, ghost, destructive…)
- **Sizes**: 크기 축 (sm, default, lg)
- **shadcn ref**: shadcn/ui v4 new-york 레지스트리 기준

---

## 요약 대시보드

| 컴포넌트 | CSS 파일 | 3블록 | Parts | States | Variants | Sizes | 토큰 | 총점 |
|----------|---------|-------|-------|--------|----------|-------|------|------|
| Button | ui/ | 🟢 | 🟢 | 🟢 | 🟡 | 🟡 | 🟢 | 4/6 |
| Accordion | ui/ | 🟡 | 🟡 | ⬜ | — | ⬜ | 🟢 | 2/6 |
| AlertDialog | ui/ | ⬜ | 🟡 | ⬜ | 🟡 | ⬜ | 🟡 | 1/6 |
| TabGroup | ui/ | ⬜ | 🟢 | 🟡 | ⬜ | ⬜ | 🟡 | 2/6 |
| Combobox | ui/ | ⬜ | 🟡 | 🟡 | ⬜ | ⬜ | 🟢 | 2/6 |
| ListBox | ui/ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 🟢 | 1/6 |
| Slider | ui/ | ⬜ | 🟢 | 🟡 | ⬜ | ⬜ | 🟢 | 2/6 |
| Spinbutton | ui/ | ⬜ | 🟢 | 🟡 | ⬜ | ⬜ | 🟢 | 2/6 |
| TextInput | ui/ | 🟡 | ⬜ | 🟢 | ⬜ | ⬜ | 🟢 | 2/6 |
| Toolbar | ui/ | ⬜ | 🟡 | 🟡 | ⬜ | ⬜ | 🟢 | 1/6 |
| Tooltip | ui/ | ⬜ | 🟢 | — | — | — | 🟢 | 2/6 |
| Toaster | ui/ | ⬜ | 🟢 | — | 🟡 | — | 🟡 | 2/6 |
| Breadcrumb | ui/ | ⬜ | 🟡 | ⬜ | — | — | 🟡 | 1/6 |
| NavList | ui/ | ⬜ | 🟡 | ⬜ | ⬜ | ⬜ | 🟢 | 1/6 |
| Kanban | ui/ | ⬜ | 🟢 | 🟡 | 🟡 | ⬜ | 🟡 | 2/6 |
| Form | ui/ | ⬜ | 🟡 | 🟡 | ⬜ | ⬜ | ⬜ | 0/6 |
| Checkbox | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 0/6 |
| Toggle | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 0/6 |
| ToggleGroup | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 0/6 |
| RadioGroup | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 0/6 |
| SwitchGroup | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 0/6 |
| MenuList | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 0/6 |
| DisclosureGroup | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 0/6 |

**현재 점수: 29/138 (21%)**

---

## 공통 패턴 (shadcn에서 추출)

### 상태 패턴 — 전 컴포넌트 공통

| 상태 | shadcn 패턴 | os 토큰 매핑 |
|------|-----------|-------------|
| **focus-visible** | `border-ring ring-[3px] ring-ring/50` | `outline: var(--focus-ring) solid var(--focus)` (interactive.css) |
| **disabled** | `pointer-events-none opacity-50` | `opacity: 0.4` (interactive.css) |
| **aria-invalid** | `border-destructive ring-destructive/20` | `border-color: var(--tone-destructive-base)` |
| **hover** | `bg-accent` / `bg-muted` | `background: var(--bg-hover)` (interactive.css) |
| **selected** | `bg-muted` / `bg-accent` | `background: var(--selection)` (interactive.css) |

### 크기 체계 — Button 기준

| Size | shadcn height | os 토큰 |
|------|-------------|---------|
| xs | h-6 (24px) | `--shape-xs-py` + `--type-caption-size` |
| sm | h-8 (32px) | `--shape-sm-py` + `--type-body-size` |
| default | h-9 (36px) | `--input-height` (36px) |
| lg | h-10 (40px) | `--shape-lg-py` + `--type-body-size` |

### Popup 콘텐츠 공통

| 속성 | shadcn | os 토큰 |
|------|--------|---------|
| bg | `bg-popover` | `var(--surface-overlay)` |
| border | `ring-1 ring-foreground/10` | `border: 1px solid var(--border-subtle)` |
| radius | `rounded-lg` | `var(--shape-xl-radius)` |
| shadow | `shadow-md` | `var(--shadow-md)` |
| padding | `p-1` | `var(--space-xs)` |
| animation | `fade-in-0 zoom-in-95` | `var(--motion-enter-duration)` |

---

## 컴포넌트 상세

### Button 🟢🟢🟢🟡🟡🟢

**현재 상태: 가장 성숙. 3블록 레시피 유일한 완전 준수.**

#### Parts
| Part | shadcn | os 현재 | 상태 |
|------|--------|---------|------|
| root | `inline-flex items-center justify-center gap-2 rounded-md` | `.root` — `data-surface="action"` | 🟢 |
| icon slot | `[&_svg]:size-4 [&_svg]:pointer-events-none` | 없음 (아이콘 크기 미제어) | ⬜ |

#### Variants
| Variant | shadcn | os 현재 | 상태 |
|---------|--------|---------|------|
| default (primary) | `bg-primary text-primary-foreground` | `.accent` | 🟢 |
| destructive | `bg-destructive text-white` | `.destructive` | 🟢 |
| outline | `border bg-background shadow-xs` | 없음 | ⬜ |
| secondary | `bg-secondary text-secondary-foreground` | 없음 | ⬜ |
| ghost | `hover:bg-accent` | `.ghost` | 🟢 |
| link | `text-primary underline-offset-4` | 없음 | ⬜ |
| dialog | — | `.dialog` (os 고유) | 🟢 |

#### Sizes
| Size | shadcn | os 현재 | 상태 |
|------|--------|---------|------|
| sm | `h-8 px-3 gap-1.5` | `.sm` | 🟢 |
| default | `h-9 px-4 py-2` | 기본 | 🟢 |
| lg | `h-10 px-6` | `.lg` | 🟢 |
| icon | `size-9` (정사각) | 없음 | ⬜ |
| icon-sm | `size-8` | 없음 | ⬜ |

---

### Accordion 🟡🟡⬜—⬜🟢

#### Parts
| Part | shadcn | os 현재 | 상태 |
|------|--------|---------|------|
| root | `flex w-full flex-col` | `.root` | 🟢 |
| item | `not-last:border-b` | `.item` — border-bottom | 🟢 |
| trigger/header | `flex flex-1 items-start justify-between py-2.5 text-sm font-medium` | `.header` | 🟡 hover 없음 |
| chevron | `size-4 transition-transform` → rotate on expand | `.chevron` + `.chevronExpanded` | 🟢 |
| content | `overflow-hidden text-sm` + open/close animation | `.panel` | 🟡 animation 없음 |

#### States
| State | shadcn | os 현재 | 상태 |
|-------|--------|---------|------|
| hover (trigger) | `hover:underline` | 없음 | ⬜ |
| focus-visible | `ring-3 ring-ring/50 border-ring` | interactive.css에 위임 | 🟢 |
| disabled | `aria-disabled:pointer-events-none aria-disabled:opacity-50` | 없음 | ⬜ |
| open/close animation | `animate-accordion-down / animate-accordion-up` | 없음 | ⬜ |

---

### AlertDialog 🟡⬜🟡⬜🟡

#### Parts
| Part | shadcn | os 현재 | 상태 |
|------|--------|---------|------|
| overlay/backdrop | `fixed inset-0 bg-black/50` + fade animation | `.backdrop` | 🟢 |
| content/box | `rounded-lg border bg-background p-6 shadow-lg` + zoom animation | `.box` | 🟢 |
| header | `grid gap-1.5 text-center sm:text-left` | `.header` | 🟡 responsive 없음 |
| title | `text-lg font-semibold` | `.header` 내부 | 🟡 분리 안됨 |
| description | `text-sm text-muted-foreground` | `.body` | 🟢 |
| footer | `flex flex-col-reverse gap-2 sm:flex-row sm:justify-end` | `.footer` | 🟡 responsive 없음 |
| media icon | `size-16 rounded-md bg-muted` | 없음 | ⬜ |
| action button | delegates to Button | delegates to Button | 🟢 |
| cancel button | delegates to Button variant=outline | delegates to Button | 🟡 outline variant 없음 |

#### Sizes
| Size | shadcn | os 현재 | 상태 |
|------|--------|---------|------|
| default | `max-w-lg p-6` | 고정 width | 🟡 |
| sm | `max-w-xs p-6` | 없음 | ⬜ |

---

### TabGroup ⬜🟢🟡⬜⬜🟡

#### Parts
| Part | shadcn | os 현재 | 상태 |
|------|--------|---------|------|
| root | `flex gap-2` + orientation | `.tabGroup` | 🟢 |
| list | `inline-flex rounded-lg p-[3px] h-8` | `.tabBar` | 🟢 |
| trigger/tab | `rounded-md border border-transparent px-1.5 py-0.5 text-sm` | `.tab` | 🟢 |
| tab close | — (shadcn 없음) | `.tabClose` (os 고유) | 🟢 |
| tab preview | — | `.tabPreview` (os 고유) | 🟢 |
| content/panel | `flex-1 text-sm` | `.tabPanel` | 🟢 |

#### Variants
| Variant | shadcn | os 현재 | 상태 |
|---------|--------|---------|------|
| default (pill) | `bg-muted` list + `data-active:bg-background shadow-sm` tab | 현재 기본 | 🟢 |
| line (underline) | `bg-transparent` list + bottom border indicator | 없음 | ⬜ |

#### States
| State | shadcn | os 현재 | 상태 |
|-------|--------|---------|------|
| active/selected | `bg-background text-foreground shadow-sm` | `aria-selected: raised bg, primary text` | 🟢 |
| hover | `hover:text-foreground` (from muted) | 없음 (탭 hover 미구현) | ⬜ |
| disabled | `disabled:pointer-events-none disabled:opacity-50` | 없음 | ⬜ |

#### 토큰 이슈
- `--space-2xs` 참조하지만 tokens.css에 없음

---

### Combobox ⬜🟡🟡⬜⬜🟢

#### Parts
| Part | shadcn | os 현재 | 상태 |
|------|--------|---------|------|
| input | Input 스타일 상속 | `.comboInput` | 🟢 |
| content/dropdown | `rounded-md bg-popover shadow-md ring-1` + animation | `.comboDropdown` | 🟢 |
| item | `py-1.5 pr-8 pl-2 text-sm rounded-sm` | `.comboItem` | 🟢 |
| item indicator (check) | `absolute right-2 size-4` | 없음 | ⬜ |
| label/group | `px-2 py-1.5 text-xs text-muted-foreground` | 없음 | ⬜ |
| separator | `-mx-1 my-1 h-px bg-border` | 없음 | ⬜ |
| empty state | `text-sm text-muted-foreground` centered | 없음 | ⬜ |
| chips (multi) | `flex flex-wrap gap-1.5 rounded-md border` | 없음 | ⬜ |

#### States
| State | shadcn | os 현재 | 상태 |
|-------|--------|---------|------|
| highlighted/focused | `data-highlighted:bg-accent` | `.comboItemFocused` (primary-dim) | 🟢 |
| selected | check indicator + accent | `.comboItemSelected` (selection bg) | 🟡 indicator 없음 |
| disabled | `pointer-events-none opacity-50` | 없음 | ⬜ |

---

### ListBox ⬜⬜⬜⬜⬜🟢

**현재 가장 빈약. CSS 1줄 (selected font-weight만).**

#### Parts
| Part | shadcn (Select 기준) | os 현재 | 상태 |
|------|---------------------|---------|------|
| root | `border rounded-md` | 없음 (interactive.css 위임) | ⬜ |
| item | `py-1.5 pr-8 pl-2 text-sm rounded-sm` | 없음 | ⬜ |
| item indicator | `absolute right-2 size-3.5` (check) | 없음 | ⬜ |
| group label | `px-2 py-1.5 text-xs text-muted-foreground` | 없음 | ⬜ |
| separator | `h-px bg-border` | 없음 | ⬜ |

#### States
| State | shadcn | os 현재 | 상태 |
|-------|--------|---------|------|
| hover | `hover:bg-accent` | interactive.css | 🟢 |
| focus | `focus:bg-accent focus:text-accent-foreground` | interactive.css | 🟢 |
| selected | `data-[state=selected]:bg-muted` + check | `.itemSelected` font-weight만 | 🟡 |
| disabled | `pointer-events-none opacity-50` | interactive.css | 🟢 |

---

### Slider ⬜🟢🟡⬜⬜🟢

#### Parts
| Part | shadcn | os 현재 | 상태 |
|------|--------|---------|------|
| root | `flex w-full touch-none items-center` | `.sliderItem` | 🟢 |
| track | `rounded-full bg-muted h-1.5` | `.sliderTrack` | 🟢 |
| range/fill | `absolute bg-primary h-full` | `.sliderFill` | 🟢 |
| thumb | `size-4 rounded-full border border-primary bg-white shadow-sm` | `.sliderThumb` | 🟢 |
| label | — | `.sliderLabel` (os 고유) | 🟢 |
| value display | — | `.sliderValue` (os 고유) | 🟢 |

#### States
| State | shadcn | os 현재 | 상태 |
|-------|--------|---------|------|
| thumb hover | `hover:ring-4` | 없음 | ⬜ |
| thumb focus | `focus-visible:ring-4` | `[data-focused] .sliderThumb` box-shadow | 🟢 |
| disabled | `opacity-50` | 없음 | ⬜ |
| vertical | `data-[orientation=vertical]` | 없음 (horizontal만) | ⬜ |

---

### Spinbutton ⬜🟢🟡⬜⬜🟢

#### Parts
| Part | shadcn (Input 기준) | os 현재 | 상태 |
|------|---------------------|---------|------|
| root | — | `.spinbuttonItem` | 🟢 |
| label | — | `.spinbuttonLabel` | 🟢 |
| input group | `h-9 rounded-md border` | `.spinbuttonGroup` | 🟢 |
| increment/decrement | — | `.spinbuttonBtn` + Inc/Dec | 🟢 |
| value display | — | `.spinbuttonValue` | 🟢 |
| input (editable) | — | `.spinbuttonInput` | 🟢 |

#### States
| State | os 현재 | 상태 |
|-------|---------|------|
| focus | `[data-focused]` primary border + ring | 🟢 |
| invalid | `[data-invalid]` destructive border + ring | 🟢 |
| disabled | 없음 | ⬜ |

*shadcn에 Spinbutton 없음 — os 고유 컴포넌트. 자체 기준으로 평가.*

---

### TextInput 🟡⬜🟢⬜⬜🟢

#### Parts
| Part | shadcn | os 현재 | 상태 |
|------|--------|---------|------|
| input | `h-9 rounded-md border px-3 py-1 text-sm` | `.input` + `data-surface="input"` | 🟢 |
| label | `text-sm font-medium` (Label 컴포넌트) | 없음 (별도 컴포넌트 없음) | ⬜ |

#### States — interactive.css에서 대부분 처리
| State | shadcn | os 현재 | 상태 |
|-------|--------|---------|------|
| focus-visible | `border-ring ring-[3px] ring-ring/50` | interactive.css `data-surface="input"` | 🟢 |
| disabled | `pointer-events-none opacity-50` | interactive.css | 🟢 |
| invalid | `border-destructive ring-destructive/20` | interactive.css | 🟢 |
| placeholder | `placeholder:text-muted-foreground` | interactive.css | 🟢 |

#### Variants
| Variant | shadcn | os 현재 | 상태 |
|---------|--------|---------|------|
| file input | `file:inline-flex file:h-7 file:border-0 file:bg-transparent` | 없음 | ⬜ |

---

### Tooltip ⬜🟢——🟢

#### Parts
| Part | shadcn | os 현재 | 상태 |
|------|--------|---------|------|
| content | `rounded-md bg-foreground px-3 py-1.5 text-xs text-background` | `.tooltip` — `surface-raised, text-primary` | 🟢 (색 체계 다름: shadcn=반전, os=raised surface) |
| arrow | `size-2.5 rounded-[2px] bg-foreground` | 없음 | ⬜ |

*Tooltip은 단순 컴포넌트. os는 CSS Anchor Positioning 사용 (더 진보적).*

---

### Toaster ⬜🟢—🟡—🟡

#### Parts
| Part | shadcn (Sonner) | os 현재 | 상태 |
|------|----------------|---------|------|
| container | `toaster group` | `.container` | 🟢 |
| toast | CSS vars로 bg/text/border | `.toast` | 🟢 |
| title | — | `.title` | 🟢 |
| description | — | `.description` | 🟢 |
| dismiss | — | `.dismiss` | 🟢 |
| icon per type | `CircleCheck/Info/TriangleAlert/OctagonX size-4` | 없음 | ⬜ |

#### Variants
| Variant | shadcn | os 현재 | 상태 |
|---------|--------|---------|------|
| success | CSS var override | `[data-variant='success']` | 🟢 |
| error | CSS var override | `[data-variant='error']` | 🟢 |
| info | CSS var override | 없음 | ⬜ |
| warning | CSS var override | 없음 | ⬜ |

#### 토큰 이슈
- `@keyframes slideIn` — raw `150ms ease-out` 대신 motion 토큰 사용해야 함

---

### Breadcrumb ⬜🟡⬜——🟡

#### Parts
| Part | shadcn | os 현재 | 상태 |
|------|--------|---------|------|
| nav | `aria-label="breadcrumb"` | `.breadcrumb` | 🟢 |
| list | `flex flex-wrap gap-1.5 text-sm text-muted-foreground` | 없음 (inline) | 🟡 |
| item | `inline-flex items-center gap-1.5` | 없음 | ⬜ |
| link | `transition-colors hover:text-foreground` | `.segment` | 🟡 hover 없음 |
| current page | `font-normal text-foreground` | `.current` | 🟢 |
| separator | `[&>svg]:size-3.5` ChevronRight | `.sep` | 🟢 |
| ellipsis | `size-9 MoreHorizontal` | 없음 | ⬜ |

#### 토큰 이슈
- `gap: 1px`, `opacity: 0.4` — raw 값

---

### NavList ⬜🟡⬜⬜⬜🟢

#### Parts
| Part | shadcn (NavigationMenu) | os 현재 | 상태 |
|------|------------------------|---------|------|
| root/list | `flex items-center` | interactive.css 위임 | 🟢 |
| group | — | `.group` | 🟢 |
| group label | — | `.groupLabel` | 🟢 |
| item | `h-9 px-2.5 py-1.5 text-sm rounded-lg` | 없음 (interactive.css item 스타일) | 🟡 |
| item active | `data-active:bg-muted/50` | 없음 | ⬜ |

*NavList은 NavigationMenu과 달리 popup/dropdown 없는 단순 목록.*

---

### Kanban ⬜🟢🟡🟡⬜🟡

*shadcn에 Kanban 없음 — os 고유 컴포넌트.*

#### Parts — 자체 평가
| Part | os 현재 | 상태 |
|------|---------|------|
| board | `.board` | 🟢 |
| column | `.column` | 🟢 |
| column header | `.columnHeader` | 🟢 |
| column count | `.columnCount` | 🟢 |
| card | `.card` | 🟢 |

#### States
| State | os 현재 | 상태 |
|-------|---------|------|
| card focused | `[data-focused]` primary-dim bg | 🟢 |
| card selected | `aria-selected` selection bg | 🟢 |
| card renaming | `[data-renaming]` focus outline | 🟢 |
| card disabled | 없음 | ⬜ |

#### Variants
| Variant | os 현재 | 상태 |
|---------|---------|------|
| compact | `[data-compact]` — dense layout | 🟢 |

#### 토큰 이슈
- compact column `width: 200px` — raw 값

---

### Form ⬜🟡🟡⬜⬜⬜

#### Parts
| Part | shadcn | os 현재 | 상태 |
|------|--------|---------|------|
| form-item | `grid gap-2` | `.field` | 🟡 |
| form-label | Label + `data-[error=true]:text-destructive` | `.label` | 🟡 error 색상 없음 |
| form-control | Slot (ARIA wiring) | `.value` | 🟡 |
| form-description | `text-sm text-muted-foreground` | 없음 | ⬜ |
| form-message | `text-sm text-destructive` | `.error` | 🟢 |

#### 토큰 이슈 — BROKEN
- `--font-size-sm`, `--font-size-md`, `--font-size-xs` — **존재하지 않는 토큰 참조**
- → `--type-body-size`, `--type-caption-size` 등으로 교체 필요

---

### CSS 없는 컴포넌트 (interactive.css에만 의존)

#### Checkbox ⬜⬜⬜⬜⬜⬜

| Part | shadcn | os 현재 | 필요 |
|------|--------|---------|------|
| root | `size-4 rounded-[4px] border shadow-xs` | interactive.css 기본만 | module.css 필요 |
| indicator | `grid place-content-center` + CheckIcon | 없음 | 필요 |
| checked | `bg-primary text-primary-foreground` | interactive.css `[aria-checked]` | 🟡 |
| indeterminate | `data-[state=indeterminate]` | 없음 | ⬜ |

#### Toggle ⬜⬜⬜⬜⬜⬜

| Part | shadcn | os 현재 | 필요 |
|------|--------|---------|------|
| root | `inline-flex items-center justify-center rounded-lg text-sm` | interactive.css 기본만 | module.css 필요 |
| variant=default | `bg-transparent hover:bg-muted` | 없음 | 필요 |
| variant=outline | `border bg-transparent hover:bg-muted` | 없음 | 필요 |
| size sm/default/lg | `h-7/h-8/h-9` | 없음 | 필요 |
| pressed | `aria-pressed:bg-muted` | interactive.css | 🟡 |

#### ToggleGroup ⬜⬜⬜⬜⬜⬜

| Part | shadcn | os 현재 | 필요 |
|------|--------|---------|------|
| root | `flex gap-[spacing] rounded-lg` | interactive.css 기본만 | module.css 필요 |
| item | Toggle 상속 + `focus:z-10` | 없음 | 필요 |
| spacing=0 | collapsed borders | 없음 | 필요 |
| orientation | horizontal/vertical | 없음 | 필요 |

#### RadioGroup ⬜⬜⬜⬜⬜⬜

| Part | shadcn | os 현재 | 필요 |
|------|--------|---------|------|
| root | `grid gap-3` | interactive.css 기본만 | module.css 필요 |
| item | `size-4 rounded-full border shadow-xs` | 없음 | 필요 |
| indicator dot | `size-2 fill-primary rounded-full` | 없음 | 필요 |
| checked | visual indicator | interactive.css `[aria-checked]` | 🟡 |

#### SwitchGroup ⬜⬜⬜⬜⬜⬜

| Part | shadcn | os 현재 | 필요 |
|------|--------|---------|------|
| track | `h-[1.15rem] w-8 rounded-full` | interactive.css 기본만 | module.css 필요 |
| thumb | `size-4 rounded-full bg-background translate-x` | 없음 | 필요 |
| checked | `bg-primary` track | interactive.css | 🟡 |
| size sm | `h-3.5 w-6` track, `size-3` thumb | 없음 | 필요 |

#### MenuList ⬜⬜⬜⬜⬜⬜

| Part | shadcn (DropdownMenu) | os 현재 | 필요 |
|------|----------------------|---------|------|
| content | `rounded-lg bg-popover p-1 shadow-md ring-1` | interactive.css 기본만 | module.css 필요 |
| item | `px-1.5 py-1 text-sm rounded-md gap-1.5` | 없음 | 필요 |
| item variant=destructive | `text-destructive focus:bg-destructive/10` | 없음 | 필요 |
| checkbox/radio item | `pl-7` + indicator | 없음 | 필요 |
| label | `text-xs text-muted-foreground` | 없음 | 필요 |
| separator | `h-px bg-border` | 없음 | 필요 |
| shortcut | `text-xs text-muted-foreground ml-auto` | 없음 | 필요 |
| sub-trigger | chevron-right indicator | 없음 | 필요 |

#### DisclosureGroup ⬜⬜⬜⬜⬜⬜

*shadcn Collapsible은 headless (CSS 0). 우리도 interactive.css 위임으로 충분할 수 있음.*

---

## 토큰 위반 목록

| 파일 | 위반 | 수정 방향 |
|------|------|----------|
| Form.module.css | `--font-size-sm/md/xs` (존재하지 않음) | `--type-body-size`, `--type-caption-size` |
| FileViewerModal.module.css | `#e5a33a` hex | `--tone-warning-base` 또는 토큰 추가 |
| TabGroup.module.css | `--space-2xs` (존재하지 않음) | `--space-xs` 또는 토큰 추가 |
| Toaster.module.css | `150ms ease-out` raw | `--motion-enter-duration`, `--motion-enter-easing` |
| StreamFeed.module.css | `6px`, `32px`, `box-shadow: 0 2px 8px` | 각각 토큰 매핑 |
| QuickOpen.module.css | `560px`, `520px`, `12vh`, `2px` | `--overlay-width` 등 |
| CodeBlock.module.css | `border-radius: 2px`, `0.1s` | `--shape-xs-radius`, `--motion-instant-duration` |
| Breadcrumb.module.css | `gap: 1px`, `opacity: 0.4` | `--space-xs` 근사 또는 토큰 추가 |
| Kanban.module.css | `width: 200px` (compact) | 컴포넌트 토큰 또는 spec 토큰 |

---

## 디자인 패스 우선순위

### Tier 1 — CSS 없는 컴포넌트 (module.css 신규 생성)
1. **Checkbox** — 가장 작은 단위, 3블록 레시피 연습
2. **Toggle** — variant 2개 + size 3개, 레시피 풀 적용
3. **ToggleGroup** — Toggle 확장
4. **RadioGroup** — Checkbox 유사 패턴
5. **SwitchGroup** — 고유 track/thumb 구조
6. **MenuList** — 가장 복잡 (item/label/separator/shortcut/sub)

### Tier 2 — 기존 CSS 보강 (parts/states/variants 추가)
7. **ListBox** — 1줄 → 완전한 컴포넌트
8. **Form** — 토큰 수정 + description part 추가
9. **TabGroup** — line variant, hover, 토큰 수정
10. **Combobox** — group/separator/empty/indicator 추가
11. **Accordion** — hover, animation, disabled 추가
12. **NavList** — active state, item 스타일

### Tier 3 — 토큰 위반 정리
13. 위 토큰 위반 목록 일괄 수정

### Tier 4 — Variant/Size 확장
14. **Button** — outline, secondary, link variant + icon size
15. **AlertDialog** — sm size, media icon, responsive footer
16. **Toaster** — info, warning variant
17. **Breadcrumb** — hover, ellipsis
18. **Slider** — hover ring, disabled, vertical

---

## 수정 레시피 (컴포넌트당 작업 순서)

```
1. shadcn 상세 섹션에서 누락 확인
2. module.css 작성/수정 — 3블록 레시피 준수
   Block 1: base (형태 + --_ private var 참조)
   Block 2: variant (--_ 값만 변경)
   Block 3: size (번들 override)
3. interactive.css 위임 가능한 것은 위임 (hover/focus/selected/disabled 기본)
4. 브라우저 스크린샷 검증
5. design score 재측정
6. 대시보드 상태 갱신
```
