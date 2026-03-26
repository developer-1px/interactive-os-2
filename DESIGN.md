# Design System — interactive-os

> Reference: claude.ai (2026-03-24 실측)
> 이 문서는 토큰 값이 아니라 **조합 규칙**을 정의한다.
> 토큰은 tokens.css가 SSOT. 여기는 "왜 그 값인지"와 "어떻게 조합하는지".

## 0. 번들 체계

디자인 토큰은 단독이 아니라 **번들로 함께 움직이는 축**이 있다.

| 번들 | 축 | 레벨 | 축 네이밍 | 설명 |
|---|---|---|---|---|
| **surface** | border + shadow + **상태 세트** | 4개 (action/input/display/overlay) | `data-surface` attr | 인터랙션 모드. bg는 variant --_bg가 주입 |
| **shape** | radius + padding-y + padding-x | 6개 (xs~pill) | `-radius`, `-py`, `-px` | 요소 형태. radius와 padding 비례 |
| **type** | size + weight + family + line-height + letter-spacing | 6개 (caption~hero) | `-size`, `-weight`, `-family`, `-line-height`, `-letter-spacing` | 글자 계층. size↑ → serif + lighter + tighter |
| **tone** | base + hover + dim + mid + bright + foreground | 5개 (primary~neutral) | `-base`, `-hover`, `-dim`, `-mid`, `-bright`, `-foreground` | 의미 색상. 모든 tone이 동일 축 구조 |
| **motion** | duration + easing | 3개 (instant/normal/enter) | `-duration`, `-easing` | 전환 속도감. property는 독립 |

독립 축 (번들에 속하지 않음): **color** (text-bright~muted), **border** (subtle~strong), **interactive** (hover/active), **weight** (light~semi), **line-height** (tight~code), **icon** (xs~lg), **gap** (상관관계 없음)

### 약어 규칙

| 허용 | 이유 |
|------|------|
| `radius` (←border-radius) | CSS property 파생, 6/6 주요 시스템 사용 |
| `shadow` (←box-shadow) | CSS property 파생 |
| `ease` (←timing-function) | CSS property 파생 |
| `py`, `px` (←padding-y/x) | Tailwind+Bootstrap+MasterCSS 3개+ 프레임워크 통용 |

**금지**: `r`, `lh`, `sz`, `wt`, `fm`, `dur` — CSS variable로 사용하는 시스템 0/6.
**원칙**: 의심스러우면 줄이지 않는다. full word가 기본.

## 1. 레퍼런스 수치 (claude.ai 실측)

### Color

| claude.ai 토큰 | 실측값 | 용도 |
|---|---|---|
| bg-base | #FAF9F5 `rgb(250,249,245)` | 페이지/사이드바 배경 |
| bg-surface | #FFFFFF | 입력 컨테이너, 카드 |
| bg-muted | #F0EEE6 `rgb(240,238,230)` | 선택 탭, 호버 |
| bg-emphasis | #E8E6DC `rgb(232,230,220)` | 강한 구분 |
| text-primary | #141413 `rgb(20,20,19)` | 본문 |
| text-secondary | #3D3D3A `rgb(61,61,58)` | 인사 제목, 부제 |
| text-tertiary | #73726C `rgb(115,114,108)` | 사이드바 섹션, 설명문 |
| border-default | `rgba(31,30,29,0.15)` | 입력 필드 테두리 |
| border-emphasis | `rgba(31,30,29,0.25)` | 호버/포커스 |
| accent | #2C84DB `rgb(44,132,219)` | Switch ON — 유일한 채도색 |

### Type 번들 (size + weight + family + line-height + letter-spacing)

size가 바뀌면 weight·family·line-height·letter-spacing이 함께 바뀐다. color는 독립 축.

