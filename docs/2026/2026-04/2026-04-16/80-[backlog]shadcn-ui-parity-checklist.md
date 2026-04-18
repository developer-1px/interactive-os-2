---
id: '0-inbox/80-[backlog]shadcn-ui-parity-checklist'
type: backlog
slug: shadcnUiParityChecklist
title: 'shadcn/ui Parity Checklist — 2026-04-16'
tags: [backlog, placeholder]
created: 2026-04-16
updated: 2026-04-16
legacy:
  status: inbox
  kind: backlog
  topics: [0-inbox, backlog, placeholder]
  relates: []
  supersedes: []
---
# shadcn/ui Parity Checklist — 2026-04-16

## 배경

shadcn/ui 대비 우리 컴포넌트가 "컴포넌트 답게 안 그려지는" 문제. 원인은 두 가지:
1. **ax.css 공통 규칙 누락** — control/badge 등에 레이아웃·transition·shadow 없음
2. **컴포넌트별 DOM 구조 차이** — shadcn은 part별 시맨틱 구조, 우리는 flat div

전수조사 후 하나씩 이식. 한 번에 안 되는 작업이므로 체크리스트로 관리.

## A. ax.css 공통 규칙 (전역 — 모든 컴포넌트에 영향)

### A1. `.rl-control` 레이아웃 번들
- [ ] `display: inline-flex; align-items: center; justify-content: center;`
- [ ] `gap: var(--space-xs);`
- [ ] `white-space: nowrap; flex-shrink: 0;`
- [ ] SVG 자동 크기: `& svg { width: 1em; height: 1em; flex-shrink: 0; pointer-events: none; }`

### A2. `.rl-badge` 레이아웃 번들
- [ ] `display: inline-flex; align-items: center; justify-content: center;`
- [ ] `gap: var(--space-xs); width: fit-content; flex-shrink: 0;`
- [ ] `overflow: hidden;`
- [ ] SVG 자동 크기: `& svg { width: 0.75em; height: 0.75em; }`

### A3. `.rl-item` 레이아웃 번들
- [ ] `display: flex; align-items: center; gap: var(--space-xs);`
- [ ] `cursor: default; user-select: none;`

### A4. transition 전역
- [ ] `.sf-action` — `transition: color, background-color, box-shadow 150ms`
- [ ] `.sf-input` — `transition: color, box-shadow 150ms`
- [ ] `.sf-ghost` — `transition: color, background-color 150ms`
- [ ] `.it-*` (interactive) — `transition: color, background-color 150ms`

### A5. shadow 토큰
- [ ] `--shadow-xs` 정의 (input, select trigger)
- [ ] `--shadow-sm` 정의 (card, active tab)
- [ ] `.sf-input` — `box-shadow: var(--shadow-xs);`
- [ ] `.sf-raised` — `box-shadow: var(--shadow-sm);`

### A6. placeholder/selection 전역
- [ ] `input::placeholder, textarea::placeholder { color: var(--text-muted); }`
- [ ] `::selection { background: var(--tone-accent-base); color: var(--text-bright); }`

### A7. disabled 통일
- [ ] 모든 surface: `disabled:opacity-50` (현재 0.4 → 0.5로 통일)
- [ ] `disabled:cursor-not-allowed` (현재 `cursor: default`)

---

## B. 컴포넌트별 DOM+CSS 이식

### B01. Button
shadcn 구조: `<button data-slot="button" data-variant data-size>`
- [ ] `shrink-0` — flex 컨테이너 안에서 찌그러지지 않음
- [ ] `has-[>svg]:px-3` — 아이콘 포함 시 패딩 축소 (`.rl-control:has(> svg)`)
- [ ] variant `outline` 추가 — `border bg-background shadow-xs hover:bg-accent`
- [ ] variant `secondary` 추가 — `bg-secondary text-secondary-foreground`
- [ ] variant `link` 추가 — `underline-offset-4 hover:underline`
- [ ] size `xs`/`sm`/`lg` 프리셋 (현재 role:control 단일 크기)
- [ ] `aria-invalid` 스타일 — `border-destructive ring-destructive/20`

