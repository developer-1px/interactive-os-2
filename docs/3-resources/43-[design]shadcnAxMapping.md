# shadcn/ui → ax() 전수 매핑 테이블

> **목적**: shadcn/ui의 tailwind 유틸리티를 ax() 축으로 1:1 번역하기 위한 참조 테이블.
> **원칙**: "대충 비슷한 거" 선택 금지. 매핑이 없으면 ❌ GAP으로 명시.
> **출처**: `/tmp/shadcn-reference/src/components/ui/` (shadcn@latest, 2026-04)

---

## 1. 원자 매핑: Tailwind → ax() 축

### 1.1 레이아웃 / 구조

| Tailwind | 실제 CSS | ax() | 비고 |
|----------|----------|------|------|
| `flex` | display:flex | `layout: 'row'` 또는 목적별 layout | ax는 flex를 layout에 번들 |
| `flex-col` | flex-direction:column | `layout: 'stack'` | |
| `flex-row` | flex-direction:row | `layout: 'row'` 또는 `layout: 'bar'` | bar=row+align:center |
| `inline-flex` | display:inline-flex | `layout: 'wrap'` | wrap=inline-flex+wrap |
| `items-center` | align-items:center | `layout: 'bar'` 또는 `layout: 'center'` | bar=row+center, center=둘 다 center |
| `justify-center` | justify-content:center | `layout: 'center'` | |
| `justify-between` | justify-content:space-between | `layout: 'spread'` | |
| `flex-1` | flex:1 1 0% | `flex: '1'` | |
| `flex-wrap` | flex-wrap:wrap | `layout: 'wrap'` | |
| `shrink-0` | flex-shrink:0 | `flex: 'none'` | |
| `grid` | display:grid | `layout: 'grid-N'` | N=열 수 |
| `grid-cols-[auto_1fr]` | grid-template-columns | ❌ GAP: module.css | ax에 임의 grid template 없음 |
| `relative` | position:relative | `placement: 'relative'` | |
| `absolute` | position:absolute | `placement: 'above'/'below'/... 목적별` | |
| `fixed` | position:fixed | `placement: 'viewport'/'float-*'` | |
| `sticky` | position:sticky | `placement: 'sticky'` | |
| `inset-0` | inset:0 | `placement: 'viewport'` (fixed) 또는 `placement: 'center'` (absolute) | |
| `top-1/2 left-1/2 -translate-x/y-1/2` | center transform | `placement: 'center'` | |
| `overflow-hidden` | overflow:hidden | `scroll: 'hidden'` | |
| `overflow-x-auto` | overflow-x:auto | `scroll: 'x'` 또는 `layout: 'scroll-x'` | |
| `overflow-y-auto` | overflow-y:auto | `scroll: 'y'` 또는 `layout: 'scroll'` | |
| `self-start` | align-self:flex-start | `layout: 'self-start'` | |
| `self-end` | align-self:flex-end | `layout: 'self-end'` | |
| `isolate` | isolation:isolate | ❌ GAP: ax에 없음 | z-index 스택 컨텍스트 |
| `z-50` | z-index:50 | placement에 내장 (overlay/anchor) | 직접 지정 불가 |

### 1.2 간격

| Tailwind | 실측 px (기본 rem=16) | ax() | 비고 |
|----------|----------------------|------|------|
| `gap-0.5` | 2px | ❌ GAP: ax gap 최소=xs | xs보다 작은 gap |
| `gap-1` | 4px | `gap: 'xs'` | |
| `gap-1.5` | 6px | `gap: 'xs'` ~ `gap: 'sm'` | ⚠ 중간값 |
| `gap-2` | 8px | `gap: 'sm'` | |
| `gap-2.5` | 10px | `gap: 'sm'` ~ `gap: 'md'` | ⚠ 중간값 |
| `gap-3` | 12px | `gap: 'md'` | |
| `gap-4` | 16px | `gap: 'lg'` | |
| `p-1` | 4px | `padding: 'xs'` | |
| `p-2` | 8px | `padding: 'sm'` | |
| `p-2.5` | 10px | `padding: 'sm'` ~ `padding: 'md'` | ⚠ 중간값 |
| `p-4` | 16px | `padding: 'md'` | |
| `px-2.5 py-2` | 10px / 8px | `content: 'text'` + `role: 'control'` | text=2:1 inline:block |
| `px-3 py-1.5` | 12px / 6px | `content: 'text'` | 약 2:1 |
| `px-2 py-0.5` | 8px / 2px | `role: 'badge'` | badge 프리셋 |
| `-space-x-2` | margin-left:-8px | ❌ GAP: 음수 간격 없음 | AvatarGroup overlap |