| 세트 | Size | Weight | Family | Line-height | Letter-spacing | 용도 |
|---|---|---|---|---|---|---|
| `--type-hero` | 40px | 330 | Serif | 1.5 | -0.02em | 인사, 랜딩 제목 — 페이지당 1개 |
| `--type-display` | 32px | 400 | Serif | 1.3 | -0.02em | h2, 부제목 — hero와 page 사이 |
| `--type-page` | 24px | 500 | Serif | 1.3 | -0.01em | 페이지 제목 ("설정") |
| `--type-section` | 16px | 600 | Sans | 1.4 | 0 | 섹션 제목 ("프로필", "알림") |
| `--type-body` | 14px | 430 | Sans | 1.4 | 0 | 본문, 버튼, 라벨 — 범용 |
| `--type-caption` | 12px | 430 | Sans | 1.33 | 0 | 사이드바, 단축키, 보조 |

**Size ratio:** 40 → 32 → 24 → 16 → 14 → 12
**Hero:Body = 2.86×**
**핵심 전환:** 16px 이하 = Sans + book/semi + normal spacing, 24px 이상 = Serif + lighter weight + tighter spacing

### Component Specs

| Component | Height | Padding | Radius | Border |
|---|---|---|---|---|
| Input | 44px | 0 12px | 10px | 1px rgba(31,30,29,0.15) |
| Composer | 122px | — | 20px | shadow only |
| Sidebar item | 32px | 6px 16px | 6px | none |
| Switch | 36×20px | — | pill | — |
| Sidebar width | 288px | — | — | — |

### Shadow

| 레벨 | 값 |
|---|---|
| composer | `rgba(0,0,0,0.035) 0px 4px 20px` |

### Border Radius Scale

6px → 10px → 20px → 9999px

---

## 2. 토큰 매핑 (claude.ai → tokens.css)

### Color: 웜톤 전환

현재 tokens.css는 zinc(blue-gray). claude.ai는 warm neutral.

| tokens.css (현재) | claude.ai 대응 | 변환 방향 |
|---|---|---|
| `--zinc-50: #FAFAFA` | #FAF9F5 | cool → warm (살짝 yellow) |
| `--zinc-100: #F4F4F5` | #F0EEE6 | cool → warm |
| `--zinc-200: #E4E4E7` | #E8E6DC | cool → warm |
| `--zinc-500: #71717A` | #73726C | cool → warm |
| `--zinc-800: #27272A` | #3D3D3A | lighter, warmer |
| `--zinc-900: #18181B` | #141413 | warmer |
| `--indigo-500` (accent) | #2C84DB (blue) | indigo → blue 전환 검토 |

**결정 필요:** palette를 zinc에서 warm neutral로 전환할 것인가?
- warm으로 가면 claude.ai 미감에 가까워짐
- 현재 dark theme 기준이므로 light theme에서 먼저 적용 후 dark는 별도 조정

### Typography: scale 재조정

| tokens.css (현재) | claude.ai 대응 | 갭 |
|---|---|---|
| `--text-xs: 11px` | — | 유지 |
| `--text-sm: 13px` | 12px | 13→12 검토 |
| `--text-md: 15px` | 14px | 15→14 검토 |
| `--text-lg: 18px` | 16px | 18→16 검토 |
| `--text-xl: 22px` | 24px | 22→24 검토 |
| `--text-2xl: 26px` | — | 유지 또는 제거 |
| `--text-3xl: 32px` | 40px | 32→40 검토 |

**현재 ratio:** 11→13→15→18→22→26→32 (≈1.18 균일)
**claude.ai ratio:** 12→14→16→24→40 (body 구간 균일, hero 점프)

**핵심 차이:** claude.ai는 body 구간(12~16)이 좁고, hero(40)로 **급격히 점프**한다. 우리는 균일하게 증가 → 위계 대비가 약함.

### Weight: 다양화

| tokens.css (현재) | claude.ai |
|---|---|
| 400, 500, 600, 700, 800 | 330, 400, 430, 500, 600 |

**갭:** claude.ai는 330(극세)~600 범위. 우리는 400~800. claude.ai의 430(body default)이 핵심 — 400보다 살짝 무거워서 가독성 확보.

### Font: 서체 혼합

