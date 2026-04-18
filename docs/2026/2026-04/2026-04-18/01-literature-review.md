---
id: research/ax/01-literature-review
title: '01 Literature Review — 1·2·3군 외부 탐색 통합'
created: 2026-04-18
updated: 2026-04-18
summary: '**작성일:** 2026-04-18 **조사 방법:** 3개 independent agent 병렬 탐색 (WebSearch + WebFetch) **조사 대상:** 1군 업계 표준 / 2군 현업·도구 / 3군 원리·수학·인지'
legacy:
  status: research
  kind: note
  topics: [research]
  relates: []
  supersedes: []
---
# 01 Literature Review — 1·2·3군 외부 탐색 통합

**작성일:** 2026-04-18
**조사 방법:** 3개 independent agent 병렬 탐색 (WebSearch + WebFetch)
**조사 대상:** 1군 업계 표준 / 2군 현업·도구 / 3군 원리·수학·인지

---

## Executive Summary

### 초안 12개 원리 검증 결과

**1군 (Material 3 / Radix / shadcn / Apple HIG / Figma):**
- **12개 중 11개가 과반(≥3/5) 수렴**, 평균 3.4/5 명시 지지
- **Density(P-10)는 Material 단독** — 나머지 레퍼런스엔 암묵조차 없음

**2군 (Linear / Vercel Geist / Tailwind+RefactoringUI / Panda / W3C DTCG):**
- **Color as Role, Chroma Scale, Interactive States, Typography Hierarchy 4개가 매우 강함** (전 도구 채택)
- **Accent Singularity(P-07)는 Linear만 채택** — 업계 다수는 멀티 accent (Vercel 7색, Refactoring UI "need multiple accent")

**3군 (Bringhurst / Modular scale / Müller-Brockmann / Oklab / APCA / Fitts / Miller):**
- **12개 중 6개 (Size Ladder·Spatial Rhythm·Chroma·Focus·Interactive·Typography)가 수학 공식/임계치로 직접 반증 가능**
- **Miller 7±2는 Cowan 4±1로 보정**이 현대 인지과학 정합
- **Golden ratio는 myth** — 본질은 "modular"지 1.618 자체가 아님
- **WCAG 2는 APCA로 대체가 더 정확** (spatial frequency 반영)

### 신규 원리 후보 발굴 (중복 제거 후 13개)

| 후보 | 1군 | 2군 | 3군 | 승격 |
|------|-----|-----|-----|------|
| P-13 Token Tiering | 5/5 | 매우 강함 | — | ⭐ 즉시 |
| P-14 Mode Switching | 4/5 | W3C 표준 | — | ⭐ 즉시 |
| P-15 Perceptual Color Space (OKLCH) | 2/5 | 매우 강함 | 수학 강 | ⭐ 즉시 |
| P-16 Fitts Target Size | 2/5 | — | 공식 정본 | ⭐ 즉시 |
| P-19 Saccade Line Length (45-75ch) | Apple 암묵 | Refactor UI 명시 | Bringhurst | ⭐ 즉시 |
| P-17 Slot Recipe (multi-part) | — | Panda 독창 | — | 승격 후보 |
| P-20 Figure-Ground | — | Arc 명시 | Gestalt 핵심 | 승격 후보 |
| P-21 Optical Alignment | — | — | 3군 강 | 승격 후보 |
| P-18 Composite Token | — | W3C 표준 | — | P-13 흡수 |
| P-22 Motion/Easing | 1/5 | — | — | 보류 (증거 약함) |
| P-23 Cognitive Chunking | — | — | Cowan 4 | P-10 흡수 |
| P-24 State Layer Overlay | Material 단독 | — | — | P-09 흡수 |
| P-25 Theme Contrast Knob | — | Linear 단독 | — | 보류 (단일 증거) |

### 기존 12개 재정렬 필요

- **P-07 Accent Singularity** → **"Accent Constraint"** 로 재명명. "1채널"이 아닌 "accent family의 제약된 집합(5~9)"
- **P-10 Density** → Miller 7 → **Cowan 4±1** 수치 교체. "선택 축" 포지셔닝
- **P-11 Typography Hierarchy** → P-19 Saccade Line Length 분리 승격

---

## §1. 1군 — 업계 de facto 표준

### 1.1 원리 × 레퍼런스 매트릭스

