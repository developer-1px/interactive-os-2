---
id: axNamingDictionary
type: inbox
slug: axNamingDictionary
title: ax 네이밍 딕셔너리 — 전수 조사
tags: [ax, naming, dictionary, design-system]
created: 2026-04-19
updated: 2026-04-19
status: open
layer: styles
summary: ax() 시스템의 모든 축·값·prefix·role×surface 조합을 코드에서 전수 추출한 단일 참조표. SSOT는 src/styles/axPublic.ts + axPrivate.ts + rolePreset.ts.
---

# ax 네이밍 딕셔너리 — 전수 조사

> **SSOT 파일**
> - `src/styles/axPublic.ts` — Public 12축 타입·AxPublic discriminated union
> - `src/styles/axPrivate.ts` — Private 7축 타입·`AX_PRIVATE_KEYS`
> - `src/styles/rolePreset.ts` — `rolePresetTable` · `textStylePresetTable`
> - `src/styles/ax.ts` — prefix map(`prefixes`) · `ax()` entry
> - `src/styles/axRaw.ts` — `ax.raw()` escape hatch + `PRIVATE_PREFIXES`

## 1. 축 × Prefix 표 (19축)

### Public (12축 — `ax()`에 직접 전달 가능)

| 키 | prefix | 타입 |
|---|---|---|
| `role` | `rl` | `AxRole` |
| `surface` | `sf` | `AxSurface` |
| `tone` | `tn` | `AxTone` |
| `textStyle` | `ts` | `AxTextStyle` |
| `content` | `ct` | `AxContent` |
| `interactive` | `ia` | `AxInteractive` |
| `layout` | `ly` | `AxLayout` |
| `placement` | `pl` | `AxPlacement` |
| `width` | `w` | `AxWidth` |
| `flex` | `fx` | `AxFlex` |
| `clamp` | `cl` | `AxClamp` |
| `aspect` | `ar` | `AxAspect` |

### Private (7축 — `ax.raw()` 또는 `rolePreset` 경유만 도달)

| 키 | prefix | 타입 |
|---|---|---|
| `padding` | `pd` | `AxPadding` |
| `gap` | `g` | `AxGap` |
| `shape` | `sh` | `AxShape` |
| `border` | `bd` | `AxBorder` |
| `icon` | `ic` | `AxIcon` |
| `square` | `sq` | `AxSquare` |
| `motion` | `mo` | `AxMotion` |

### @removed (과거 존재 → 현재 폐기)