### 1.3 크기

| Tailwind | 실측 | ax() | 비고 |
|----------|------|------|------|
| `h-1` | 4px | `square: 'xs'` (but height only) | ⚠ Progress track h |
| `h-5` | 20px | `role: 'badge'` | badge h=20px |
| `h-6` | 24px | button size xs | `role: 'control'` 변주? |
| `h-7` | 28px | button size sm = **28px 법칙** | `role: 'control'` 기본 |
| `h-8` | 32px | button size default | `role: 'control'` |
| `h-9` | 36px | button size lg | ❌ GAP: role:control에 size 변주 없음 |
| `size-4` | 16px | `square: 'sm'` 또는 `icon: 'sm'` | checkbox/radio 크기 |
| `size-6` | 24px | avatar sm | `square: 'sm'` |
| `size-8` | 32px | avatar default / icon button | `square: 'md'` |
| `size-10` | 40px | avatar lg | `square: 'lg'` |
| `w-full` | width:100% | `width: 'full'` | |
| `w-fit` | width:fit-content | `width: 'fit'` | |
| `w-72` | 288px | `width: 'md'` ? | ⚠ popover 폭. ax md 실측 확인 필요 |
| `max-w-xs` | 320px | ❌ GAP: max-width 없음 | |
| `max-w-sm` | 384px | ❌ GAP | dialog/sheet |
| `min-w-0` | min-width:0 | layout: 'fill'에 내장 | |
| `min-w-36` | 144px | ❌ GAP: min-width 없음 | select dropdown |

### 1.4 타이포

| Tailwind | 실측 | ax() | 비고 |
|----------|------|------|------|
| `text-xs` | 12px | `textStyle: 'caption'` | |
| `text-sm` | 14px | `textStyle: 'body'` 또는 `'label'` | body=13px(Linear), sm=14px(shadcn) ⚠ |
| `text-base` | 16px | `textStyle: 'section'` | |
| `text-lg` | 18px | `textStyle: 'page'` ? | ⚠ 확인 필요 |
| `font-medium` | 500 | `weight: 'medium'` | |
| `font-semibold` | 600 | `weight: 'semi'` | |
| `font-bold` | 700 | `weight: 'bold'` | |
| `font-heading` | font-family var | ❌ ax textStyle에 heading family 없음 | shadcn heading 전용 폰트 |
| `leading-none` | line-height:1 | ❌ GAP: textStyle에 번들 | line-height 오버라이드 |
| `leading-snug` | line-height:1.375 | ❌ GAP | |
| `text-balance` | text-wrap:balance | ❌ GAP | |
| `text-pretty` | text-wrap:pretty | ❌ GAP | |
| `whitespace-nowrap` | white-space:nowrap | `clamp: '1'` ? | ⚠ clamp은 말줄임 포함 |
| `tabular-nums` | font-variant-numeric | ❌ GAP | 숫자 정렬 |
| `select-none` | user-select:none | ❌ GAP: interactive에 내장? | |

### 1.5 색상 / 시각