| # | 원리 | Material 3 | Radix | shadcn | Apple HIG | Figma | 수렴도 |
|---|------|------------|-------|--------|-----------|-------|--------|
| 1 | Role→Structure 파생 | O (component category→shape+elevation+typography) | O (size prop 1-9이 font+line-height+letter-spacing 동기화) | O (size sm/default/lg가 height+padding+radius 일괄) | △ (Text Style이 body/headline 내부값 묶음) | O (Component tier tokens) | **5/5** |
| 2 | Size Ladder SSOT | △ (Typography만 3단) | O (9-step, typography+spacing 공유) | △ (컴포넌트별 sm/default/lg) | △ (Dynamic Type) | O (primitive tier) | 3/5 |
| 3 | Spatial Rhythm (grid) | O (8dp baseline + 4dp type) | △ (9-step spacing) | X (Tailwind 1-96) | △ (8pt) | △ | 2/5 |
| 4 | Surface Hierarchy | O (Surface1-5 tonal + 6 elevation) | △ (panelBackground solid/translucent, step 1-5) | O (background/card/popover 3단) | O (systemBackground primary/secondary/tertiary) | △ | 4/5 |
| 5 | Color as Role | O (primary/secondary/tertiary/surface/error) | O (accent/gray + semantic) | O (primary/secondary/muted/accent/destructive) | O (label/fill/tint semantic) | O (semantic tier) | **5/5** |
| 6 | Chroma Scale + 페어링 | O (tonal palette 13 tones + on-pair) | O (12-step + step11/12 APCA Lc60/Lc90 on step 2) | O (foreground pair convention) | △ (label 4단 hierarchy) | △ | 4/5 |
| 7 | Accent Singularity | O (seed 1개→5 key color 파생) | O (Theme accent 1개) | O (primary 1채널) | O (tintColor 1개) | △ (브랜드 primitive) | 4/5 |
| 8 | Focus Visibility | △ (state layer focus 10%) | O (focus 색 accent 기반 자동) | O (ring token 전용) | O (Increase Contrast 대응 + 3:1) | X | 3/5 |
| 9 | Interactive States | O (hover 8%, focus 10%, pressed 10% state layer) | O (step 3/4/5 = rest/hover/active) | △ (variant 내 hover:/focus:) | △ (Highlighted/Selected) | X | 3/5 |
| 10 | Density Modes | O (default/comfortable/compact, -1/-2/-3 = 4px↓) | X | X | X | X | **1/5** |
| 11 | Typography Hierarchy | O (display/headline/title/body/label × L/M/S = 15 tokens) | O (9-step, size prop이 line-height+tracking 포함) | △ (heading/text utility) | O (Title1/Body/Footnote 11개 + Dynamic Type) | △ | 4/5 |
| 12 | Shape Family | O (none/xs 4/sm 8/md 12/lg 16/xl 28/full) | O (radius 6-step scale) | △ (컴포넌트별 rounded-md 고정) | △ (Rounded variant) | △ | 3/5 |

### 1.2 1군 신규 원리 후보

- **A. Token Tiering (Primitive → Semantic → Component)** — 세 레퍼런스가 같은 3층 구조 명시. Material/Figma/Tokens Studio/shadcn/Panda 공통. **ax의 Public/Private 2계층 분리와 정확히 대응** → 즉시 승격
- **B. Mode Switching (Light/Dark/Contrast)** — Figma `modes`, Apple `systemBackground` 자동 전환, Material `dynamic color`, shadcn `.dark` class
- **C. Perceptual Color Space** — shadcn OKLCH, Radix APCA
- **D. Touch/Hit Target Minimum** — Material 48dp, Apple 44pt
- **E. Motion/Easing Tokens** — 12개 원리에서 누락
- **F. State Layer Overlay 패턴** — Material 8/10/10% 투명도 오버레이 (P-09 하위로 흡수)

### 1.3 1군 주요 충돌

- **Elevation: 그림자 vs 색**
  - M3: tonal elevation 선호(색 tint), shadow 보조
  - Apple/shadcn/Radix: 그림자+surface 색 분리
  - **판정:** 평면 UI(웹)는 tonal, 3D(Android/깊이 강조)는 shadow. Depth ladder는 **두 표현 동시 지원** 필요
