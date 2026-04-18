---
id: 0-inbox/role-control-task
type: plan
slug: roleControl
title: 'role: ''control'' 축 도입 — size: ''md'' 단일 크기'
tags: [untagged]
created: 2026-04-13
updated: 2026-04-13
legacy:
  status: inbox
  kind: plan
  topics: [0-inbox]
  relates: []
  supersedes: []
---
# role: 'control' 축 도입 — size: 'md' 단일 크기

## 배경

컨트롤 크기 체계를 통일한다. 현재 recipe + controlSize + padding + gap + shape + layout + content + clamp + interactive를 수동 조합하는 구조에서, `role: 'control'` 하나로 파생시키는 구조로 전환.

- size: 'md' **1개만** 우선 구현. 다른 크기는 후속.
- 기존 축(recipe, controlSize, padding, gap, shape)은 아직 삭제하지 않는다. 공존.

## role: 'control' + size: 'md' 파생 공식

```
기본 (텍스트 버튼):
  min-height: 36px
  min-width: 36px
  font-size: 14px
  font-weight: 500
  padding-inline: 16px (2:1)
  padding-block: 8px
  gap: 8px
  radius: sm
  layout: bar (flex row + align:center)
  clamp: 1줄
  cursor: pointer
  user-select: none
  interactive: hover + active

content: 'icon' 일 때:
  padding: 0
  layout: center
  (나머지 동일)
```

## 소유권 정리

| 소유자 | 범위 |
|--------|------|
| **role** | 크기(height/width/padding/gap/radius) + 구조(layout/clamp) + interactive 여부(hover/active/cursor/user-select) |
| **surface** | 색칠(background/border/shadow) + 상태 색상(hover 색, active 색, disabled 색) |
| **tone** | 의미 색상 주입 |

## 구현 태스크

### T1. ax.ts — role + size 타입 추가

- `Role` 타입 추가: `'control'` (후속: item, badge, card, container)
- `Size` 타입 추가: `'md'` (후속: xs, sm, lg)
- AxesBase에 `role?: Role`, `size?: Size` 필드 추가
- prefixes에 `role: 'rl'`, `size: 'sz'` 추가 (size는 기존 sz와 충돌 — 기존 size 축 rename 필요 확인)

**주의**: 기존 `size` 축(정사각 크기)이 `sz` prefix를 쓰고 있음. role의 size와 이름 충돌. 기존 size → `square`로 rename하거나, role의 크기를 다른 이름으로.

### T2. ax.css — .rl-control 클래스 작성

```css
@layer recipe {
.rl-control {
  min-height: 36px;
  min-width: 36px;
  font-size: 14px;
  font-weight: 500;
  padding-inline: 16px;
  padding-block: 8px;
  gap: 8px;
  border-radius: var(--shape-sm-radius);
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  cursor: pointer;
  user-select: none;
  -webkit-overflow-scrolling: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 아이콘 전용 — content:'icon'과 조합 시 */
.rl-control.ct-icon {
  padding: 0;
  justify-content: center;
}
}
```

### T3. ax.css — interactive 통합

role: 'control'이 interactive: 'button' 역할을 흡수.
`.rl-control`에 hover/active 상태 시각을 포함:

```css
@layer state {
.rl-control:hover { background: var(--_bg-hover, var(--bg-hover)); }
.rl-control:active { background: var(--_bg-active, var(--bg-active)); }
.rl-control:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
.rl-control[aria-disabled="true"],
.rl-control:disabled { opacity: 0.4; pointer-events: none; cursor: default; }
}
```

**질문**: 이러면 surface: 'action'의 hover/active와 중복. role이 interactive를 소유하므로 surface: 'action'에서 hover/active/cursor/user-select를 제거해야 하나? → 아니다. 점진적 전환이므로 당분간 공존. role: 'control'을 쓰는 곳은 surface: 'action'의 hover를 자연히 override.

### T4. Button.tsx 마이그레이션

현재:
```tsx
const axes = { ...variantAxes[variant], recipe: sizeRecipe[size], padding: sizePadding[size], gap: sizeGap[size], shape: 'xs', layout: 'bar', content: 'text', clamp: '1' } as Axes
```

목표 (size: 'default' = md만 우선):
```tsx
const axes = { ...variantAxes[variant], role: 'control' } as Axes
```

- sizeRecipe, sizePadding, sizeGap 매핑 제거
- size prop은 유지하되, 'default'만 role: 'control'로 전환. sm/lg는 기존 recipe 유지 (후속)

### T5. 아이콘 버튼 마이그레이션 (ui/ 내부 인라인 버튼들)

모두 `ax({ role: 'control', surface: 'ghost', content: 'icon' })` 패턴으로 통일.