### B02. Badge
shadcn 구조: `<span data-slot="badge" data-variant>`
- [ ] variant `secondary` — `bg-secondary text-secondary-foreground`
- [ ] variant `ghost` — hover만 배경
- [ ] variant `link` — underline
- [ ] `border border-transparent` 기본 (outline 변형에서 보이게)
- [ ] `[a&]:hover:*` — 링크 뱃지 hover

### B03. Input (TextInput)
shadcn 구조: `<input data-slot="input">`
- [ ] `shadow-xs` 추가
- [ ] `transition-[color,box-shadow]` 추가
- [ ] `placeholder:text-muted-foreground`
- [ ] `selection:bg-primary selection:text-primary-foreground`
- [ ] `aria-invalid:border-destructive aria-invalid:ring-destructive/20`
- [ ] `md:text-sm` (반응형 폰트)
- [ ] `min-w-0` (flex 안에서 축소 허용)
- [ ] `file:` 셀렉터 (파일 입력 스타일)
- [ ] dark mode: `dark:bg-input/30`

### B04. Textarea
shadcn 구조: `<textarea data-slot="textarea">`
- [ ] `field-sizing-content` (CSS native auto-resize)
- [ ] `min-h-16` 최소 높이
- [ ] `shadow-xs` 추가
- [ ] `placeholder:text-muted-foreground`
- [ ] `aria-invalid` 스타일
- [ ] autoResize JS 로직 → `field-sizing: content` CSS로 교체 검토

### B05. Card
shadcn 구조: `<div data-slot="card">` + `card-header` (grid!) + `card-content` (px-6) + `card-footer` (flex)
- [ ] `shadow-sm` 추가 (depth 시각 단서)
- [ ] gap `sm` → `lg` (shadcn은 gap-6)
- [ ] `rounded-xl` (현재 md → xl 검토)
- [ ] CardHeader: `grid auto-rows-min grid-cols-[1fr_auto]` 구조 (action 슬롯)
- [ ] CardAction 슬롯 추가 (우상단 액션 버튼)
- [ ] CardTitle: `leading-none font-semibold`
- [ ] CardDescription: `text-sm text-muted-foreground`
- [ ] padding 구조: py(card) + px(header/content/footer) 분리

### B06. Alert
shadcn 구조: `<div data-slot="alert" role="alert">` + `alert-title` + `alert-description` (grid 레이아웃!)
- [ ] grid 레이아웃: `grid grid-cols-[calc(var(--spacing)*4)_1fr] gap-y-0.5 gap-x-3`
- [ ] `has-[>svg]:grid-cols-[...]` — SVG 유무에 따른 grid 변경
- [ ] `rounded-lg border px-4 py-3`
- [ ] AlertTitle: `col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight`
- [ ] AlertDescription: `col-start-2 text-sm text-muted-foreground`
- [ ] variant `destructive` — 색상만 변경, 구조 동일

### B07. Accordion
shadcn 구조: `AccordionItem(border-b)` > `Header(flex)` > `Trigger(flex-1 justify-between)` + `Content(animate)`
- [ ] item 간 `border-bottom` + `last:border-b-0`
- [ ] trigger: `flex-1 items-start justify-between gap-4`
- [ ] trigger: `py-4 text-left text-sm font-medium`
- [ ] trigger: `hover:underline`
- [ ] chevron: `size-4 text-muted transition-transform duration-200`
- [ ] `[data-state=open] > svg: rotate-180`
- [ ] content: `animate-accordion-down / animate-accordion-up` (open/close 애니메이션)
- [ ] content: `overflow-hidden` + 내부 `pb-4`