| Tailwind (shadcn 시맨틱) | 역할 | ax() | 비고 |
|--------------------------|------|------|------|
| `bg-background` | 앱 기본 배경 | `surface: 'base'` (선언 불필요) | |
| `bg-card` | 카드 배경 | `surface: 'raised'` | |
| `bg-popover` | 팝오버/다이얼로그 배경 | `surface: 'overlay'` | |
| `bg-muted` | 비활성/dim 배경 | `surface: 'sunken'` | tab list, skeleton |
| `bg-muted/50` | 반투명 muted | ❌ GAP: opacity 조합 없음 | table footer, card footer |
| `bg-primary` | 주 액션 색상 | `surface: 'action'` + `tone: 'accent'` | |
| `bg-secondary` | 보조 액션 | `surface: 'action'` + `tone: 'neutral'` ? | ⚠ |
| `bg-destructive/10` | 위험 배경 (연함) | `tone: 'danger-dim'` | |
| `bg-input` | 입력 배경 | `surface: 'input'` | |
| `bg-input/30` | dark 입력 배경 | `surface: 'input'` (dark 자동) | |
| `bg-transparent` | 투명 | `surface: 'ghost'` | |
| `bg-accent` | 호버/포커스 하이라이트 | interactive 축에서 자동 | |
| `bg-border` | 구분선 색상 bg | ❌ GAP: border를 bg로 쓰는 패턴 | separator, scrollbar thumb |
| `bg-foreground` | 전경색을 배경으로 | ❌ GAP: 반전 패턴 없음 | tooltip bg |
| `bg-black/10` | 반투명 검정 | `surface: 'trap'` | dialog overlay |
| `text-foreground` | 기본 전경색 | `text: 'primary'` | |
| `text-muted-foreground` | 보조 전경색 | `text: 'muted'` | |
| `text-primary-foreground` | accent 위의 텍스트 | `text: 'bright'` | |
| `text-card-foreground` | 카드 전경 | `text: 'primary'` | |
| `text-popover-foreground` | 팝오버 전경 | `text: 'primary'` | |
| `text-destructive` | 위험 텍스트 | `tone: 'danger'` + `text: 'primary'`? | ⚠ tone이 text색 제어하는지 |
| `text-current` | currentColor 상속 | ❌ GAP: 부모색 상속 | icon 색상 |
| `text-background` | 배경색을 텍스트로 | ❌ GAP: 반전 패턴 | tooltip text |

### 1.6 테두리

| Tailwind | ax() | 비고 |
|----------|------|------|
| `border` | `border: 'default'` | |
| `border-input` | `border: 'default'` (input 문맥) | surface: 'input'에 내장 |
| `border-border` | `border: 'subtle'` | |
| `border-transparent` | ❌ GAP: 투명 border | 버튼 기본 — border 공간 확보용 |
| `border-ring` | ❌ GAP: focus ring border | focus-visible 상태 |
| `border-destructive` | `border: 'default'` + `tone: 'danger'` | ⚠ 조합 동작 확인 필요 |
| `border-t` / `border-b` / `border-l` / `border-r` | `border: 'top'/'bottom'/'start'/'end'` | |
| `ring-1` | ❌ GAP: box-shadow ring | card 미세 테두리 (ring-foreground/10) |
| `ring-3` / `ring-[3px]` | ❌ GAP: focus ring | focus-visible 상태 |
| `ring-ring/50` | ❌ GAP: focus ring 색상+투명도 | |

### 1.7 모서리

| Tailwind | 실측 | ax() | 비고 |
|----------|------|------|------|
| `rounded-sm` | 2px? | `shape: '2xs'` ? | ⚠ 실측 확인 |
| `rounded-[4px]` | 4px | `shape: 'xs'` ? | checkbox |
| `rounded-md` | 6px | `shape: 'sm'` ? | ⚠ |
| `rounded-lg` | 8px | `shape: 'md'` | alert, button, input, select |
| `rounded-xl` | 12px | `shape: 'lg'` | card, dialog |
| `rounded-full` | 9999px | `shape: 'pill'` | avatar, progress track, switch |
| `rounded-t-xl` | top only 12px | ❌ GAP: 부분 radius 없음 | card 상단 |
| `rounded-b-xl` | bottom only 12px | ❌ GAP | card 하단 |

### 1.8 그림자 / 효과

| Tailwind | ax() | 비고 |
|----------|------|------|
| `shadow-sm` | 미세 그림자 | `surface: 'raised'`에 내장? | |
| `shadow-md` | 중간 그림자 | `surface: 'overlay'`에 내장? | popover/select |
| `shadow-lg` | 큰 그림자 | `surface: 'overlay'`에 내장? | sheet |
| `ring-1 ring-foreground/10` | 미세 outline | ❌ GAP: surface에 ring 없음 | card, popover 경계 |

### 1.9 상태 / 인터랙션