- **Size Ladder 단일 vs 분리**
  - Radix: typography+spacing 단일 9-step
  - shadcn: 컴포넌트별 size 개별
  - Material: typography 3-step / radius 7-step 분리
  - **판정:** 작은 팀은 단일 래더(Radix 방식), 큰 팀/풍부한 제품은 분리. ax는 Radix 쪽
- **Chroma 단계 수**
  - Radix 12 / Material 13 tones / shadcn 4-5 shade
  - **판정:** 12-step이 borders+fills+text 모두 커버하는 최소 단위 (Radix 주장이 가장 명확)
- **Density 제1급 여부**
  - Material 단독. 다른 레퍼런스엔 암묵조차 없음
  - **판정:** 데이터 집약 UI(CMS, TreeGrid) 필수 → ax는 유지하되 **선택 축**

### 1.4 1군 핵심 수치

- **Material 3:** 8dp baseline + 4dp type grid, 48dp touch, Shape 0/4/8/12/16/28dp, Elevation 6 levels, state layer 8%/10%/10%, Typography 15 tokens (Display L 57px / Body 16/14/12px), Tonal palette 13 tones, Density 0/-1/-2/-3 = 4px↓
- **Radix:** 12-step chroma (step 9 solid, 6-8 border, step 11 Lc60 / step 12 Lc90 APCA on step 2), Size 9-step, Radius 6-step
- **shadcn:** OKLCH, size 3단(h-9/h-10/h-11), foreground-pair 네이밍
- **Apple:** Touch 44pt, WCAG 4.5:1 text / 3:1 focus, SF Pro/Compact/Rounded, 11 Text Styles, Dynamic Type
- **Figma/Tokens Studio:** 3-tier(primitive/semantic/component), W3C DTCG $value/$type, variable modes

### 1.5 1군 핵심 인용

