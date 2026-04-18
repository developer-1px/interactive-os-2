---
id: research/ax/02-principles
type: note
slug: principles
title: '02 Principles — ax 메타 원리 카드'
tags: [research]
created: 2026-04-18
updated: 2026-04-18
summary: '**작성일:** 2026-04-18 **상태:** 초안 v1. 20개 카드. 03 매핑 작업 전 검토 필요. **포맷:** 6항목 Principle Card (원리 / 정의 / 업계 증거 / 수학·인지 근거 / 반증 조건 / ax 매핑 + Examples)'
legacy:
  status: research
  kind: note
  topics: [research]
  relates: []
  supersedes: []
---
# 02 Principles — ax 메타 원리 카드

**작성일:** 2026-04-18
**상태:** 초안 v1. 20개 카드. 03 매핑 작업 전 검토 필요.
**포맷:** 6항목 Principle Card (원리 / 정의 / 업계 증거 / 수학·인지 근거 / 반증 조건 / ax 매핑 + Examples)

## Legend

| 태그 | 의미 |
|------|------|
| ✅ 확정 | 3군 이상 교차 검증 완료 |
| ⚡ 정량 반증 | 수학 공식·임계치로 직접 반증 가능 |
| 🔄 보정 | 기존 12개 중 증거 기반 수정 |
| 🆕 신규 | 1·2·3군 탐색에서 발굴, 즉시 승격 |
| 🔵 후보 확정 | 단일 강군 증거이나 카드 작성 완료로 승격 확정 |
| ⬜ TBD | ax 매핑은 03에서 최종 판정 |

## 원리 목차

| # | 이름 | 태그 |
|---|------|------|
| P-01 | Role → Structure Derivation | ✅ |
| P-02 | Size Ladder SSOT | ✅ ⚡ |
| P-03 | Spatial Rhythm | ✅ ⚡ |
| P-04 | Surface Hierarchy | ✅ |
| P-05 | Color as Role | ✅ |
| P-06 | Chroma Scale with Paired Foreground | ✅ ⚡ |
| P-07 | Accent Constraint | 🔄 |
| P-08 | Focus Visibility | ✅ ⚡ |
| P-09 | Interactive States | ✅ ⚡ |
| P-10 | Density Modes (Cowan Ceiling) | 🔄 ⚡ |
| P-11 | Typography Hierarchy | ✅ |
| P-12 | Shape Family | ✅ |
| P-13 | Token Tiering | 🆕 |
| P-14 | Mode Switching | 🆕 |
| P-15 | Perceptual Color Space (OKLCH) | 🆕 ⚡ |
| P-16 | Fitts Target Size (조건부) | 🆕 ⚡ 조건부 |
| P-17 | Slot Recipe | 🔵 |
| P-19 | Saccade Line Length | 🆕 ⚡ |
| P-20 | Figure-Ground Contrast | 🔵 |
| P-21 | Optical Alignment | 🔵 |

**참고:** P-18 (Composite Token) → P-13에 흡수 / P-22 (Motion) → 보류 / P-23 (Cognitive Chunking) → P-10에 흡수 / P-24 (State Layer Overlay) → P-09에 흡수 / P-25 (Theme Contrast Knob) → 보류.

---

## P-01 Role → Structure Derivation ✅

**원리**
컴포넌트의 역할(button/input/badge 등)이 크기·패딩·radius·font-size·font-weight의 묶음 결정자다.

**정의**
```
f(role) → {cs, pd, radius, font, weight, chroma, ...}
```
개별 속성을 따로 선택하는 API를 제공하지 않는다. 값은 role에서 **파생**된다.