| Tailwind | ax() | 비고 |
|----------|------|------|
| `hover:bg-muted` | hover 배경 | `interactive: 'item'` 또는 `'button'` | |
| `hover:text-foreground` | hover 텍스트 | interactive에 내장 | |
| `focus-visible:ring-3` | focus ring | ❌ GAP: ax focus는 outline 기반? | |
| `focus-visible:border-ring` | focus border | `state: 'focused'` ? | ⚠ |
| `disabled:opacity-50` | disabled 시각 | interactive에 내장 | |
| `disabled:pointer-events-none` | disabled 동작 | interactive에 내장 | |
| `data-checked:bg-primary` | checked 배경 | `interactive: 'check'` | |
| `data-active:bg-background` | active tab 배경 | `interactive: 'tab'` | |
| `data-[state=selected]:bg-muted` | selected row | `interactive: 'cell'` 또는 `state: 'selected'` | |
| `aria-pressed:bg-muted` | toggle pressed | `interactive: 'button'` ? | ⚠ |
| `aria-expanded:bg-muted` | expanded 배경 | ❌ GAP: expanded 상태 시각 없음 | |
| `active:translate-y-px` | 클릭 눌림 효과 | ❌ GAP | 버튼 미세 이동 |
| `transition-all` | 전체 전환 | interactive에 내장 | |

### 1.10 애니메이션

| Tailwind | ax() | 비고 |
|----------|------|------|
| `animate-pulse` | 맥박 | `motion: 'pulse'` | skeleton |
| `animate-in` / `animate-out` | 진입/퇴장 | `motion: 'fade-in'/'scale-in'` | |
| `fade-in-0` | opacity 0→1 | `motion: 'fade-in'` | |
| `zoom-in-95` | scale 0.95→1 | `motion: 'scale-in'` | |
| `slide-in-from-top-2` | translateY -8px→0 | `motion: 'slide-up'` ? | ⚠ 방향 매핑 |
| `duration-100` | 100ms | ❌ GAP: duration 제어 없음 | |
| `ease-in-out` | easing | ❌ GAP: easing 제어 없음 | |
| `backdrop-blur-xs` | backdrop-filter blur | ❌ GAP | dialog overlay |

---

## 2. 컴포넌트별 매핑: shadcn → ax() 레시피

### Alert

| 파트 | shadcn tailwind | ax() 번역 |
|------|----------------|-----------|
| Root | `grid w-full gap-0.5 rounded-lg border px-2.5 py-2 text-sm` | `ax({ layout: 'row', width: 'full', gap: 'xs', shape: 'md', border: 'default', padding: 'md', textStyle: 'body' })` |
| Root (default) | `bg-card text-card-foreground` | `ax({ surface: 'raised', text: 'primary' })` |
| Root (destructive) | `bg-card text-destructive` | `ax({ surface: 'raised', tone: 'danger' })` |
| Title | `font-heading font-medium` | `ax({ textStyle: 'label', weight: 'medium' })` |
| Description | `text-sm text-muted-foreground` | `ax({ textStyle: 'body', text: 'muted' })` |
| Icon slot | `*:[svg]:size-4 *:[svg]:text-current` | icon 컴포넌트 `ax({ icon: 'sm' })` |

**AS-IS → TO-BE:**
```tsx
// AS-IS (현재)
ax({ recipe: 'container-sm', surface: 'display', tone: resolvedTone, layout: 'row', gap: 'sm', padding: 'md', shape: 'md' })

// TO-BE (shadcn 매핑)
ax({ surface: 'raised', border: 'default', layout: 'row', gap: 'xs', padding: 'md', shape: 'md', width: 'full' })
// + tone: 'danger' for destructive variant
```

**차이점:**
1. `surface: 'display'` → `surface: 'raised'` (카드 느낌)
2. `recipe: 'container-sm'` 제거 (role 축으로)
3. `border: 'default'` 추가 (shadcn Alert의 핵심 — 테두리가 구조를 만듦)
4. `gap: 'sm'` → `gap: 'xs'` (shadcn gap-0.5 = 2px, 매우 타이트)

### Avatar

| 파트 | shadcn tailwind | ax() 번역 |
|------|----------------|-----------|
| Root | `size-8 rounded-full` + `after:border after:border-border` | `ax({ square: 'md', shape: 'pill' })` + ❌ GAP: after ring |
| Root sm | `size-6` | `ax({ square: 'sm', shape: 'pill' })` |
| Root lg | `size-10` | `ax({ square: 'lg', shape: 'pill' })` |
| Fallback | `bg-muted text-sm text-muted-foreground` | `ax({ surface: 'sunken', textStyle: 'body', text: 'muted', layout: 'center' })` |
| Fallback sm | + `text-xs` | `ax({ ..., textStyle: 'caption' })` |
| Image | `rounded-full object-cover aspect-square size-full` | native img + `ax({ shape: 'pill' })` |