| 키 | 폐기 사유 (commit refs: §1 #4~#6, 2026-04-19 ax-textstyle-ssot-prd) |
|---|---|
| `scroll` | `AxLayout`의 `scroll`/`scroll-x`/`clip`로 흡수 |
| `cs` | `textStyle` 4-tuple(font-size·cs-h·cs-py·cs-px)이 SSOT |
| `text` | surface→text pairing을 CSS layer가 자동 파생 (Material on-*) |
| `weight` | surface→text pairing CSS가 SSOT |
| `opacity` | CSS layer 자동 파생 |
| `state` | Zone(surface+material+elevation) cascade가 결정 |

## 2. 값 전수 enum (Public)

### `AxRole` (10 브랜치)

| 값 | 설명 | surface 필수? |
|---|---|---|
| `control` | 인터랙티브 컨트롤 (버튼·입력·탭) | ✅ (strict) |
| `control-group` | 컨트롤 묶음 컨테이너 (패널·툴바·그룹) | ❌ (silent) |
| `item` | 리스트/트리/탭 행 | ❌ (silent) |
| `cell` | grid 칸 컨테이너 + 내부 control 묶음 | ✅ (strict) |
| `badge` | 뱃지 | ✅ (strict) |
| `utility` | default 브랜치 (role 키 생략 시) — 레이아웃/타이포 전용 | ❌ |
| `tip` | 툴팁/오버레이 보조 표면 | ✅ (strict) |
| `metric` | 숫자 강조 표시 (신규) | ✅ (strict) |
| `signal` | 시스템→사용자 알림 (신규) | ✅ (strict) |
| `placeholder` | 로딩/Skeleton (신규) | ❌ (optional) |

> **strictRoles** = `{ control, badge, tip, cell, metric, signal }` — surface 지정 + preset all-miss 시 `resolveRolePreset` throw (현재 Phase 1-a G-5 임시 warn).

### `AxSurface` (role-별 subset 잠금, 10개 union)

| role | 허용 surface |
|---|---|
| `control` | `action` · `ghost` · `input` · `placeholder` |
| `control-group` | `sunken` · `base` · `raised` · `overlay` · `ghost` |
| `item` | `ghost` · `display` |
| `cell` | `display` · `ghost` · `input` |
| `badge` | `display` · `ghost` · `overlay` · `placeholder` |
| `tip` | `inverted` · `overlay` |
| `metric` | `display` · `ghost` · `sunken` |
| `signal` | `display` · `overlay` · `ghost` |
| `placeholder` | `sunken` · `ghost` · `display` |

> 전체 surface 어휘 union: `action · ghost · input · placeholder · display · overlay · inverted · sunken · base · raised`

### `AxTone` (10값, 5색 × 2강도)

```
accent · danger · success · warning · neutral
accent-dim · danger-dim · success-dim · warning-dim · neutral-dim
```

### `AxTextStyle` (9값)

```
hero · display · page · section · label · body · caption · code · overline
```

### `AxContent` (4값)

```
text · code · bubble · icon
```

### `AxInteractive` (6값)

```
item · tab · check · cell · input · button
```

> 인터랙티브 아이템은 이 중 하나를 필수 선언. `surface: 'ghost'`는 독립 버튼/컨트롤 한정.

### `AxLayout` (18값)

```
row · center · bar · spread · stack
scroll · scroll-x · clip
fill · row-fill · wrap
grid-2 · grid-3 · grid-4 · grid-5 · grid-7 · table
self-start · self-end · self-center
```

### `AxPlacement` (18값)

```
above · below · bottom · bottom-center · center
top-start · top-end · viewport · sticky
anchor-below · anchor-below-start · anchor-above · anchor-end · anchor-start
relative
float-top-start · float-top-center · float-bottom-center · float-bottom
```

### `AxWidth` (8값)

```
full · auto · fit · sm · md · lg · xl · prose
```

### `AxFlex` (3값)

```
none · auto · 1
```

### `AxClamp` (5값)

```
1 · 2 · 3 · 4 · pre
```

### `AxAspect` (3값)

```
1 · video · card
```

## 3. 값 전수 enum (Private)

### `AxPadding` (6값)

```
none · xs · sm · md · lg · xl
```

### `AxGap` (6값)

```
xs · sm · md · lg · xl · 2xl
```

### `AxShape` (9값)

```
none · 2xs · xs · sm · md · lg · xl · pill · island
```

> `island` = 큰 radius + overflow clip 번들. `surface:'raised'`와 페어링 시 "sunken 속 떠오른 섬" 시멘틱 (단순 radius 스케일 아님).

### `AxBorder` (9값, full 5 + side 4)

```
# full
subtle · default · strong · dashed · ring
# side
bottom · top · start · end
```

### `AxIcon` (4값)

```
xs · sm · md · lg
```

### `AxSquare` (6값)

```
xs · sm · md · lg · xl · 2xl
```

### `AxMotion` (9값)

```
pulse · spin · fade-in · slide-up
fade-slide-in · slide-in · scale-in · blink · shimmer
```

## 4. `rolePresetTable` 전수 (cascade seed)

**키 형식**: `role` · `role.surface` · `role.surface.interactive` · `role.surface.content`

### control.*

| key | 주입 Private |
|---|---|
| `control.action` | `{ shape: 'md', gap: 'xs' }` |
| `control.action.text` | `{}` |
| `control.action.icon` | `{}` |
| `control.action.button` | `{ gap: 'sm' }` |
| `control.ghost` | `{ shape: 'md' }` |
| `control.ghost.icon` | `{}` |
| `control.ghost.text` | `{ shape: 'sm' }` |
| `control.ghost.tab` | `{ shape: 'sm' }` |
| `control.input` | `{ shape: 'sm', border: 'default' }` |
| `control.input.text` | `{}` |
| `control.input.input` | `{ shape: 'md' }` |
| `control.placeholder` | `{ shape: 'md', motion: 'spin' }` |

### control-group.*

| key | 주입 Private |
|---|---|
| `control-group.overlay` | `{ gap: 'xs', shape: 'xl' }` |
| `control-group.raised` | `{ gap: 'xs', shape: 'island' }` |
| `control-group.sunken` | `{ gap: 'sm' }` |

### item.*

| key | 주입 Private |
|---|---|
| `item.placeholder` | `{ gap: 'sm', motion: 'shimmer' }` |

### cell.*

| key | 주입 Private |
|---|---|
| `cell.display` | `{ gap: 'xs' }` |
| `cell.ghost` | `{}` |
| `cell.input` | `{ shape: 'sm', border: 'default' }` |

### badge.*

| key | 주입 Private |
|---|---|
| `badge.display` | `{ shape: 'pill' }` |
| `badge.ghost` | `{}` |
| `badge.overlay` | `{ shape: 'md' }` |
| `badge.placeholder` | `{ shape: 'pill', motion: 'pulse' }` |

### tip.*

| key | 주입 Private |
|---|---|
| `tip.inverted` | `{ shape: 'sm', motion: 'fade-slide-in' }` |
| `tip.overlay` | `{ shape: 'sm', motion: 'fade-slide-in' }` |

### metric.*

| key | 주입 Private |
|---|---|
| `metric.display` | `{ shape: 'sm' }` |
| `metric.display.text` | `{}` |
| `metric.display.bubble` | `{ shape: 'md' }` |
| `metric.ghost` | `{}` |
| `metric.sunken` | `{ shape: 'sm' }` |

### signal.*

| key | 주입 Private |
|---|---|
| `signal.display` | `{ shape: 'md' }` |
| `signal.display.button` | `{ shape: 'md' }` |
| `signal.overlay` | `{ shape: 'md', motion: 'fade-slide-in' }` |
| `signal.ghost` | `{}` |

### placeholder.*

| key | 주입 Private |
|---|---|
| `placeholder.sunken` | `{ shape: 'sm', motion: 'shimmer' }` |
| `placeholder.ghost` | `{ motion: 'pulse' }` |
| `placeholder.display` | `{ shape: 'sm', motion: 'shimmer' }` |

## 5. `textStylePresetTable` 전수

모든 9개 textStyle(`hero` · `display` · `page` · `section` · `label` · `body` · `caption` · `code` · `overline`) 엔트리는 현재 `{}`. surface→text pairing은 CSS layer(§4c)가 SSOT이므로 textStyle은 Private 주입 없음. 향후 textStyle-별 padding 등 등록 여지로만 존재.

## 6. 호출 경로 분기

```
input: Axes (Public discriminated union)
  │
  ├─ ax(axes) ──► 1) Private 키 오염 검사 (현 Phase 1-a G-5: warn)
  │              2) resolveRolePreset(role, surface, content, interactive)
  │                 └─ cascade: role → role.surface → role.surface.interactive
  │                                                 → role.surface.content
  │                 └─ all-miss + strictRole + surface → warn (장차 throw)
  │              3) resolveTextStylePreset(textStyle) — 현재 전부 {}
  │              4) merge: textPreset ← rolePreset ← input (구체 override)
  │              5) className 합성: prefix-value 공백 구분
  │
  └─ ax.raw(privateOnly) ──► Private 7축 직접 주입 (유일 경로)
                             └─ non-private 키 입력 시 dev throw
```

## 7. 합성 규칙 요약

- **override 순서**: `textStylePreset` (일반) → `rolePresetTable` hit (구체) → `input` (Public 명시)
- **className 포맷**: `{prefix}-{value}` 공백 구분 단일 문자열
- **Public/Private 키 교집합 공집합** 불변식 (이름 충돌 금지)
- **`ax.raw()`는 Private만** — Public 입력 시 dev throw
- **`role` 키 부재** → `utility` 브랜치로 default brand (1,701 role-less 호출 보호)

## 8. 참조 체인 (변경 시 동반 수정 지점)

```
axPublic.ts (타입 SSOT)
  ├─► ax.ts prefixes (Public 12 엔트리)
  ├─► rolePreset.ts RolePresetKey 템플릿
  └─► ui/ AriaComponentProps 타입

axPrivate.ts (타입 SSOT + AX_PRIVATE_KEYS)
  ├─► ax.ts PRIVATE_KEY_SET (런타임 가드)
  ├─► axRaw.ts PRIVATE_PREFIXES (Private 7 엔트리)
  ├─► guardOsPatterns.mjs (정적 검사)
  └─► scanOsViolations.mjs (감사 스캐너)

rolePresetTable (조합 SSOT)
  └─► "조합 변경은 이 파일 수정만으로 완결" (§1 불변식 #4)
```

## 9. 주의 사항

- **Public 축 신설 전에** subset 확장 · 테마 override · 기본값 주입 시도 (`feedback_axis_minimum_via_subset_expansion`)
- **Public 축에 원리 종속축 해치 금지** — 의도축(role/surface/cs)만, override는 `ax.raw()` 단일 해치 (`feedback_public_axis_no_hatch`)
- **축/값 이름은 디자인-중립** — 미감 지시어 금지 (`feedback_naming_design_neutral`)
- **Private 키 ui/pages 직접 import 금지** — `guardCssAxes` 정적 검사
- **Phase 1-a G-5**: Bundle D/E 마이그레이션 중 throw → warn 완화 상태. Bundle E 완료 후 throw 재승격 예정 (§1 #7, #9)