### B08. Select
shadcn 구조: `SelectTrigger(flex border shadow-xs)` + `SelectContent(portal z-50 border shadow-md animate)` + `SelectItem(flex gap-2 rounded-sm)`
- [ ] trigger: `shadow-xs` 추가
- [ ] trigger: `data-[placeholder]:text-muted-foreground`
- [ ] trigger: size variant (`h-9` default, `h-8` sm)
- [ ] content: `z-50 min-w-[8rem] border shadow-md rounded-md`
- [ ] content: `animate-in/out fade/zoom/slide` 방향별 애니메이션
- [ ] content: `max-h-(--radix-select-content-available-height)` → 뷰포트 넘침 방지
- [ ] item: `rounded-sm py-1.5 pr-8 pl-2` (indicator 공간 확보)
- [ ] item: `focus:bg-accent focus:text-accent-foreground`
- [ ] item indicator: `absolute right-2 size-3.5` (체크 아이콘)
- [ ] SelectLabel: 그룹 라벨 `px-2 py-1.5 text-xs text-muted`
- [ ] SelectSeparator: `-mx-1 my-1 h-px bg-border`
- [ ] ScrollUp/Down 버튼

### B09. Tabs (TabList)
shadcn 구조: `Tabs(flex gap-2)` > `TabsList(inline-flex bg-muted rounded-lg p-[3px] h-9)` > `TabsTrigger(data-[state=active]:bg-background shadow-sm)`
- [ ] list: 고정 높이 `h-9` (= control height)
- [ ] list: `p-[3px]` (inner padding for inset look)
- [ ] trigger: `h-[calc(100%-1px)]` (list 안에서 1px 여백)
- [ ] trigger: `text-sm font-medium`
- [ ] trigger active: `bg-background shadow-sm text-foreground` (float 효과)
- [ ] trigger active dark: `border-input bg-input/30`
- [ ] line variant: `after::` pseudo 하단 indicator + `data-[state=active]:after:opacity-100`
- [ ] vertical orientation 지원
- [ ] SVG 자동 크기: `[&_svg]:size-4`

### B10. Tooltip
shadcn 구조: `TooltipContent(portal z-50 animate-in rounded-md bg-foreground text-xs)`
- [ ] `bg-foreground text-background` (inverted — 이미 `surface:inverted`)
- [ ] `rounded-md px-3 py-1.5 text-xs text-balance`
- [ ] Arrow: `size-2.5 rotate-45 rounded-[2px] bg-foreground` — 우리는 arrow 없음
- [ ] 방향별 slide 애니메이션: `data-[side=*]:slide-in-from-*`
- [ ] close 애니메이션: `data-[state=closed]:fade-out-0 zoom-out-95`
- [ ] `pointer-none` 이미 있음 → 남은 `style={}` 제거 검토

### B11. Progress
shadcn 구조: `Root(h-2 rounded-full bg-primary/20)` > `Indicator(h-full bg-primary transition-all translateX)`
- [ ] track: `bg-primary/20` (현재 `surface:sunken` — 색상 차이)
- [ ] track: `h-2` (현재 `square:xs`)
- [ ] indicator: `translateX(-${100-value}%)` 방식 vs 우리 `width:%` 방식
- [ ] indicator: `transition-all` 추가
- [ ] `rounded-full` (현재 `shape:pill` ✅)

### B12. Skeleton
shadcn 구조: `<div data-slot="skeleton" className="animate-pulse rounded-md bg-accent">`
- [ ] `bg-accent` (현재 `surface:sunken` — 차이)
- [ ] 외부에서 width/height를 className으로 주입 (shadcn 패턴)
- [ ] 우리는 props로 관리 — 호환성 검토

### B13. Avatar
shadcn 구조: `Root(size-8 rounded-full overflow-hidden select-none)` > `Image(aspect-square size-full)` + `Fallback(flex center bg-muted text-muted-foreground)`
- [ ] `overflow-hidden` (이미지 clipping)
- [ ] `select-none`
- [ ] `data-size` attribute (sm=size-6, default=size-8, lg=size-10)
- [ ] AvatarBadge: `absolute right-0 bottom-0 ring-2 ring-background` (status dot)
- [ ] AvatarGroup: `flex -space-x-2 ring-2 ring-background` (겹침)