| tokens.css (현재) | claude.ai |
|---|---|
| `--sans: Manrope` | Anthropic Sans (body) + Anthropic Serif (hero/title) |
| `--mono: SF Mono` | — |

**갭:** 우리는 sans 단일. claude.ai는 serif+sans 혼합으로 제목의 인간적 느낌을 만듦.
**검토:** hero/page-title에 serif 도입? (e.g., `--serif: 'Newsreader', Georgia, serif`)

### Shape: radius + padding 번들

radius와 padding은 독립이 아니라 비례 관계. 세트로 사용한다.
축 네이밍: `-radius`, `-py`, `-px` (py/px는 Tailwind+Bootstrap 통용 약어)

| 세트 | radius | padding-y | padding-x | 용도 |
|---|---|---|---|---|
| `--shape-xs` | 6px | 6px | 12px | 뱃지, 태그 |
| `--shape-sm` | 6px | 6px | 16px | 사이드바 아이템, 네비 |
| `--shape-md` | 10px | 0 | 12px | Input, Textarea, Select |
| `--shape-lg` | 12px | 20px | 20px | 카드 |
| `--shape-xl` | 20px | 24px | 24px | Composer, 대형 컨테이너 |
| `--shape-pill` | 9999px | — | — | Switch, 완전 라운드 |

비율: radius ≈ 요소 height × 0.2, padding-y ≈ radius

### Spacing: 이미 일치

tokens.css 4→8→12→16→24→32→40은 충분. claude.ai도 비슷한 scale 사용.

---

## 3. CSS Layers — SRP 기반 스타일링 프로토콜

> 각 CSS 파일/레이어는 **변경 이유가 단 하나**여야 한다 (Single Responsibility Principle).
> 파일명 = 레이어 = 책임. 다음 LLM 세션이 파일명만 보고 "여기에 이걸 쓰면 된다"를 즉시 판단.

### 6레이어 스택

```
Global ──────────────────────────────
  L1  reset.css        브라우저 초기화 + HTML type 기본값
  L2  tokens.css       디자인 값 선언 (:root 변수 + 테마 override)
      structure.css    수치 없는 atomic layout class (닫힌 체계)
  L3  surface.css      인터랙션 모드 정책 ([data-surface] action/input/display/overlay)
  L4  interactive.css  인터랙션 정책 (hover, focus, disabled, selected...) + [data-surface] 독립 컴포넌트 상태 전환

Local ───────────────────────────────
  L5  *.module.css     컴포넌트 고유 형태 (Structure)
  L6  *.module.css     컴포넌트 변형 (Variant — tone/size)
```

| Layer | 파일 | 변경 이유 (단 하나) | specificity |
|-------|------|-------------------|-------------|
| L1 | `reset.css` | 브라우저 기본값 정책이 바뀔 때 | 기본 |
| L2 | `tokens.css` | 디자인 시스템 값이 바뀔 때 | — (값만) |
| — | `structure.css` | atomic layout class가 필요할 때 | (0,1,0) |
| L3 | `surface.css` | 인터랙션 모드 정책이 바뀔 때 | (0,1,0) |
| L4 | `interactive.css` | 사용자 입력 반응 정책이 바뀔 때 | (0,0,0) `:where()` |
| L5+L6 | `*.module.css` | 이 컴포넌트의 형태/변형이 바뀔 때 | (0,1,0)+ |

### 판단 플로우

```
속성을 쓰려 한다
  ├─ display, flex-direction, align-items, justify-content,
  │  flex-wrap, flex-shrink, overflow, position?
  │  → structure.css atomic class (className에서 사용)
  │
  ├─ color, background, font, spacing, border, shadow, radius?
  │  → CSS 파일 (module.css 또는 글로벌) + 토큰 필수
  │
  └─ ARIA 상태 (hover, focus, selected, disabled)?
     → interactive.css 기본값 확인
       ├─ 기본값 충분 → 그대로 사용
       └─ 커스텀 필요 → module.css에서 override (:where() 덕에 바로 이김)
```

### 컴포넌트 분류와 필수 상태