**AS-IS → TO-BE:**
```tsx
// AS-IS
ax({ square: sizeMap[size], shape: 'pill', surface: 'action', tone: 'accent-dim', layout: 'center', textStyle: ..., text: 'bright', weight: 'semi' })

// TO-BE
ax({ square: sizeMap[size], shape: 'pill', surface: 'sunken', layout: 'center', textStyle: size === 'lg' ? 'label' : 'caption', text: 'muted' })
```

**차이점:**
1. `surface: 'action'` + `tone: 'accent-dim'` → `surface: 'sunken'` (shadcn은 **무채색 bg-muted**)
2. `text: 'bright'` → `text: 'muted'` (이니셜이 튀지 않게)
3. `weight: 'semi'` 제거 (shadcn은 font-medium이 아닌 기본)

### Badge

| 파트 | shadcn tailwind | ax() 번역 |
|------|----------------|-----------|
| Root | `h-5 px-2 py-0.5 text-xs font-medium rounded-4xl border-transparent gap-1` | `ax({ role: 'badge', textStyle: 'caption', weight: 'medium', shape: 'pill' })` |
| default | `bg-primary text-primary-foreground` | `ax({ surface: 'action', tone: 'accent', text: 'bright' })` |
| secondary | `bg-secondary text-secondary-foreground` | `ax({ surface: 'action', tone: 'neutral' })` |
| destructive | `bg-destructive/10 text-destructive` | `ax({ tone: 'danger-dim' })` |
| outline | `border-border text-foreground` | `ax({ border: 'default', text: 'primary' })` |

### Button

| 파트 | shadcn tailwind | ax() 번역 |
|------|----------------|-----------|
| Base | `inline-flex items-center justify-center rounded-lg text-sm font-medium` | `ax({ role: 'control', shape: 'md', textStyle: 'label', interactive: 'button' })` |
| default (h-8) | `h-8 gap-1.5 px-2.5` | `ax({ role: 'control', content: 'text' })` |
| sm (h-7) | `h-7 gap-1 px-2.5 text-[0.8rem]` | `ax({ role: 'control', content: 'text' })` ← 28px 법칙 |
| xs (h-6) | `h-6 gap-1 px-2` | ❌ GAP: 24px 컨트롤 없음 |
| lg (h-9) | `h-9 gap-1.5 px-2.5` | ❌ GAP: 36px 컨트롤 없음 |
| icon (size-8) | `size-8` | `ax({ role: 'control', content: 'icon' })` |
| default variant | `bg-primary text-primary-foreground` | `ax({ surface: 'action', tone: 'accent', text: 'bright' })` |
| outline variant | `border-border bg-background hover:bg-muted` | `ax({ surface: 'input', interactive: 'button' })` |
| ghost variant | `hover:bg-muted hover:text-foreground` | `ax({ surface: 'ghost', interactive: 'button' })` |
| destructive | `bg-destructive/10 text-destructive` | `ax({ surface: 'action', tone: 'danger-dim', interactive: 'button' })` |
| active 효과 | `active:translate-y-px` | ❌ GAP: 클릭 눌림 없음 |

### Card

| 파트 | shadcn tailwind | ax() 번역 |
|------|----------------|-----------|
| Root | `flex flex-col gap-4 rounded-xl bg-card py-4 text-sm ring-1 ring-foreground/10` | `ax({ layout: 'stack', gap: 'lg', shape: 'lg', surface: 'raised', textStyle: 'body' })` + ❌ GAP: ring |
| Header | `grid gap-1 px-4` | `ax({ layout: 'stack', gap: 'xs', padding: 'md' })` ← padding은 x만 |
| Title | `text-base font-heading font-medium leading-snug` | `ax({ textStyle: 'section', weight: 'medium' })` |
| Description | `text-sm text-muted-foreground` | `ax({ textStyle: 'body', text: 'muted' })` |
| Content | `px-4` | `ax({ padding: 'md' })` ← x만 |
| Footer | `flex items-center border-t bg-muted/50 p-4` | `ax({ layout: 'bar', border: 'top', surface: 'sunken', padding: 'md' })` ⚠ muted/50 |