### B14. Checkbox
shadcn 구조: `Root(size-4 rounded-[4px] border shadow-xs)` > `Indicator(grid place-content-center)` > `CheckIcon(size-3.5)`
- [ ] checkbox 자체: `size-4 rounded-[4px]` (정사각 4px radius)
- [ ] `shadow-xs`
- [ ] `data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground`
- [ ] `data-[state=checked]:border-primary`
- [ ] indicator: `grid place-content-center`
- [ ] `aria-invalid` 스타일
- [ ] dark: `dark:bg-input/30`

### B15. RadioGroup
shadcn 구조: `Group(grid gap-3)` + `Item(size-4 rounded-full border)` > `Indicator` > `CircleIcon(size-2.5 fill-current)`
- [ ] container: `grid gap-3` (수직 정렬)
- [ ] radio dot: `size-4 rounded-full border border-input`
- [ ] `data-[state=checked]:border-primary`
- [ ] indicator: `size-2.5 fill-current` (solid circle)
- [ ] `shadow-xs`
- [ ] `aria-invalid` 스타일

### B16. Switch (SwitchGroup)
shadcn 구조: `Root(h-5 w-9 rounded-full border-2 border-transparent)` > `Thumb(size-4 rounded-full bg-background shadow-sm transition-transform data-[state=checked]:translate-x-4)`
- [ ] switch track: `h-5 w-9 rounded-full`
- [ ] track off: `bg-input`
- [ ] track on: `data-[state=checked]:bg-primary`
- [ ] thumb: `size-4 rounded-full bg-background shadow-sm`
- [ ] thumb slide: `transition-transform data-[state=checked]:translate-x-4`
- [ ] size `sm`: `h-4 w-7` + thumb `size-3`

### B17. Slider
shadcn 구조: `Root(flex w-full touch-none items-center)` > `Track(h-1.5 rounded-full bg-muted)` > `Range(bg-primary)` + `Thumb(size-4 rounded-full border border-primary bg-white shadow-sm)`
- [ ] track: `h-1.5 rounded-full bg-muted`
- [ ] range fill: `bg-primary` (absolute 안에서)
- [ ] thumb: `size-4 rounded-full border border-primary bg-white shadow-sm`
- [ ] thumb hover/focus: `ring-4 ring-ring/50`
- [ ] `touch-none select-none` (드래그 시 텍스트 선택 방지)
- [ ] vertical orientation 지원

### B18. Dialog
shadcn 구조: `Overlay(fixed inset-0 z-50 bg-black/50 animate)` + `Content(fixed center z-50 grid gap-4 rounded-lg border bg-background p-6 shadow-lg animate)` + `Header(flex flex-col gap-2)` + `Footer(flex flex-col-reverse sm:flex-row sm:justify-end gap-2)`
- [ ] overlay: `bg-black/50` + `fade-in/out` 애니메이션
- [ ] content: `fixed top-50% left-50% translate(-50%,-50%) z-50`
- [ ] content: `max-w-lg rounded-lg border shadow-lg p-6 gap-4`
- [ ] content: `zoom-in-95 / zoom-out-95 + fade` 애니메이션
- [ ] close button: `absolute top-4 right-4 opacity-70 hover:opacity-100`
- [ ] header: `flex flex-col gap-2 text-center sm:text-left`
- [ ] footer: `flex flex-col-reverse gap-2 sm:flex-row sm:justify-end`
- [ ] title: `text-lg font-semibold leading-none`
- [ ] description: `text-sm text-muted-foreground`

### B19. Popover
shadcn 구조: Radix Portal + `Content(z-50 rounded-md border bg-popover p-4 shadow-md outline-none animate)`
- [ ] `border shadow-md` (현재 `border:subtle` — ring vs solid border)
- [ ] `z-50`
- [ ] animate: `fade-in/zoom-in-95` + 방향별 `slide-in-from-*`
- [ ] close 애니메이션
- [ ] `style={}` 제거 → ax 축으로 흡수 (maxWidth, offset)