| 분류 | 예시 | 필수 상태 | 상태 제공 |
|------|------|-----------|-----------|
| **Action** | Button, Toggle, Switch | hover, active, focus, disabled, tone variant | `data-surface="action"` + variant --_ |
| **Collection** | ListBox, TreeGrid, Menu, Tabs | hover, focus(bg), selected, disabled item | `data-aria-container` (L4 전담) |
| **Input** | TextInput, Checkbox, Radio, Slider | hover, focus(ring), disabled, invalid, readonly | `data-surface="input"` + variant --_ |
| **Overlay** | Dialog, AlertDialog, Tooltip | enter/exit motion, backdrop | `data-surface="overlay"` (L3 + L4) |
| **Static** | Separator, Progress | 없음 또는 최소 | `data-surface="display"` 또는 L5만 |

### `--_` Scoped Property 패턴

**문제:** Button hover가 `var(--tone-primary-hover)`를 써야 한다. tone은 L6(Variant)이고 hover는 L4(Interactive) — SRP 충돌.

**해결:** L6이 값을 선언하고, L4가 상태 전환만 소유한다.

```css
/* L6: Variant — hover 시 쓸 값을 선언 (module.css) */
.primary {
  --_bg: var(--tone-primary-base);
  --_bg-hover: var(--tone-primary-hover);
  --_fg: var(--tone-primary-foreground);
  background: var(--_bg);
  color: var(--_fg);
}

/* L4: Interactive — 상태 전환 타이밍만 소유 (interactive.css) */
button:hover { background: var(--_bg-hover); }
```

**원칙:** 상태 전환 타이밍은 L4, 시각적 값은 L6. `--_` 접두사로 스코프.

### module.css 작성 규칙

module.css에는 **Structure(L5) + Variant(L6)만** 작성한다. 상태 스타일은 금지.

```css
/* Button.module.css — Structure + Variant만 */

/* L5: Structure */
.root {
  border-radius: var(--shape-md-radius);
  padding: var(--shape-md-py) var(--shape-md-px);
  font-size: var(--type-body-size);
  font-weight: var(--type-body-weight);
  transition: background var(--motion-instant-duration) var(--motion-instant-easing);
}

/* L6: Variant */
.primary {
  --_bg: var(--tone-primary-base);
  --_bg-hover: var(--tone-primary-hover);
  --_fg: var(--tone-primary-foreground);
  background: var(--_bg);
  color: var(--_fg);
}

/* ❌ 금지 — 아래는 L4 Interactive의 책임 */
/* .root:hover { } */
/* .root:focus { } */
/* .root:disabled { } */
```

### structure.css — atomic class (닫힌 체계)

- Tailwind 네이밍 (de facto 표준, LLM/사람 모두 즉시 인식)
- 수치 없는 레이아웃 속성 + 토큰 고정 스케일(gap-xs~gap-3xl)
- 정의된 class만 사용 가능. JIT 없음, escape hatch 없음
- 부족하면 class를 추가 (토큰처럼 스케일 확장)

### interactive.css — ARIA 인터랙션 정책 (:where() 기본값)

- 모든 셀렉터를 `:where()`로 래핑 → specificity (0,0,0)
- "기본값 제공자" 역할 — module.css의 아무 셀렉터도 이김
- **상태 + ARIA 컴포넌트 구조** 제공 (hover, focus, selected, disabled, item parts, grid, tree depth)
- Focus rule (Apple HIG): Collection 아이템 = bg highlight, 독립 요소 = outline ring

### component class convention — `item-{part}`

interactive.css에서 className으로 제공하는 class의 네이밍 규칙.
daisyUI `{component}-{part}` 패턴 참조.

**2단 게이트 (class 생성 판단):**

```
class를 만들려 한다
  ├─ atomic으로 100% 표현 가능? → class 만들지 않음
  └─ 디자인 토큰 포함 (color, opacity, size 등)?
      → item-{part} 패턴으로 생성
```

**part는 역할 어휘 (key pool):**