**핵심 발견:** shadcn Card는 `ring-1 ring-foreground/10` (미세한 box-shadow ring)으로 경계를 만든다. `border`가 아님. ax()에 ring 개념이 없다 → **GAP**.

### Progress

| 파트 | shadcn tailwind | ax() 번역 |
|------|----------------|-----------|
| Root | `flex flex-wrap gap-3` | `ax({ layout: 'wrap', gap: 'md' })` |
| Track | `h-1 w-full rounded-full bg-muted overflow-x-hidden` | `ax({ width: 'full', shape: 'pill', surface: 'sunken', scroll: 'hidden' })` + ❌ GAP: h-1 (4px height) |
| Indicator | `h-full bg-primary` | `ax({ surface: 'action', tone: 'accent' })` |
| Label | `text-sm font-medium` | `ax({ textStyle: 'label' })` |
| Value | `text-sm text-muted-foreground tabular-nums` | `ax({ textStyle: 'body', text: 'muted' })` + ❌ GAP: tabular-nums |

**AS-IS → TO-BE:**
```tsx
// AS-IS
// Track:
ax({ surface: 'sunken', shape: 'pill', width: 'full', square: 'xs', scroll: 'hidden' })
// Indicator:
ax({ surface: 'action', tone, shape: 'pill', square: 'xs' })

// TO-BE
// Track: square: 'xs'는 정사각인데, track은 가로로 길다. height만 4px이어야 함.
// → module.css에 height: 4px (또는 h-1) 필요 = last-mile
// Indicator: shape: 'pill' 불필요 (부모 overflow:hidden이 clip)
ax({ surface: 'action', tone: 'accent' })
```

### Input

| 파트 | shadcn tailwind | ax() 번역 |
|------|----------------|-----------|
| Root | `h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base` | `ax({ role: 'control', surface: 'input', width: 'full', shape: 'md', interactive: 'input' })` |
| placeholder | `placeholder:text-muted-foreground` | interactive: 'input'에 내장 |
| focus | `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` | `state: 'focused'` ? |
| disabled | `disabled:opacity-50 disabled:pointer-events-none` | interactive에 내장 |
| invalid | `aria-invalid:border-destructive aria-invalid:ring-3` | ❌ GAP: invalid 상태 |

### Tabs

| 파트 | shadcn tailwind | ax() 번역 |
|------|----------------|-----------|
| Root | `flex gap-2 flex-col` (horizontal) | `ax({ layout: 'stack', gap: 'sm' })` |
| List (default) | `inline-flex items-center h-8 p-[3px] rounded-lg bg-muted text-muted-foreground` | `ax({ layout: 'bar', surface: 'sunken', shape: 'md', text: 'muted' })` + ❌ GAP: 3px padding |
| List (line) | `gap-1 bg-transparent` | `ax({ layout: 'bar', gap: 'xs' })` |
| Trigger | `h-full flex-1 items-center justify-center rounded-md px-1.5 py-0.5 text-sm font-medium` | `ax({ flex: '1', layout: 'center', shape: 'sm', content: 'text', textStyle: 'label', interactive: 'tab' })` |
| Trigger active | `data-active:bg-background data-active:text-foreground data-active:shadow-sm` | interactive: 'tab'에서 active 스타일 |
| Content | `flex-1 text-sm` | `ax({ flex: '1', textStyle: 'body' })` |

### Dialog

| 파트 | shadcn tailwind | ax() 번역 |
|------|----------------|-----------|
| Overlay | `fixed inset-0 z-50 bg-black/10 backdrop-blur-xs` | `ax({ placement: 'viewport', surface: 'trap' })` + ❌ GAP: backdrop-blur |
| Content | `fixed top-1/2 left-1/2 -translate-x/y-1/2 z-50 w-full max-w-sm gap-4 rounded-xl bg-popover p-4 text-sm ring-1 ring-foreground/10` | `ax({ placement: 'center', surface: 'overlay', padding: 'md', gap: 'lg', shape: 'lg', textStyle: 'body' })` |
| Header | `flex flex-col gap-2` | `ax({ layout: 'stack', gap: 'sm' })` |
| Title | `text-base font-heading font-medium leading-none` | `ax({ textStyle: 'section', weight: 'medium' })` |
| Description | `text-sm text-muted-foreground` | `ax({ textStyle: 'body', text: 'muted' })` |
| Footer | `-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4` | ❌ GAP: 음수 마진, flex-col-reverse, 부분 radius |
| Close btn | `absolute top-2 right-2` + ghost button | `ax({ placement: 'top-end' })` + ghost button |