### B20. Breadcrumb
shadcn 구조: `<nav aria-label="breadcrumb">` > `<ol>` > `<li>` + `BreadcrumbSeparator` + `BreadcrumbEllipsis`
- [ ] 시맨틱 구조: `nav > ol > li` (현재 `div > span`)
- [ ] `flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground`
- [ ] separator: `ChevronRight` 아이콘 (현재 `/` 텍스트)
- [ ] 현재 페이지: `aria-current="page" aria-disabled="true" font-normal text-foreground`
- [ ] ellipsis: `MoreHorizontal` 아이콘 + `size-9 center`
- [ ] `break-words` (긴 경로 줄바꿈)

### B21. Toggle
shadcn 구조: `<button data-slot="toggle" data-variant data-size>` (cva variants)
- [ ] variant `outline`: `border shadow-xs` (off 상태에서 테두리)
- [ ] size `sm`/`lg` 프리셋
- [ ] `data-[state=on]:bg-accent data-[state=on]:text-accent-foreground`
- [ ] `hover:bg-muted hover:text-muted-foreground`
- [ ] SVG 자동 크기: `[&_svg]:size-4`
- [ ] `aria-invalid` 스타일

### B22. Table
shadcn 구조: `<div overflow-x-auto>` > `<table w-full caption-bottom text-sm>` > `thead` > `tr border-b` > `th h-10 px-2 text-left font-medium text-muted-foreground` / `td p-2 align-middle`
- [ ] wrapper: `overflow-x-auto`
- [ ] `caption-bottom text-sm`
- [ ] th: `h-10 px-2 text-left font-medium text-muted-foreground align-middle`
- [ ] td: `p-2 align-middle whitespace-nowrap`
- [ ] tr: `border-b transition-colors`
- [ ] tr hover: `hover:bg-muted/50`
- [ ] tr selected: `data-[state=selected]:bg-muted`
- [ ] 우리 Table은 div grid 구조 — 시맨틱 table 요소로 전환 검토

### B23. Divider (Separator)
shadcn 구조: `<div data-slot="separator" role="separator" className="bg-border shrink-0 h-px w-full / h-full w-px">`
- [ ] `bg-border` (현재 `border:bottom` — border vs background 방식 차이)
- [ ] `shrink-0`
- [ ] horizontal: `h-px w-full`
- [ ] vertical: `h-full w-px`
- [ ] `style={}` 제거 (`alignSelf:stretch` → ax 축)

### B24. ScrollArea
shadcn: Radix ScrollArea with custom scrollbar styling
- [ ] 커스텀 스크롤바 스타일링 (현재 없음 — OS 네이티브)
- [ ] scrollbar track/thumb 크기·색상 토큰
- [ ] `scrollbar-color`, `scrollbar-width` 또는 `::-webkit-scrollbar` 적용 검토

---

## C. 실행 순서 (의존관계 기반)

1. **A1~A7** — ax.css 공통 규칙 먼저 (모든 컴포넌트에 영향)
2. **B01 Button** — 가장 기본, 다른 컴포넌트가 참조
3. **B03 Input + B04 Textarea** — form control 기본
4. **B05 Card + B06 Alert** — 정적 표시 컴포넌트
5. **B02 Badge + B12 Skeleton + B11 Progress + B13 Avatar** — 단순 표시
6. **B14 Checkbox + B15 RadioGroup + B16 Switch + B17 Slider** — form 인터랙티브
7. **B08 Select + B09 Tabs + B07 Accordion + B21 Toggle** — 복합 인터랙티브
8. **B18 Dialog + B19 Popover + B10 Tooltip** — overlay
9. **B20 Breadcrumb + B22 Table + B23 Divider + B24 ScrollArea** — 기타

## 다음 행동

- A 그룹(ax.css 공통)부터 시작 — 이것만으로 전체 룩이 크게 개선됨
- 각 B 항목은 1 커밋 단위로 진행
- 완료 후 demo 스크린샷으로 before/after 검증