**업계 증거 (1·2군)**
- Material 3 Component Tokens — component category가 shape+elevation+typography 묶음 결정. [m3.material.io](https://m3.material.io/styles/shape/corner-radius-scale)
- Radix Typography — "size prop … also provides correct line height and corrective letter spacing". [radix-ui.com](https://www.radix-ui.com/themes/docs/theme/typography)
- shadcn Button — size sm/default/lg가 height+padding+radius 일괄 결정. [ui.shadcn.com](https://ui.shadcn.com/docs/components/radix/button)
- Vercel Geist — BG1/BG2, component BG 1-3, border 4-6, text 9-10 역할 고정. [vercel.com/geist/colors](https://vercel.com/geist/colors)
- Panda Slot Recipe — 복합 컴포넌트의 slot × 공유 variant 구조. [panda-css.com](https://panda-css.com/docs/concepts/slot-recipes)

**수학·인지 근거 (3군)**
구조 매핑이므로 직접 수식 없음. 인지적으로는 **chunking** — 역할 하나를 떠올리면 속성 묶음이 단일 단위로 회상된다 (Miller 1956 → Cowan 2001).

**반증 조건**
role과 무관하게 개별 속성(padding·radius·font-size)을 따로 지정해도 compo 전체에서 일관성이 유지된다면 거짓.

**ax 매핑** ⬜
role + cs(derived) + pd(derived) + radius(derived). 현재 상태: TBD — 03에서 판정.

**예시**
- ✅ `ax({role: 'button', cs: 'md'})` — padding/radius 자동
- ❌ `ax({role: 'button', cs: 'md', pd: 'xl', radius: 'full'})` — 원리 위반

---

## P-02 Size Ladder SSOT ✅ ⚡

**원리**
xs → xl 단일 크기 계단이 모든 축(font, padding, gap, icon)을 동기화한다.

**정의**
```
Sₙ = S₀ × rⁿ  (modular scale)
```
r은 고정 승수. 계단 전체가 타이포·간격·아이콘에 파생.

**업계 증거 (1·2군)**
- Radix Spacing — 9-step scale, typography+spacing 단일 ladder. [radix-ui.com](https://www.radix-ui.com/themes/docs/theme/spacing)
- Tailwind v4 — `--text-xs…9xl`, `--spacing=0.25rem` × n 공유. [tailwindcss.com](https://tailwindcss.com/docs/theme)
- W3C DTCG — dimension type으로 계단 구조 표현. [designtokens.org](https://www.designtokens.org/tr/drafts/format/)
- Panda — size variant 공유. [panda-css.com](https://panda-css.com/docs/concepts/recipes)

**수학·인지 근거 (3군)**
- Modular scale. r ∈ {1.125 Major Second, 1.2 Minor Third, **1.25 Major Third**, 1.333 Perfect Fourth, 1.414 Augmented Fourth (√2), 1.5 Perfect Fifth, 1.618 Golden Ratio, 2.0 Octave}
- 음계 조화 (Pythagorean) — 단계 간 비율이 일정해야 지각 연속성
- **Golden ratio 1.618은 myth** — 본질은 "modular"지 ratio 자체가 아님. Every Layout, [plus.maths.org](https://plus.maths.org/content/myths-maths-golden-ratio)

**반증 조건** ⚡ 정량
인접 단계 비율이 **r ∉ [1.067, 2.0]** 범위 밖이면 modular scale 위반.
예: 12 → 13px (ratio 1.083 OK) / 12 → 25px (ratio 2.08 위반).

**ax 매핑** ⬜
cs 축 단일 SSOT. font/pd/gap/icon 모두 cs에서 파생. TBD.

**예시**
- ✅ `cs: xs/sm/md/lg/xl` (ratio ≈ 1.25) — 일관
- ❌ `font: 12px, padding: 11px, gap: 7px` — 비 modular

---

## P-03 Spatial Rhythm ✅ ⚡

**원리**
padding, gap, margin이 같은 baseline grid(4/8/12px)를 공유한다.

**정의**
모든 spacing 값이 baseline의 정수 배수. 비배수 금지.

**업계 증거 (1·2군)**
- Material 1 Metrics — "8dp square baseline grid". [m1.material.io](https://m1.material.io/layout/metrics-keylines.html)
- Linear — "reduce visual noise, maintain visual alignment"
- Vercel Geist — "Grid 시스템 huge part of aesthetic"
- Tailwind — 4px 배수 기반

**수학·인지 근거 (3군)**
- **Müller-Brockmann Grid Systems (1961)** — 8-32 필드 grid. [monoskop.org](https://monoskop.org/images/a/a4/Mueller-Brockmann_Josef_Grid_Systems_in_Graphic_Design_Raster_Systeme_fuer_die_Visuele_Gestaltung_English_German_no_OCR.pdf)
- 8pt = Retina 정합 ("designs can scale perfectly")
- Bringhurst: leading = font-size × 1.5 근사

**반증 조건** ⚡ 정량
baseline grid **비배수**(예: 7px, 13px, 17px) 발생 시 위반.

**ax 매핑** ⬜
pd / gap / margin 축 모두 cs 계단 공유 또는 독립 spacing 토큰. TBD.

**예시**
- ✅ padding 4/8/12/16/24/32px (8px multiples)
- ❌ padding 7px, gap 13px (비배수)

---

## P-04 Surface Hierarchy ✅

**원리**
UI 표면은 base → raised → overlay의 깊이 사다리를 형성한다.

**정의**
모든 표면이 정해진 깊이 단계 중 하나에 귀속. 깊이마다 고유의 색/shadow/z-index 페어링.

**업계 증거 (1·2군)**
- Material 3 — Surface1-5 tonal + 6 elevation levels. [m3.material.io](https://m3.material.io/styles/color/roles)
- Apple — systemBackground primary/secondary/tertiary
- shadcn — background/card/popover 3단. [ui.shadcn.com](https://ui.shadcn.com/docs/theming)
- Linear — background/foreground/panel/dialog/modal 레이어
- Vercel Geist — BG1/BG2 + component BG 1-3
- W3C DTCG — shadow composite token

**수학·인지 근거 (3군)**
- **Gestalt figure-ground** (Wertheimer 1923). [Scholarpedia](http://www.scholarpedia.org/article/Gestalt_principles)
- 깊이 ∝ 상대 luminance Δ
- tonal(색 tint) vs shadow 2가지 표현 방식 공존 허용

**반증 조건**
서로 다른 깊이의 표면이 동일 색/shadow/z-index를 가져도 시각적으로 구분된다면 거짓.

**ax 매핑** ⬜
`project_depth_ladder` — sunken → base → raised → overlay 구현. surface 축 + z 축. TBD.

**예시**
- ✅ `ax({surface: 'raised'})` → shadow/z-index 자동 페어링
- ❌ 카드에 `boxShadow: '0 2px 4px #000'` 직접 지정

---

## P-05 Color as Role ✅

**원리**
색상은 "파란색"이 아니라 "primary/muted/danger" **역할**로 분류한다. 구체 색상 값은 런타임 결정.

**정의**
Color = Role (primary, secondary, muted, accent, danger, success, warning, ...). 실제 RGB/OKLCH 값은 테마(Light/Dark/Contrast)에서 주입.

**업계 증거 (1·2군)**
- Material 3 — primary/secondary/tertiary/surface/error. [m3.material.io](https://m3.material.io/styles/color/roles)
- Radix — accent/gray + semantic
- shadcn — primary/secondary/muted/accent/destructive
- Apple — label/fill/tint semantic
- Vercel Geist — **10-slot 기능형 색** (BG/comp/border/HC/text). [vercel.com/geist/colors](https://vercel.com/geist/colors)
- Linear — surfaces/texts/icons/controls 역할 분리

**수학·인지 근거 (3군)**
구조 매핑 (색-역할 결합). 인지적 기능 매핑 — 사용자는 "빨강"을 보지 않고 "경고"를 본다.

**반증 조건**
컴포넌트에 hex/rgb 값을 직접 주입해도 Light/Dark 모드 전환 시 일관성이 유지된다면 거짓.

**ax 매핑** ⬜
role/surface 축에 색상 귀속, chroma로 강도 조절. TBD.

**예시**
- ✅ `ax({role: 'danger'})` → 모드 전환에 자동 대응
- ❌ `style={{ color: '#ef4444' }}` — Dark mode에서 깨짐

---

## P-06 Chroma Scale with Paired Foreground ✅ ⚡

**원리**
색상은 강 → 약 단계(chroma scale)를 갖고, 각 단계에 짝이 되는 배경-전경 토큰이 자동 페어링된다.

**정의**
```
Scale = {s1, s2, ..., sN}
각 sᵢ 에 대해 pair(sᵢ) = {bg: sᵢ, fg: sⱼ}
```
Oklab L 기반 지각 균일 필수. Radix 12-step 또는 유사 체계.

**업계 증거 (1·2군)**
- Radix Colors 12-step — "step 11 Lc60 … step 12 Lc90 APCA on step 2". [radix-ui.com](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale)
- Material 3 Tonal Palette — 13 tones + on-pair
- shadcn — semantic background and foreground pairs
- Tailwind v4 — 전면 OKLCH, P3
- W3C DTCG 2025.10 — OKLCH 정식 지원
- Vercel Geist — 1-10 기능 역할 고정

**수학·인지 근거 (3군)**
- Oklab Euclidean √(a²+b²), **Lightness RMS 0.20** (CIELAB 1.70 대비 8.5× 개선). [bottosson.github.io](https://bottosson.github.io/posts/oklab/)
- CIEDE2000 ΔE < 1 imperceptible; 1-2 훈련된 눈; >5 명백
- Weber-Fechner: ΔS ∝ log ΔI; Stevens brightness exponent ≈ 0.33

**반증 조건** ⚡ 정량
- HSL lightness 사용 → 지각 비균일 (CIELAB 대비 RMS 8.5× 악화)
- 인접 surface/text 간 **ΔE2000 < 1** → 경계 불가시
- APCA **Lc < 45** on headlines → 대비 실패

**ax 매핑** ⬜
chroma 축(5단계) + on-pair(derived). `feedback_color_system` 기준 Oklab 정합성 재검증 필요. TBD.

**예시**
- ✅ `ax({surface: 'primary.soft'})` — chroma/pair 자동
- ❌ `ax({ bg: '#3b82f6', fg: '#e0e7ff' })` — hex 직접, 페어링 비검증

---

## P-07 Accent Constraint 🔄

**원리 (재명명: Singularity → Constraint)**
Accent 색상 family는 **제약된 소수 집합(5~9)**으로 한정된다. "1채널"이 아니라 "family of limited accents".

**정의**
```
Accent ∈ {semantic: 5-9 (primary, danger, success, warning, info, ...), brand: 0-2}
```
임의 색 생성 금지. family 크기는 Miller 7±2 상한.

**업계 증거 (1·2군)**
- Vercel Geist — accent 7종(Blue/Red/Amber/Green/Teal/Purple/Pink). [vercel.com/geist](https://vercel.com/geist/introduction)
- Radix — accent 1개 + gray. 나머지 semantic
- Material 3 — seed 1개 → 5 key color 파생
- Apple — tintColor 1개
- **Refactoring UI — "need multiple accent" for "bland UI"**. [refactoringui.com](https://refactoringui.com/previews/building-your-color-palette/)
- **Linear만 1채널** (base/accent/contrast). [linear.app](https://linear.app/now/how-we-redesigned-the-linear-ui)

**수학·인지 근거 (3군)**
- Selective attention, pop-out (Treisman)
- Accent가 너무 많으면(>9) 시각 우선순위 혼란 — Miller 7±2 상한
- 너무 적으면(1) 상태 구분 실패 (success/warning/danger 구분 불가)

**반증 조건**
- Accent 1개로 success/warning/danger/info를 구분할 수 있다면 "Singularity" 주장이 맞음 → 업계 다수는 반대
- Accent > 9개 → 혼란 발생

**ax 매핑** ⬜
role 축에 accent family 등록 (primary/danger/success/warning/info). TBD. 이전 `feedback_color_system`의 "accent 1채널"은 **의미 조정 필요**.

**예시**
- ✅ 5-7개 semantic role + 1-2 brand role
- ❌ 임의 `accentColor: '#ff5733'` 인라인
- ❌ accent만 15개 정의

---

## P-08 Focus Visibility ✅ ⚡

**원리**
포커스 링은 현재 surface와 상관없이 항상 가시적이며 대비가 **수학적으로 보장**된다.

**정의**
focus state에 대비 ≥ APCA Lc 60 페어가 자동 결정. surface 교체 시 focus 색 자동 조정.

**업계 증거 (1·2군)**
- Radix Themes — "automatically adjusts the focus and selection colors". [radix-ui.com](https://www.radix-ui.com/themes/docs/theme/color)
- shadcn — `--ring` token 전용
- Apple HIG — Increase Contrast 대응 + 3:1
- Vercel Geist — Step 7 focus rings
- Linear — keyboard-first

**수학·인지 근거 (3군)**
- **APCA Lc ≥ 60** (비텍스트/UI 기준). [apcacontrast.com](https://git.apcacontrast.com/documentation/APCAeasyIntro.html)
- Lc 45/60/75/90 단계, "halving/doubling Lc = 지각 대비 동일 변화"
- WCAG 2.1 비텍스트 UI 대비 3:1 최소 (APCA가 더 정확)
- Contrast sensitivity function (CSF) — 공간 주파수에 따른 대비 감도

**반증 조건** ⚡ 정량
- APCA **Lc < 45** on headlines → 실패
- **Lc < 60** on 24px body 또는 UI → 실패
- focus ring이 특정 surface에서 사라지는(Lc < 15) 케이스 발생 → 위반

**ax 매핑** ⬜
focus 축 또는 interactive 축 내부 상태. APCA 기반 자동 페어링 필요. TBD.

**예시**
- ✅ focus ring 색이 surface 교체에 자동 따라옴
- ❌ `outline: 2px solid blue` 인라인 — Dark surface에서 실종

---

## P-09 Interactive States ✅ ⚡

**원리**
모든 인터랙티브 요소는 default → hover → active → focus 3~4단의 대칭 상태 전이를 가진다. **(State Layer Overlay 흡수)**

**정의**
```
state ∈ {rest, hover, active, focus, disabled}
```
각 상태가 색/대비/투명도를 **대칭적으로** 조정. 상태별 토큰 스케일 공유 (Radix 12-step style, Material state layer).

**업계 증거 (1·2군)**
- Material 3 — state layer **hover 8%, focus 10%, pressed 10%**. [ux.stackexchange.com](https://ux.stackexchange.com/questions/145496)
- Radix — step 3/4/5 = rest/hover/active, 6-8 border, 9-10 solid, 11-12 text
- Vercel Geist — rest/hover/active 3단을 BG·border·high-contrast 모두 대칭 배치
- Panda — compound variant로 hover/focus 표현
- Tailwind — `hover:` / `focus:` / `active:` modifiers

**수학·인지 근거 (3군)**
- **Fitts's Law: MT = a + b·log₂(2D/W)** — 타깃 도달 시간 예측. [Fitts Wikipedia / Mack York](https://www.yorku.ca/mack/JMB89.html)
- State layer overlay 패턴 (Material 투명도 8/10/10%)
- 상태 전이 애니메이션 200~300ms = 인지 연속성 유지

**반증 조건** ⚡ 정량
- hover/active 상태 간 대비 변화 **ΔE < 1** → 전이 불가시 (Weber-Fechner JND 미달)
- state layer 투명도가 불균등(예: hover 5%, active 15%) → 대칭 위반

**ax 매핑** ⬜
interactive 축 + state 축. 상태별 chroma/luminance shift 규칙. TBD.

**예시**
- ✅ `ax({interactive: 'item'})` — 4상태 자동 처리
- ❌ `:hover { background: '#eee' }` 인라인 CSS — surface 무관하게 고정

---

## P-10 Density Modes (Cowan Ceiling) 🔄 ⚡

**원리 (보정: Miller 7 → Cowan 4)**
정보 밀도 모드(compact/default/comfortable)는 크기 축과 **독립**이며, 단일 그룹 상한은 **Cowan 4±1**이다. **(Cognitive Chunking 흡수)**

**정의**
```
density ∈ {compact, default, comfortable}  —— cs 축과 직교
단일 그룹 요소 수 ≤ 4 (권장), ≤ 7 (Miller 상한)
```

**업계 증거 (1·2군)**
- **Material 3 Density — default/comfortable/compact, -1/-2/-3 = 4px↓**. [m3.material.io](https://m3.material.io/foundations/layout/understanding-layout/density)
- Gmail — Comfortable/Cozy/Compact 3단
- Linear — compact 내장

**수학·인지 근거 (3군)**
- **Hick-Hyman: RT = a + b·log₂(n+1)** — 선택지 n에 따른 결정 지연
- **Miller 1956 → Cowan 2001 보정**: 단일 chunk working memory 용량 4±1 (Miller 7±2는 과대평가). [Miller PDF](https://labs.la.utexas.edu/gilden/files/2016/04/MagicNumberSeven-Miller1956.pdf)
- Cognitive Chunking — 그룹 개수로 인지 부하 관리

**반증 조건** ⚡ 정량
- 단일 그룹에 선택지 **> 7** (Miller 상한) → 작업 기억 초과
- **> 4** (Cowan 정밀) → 결정 지연 증가
- Comfortable/Compact 전환 시 cs(크기) 축이 함께 변경됨 → 독립 축 원칙 위반

**ax 매핑** ⬜
density 축 (**선택 축**으로 포지셔닝). 데이터 집약 UI(CMS, TreeGrid)에서만 활성. TBD.

**예시**
- ✅ `ax({density: 'compact'})` — padding/gap만 조정, 글자 크기 유지
- ❌ Compact 모드가 font-size도 함께 줄임 — 크기 축 침범
- ❌ 메뉴 단일 레벨에 항목 12개 (Cowan 상한 초과)

---

## P-11 Typography Hierarchy ✅

**원리**
타이포그래피는 display → headline → body → caption의 단일 위계를 형성하며, 각 단계가 line-height/weight/tracking을 **묶어서 포함**한다.

**주의:** 줄 길이(line length)는 분리됨 → **P-19 Saccade Line Length** 참조.

**정의**
```
Typography = {display, headline, title, body, label, caption}
각 단계 = (font-size, line-height, weight, letter-spacing) 번들
```
개별 속성 분리 지정 불가.

**업계 증거 (1·2군)**
- **Material 3** — display/headline/title/body/label × L/M/S = **15 tokens**. [medium](https://medium.com/@vosarat1995/material-3-you-typography-cheatsheet-ffc58c540181)
- **Apple HIG** — Title1/Body/Footnote 등 11개 Text Styles + Dynamic Type. [apple](https://developer.apple.com/design/human-interface-guidelines/typography/)
- Radix — 9-step, size prop이 line-height+tracking 포함
- W3C DTCG — typography composite token
- **Refactoring UI — "색/굵기로 hierarchy, 크기 아님"** (크기만으로 위계 금지)

**수학·인지 근거 (3군)**
- Bringhurst: line-height ≈ 1.5 em; "tight, variable" (실제 1.2-1.4대 다수)
- Weight 100-900 스케일 (CSS 표준)
- 음악적 조화 (Typography = 청각 리듬)

**반증 조건**
- font-size만 조정하고 line-height/weight/tracking은 기본값 → 단계 혼란
- display와 body가 같은 weight+letter-spacing → 위계 실패

**ax 매핑** ⬜
text 축 + role 흡수 가능. font composite token. TBD.

**예시**
- ✅ `ax({role: 'heading', cs: 'lg'})` — line-height/weight 자동
- ❌ `style={{ fontSize: '24px' }}` 만 조정, line-height 기본

---

## P-12 Shape Family ✅

**원리**
Corner radius는 component category에 귀속된다 (button-sm, card-md, modal-lg).

**정의**
Shape = family mapping (component + size → radius). 임의 radius 값 금지, 계단 사용.

**업계 증거 (1·2군)**
- Material 3 Corner Radius Scale — none/xs 4/sm 8/md 12/lg 16/xl 28/full. [m3.material.io](https://m3.material.io/styles/shape/corner-radius-scale)
- Radix — radius 6-step scale
- Tailwind — radius xs/sm/md/lg/xl/2xl/3xl/4xl
- Apple — Rounded variant
- [Google Shape System](https://medium.com/google-design/you-need-a-shape-system-8d2aa9016817)

**수학·인지 근거 (3군)**
- Shape family = 브랜드 정체성 표현 (rigid, playful, formal)
- Round letter overshoot 2-3% — 수학 정렬 ≠ 시각 정렬 (P-21 연결)

**반증 조건**
- Button에 임의 radius(`border-radius: 3.7px`) 적용 → 계단 위반
- Card와 Button이 무관한 radius → shape family 불일치

**ax 매핑** ⬜
radius 축이 role+cs 파생. TBD.

**예시**
- ✅ `ax({role: 'button', cs: 'md'})` → radius 8px
- ❌ `border-radius: 11px` 인라인

---

## P-13 Token Tiering 🆕

**원리 (즉시 승격, Composite Token 흡수)**
토큰은 3계층 구조를 가진다: **Reference → Semantic → Component**.

**정의**
```
Reference (Primitive):  color.blue.500, spacing.8
Semantic (Alias):       color.primary = color.blue.500
Component:              button.bg = color.primary
```
ax의 Public 축(cs/role/surface)이 Semantic 계층, Private 프리셋이 Component 계층에 대응. `project_ax_public_private_split` 메모리와 정확히 동일 구조.

**업계 증거 (1·2군)**
- Material 3 Design Tokens — primitive/reference/system tokens
- Figma Variables — 3-tier collections. [help.figma.com](https://help.figma.com/hc/en-us/articles/14506821864087)
- Tokens Studio — DTCG 기반. [docs.tokens.studio](https://docs.tokens.studio/manage-settings/token-format)
- **W3C DTCG 2025.10 stable** — 체인 참조 허용 (alias). [designtokens.org](https://www.designtokens.org/tr/drafts/format/) / [stable announcement](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/)
- shadcn — CSS variables 3층 (base / semantic / component)
- Panda — token + semantic token + recipe

**수학·인지 근거 (3군)**
- Abstraction layering — 변경 격리 (primitive 교체해도 component 불변)
- 3계층이 최소 필요 집합: 값(primitive) ↔ 의미(semantic) ↔ 응용(component)

**반증 조건**
- 1계층(primitive만) → 브랜드 변경 시 모든 컴포넌트 수정
- 2계층(primitive + component) → semantic 생략 시 재매핑 폭증
- 4+계층 → 불필요한 간접성

**ax 매핑** ⬜
`project_ax_public_private_split` 이미 2계층(Public/Private) 운영 중. 3계층으로 명시화 필요. TBD.

**예시**
- ✅ `color.blue.500` → `color.primary` → `button.bg` 체인
- ❌ 컴포넌트에 `#3b82f6` 직접 (primitive 건너뜀)
- ❌ `button.bg = #3b82f6` (semantic 건너뜀)

---

## P-14 Mode Switching 🆕

**원리 (즉시 승격)**
동일 디자인 시스템이 Light/Dark/High-Contrast/브랜드 모드를 **파일 복제 없이** 교체한다.

**정의**
```
modes = {light, dark, hc-light, hc-dark, brand-a, brand-b, ...}
토큰 값만 모드별 스위치 — 구조는 공유
```

**업계 증거 (1·2군)**
- **W3C DTCG 2025.10** — "manage light/dark modes, accessibility variants, and brand themes without file duplication"
- Figma Variables modes — 다중 축 (light/dark × brand × density). [help.figma.com](https://help.figma.com/hc/en-us/articles/14506821864087)
- Apple `systemBackground` 자동 전환
- Material 3 Dynamic Color
- shadcn `.dark` class
- Vercel Geist P3 mode

**수학·인지 근거 (3군)**
- DRY 원칙 (Don't Repeat Yourself)
- Accessibility 법규 대응 (Increase Contrast 등)

**반증 조건**
- Light/Dark를 별도 파일로 관리, diff가 구조적 → DRY 위반
- 모드 전환 후 레이아웃/구조가 바뀜 → modes 원칙 위반 (값만 바뀌어야 함)

**ax 매핑** ⬜
theme 축 또는 별도 mode layer. CSS `@media (prefers-color-scheme)` / class switch. TBD.

**예시**
- ✅ 단일 token 정의, 모드별 값 주입
- ❌ `light.css` / `dark.css` 파일 분리, 값 중복

---

## P-15 Perceptual Color Space (OKLCH) 🆕 ⚡

**원리 (즉시 승격)**
색 조작(scale 생성, 페어링, blending)은 **지각 균일 색공간**(OKLCH/Oklab)에서 수행한다. HSL/RGB 금지.

**정의**
color operations in OKLCH space. Lightness/Chroma/Hue 분리로 의도적 조작. P3 gamut 지원.

**업계 증거 (1·2군)**
- **Tailwind v4 전면 OKLCH**. [tailwindcss.com](https://tailwindcss.com/docs/theme)
- shadcn — OKLCH. [ui.shadcn.com](https://ui.shadcn.com/docs/theming)
- Radix APCA — 지각 대비 계산
- Vercel Geist — OKLCH, P3
- W3C DTCG 2025.10 — CSS Color Module 4 (Display P3, OKLCH 정식)
- Linear — LCH

**수학·인지 근거 (3군)**
- Oklab Lightness **RMS 0.20** (CIELAB 1.70 대비 **8.5× 개선**). [Ottosson](https://bottosson.github.io/posts/oklab/)
- Weber-Fechner log 비선형성
- Stevens brightness exponent ≈ 0.33 — 입력 밝기 ↔ 지각 밝기

**반증 조건** ⚡ 정량
- HSL `lightness` 50% 조정 → 색상에 따라 지각 밝기 편차 (파랑이 빨강보다 어두워 보임)
- RGB linear 블렌딩 → 회색(회색이 탁함) / 채도 손실
- P3 미지원 → 광색역 디스플레이에서 색 소실

**ax 매핑** ⬜
chroma 축의 내부 계산을 OKLCH로. Light/Dark 모드 전환도 OKLCH shift. TBD.

**예시**
- ✅ `oklch(65% 0.18 240)` 사용
- ❌ `hsl(240 70% 50%)` 기반 scale 생성

---

## P-16 Fitts Target Size 🆕 ⚡ [조건부]

**원리 (조건부 승격)**
Touch primary UI에서 인터랙티브 타깃은 **최소 44×44 CSS px** (WCAG 2.1 AAA, Fitts 정본).
Desktop + keyboard primary에서는 28-36 px 허용 (프로젝트 규약·Linear 레퍼런스).

**조건부 판정:**
- Touch/모바일 → 44×44 px 엄격 적용 (non-negotiable)
- Desktop + 키보드 우선 (현 프로젝트) → control 36 px / item 28 px 수용
- Hybrid (양쪽 대응) → primary 채널 기준

**이 프로젝트 스코프 (2026-04-18):**
- 현재: Desktop/keyboard 우선 (`user_fe_developer` memory + Linear 28px 법칙) → 28/36 px 유지
- Touch UI 커버리지 확장 시 원리 자동 활성화 — 03-ax-mapping.md §4 쟁점 1 참조
- `feedback_judgment_priority` — 프로젝트 규약 > 외부 표준 (단, 수학적 근거 자체는 유효하므로 기각 아닌 조건부)

**정의**
```
hit area ≥ 44 × 44 CSS px  (touch primary)
hit area ≥ 28 × 28 CSS px  (desktop + keyboard primary, 프로젝트 허용)
```
Apple 44pt, Material 48dp. 시각 사이즈가 아닌 hit 영역 기준.

**업계 증거 (1·2군)**
- **WCAG 2.1 SC 2.5.5 Target Size — 44×44 CSS px**. [w3.org](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- Apple HIG — 44pt. [developer.apple.com](https://developer.apple.com/design/human-interface-guidelines/typography/)
- Material 3 — 48dp
- Microsoft Fluent — 40epx
- 자동차 UI — 76dp

**수학·인지 근거 (3군)**
- **Fitts's Law: MT = a + b·log₂(2D/W)** — 거리 D와 너비 W로 이동시간 예측
- MIT Touch Lab — 손가락 폭 1.6-2 cm ≒ 45-57 CSS px
- Shannon 정보이론 기반 (ID = bits)

**반증 조건** ⚡ 정량
- 타깃 **< 44×44 CSS px** → WCAG 2.5.5 AAA 실패, Fitts ID 증가로 오류율 상승
- 시각 사이즈 vs 히트 사이즈 괴리 (아이콘 16px + 28px padding)인데 실제 hit area 16px만 잡힘 → 위반

**ax 매핑** ⬜
interactive 축과 cs 축의 최소값 강제. TBD.

**예시**
- ✅ 16px 아이콘 + 14px padding = 44px hit area
- ❌ 16px 아이콘만, padding 0 — WCAG 실패

---

## P-17 Slot Recipe 🔵

**원리 (승격 후보 → 확정)**
복합 컴포넌트(Button with Icon, Card with Header+Content+Footer 등)는 **역할별 slot × 공유 variant** 매트릭스로 선언한다.

**정의**
```
recipe = {
  slots: [root, control, label, icon, ...],
  variants: [size, intent, disabled]
}
```
각 slot이 variant를 독립적으로 받아 조합.

**업계 증거 (1·2군)**
- **Panda CSS Slot Recipes — 독창적 명명**. [panda-css.com](https://panda-css.com/docs/concepts/slot-recipes)
- Material 3 Component Tokens — 내부적으로 slot 분리
- Radix Primitives — Compound components 패턴

**수학·인지 근거 (3군)**
- 직교성 (orthogonality) — slot과 variant 곱으로 조합 폭발 방지
- SRP (Single Responsibility) — 각 slot이 고유 역할

**반증 조건**
- 복합 컴포넌트에 slot 분리 없이 단일 className → 내부 파트 독립 스타일 불가
- variant가 slot별로 다른 의미 → orthogonality 위반

**ax 매핑** ⬜
`ui/composites/` 레이어와 연결. `project_a2ui_composites` 참조. TBD.

**예시**
- ✅ `Card` = {root, header, body, footer} × {size: sm/md/lg}
- ❌ `<div className="card card-header">` — slot 혼재

**승격 근거:** Panda 단독 명명이지만 원리 자체는 Material Component Tokens·Radix Compound에 암묵 존재. ax `ui/composites/`에 이미 부분 구현. 승격 확정.

---

## P-19 Saccade Line Length 🆕 ⚡

**원리 (즉시 승격)**
본문 텍스트 줄 길이는 **45~75 문자** 범위를 유지한다. 이상값 66자.

**정의**
```
line length (measure) ∈ [45ch, 75ch]  for single-column body
multi-column:                [40ch, 50ch]
```

**업계 증거 (1·2군)**
- **Bringhurst, "The Elements of Typographic Style"** — 66자 이상적, 45-75 허용. [webtypography.net](http://webtypography.net/2.1.2)
- **Refactoring UI (Adam Wathan/Steve Schoger)** — "줄당 45-75자"
- Apple HIG — 암묵 (Dynamic Type + 읽기 최적 폭)
- Medium.com — 70자 근처 layout

**수학·인지 근거 (3군)**
- **Saccade** — 시각 점프 범위에 맞춘 줄 길이
- 중심와(fovea) 해상도 — 한 시점에 파악 가능한 문자 수
- Bringhurst PDF. [readings.design](https://readings.design/PDF/the_elements_of_typographic_style.pdf)

**반증 조건** ⚡ 정량
- 한 줄 **> 75자** → 줄바꿈 복귀 실패, 같은 줄 재독
- 한 줄 **< 45자** → 과도한 saccade, 리듬 붕괴
- multi-column에서 40자 미만 → 단어 쪼개짐

**ax 매핑** ⬜
text 축 또는 layout 축의 max-width 제약. `max-width: 65ch`. TBD.

**예시**
- ✅ `ax({role: 'body', layout: 'reading'})` → max-width 65ch
- ❌ Article body `width: 100%` 1200px 와이드 스크린

---

## P-20 Figure-Ground Contrast 🔵

**원리 (승격 후보 → 확정)**
UI는 "**figure(콘텐츠)**"와 "**ground(컨테이너)**"의 이분 지각을 명시적으로 설계한다.

**정의**
```
figure = 주목 대상 (메시지, 카드, 모달)
ground = 배경/컨테이너
```
둘의 대비가 Gestalt 원리로 보장. Surface Hierarchy와 다름 — 깊이가 아닌 **주목/배경**의 이분.

**업계 증거 (1·2군)**
- **Arc Browser** — 웹 = figure, 브라우저 = ground. Boosts로 재스타일
- Linear — panel/modal의 ground 처리
- Apple — systemBackground/groupedBackground 분리

**수학·인지 근거 (3군)**
- **Gestalt Figure-Ground (Wertheimer 1923)**. [Scholarpedia](http://www.scholarpedia.org/article/Gestalt_principles)
- APCA Lc로 figure-ground 대비 정량화
- 양가적 도형 (Rubin's vase) — 정확한 대비 없으면 지각 흔들림

**반증 조건**
- figure와 ground 구분이 명확하지 않음 → 콘텐츠 부상 실패
- ground가 figure를 압도하는 강도(과다 texture) → 집중 분산

**ax 매핑** ⬜
surface 축의 base vs raised 관계로 부분 구현. content 명시 필요. TBD.

**예시**
- ✅ base surface(ground) + elevated card(figure) + focus ring
- ❌ 전체가 동일 surface + 카드 border만 — figure 부상 실패

**승격 근거:** Gestalt는 디자인 기본 원리이나 ax에 명시되지 않음. Arc가 실제 제품에서 증명. P-04(Surface Hierarchy)와 독립 — 깊이가 아닌 주목/배경 이분. 승격 확정.

---

## P-21 Optical Alignment 🔵

**원리 (승격 후보 → 확정)**
시각 정렬 ≠ 수학 정렬. 원형/곡선 요소는 수학 정렬 대신 **시각 무게 중심**으로 정렬한다.

**정의**
- round letters → cap-height 위·baseline 아래로 **overshoot**
- 재생/일시정지 아이콘 → 삼각형 시각 중심 offset
- 버튼 내부 텍스트 → optical center 배치

**업계 증거 (1·2군)**
- **Marvel Blog** — optical alignment 해설
- **Figma** — 아이콘 제작 가이드에 overshoot 권장
- Apple San Francisco 폰트 — metric/optical 버전 분리

**수학·인지 근거 (3군)**
- **Overshoot 2-3%** — 라운드 자간 표준
- Robert Bringhurst — 기계적 정렬의 시각적 오류
- 시각 무게 중심 — 기하학 중심과 다름 (삼각형은 1/3 기준)

**반증 조건**
- 삼각형 재생 아이콘을 기하학적 중심에 배치 → 왼쪽으로 치우쳐 보임
- 원형 버튼의 텍스트를 baseline에 정렬 → 위로 떠 보임

**ax 매핑** ⬜
icon 축 또는 typography composite token의 optical flag. 대부분 폰트/아이콘 SVG 레벨 처리. TBD.

**예시**
- ✅ 재생 아이콘 triangle `cx = 40% (not 50%)`
- ❌ 모든 아이콘 `cx = 50%` (기하학 중심)

**승격 근거:** 업계 2군 증거는 간접적이나 3군 수학 근거 강함. 저수준 원리이지만 완성도의 결정 요소. ax의 icon/typography 처리에 명시 필요. 승격 확정.

---

## 요약

| 분류 | 카운트 | 원리 |
|------|--------|------|
| ✅ 기존 확정 | 12 | P-01, P-02, P-03, P-04, P-05, P-06, P-08, P-09, P-11, P-12 + 보정 2 (P-07, P-10) |
| 🆕 즉시 승격 | 5 | P-13, P-14, P-15, P-16, P-19 |
| 🔵 후보 확정 | 3 | P-17, P-20, P-21 |
| **합계** | **20** | |
| ⚡ 정량 반증 가능 | 10 | P-02, P-03, P-06, P-08, P-09, P-10, P-15, P-16, P-19 (+ 일부 P-21) |

## 다음 단계

- Task 4: `03-ax-mapping.md` — 20개 원리 × ax 24축 Locked/Exposed/Missing 매트릭스
- Task 5: `04-gap-plan.md` + `DESIGN.md` 재편