### Skeleton

| 파트 | shadcn tailwind | ax() 번역 |
|------|----------------|-----------|
| Root | `animate-pulse rounded-md bg-muted` | `ax({ motion: 'pulse', shape: 'sm', surface: 'sunken' })` ← 거의 완벽 매핑 |

### Separator

| 파트 | shadcn tailwind | ax() 번역 |
|------|----------------|-----------|
| horizontal | `h-px w-full bg-border` | `ax({ border: 'bottom' })` (div) 또는 ❌ GAP: 1px height bg |
| vertical | `w-px self-stretch bg-border` | `ax({ border: 'start' })` 또는 ❌ GAP |

### Checkbox

| 파트 | shadcn tailwind | ax() 번역 |
|------|----------------|-----------|
| Root | `size-4 rounded-[4px] border border-input` | `ax({ square: 'sm', shape: 'xs', border: 'default', interactive: 'check' })` |
| checked | `data-checked:bg-primary data-checked:border-primary data-checked:text-primary-foreground` | interactive: 'check'에서 자동 |
| Indicator icon | `[&>svg]:size-3.5` | `ax({ icon: 'sm' })` |

### Switch

| 파트 | shadcn tailwind | ax() 번역 |
|------|----------------|-----------|
| Root | `h-[18.4px] w-[32px] rounded-full` | ❌ GAP: 비표준 크기, module.css |
| unchecked | `data-unchecked:bg-input` | `surface: 'input'` 변환 |
| checked | `data-checked:bg-primary` | `tone: 'accent'` |
| Thumb | `size-4 rounded-full bg-background` | `ax({ square: 'sm', shape: 'pill', surface: 'raised' })` |

### Select

| 파트 | shadcn tailwind | ax() 번역 |
|------|----------------|-----------|
| Trigger | `h-8 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm` | `ax({ role: 'control', surface: 'input', shape: 'md', interactive: 'input' })` |
| Content (popup) | `rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10` | `ax({ surface: 'overlay', shape: 'md' })` + ❌ GAP: ring |
| Item | `rounded-md py-1 pr-8 pl-1.5 text-sm` | `ax({ shape: 'sm', textStyle: 'body', interactive: 'item' })` |
| Item focus | `focus:bg-accent focus:text-accent-foreground` | interactive: 'item'에서 자동 |
| Label | `px-1.5 py-1 text-xs text-muted-foreground` | `ax({ textStyle: 'caption', text: 'muted', padding: 'xs' })` |

### Table

| 파트 | shadcn tailwind | ax() 번역 |
|------|----------------|-----------|
| Container | `w-full overflow-x-auto` | `ax({ width: 'full', scroll: 'x' })` |
| Table | `w-full caption-bottom text-sm` | `ax({ width: 'full', textStyle: 'body' })` |
| Head (th) | `h-10 px-2 text-left font-medium text-foreground` | `ax({ textStyle: 'label', text: 'primary', interactive: 'cell' })` |
| Row (tr) | `border-b hover:bg-muted/50 data-[state=selected]:bg-muted` | `ax({ border: 'bottom', interactive: 'item' })` |
| Cell (td) | `p-2 align-middle whitespace-nowrap` | `ax({ padding: 'sm', interactive: 'cell' })` |
| Footer | `border-t bg-muted/50 font-medium` | `ax({ border: 'top', surface: 'sunken', weight: 'medium' })` |

### Tooltip

| 파트 | shadcn tailwind | ax() 번역 |
|------|----------------|-----------|
| Content | `rounded-md bg-foreground px-3 py-1.5 text-xs text-background` | ❌ GAP: **반전 색상** (bg=foreground, text=background) |

---

## 3. GAP 요약: ax()에 없는 것