- [Radix Typography](https://www.radix-ui.com/themes/docs/theme/typography) — "size prop … also provides correct line height and corrective letter spacing" (P-01)
- [Radix Spacing](https://www.radix-ui.com/themes/docs/theme/spacing) (P-02)
- [Material 1 Metrics & Keylines](https://m1.material.io/layout/metrics-keylines.html) — "8dp square baseline grid" (P-03)
- [M3 Color Roles](https://m3.material.io/styles/color/roles) — "Surface1-5" (P-04)
- [shadcn Theming](https://ui.shadcn.com/docs/theming) — "semantic background and foreground pairs" (P-05)
- [Radix Scales](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale) — "step 11 Lc60 … step 12 Lc90 on step 2" (P-06)
- [M3 Density](https://m3.material.io/foundations/layout/understanding-layout/density) (P-10)
- [M3 Corner Radius Scale](https://m3.material.io/styles/shape/corner-radius-scale) (P-12)

---

## §2. 2군 — 현업·도구·최신 디자인 시스템

### 2.1 원리 × 2군 매트릭스

| # | 원리 | Linear | Vercel Geist | Tailwind/RefactorUI | Panda | W3C DTCG | 수렴도 |
|---|------|--------|--------------|---------------------|-------|----------|--------|
| 1 | Role→Structure 파생 | 부분 | 강함 (BG1/BG2, comp 1-3, border 4-6, text 9-10 역할 고정) | 약함(Tailwind 원자) / 강함(RefactorUI 원리) | 강함 (slot recipe) | 중간 | 높음 |
| 2 | Size Ladder SSOT | 약함 | 중간 | 강함 (`--text-xs…9xl`, `--spacing=0.25rem × n`) | 강함 | 강함 (dimension type) | 높음 |
| 3 | Spatial Rhythm | 강함 | 강함 | 강함 (4px 배수) | 중간 | 약함 | 중간 |
| 4 | Surface Hierarchy | 강함 (background/foreground/panel/dialog/modal) | 강함 (BG1/BG2 + comp 1-3) | 중간 | 중간 | 강함 (shadow composite) | 높음 |
| 5 | Color as Role | 강함 | **매우 강함** (10-slot 기능형) | 중간 | 강함 | 강함 (alias tier) | **매우 높음** |
| 6 | Chroma Scale | 강함 (LCH 균일) | 강함 (OKLCH P3) | 강함 (v4 전면 OKLCH) | — | 강함 (2025.10 P3/OKLCH) | **매우 높음** |
| 7 | Accent Singularity | 강함 (3 token: base/accent/contrast) | 부분 (accent 7종) | **반대** ("need multiple accent") | 반대 | — | **낮음 (논쟁)** |
| 8 | Focus Visibility | 강함 (keyboard-first) | 강함 (Step 7 focus rings) | 약함 | — | — | 중간 |
| 9 | Interactive States | 강함 | **매우 강함** (rest/hover/active 3단 대칭 배치) | 강함 (Radix 12-step: 3/4/5=bg, 7/8=border, 9/10=solid) | 강함 (compound variant) | — | **매우 높음** |
| 10 | Density Modes | 강함 (compact 내장) | 약함 | 약함 | — | 약함 | 중간 (Gmail 3단) |
| 11 | Typography Hierarchy | 강함 (Inter Display / Inter 2축) | 강함 (Geist Sans/Mono) | 강함 (xs…9xl + weight 100-900 + tracking 6단) | 강함 | 강함 (composite token) | **매우 높음** |
| 12 | Shape Family | 중간 | 중간 | 강함 (radius xs/sm/md/lg/xl/2xl/3xl/4xl) | 중간 | 중간 | 높음 |

### 2.2 2군 신규 원리 후보

- **Token Tier 3계층 (Reference → Semantic → Component)** — `color.blue.500` → `color.primary` → `button.bg`. DTCG 2025.10 stable + Material/shadcn 공통. **동일 structure를 여러 브랜드·모드에 재매핑** (P-13)
- **Modes without duplication** — W3C 2025.10 stable 표준화. "multi-brand themes without file duplication" (P-14)
- **Slot Recipe (multi-part component)** — Panda: `slots: [root, control, label]` + 공유 variant. **역할별 slot × 공유 variant 직교 매트릭스** (P-17)
- **APCA contrast guarantee** — Radix Step 11/12가 WCAG 대신 APCA로 대비 보장 (P-08 강화)
- **Composite token** — DTCG의 shadow/border/typography/transition/gradient/stroke가 1 토큰 = 다중 속성 (P-18, P-13 흡수)
- **Theme Contrast Knob** — Linear의 `contrast` 토큰: 전체 대비를 한 축으로 조정 (P-25, 단일 증거 보류)
- **Functional Step 10-slot** — Vercel Geist: 1-10이 step 아닌 **기능 역할** (BG/comp/border/high-contrast/text) (P-05+P-06 결합 구체형)
- **Per-Space Identity (Spaces)** — Arc: workspace마다 theme/color 바인딩. 토큰 스코프 확장

### 2.3 제품별 고유 패턴

- **Linear** — 3 토큰(base/accent/contrast) × LCH. "사이드바·탭·헤더·패널의 레이블·아이콘·버튼 수평·수직 정렬" — 즉감 불가 alignment 누적. 98 변수 → 3 변수 축약
- **Arc** — Space마다 독립 theme. 피겨-그라운드 원칙 (웹=figure, 브라우저=ground). Boosts로 웹사이트 재스타일. 토큰 스코프가 product 전역 아님
- **Vercel Geist** — 색 스케일 10개 각각 기능 역할 고정 (BG1/BG2/comp 1-3/border 4-6/HC 7-8/text 9-10). P3. Geist Sans/Mono 2체
- **Gmail** — 3단 density (Comfortable/Cozy/Compact). Comfortable는 화면 크기 유체적, Compact는 고정
- **Radix** — 12-step 함수 스케일: 1-2 BG / 3-5 component state / 6-8 border / 9-10 solid / 11-12 text. "Step 9 = 최고 chroma" 제약

### 2.4 Refactoring UI unconventional wisdom (15개)

1. **"색/굵기로 hierarchy, 크기 아님"** — 2-3 색 (dark/grey/lighter grey), 2 굵기 (400-500 / 600-700)
2. **"컬러 BG엔 grey 텍스트 금지"** — hue를 배경색에 맞춰 hand-pick
3. **"shadow는 blur 말고 vertical offset"** — 위 광원 simulate
4. **"border 줄이고 box-shadow·배경색·spacing로 구분"**
5. **"작은 아이콘 blow up 금지"** — 16-24px를 3-4배 키우면 unprofessional. 배경 shape에 담기
6. **"accent border로 bland UI 살리기"** — 카드 상단·alert 좌측·활성 nav
7. **"모든 버튼이 배경색일 필요 없음"** — primary(solid) / secondary(outline) / tertiary(link) 3단
8. **"em 단위 피하라"** — UI에선 rem/px
9. **"숫자는 우측 정렬"**
10. **"2-3줄 이상 텍스트 center 금지"**
11. **"줄당 45-75자"** — Bringhurst와 일치 (P-19)
12. **"HSL이 hex보다 reasoning 쉬움"** (현재는 OKLCH)
13. **"색당 5-10 shade, 9가 이상적"**
14. **"순수 grey는 지루함 / pure black 금지"** — "saturate with blue for cool, warm for warmer"
15. **"whitespace로 시작해 줄여라"** — "그룹 외부 여백 > 그룹 내부 여백"

### 2.5 W3C Design Tokens 표준 (2025.10 stable)

- **tier:** Reference(`color.blue.500`) → Semantic(`color.primary`) → Component(`button.bg`). alias = `{group.token}` 또는 JSON Pointer `$ref: "#/path"`. 체인 참조 허용, 순환 탐지 필수
- **simple types:** color / dimension / fontFamily / fontWeight / duration / cubicBezier / number
- **composite types:** border / shadow / typography / gradient / transition / strokeStyle
- **groups:** `$value` 없는 JSON object = group. `$type` 상속, `$extends` deep-merge
- **modes/themes:** light/dark, a11y variant, multi-brand을 파일 복제 없이 표현
- **color:** CSS Color Module 4 — Display P3, OKLCH 정식 지원
- **ecosystem:** Figma/Sketch/Framer/Penpot 등 10+ 도구. Adobe/Google/Amazon/Microsoft/Meta/Salesforce editor 20+

### 2.6 2군 핵심 인용

- [Linear — How we redesigned the Linear UI](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [Vercel Geist Introduction](https://vercel.com/geist/introduction) / [Colors](https://vercel.com/geist/colors)
- [Tailwind CSS v4 theme](https://tailwindcss.com/docs/theme)
- [Refactoring UI — Color Palette](https://refactoringui.com/previews/building-your-color-palette/)
- [Panda CSS Recipes](https://panda-css.com/docs/concepts/recipes) / [Slot Recipes](https://panda-css.com/docs/concepts/slot-recipes)
- [W3C Design Tokens Format 2025.10](https://www.designtokens.org/tr/drafts/format/) / [First Stable announcement](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/)
- [Arc Browser design analysis](https://medium.com/design-bootcamp/arc-browser-rethinking-the-web-through-a-designers-lens-f3922ef2133e)

---

## §3. 3군 — 원리·수학·인지과학

### 3.1 원리 × 수학 근거 매트릭스

| # | 원리 | 수학 공식 | 수치 기준 | 인지 근거 | 출처 |
|---|------|----------|----------|----------|------|
| 1 | Role → Structure 파생 | — (구조 매핑) | — | 암묵적 | 업계 패턴 |
| 2 | Size Ladder SSOT | **Sₙ = S₀ × rⁿ** (modular scale) | r ∈ {1.125, 1.2, 1.25, 1.333, 1.414, 1.5, 1.618} | 음계 조화 (Pythagorean) | Every Layout, Bringhurst |
| 3 | Spatial Rhythm | leading = font-size × 1.5; grid = 4/8/12px | baseline 8pt = Retina 정합 | Müller-Brockmann 그리드 | Müller-Brockmann 1961 |
| 4 | Surface Hierarchy | 깊이 ∝ 상대 luminance Δ | — | figure-ground (Gestalt) | Wertheimer 1923 |
| 5 | Color as Role | — (매핑 규약) | — | 기능 매핑 | shadcn 관행 |
| 6 | Chroma Scale | **Oklab Euclidean √(a²+b²); 지각 균일 Lightness RMS 0.20** (CIELAB 1.70 대비 8.5배 개선) | ΔE < 1 imperceptible; 2-3 perceivable; >5 clear | Weber-Fechner (ΔS ∝ log ΔI), **Stevens brightness exponent ≈ 0.33** | Ottosson 2020, CIEDE2000 |
| 7 | Accent Singularity | — (제약 규칙) | — | selective attention, pop-out | UX 경험칙 |
| 8 | Focus Visibility | **APCA Lc ≥ 60** (비텍스트 기준) | Lc 45/60/75/90 단계 | contrast sensitivity function | APCA/WCAG 3 draft |
| 9 | Interactive States | **Fitts: MT = a + b·log₂(2D/W)** | WCAG 2.5.5 = 44×44px; Material = 48dp; MIT Touch Lab 손가락 16-20mm ≒ 45-57px | 운동 제어 Shannon 정보이론 | Fitts 1954, WCAG 2.1 |
| 10 | Density Modes | **Hick-Hyman: RT = a + b·log₂(n+1)** | **n = 4 (Cowan 2001, Miller 보정)** | Miller 7±2 → Cowan 4±1 | Miller 1956, Cowan 2001 |
| 11 | Typography Hierarchy | line-height ≈ 1.5 em; **line length 66ch (45-75)** | Bringhurst 1992: 66 이상적, 45-75 허용, multi-column 40-50 | saccade + 중심와 | Bringhurst, webtypography.net |
| 12 | Shape Family | overshoot % (시각 보정) | 라운드 자간 ~2-3% overshoot | optical alignment, 시각 무게 | Marvel Blog |

### 3.2 정량 비율 카탈로그

**Modular scale (음계 대응):**
- 1.067 Minor Second / 1.125 Major Second / **1.2** Minor Third / **1.25** Major Third / **1.333** Perfect Fourth / **1.414** Augmented Fourth (√2 = ISO 종이) / **1.5** Perfect Fifth / 1.667 Minor Sixth / **1.618** Golden Ratio (φ) / 2.0 Octave
- 문서형 1.067-1.2, 웹 대부분 1.25-1.414, 마케팅/에디토리얼 1.5-1.618

**Baseline grid:**
- 4 / 8 / 12px. **8pt가 사실상 표준** — "designs can scale perfectly on retina screens"
- Müller-Brockmann은 8-32 필드 grid 제시

**Typography (Bringhurst):**
- 한 줄 66자 이상적, 45-75자 허용, 다단 40-50자
- 라틴 텍스트 여백은 고전적으로 페이지의 **45-50%만 차지** (나머지 50-55% 여백)
- Round letter는 cap-height 위·baseline 아래로 overshoot — 수학 정렬보다 **시각 정렬 우선**

**Color perception:**
- CIEDE2000 ΔE < 1 → 인지 불가; 1-2 → 훈련된 눈; 2-3.5 → 상업적 수용 한계; >5 → 명백
- CIE76 JND 2.3으로 개정된 바 있음
- Oklab RMS: Lightness 0.20, Chroma 0.81, Hue 0.49 (CIELAB 1.70/1.84/0.69 대비 압도적 개선). L 정규화 D65 = 1
- **Stevens brightness exponent ≈ 0.33** (log-like 압축). Fechner: S = k·log(I/I₀)

**APCA 문턱값:**
- Lc 90 body 14px/400; Lc 75 body 18px/400; **Lc 60 content 24px/400 또는 16px/700**; Lc 45 headlines 36px/400; Lc 30 disabled; Lc 15 비텍스트 하한
- **"halving/doubling Lc = 지각 대비 동일 변화"** — 지각 균일

**Target size (Fitts):**
- WCAG 2.1 SC 2.5.5 = **44×44 CSS px** (AAA). Apple HIG 44pt, Material 48dp, Microsoft Fluent 40epx, 자동차 UI 76dp
- MIT Touch Lab 손가락 폭 1.6-2 cm

### 3.3 3군 신규 원리 후보

| 후보 | 수학/인지 근거 | 12개와 구분점 |
|------|----------------|---------------|
| **Optical Alignment** | overshoot, 시각 무게 중심 (비기하학적) | Shape Family는 "원/사각/곡선 패밀리"지만 optical alignment는 "수학 정렬 ≠ 시각 정렬" 직교 규칙 (P-21) |
| **Figure-Ground Contrast** | APCA Lc, Gestalt 전경-배경 | Surface Hierarchy는 깊이지만, figure-ground는 "콘텐츠 vs 컨테이너"의 이분 지각 (P-20) |
| **Information Scent / Hick-Hyman** | RT = a + b·log₂(n+1) | Density는 공간, Hick은 "선택지 수에 따른 결정 지연" |
| **Cognitive Chunking** | Cowan ~4 ±1 | Density Mode는 공간, Chunking은 그룹 개수 (P-10 흡수) |
| **Perceptual Gamma / Stevens** | S = k·Iⁿ (n ≈ 0.33 brightness) | Chroma Scale은 색상 축, Stevens는 입력-지각 비선형성이 전체 축에 걸친다 (P-15 통합) |
| **Saccade-based Line Length** | 한 줄 66자 Bringhurst | Typography Hierarchy는 크기 위계, 줄길이는 읽기 동선 — 별도 축 (P-19) |

### 3.4 3군 주요 충돌

- **Golden ratio vs Modular scale 자유도**
  - Adobe는 1.618을 "beginner's guide"로 홍보하나, goldennumber.net 자체가 "Parthenon 측정은 golden ratio 뒷받침 안 됨" 2024 연구 인용. Medium/Patrick Altair "overrated", plus.maths.org "myths"
  - **Every Layout 결론: "어떤 ratio든 일관성이 중요하지 ratio 자체가 아니다."** → 원리는 **"modular"**(승수), 특정 1.618이 아님
- **Miller 7 vs Cowan 4**
  - Miller 본인이 "nothing magical" 인정. Cowan 2001이 **4±1로 수정** — 밀도/칩킹 상한을 7이 아닌 **4로 설정**해야 현대 인지과학 정합
- **WCAG 2 vs APCA**
  - WCAG 2는 어두운 영역에서 "4.5:1 통과하지만 실제 읽을 수 없는" 과대 평가. APCA는 spatial frequency(폰트 크기·두께)까지 반영
  - **ax의 focus 기준은 APCA Lc가 더 정확**
- **Fitts Shannon 공식 vs 단순 선형**
  - Wikipedia/York Mack: MT = a + b·log₂(2D/W) (ID bits 단위)
  - **Shannon 형식이 정본**
- **Bringhurst leading vs 업계 1.5**
  - Bringhurst는 "tight, variable" 권고 (1.2-1.4대 다수)
  - 업계 web CSS 기본 1.5

### 3.5 정량 반증 조건 (3군 핵심 수확)

| 원리 | 반증 조건 수치 |
|------|----------------|
| P-02 Size Ladder | 인접 단계 비율이 **[1.067, 2.0]** 범위 밖이면 modular scale 위반 |
| P-03 Spatial Rhythm | baseline grid **비배수**(예: 7px, 13px) 발생 시 위반 |
| P-06 Chroma Scale | Oklab L이 아닌 **HSL lightness** 사용 시 지각 비균일 (RMS 8.5× 악화) |
| P-08 Focus Visibility | APCA **Lc < 45** on headlines, **Lc < 60** on 24px body → 실패 |
| P-09 Interactive States (Fitts) | 타깃 **< 44×44 CSS px** → WCAG 2.5.5 AAA 실패 |
| P-10 Density Modes | 단일 그룹에 선택지 **> 4** (Cowan 정밀) 또는 **> 7** (Miller 상한) |
| P-11 Typography Hierarchy | 한 줄 **> 75자 또는 < 45자** |
| Color JND | 인접 surface/text 간 **ΔE2000 < 1** → 경계 불가시 |

### 3.6 3군 핵심 인용

- [Elements of Typographic Style PDF](https://readings.design/PDF/the_elements_of_typographic_style.pdf) (Bringhurst)
- [webtypography.net 2.1.2 Comfortable measure](http://webtypography.net/2.1.2) (Bringhurst 66 char)
- [Every Layout — Modular Scale](https://every-layout.dev/rudiments/modular-scale/)
- [Ottosson Oklab 원문](https://bottosson.github.io/posts/oklab/)
- [APCA Easy Intro](https://git.apcacontrast.com/documentation/APCAeasyIntro.html) / [Why vs WCAG](https://git.apcacontrast.com/documentation/WhyAPCA.html)
- [Fitts's Law — Wikipedia / Mack York](https://www.yorku.ca/mack/JMB89.html)
- [Miller 1956 — Magical Number Seven PDF](https://labs.la.utexas.edu/gilden/files/2016/04/MagicNumberSeven-Miller1956.pdf)
- [Color difference / CIEDE2000 — Wikipedia](https://en.wikipedia.org/wiki/Color_difference)
- [Müller-Brockmann Grid Systems PDF](https://monoskop.org/images/a/a4/Mueller-Brockmann_Josef_Grid_Systems_in_Graphic_Design_Raster_Systeme_fuer_die_Visuele_Gestaltung_English_German_no_OCR.pdf)
- [WCAG 2.5.5 Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [Golden ratio myth — plus.maths.org](https://plus.maths.org/content/myths-maths-golden-ratio)
- [Gestalt principles — Scholarpedia](http://www.scholarpedia.org/article/Gestalt_principles)

---

## §4. 통합 — 수렴 매트릭스

### 4.1 원리별 3군 교차 검증

| # | 원리 | 1군 | 2군 | 3군 | 종합 |
|---|------|-----|-----|-----|------|
| P-01 | Role → Structure | 5/5 | 높음 | — | **매우 강** |
| P-02 | Size Ladder SSOT | 3/5 | 높음 | 공식 | 강 |
| P-03 | Spatial Rhythm | 2/5 | 중간 | 공식 | 중 |
| P-04 | Surface Hierarchy | 4/5 | 높음 | Gestalt | 강 |
| P-05 | Color as Role | 5/5 | **매우 높음** | — | **매우 강** |
| P-06 | Chroma Scale | 4/5 | **매우 높음** | **Oklab 공식** | **매우 강** |
| P-07 | Accent Singularity | 4/5 | **낮음 (논쟁)** | 경험칙 | **약 → 재명명** |
| P-08 | Focus Visibility | 3/5 | 중간 | **APCA 공식** | 강 |
| P-09 | Interactive States | 3/5 | **매우 높음** | **Fitts 공식** | **매우 강** |
| P-10 | Density Modes | **1/5 (Material 단독)** | 중간 (Gmail) | **Cowan 4** | 중 → 보정 |
| P-11 | Typography Hierarchy | 4/5 | **매우 높음** | Bringhurst | **매우 강** |
| P-12 | Shape Family | 3/5 | 높음 | overshoot | 중 |

### 4.2 3군 합의 결과

**"매우 강"한 원리 (5개):** P-01, P-05, P-06, P-09, P-11 — 이들은 업계+이론 전반에서 반박 없음

**보정 필요 원리 (3개):**
- P-07 Accent Singularity → **"Accent Constraint"** 로 재명명 (family of 5-9)
- P-10 Density → Miller 7 → **Cowan 4±1**
- P-11 Typography → P-19 Saccade Line Length 분리

**즉시 승격 신규 원리 (5개):**
- P-13 Token Tiering
- P-14 Mode Switching
- P-15 Perceptual Color Space (OKLCH)
- P-16 Fitts Target Size (P-09 하위 혹은 독립)
- P-19 Saccade Line Length (45-75ch)

**승격 후보 (3개):**
- P-17 Slot Recipe
- P-20 Figure-Ground
- P-21 Optical Alignment

**흡수/보류 (4개):**
- P-18 Composite Token → P-13 흡수
- P-22 Motion → 보류 (1/5)
- P-24 State Layer Overlay → P-09 흡수
- P-25 Theme Contrast Knob → 보류 (Linear 단독)

---

## §5. 확정 사항 (2026-04-18 사용자 승인)

1. **스켈레톤 3종 확정:**
   - 위치: `docs/research/ax/`
   - 파일: README + 00-mandate + 01-literature-review + 02-principles + 03-ax-mapping + 04-gap-plan
   - Principle Card 6항목: 원리/정의/업계증거/수학근거/반증조건/ax매핑/예시

2. **즉시 승격 5개 원리 확정:** P-13, P-14, P-15, P-16, P-19

3. **기존 12개 보정 3건 확정:** P-07 재명명, P-10 Cowan 보정, P-11 분리

4. **승격 후보 3개 확정:** P-17, P-20, P-21 (02-principles.md에서 카드 작성 시 확정 승격)

5. **보류 2개:** P-22 Motion, P-25 Theme Contrast Knob (2026-Q2 재탐색)

---

## §6. 다음 단계

- **Task 3** — `02-principles.md` 원리 카드 작성 (최대 20개 규모)
- **Task 4** — `03-ax-mapping.md` 원리 × 24축 매트릭스
- **Task 5** — `04-gap-plan.md` + `DESIGN.md` 재편

#kind/note #topic/research