| key | 역할 | 예시 |
|-----|------|------|
| chevron | 펼침/접힘 표시 아이콘 | `item-chevron`, `item-chevron--tree` |
| indicator | 상태 표시 (radio, checkbox) | `item-indicator` |
| icon | 장식 아이콘 | `item-icon` |
| badge | 숫자/상태 뱃지 | `item-badge` |
| shortcut | 키보드 단축키 힌트 | `item-shortcut` |
| description | 보조 텍스트 | `item-description` |
| label | 라벨 텍스트 | `item-label` |

**variant → BEM modifier:** `item-{part}--{variant}` (예: `item-chevron--tree`)

**금지 어휘:** inner, wrapper, container, box, section, area — 구조/위치 이름.
역할을 말하지 않는 이름은 만들 수 없다.

### 금지 목록

| 금지 | 대신 | 이유 |
|------|------|------|
| raw 수치 (6px, #fff) | 토큰 (var(--space-sm)) | 디자인 시스템 일관성 |
| margin | gap | 부모가 간격 제어 |
| module.css에 display:flex/grid | structure.css atomic class | 구조는 DOM과 co-locate |
| module.css에 :hover/:focus/:disabled | interactive.css에 위임 | L4 SRP — 상태는 글로벌 정책 |
| interactive.css에 :where() 없는 셀렉터 | :where() 래핑 | specificity 군비경쟁 방지 |
| palette 직접 참조 (--blue-600) | semantic 토큰 (--tone-primary-base) | 테마 독립성 |
| 구조/위치 이름의 class (inner, wrapper) | atomic class 조합 | 역할을 말하지 않음 |
| module.css에 :hover/:focus/:active/:disabled | data-surface가 상태 제공. 예외: HTML 기본 요소(a:hover), syntax highlight | L4 SRP |
| variant에 background/color 직접 작성 | --_ 변수 선언만 | 값과 전환 분리 |
| data-surface + data-aria-container 동시 부여 | 컬렉션은 [data-aria-container], 독립은 [data-surface] | 셀렉터 충돌 방지 |
| --_ 풀에 없는 scoped property 무단 추가 | DESIGN.md 풀 테이블에 등록 후 사용 | 닫힌 체계 |

---

## 4. 조합 규칙 (Composition Rules)


토큰으로 해결 안 되는, "어떻게 조합하는가"의 규칙.

### Rule 1: 면으로 구분, 선으로 구분 안 함

```
❌ border: 1px solid var(--border-default)  ← 영역 구분용
✅ background: var(--surface-sunken)         ← 배경색 차이로 구분
```

border는 **입력 필드, 카드 윤곽**에만 사용. 영역 분리(사이드바↔콘텐츠, 섹션↔섹션)는 배경색 차이로.

### Rule 2: 화면당 주인공 1개

```
페이지 = 1 hero element + N supporting elements
hero:   --text-3xl, weight 330(light), serif
others: --text-md 이하, weight 400~600, sans
```

하나의 요소만 시각적으로 압도. 나머지는 후퇴. "모든 게 중요하면 아무것도 중요하지 않다."

### Rule 3: 위계 점프

```
body 구간: 12 → 14 → 16  (차이 2px — 균일, 조용)
hero 점프: 16 → 40         (차이 24px — 극적)
```

body 내에서는 미세한 차이. body→hero는 2.5배 이상 점프. 중간 단계(22, 26)를 건너뜀.

### Rule 4: 조연의 후퇴

```
사이드바 항목:   font-size 12px, color --text-tertiary
사이드바 섹션명: font-size 12px, weight 400, color --text-tertiary
콘텐츠 본문:    font-size 14px, color --text-primary
```

네비게이션/보조 요소는 **본문보다 작고, 연한 색**. 콘텐츠와 시선 경쟁하지 않음.

### Rule 5: 입력은 넉넉하게

```
Input height: 44px (본문 14px 대비 3.1배)
Input padding: 0 12px
Input radius: 10px (body radius보다 큼)
```

입력 필드는 시각적으로 "여유"를 줌. 답답한 input = 저급한 느낌.

### Rule 6: 포인트 컬러는 1개

```
전체 palette: warm neutral (무채색)
유일한 채도: accent (#2C84DB) — Switch ON, focus ring
나머지: 전부 gray 계열
```

색이 많으면 산만. 하나의 색만 의미를 가짐.

### Rule 7: 설명문은 항상 있되, 후퇴

```
라벨:   --text-sm, weight 500, color --text-primary
설명문: --text-sm, weight 400, color --text-tertiary
```

모든 설정/필드에 "왜 필요한지" 설명. 하지만 색이 연해서 라벨과 경쟁 안 함.

### Rule 8: 카드형 선택

```
❌ <input type="radio"> + 텍스트 라벨
✅ 비주얼 카드 (미리보기 + 라벨) — 선택 시 border 강조
```

선택지가 시각적일 때는 카드로. 텍스트 라디오보다 직관적.

### Rule 9: 액션은 오른쪽 끝

```
[라벨 + 설명 ........................... Switch/Button]
```

설명은 왼쪽에서 흐르고, 액션은 오른쪽 끝에 정렬. 시선 흐름: 읽기(좌→우) → 행동(우측).

### Rule 10: gap 기본값 — 가로 좁게, 세로 넓게

```
row(가로 배치):    gap: var(--space-md)  /* 12px — claude.ai 61/76회 */
column(세로 배치): gap: var(--space-xl)  /* 24px — 섹션 간 분리 */
```

가로는 요소 간 결합감을 유지하되, 세로는 섹션 분리를 위해 2배 넓게.

---

## 5. 적용 우선순위

1. **Color palette warm 전환** — zinc → warm neutral (light theme 먼저)
2. **Typography scale 재조정** — body 구간 압축 + hero 점프
3. **Serif 도입** — hero/page-title용
4. **Radius scale 조정** — 최소 6px, input 10px
5. **Component specs** — Input 44px, Sidebar item 32px 등
6. **Composition rules** — 위 9개 규칙을 컴포넌트 작성 시 참조

## 6. module.css 3블록 레시피

독립 컴포넌트의 module.css는 3블록 순서로 작성한다.

### Block 1: base (.root)

공유 형태 — shape/type/motion 번들 세트 + --_ 참조.

```css
.root {
  border-radius: var(--shape-md-radius);
  padding: var(--shape-md-py) var(--shape-md-px);
  font-size: var(--type-body-size);
  font-weight: var(--type-body-weight);
  transition: background var(--motion-instant-duration) var(--motion-instant-easing);
  background: var(--_bg);
  color: var(--_fg);
}
```

상태(:hover, :focus 등)는 여기 없음 — `data-surface`가 제공.

### Block 2: variant

--_ 변수 선언만. background/color 직접 작성 금지.

```css
.accent {
  --_bg: var(--tone-primary-base);
  --_bg-hover: var(--tone-primary-hover);
  --_fg: var(--tone-primary-foreground);
}
```

### Block 3: size

shape + type 번들 override. 번들 세트로 교체.

```css
.sm {
  border-radius: var(--shape-xs-radius);
  padding: var(--shape-xs-py) var(--shape-xs-px);
  font-size: var(--type-caption-size);
}
```

### --_ 네이밍 풀 (닫힌 체계)

| 변수 | surface | 용도 | fallback |
|------|---------|------|----------|
| `--_bg` | all | 기본 배경 | 없음 (필수) |
| `--_bg-hover` | action | 호버 배경 | 없음 |
| `--_bg-active` | action | 누름 배경 | `--_bg-hover` |
| `--_fg` | all | 기본 전경 | 없음 (필수) |
| `--_fg-hover` | action | 호버 전경 | `--_fg` |
| `--_border` | input | 기본 테두리 | `--border-default` |
| `--_border-focus` | input | 포커스 테두리 | `--focus` |
| `--_border-invalid` | input | 에러 테두리 | `--tone-destructive-base` |

풀 확장 시 이 표에 등록 필수.