| 파일 | 현재 | 목표 |
|------|------|------|
| CopyButton.tsx:19 | `{ placement: 'top-end', surface: 'ghost', interactive: 'button', text: 'muted', shape: 'md', padding: 'xs' }` | `{ placement: 'top-end', role: 'control', surface: 'ghost', content: 'icon', text: 'muted' }` |
| TabGroup.tsx:108 (탭 추가) | `{ surface: 'ghost', layout: 'center', recipe: 'control-sm', text: 'muted', opacity: 'dim', padding: 'xs', content: 'text', gap: 'xs', shape: 'xs', clamp: '1' }` | `{ role: 'control', surface: 'ghost', content: 'icon', text: 'muted', opacity: 'dim' }` |
| items/TabItem.tsx:38 (탭 닫기) | `{ surface: 'ghost', layout: 'center', text: 'muted', shape: 'sm', opacity: 'dim' }` | `{ role: 'control', surface: 'ghost', content: 'icon', text: 'muted', opacity: 'dim' }` |
| Toaster.tsx:54 (토스트 닫기) | `{ surface: 'ghost', layout: 'center', recipe: 'control-sm', flex: 'none', padding: 'xs', content: 'text', gap: 'xs', shape: 'xs', clamp: '1' }` | `{ role: 'control', surface: 'ghost', content: 'icon', flex: 'none' }` |
| FilterBar.tsx:36 (필터 제거) | `{ surface: 'ghost', interactive: 'button' }` | `{ role: 'control', surface: 'ghost', content: 'icon' }` |
| FileViewerModal.tsx:107 (모달 닫기) | `{ surface: 'ghost', recipe: 'control-sm', layout: 'center', text: 'secondary', padding: 'xs', content: 'text', gap: 'xs', shape: 'xs', clamp: '1' }` | `{ role: 'control', surface: 'ghost', content: 'icon', text: 'secondary' }` |
| DatePicker.tsx:269,272,276,279 (nav) | `{ surface: 'ghost', layout: 'center', text: 'secondary', shape: 'sm' }` | `{ role: 'control', surface: 'ghost', content: 'icon', text: 'secondary' }` |
| Spinbutton.tsx:127,158 (±) | `{ layout: 'center', surface: 'ghost', text: 'primary' }` | `{ role: 'control', surface: 'ghost', content: 'icon', text: 'primary' }` |
| SidePanel.tsx:36 (펼치기) | `{ textStyle: 'overline', text: 'muted' }` | `{ role: 'control', surface: 'ghost', textStyle: 'overline', text: 'muted' }` |
| SidePanel.tsx:54 (접기) | `{ text: 'muted' }` | `{ role: 'control', surface: 'ghost', content: 'icon', text: 'muted' }` |
| Combobox.tsx:300 (토큰 제거) | ax() 없음, 맨 button | `{ role: 'control', surface: 'ghost', content: 'icon' }` |

### T6. 텍스트 버튼 마이그레이션 (ui/ 내부 인라인 버튼들)

| 파일 | 현재 | 목표 |
|------|------|------|
| DatePicker.tsx:295,296 (Cancel/OK) | `{ surface: 'ghost', recipe: 'control-sm', text: 'primary', padding: 'xs', content: 'text', gap: 'xs', shape: 'xs', layout: 'row', clamp: '1' }` | `{ role: 'control', surface: 'ghost', text: 'primary' }` |
| FilterBar.tsx:48 (+ 필터 추가) | `{ recipe: 'badge', surface: 'ghost', text: 'muted', interactive: 'button', padding: 'xs', gap: 'xs', shape: 'pill', layout: 'row', content: 'text', clamp: '1' }` | `{ role: 'control', surface: 'ghost', text: 'muted' }` — pill shape 소실. badge 역할과 겹침, 후속 논의 |
| StreamFeed.tsx:66 (scroll FAB) | `{ layout: 'center', surface: 'action', text: 'secondary', border: 'default', shape: 'pill', placement: 'bottom-center', motion: 'fade-slide-in' }` | `{ role: 'control', surface: 'action', content: 'icon', placement: 'bottom-center', motion: 'fade-slide-in', border: 'default' }` — pill shape 소실. FAB는 별도 논의 |

### T7. 검증

- `pnpm typecheck` 통과
- `pnpm test` 통과
- Button 브라우저 시각 확인: accent/ghost/dialog/destructive 4변형
- 아이콘 버튼 시각 확인: CopyButton, DatePicker nav, Spinbutton ±, TabGroup add

## 보류 (이번 범위 아님)

- size: xs/sm/lg 추가
- role: 'item', 'badge', 'card', 'container' 추가
- padding/gap/shape/controlSize/recipe 축 폐기
- interactive 축 폐기
- surface에서 cursor/user-select 제거
- FilterBar의 pill shape 버튼 → badge role 필요
- StreamFeed FAB → pill shape 컨트롤 필요
- FlatLayout.tsx:85-101 탭 버튼 → role: 'item' 영역 (control 아님)
- pages/ 마이그레이션