| # | GAP | shadcn 사용처 | 영향도 | 해결 방향 |
|---|-----|--------------|--------|-----------|
| G1 | **ring (box-shadow outline)** | Card, Dialog, Popover, Select popup | 🔴 높음 | surface에 ring 옵션 추가 또는 새 축 |
| G2 | **반전 색상** (bg-foreground + text-background) | Tooltip | 🟡 중간 | surface: 'inverted' 신규? |
| G3 | **focus ring** (ring-3 ring-ring/50) | Button, Input, Checkbox, Select 전부 | 🔴 높음 | interactive/state에 ring 기반 focus 추가 |
| G4 | **height 단독 제어** (h-1, h-[18.4px]) | Progress track, Switch | 🟡 중간 | module.css last-mile |
| G5 | **투명 border** (border-transparent) | Button 기본 — border 공간 확보 | 🟡 중간 | interactive: 'button'에 내장 |
| G6 | **음수 간격/마진** (-space-x-2, -mx-4) | AvatarGroup, Dialog footer | 🟡 중간 | module.css |
| G7 | **부분 radius** (rounded-t-xl, rounded-b-xl) | Card top/bottom, Dialog footer | 🟡 중간 | module.css |
| G8 | **bg-muted/50** (반투명 muted) | Card footer, Table footer, Table row hover | 🟡 중간 | tone에 opacity 조합? |
| G9 | **tabular-nums** | Progress value | 🟢 낮음 | textStyle에 variant? 또는 module.css |
| G10 | **backdrop-blur** | Dialog overlay | 🟢 낮음 | surface: 'trap'에 내장 가능 |
| G11 | **text-wrap (balance/pretty)** | Alert description | 🟢 낮음 | module.css |
| G12 | **active:translate-y-px** | Button 클릭 효과 | 🟢 낮음 | interactive: 'button'에 내장 가능 |
| G13 | **aria-expanded 시각 상태** | Button, Select trigger | 🟡 중간 | interactive에 expanded 추가 |
| G14 | **invalid 상태** (aria-invalid:border-destructive) | Input, Checkbox, Select | 🟡 중간 | interactive에 invalid 추가 |
| G15 | **min-width/max-width** 직접 제어 | Select dropdown, Dialog | 🟡 중간 | width 축 확장 |
| G16 | **duration/easing** 제어 | 다수 | 🟢 낮음 | motion 축 확장? |
| G17 | **font-heading** (heading 전용 font-family) | Card title, Dialog title, Tab trigger | 🟡 중간 | textStyle에 heading family 추가 |
| G18 | **padding x/y 분리** (px-4 vs p-4) | Card (px만), Dialog footer | 🟡 중간 | padding: 'md-x'? |
| G19 | **grid-cols arbitrary** (auto_1fr 등) | Alert icon+content | 🟡 중간 | module.css |
| G20 | **3px padding** (p-[3px]) | Tabs list 내부 | 🟢 낮음 | module.css |

---

## 4. 핵심 인사이트

### shadcn의 시각적 품질을 만드는 5가지

1. **ring-1 ring-foreground/10** — 거의 모든 카드/팝오버에 미세한 ring. border보다 부드럽고 shadow보다 구조적. **ax()에 없음 (G1).**
2. **bg-muted** — sunken 역할이지만 매우 연한 회색. avatar fallback, tabs list, skeleton 전부 이것. ax `surface: 'sunken'`이 이 밝기인지 확인 필요.
3. **rounded-lg (8px)** — 기본 radius. alert, button, input, select 전부 동일. **일관성**.
4. **h-8 (32px) 기본 컨트롤 높이** — 28px 법칙과 4px 차이. sm이 28px(h-7).
5. **text-sm (14px) 기본** — Linear 실측 13px vs shadcn 14px. 1px 차이가 느낌을 바꿈.

### ax()와 shadcn의 근본 차이

| | shadcn | ax() |
|---|--------|------|
| 경계 표현 | ring (box-shadow) 중심 | border 중심 |
| focus 표현 | ring-3 + border 변경 | outline? state? |
| 컨트롤 높이 | 32px 기본, 28/24/36 변주 | 28px 법칙 단일 |
| 기본 font-size | 14px (text-sm) | 13px (body) |
| 불투명도 | 직접 제어 (/10, /50, /80) | tone-dim으로 근사 |
