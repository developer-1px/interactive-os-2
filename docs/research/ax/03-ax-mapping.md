# 03 ax Mapping — 원리 × 25축 Locked/Exposed/Missing/Conflicts/N/A

**작성일:** 2026-04-18
**근거:** `src/styles/ax.ts`, `axPublic.ts`, `axPrivate.ts`, `rolePreset.ts`, `ax.css`, `tokens.css`, `palette.css`, `docs/DESIGN.md` 실독
**목적:** 02 원리 20개 × ax 25축 역매핑으로 **원리 자체의 타당성**과 **축 구현의 완성도**를 동시에 검증 (`feedback_enforcement_multilayer`, `feedback_judgment_priority`)

---

## Executive Summary

### 판정 집계

| 상태 | 개수 | 의미 |
|------|:----:|------|
| 🟢 Locked | **10** | 원리가 축 내부에 잠김. 사용자가 우회 불가 |
| ⚠ Exposed | **6** | 축은 있으나 사용자가 우회 가능 또는 강제 불완전 |
| ✗ Missing | **1** | 축 자체 부재 |
| ✱ Conflicts | **1** | 축과 원리 방향이 충돌 — 프로젝트 규약 우선 검토 필요 |
| ∅ N/A (ax scope 외) | **2** | ax 단독으로 커버 불가, 상위 레이어(ui/composites, font/SVG) 담당 |

### 주요 발견

1. **원리 50%가 완전 Locked (10/20)** — Role→Structure, Color as Role, OKLCH, Token Tiering 등 핵심 원리는 이 프로젝트가 이미 "현대 UI 메타 원리의 좌표계"를 상당 수준 구현 중
2. **⚡ 정량 반증 가능 원리 중 일부는 Exposed** — Size Ladder SSOT, Spatial Rhythm, Focus APCA 측정이 미구현 → `feedback_enforcement_multilayer` 7 layer 중 **자동 검증 layer**가 부재
3. **Conflicts 1건 발견** — P-16 Fitts 44px가 `--control-height: 36px` / `--item-height: 28px` 규약과 충돌. `feedback_judgment_priority`에 따라 **프로젝트 규약 우선 → 원리를 조건부 수용** (Desktop/keyboard 전용)
4. **수렴도 ≠ 타당성 확증** — 외부 수렴 95%였던 원리 중 P-16 1건이 프로젝트에서 **부분 기각**. 이것이 방금 세운 "타당성 검증" 프로세스의 첫 산출

---

## §1. 매핑 방법론

### 5상태 정의

| 상태 | 정의 | 판정 기준 |
|------|------|-----------|
| **🟢 Locked** | 원리가 축 내부에 잠김, 우회 불가 | 타입 수준 제약 OR 인라인 금지 훅 OR 조합 규칙이 SSOT |
| **⚠ Exposed** | 축은 있으나 사용자가 규칙을 우회하거나 축이 원리 일부만 커버 | `style={}` 인라인 가능, 자동 검증 부재, 복수 계단 분리 |
| **✗ Missing** | 축 자체 부재 | 그 원리를 표현하는 축/토큰이 없음 |
| **✱ Conflicts** | 축이 존재하나 원리와 방향 충돌 | 프로젝트 규약이 원리에 반하는 값을 강제 |
| **∅ N/A** | ax scope 외 | 폰트/SVG/ui 레이어가 담당 |

### 판정 단위

- **원리 1개 = 판정 1개.** 복수 축 매핑 가능하되 종합 상태는 하나.
- **보정 유도:** Exposed는 04에서 강화 플랜. Missing은 신규 축 검토. Conflicts는 프로젝트 규약 재확인.

---

## §2. 20 원리 × 25축 매핑 매트릭스

| # | 원리 | ax 축 매핑 | 상태 | 핵심 근거 |
|---|------|-----------|:----:|-----------|
| P-01 | Role → Structure Derivation | `role` + `cs` + **rolePreset cascade** | 🟢 Locked | `rolePreset.ts` SSOT, Private 타입 거부(마이그레이션), `role × surface × (content|interactive)` |
| P-02 | Size Ladder SSOT | `cs` (5단) + space/shape/icon/square 별도 | ⚠ Exposed | cs 단일, 하지만 padding(6)/gap(6)/shape(8)/icon(4) 각자 스케일. 비율 미검증 |
| P-03 | Spatial Rhythm | `--space-*` 4/8/16/24/32/48/64/80/96 | 🟢 Locked | **8px baseline grid 완전 정합** (4는 xs 단 1개). Müller-Brockmann 정합 |
| P-04 | Surface Hierarchy | `surface` (11) + `--depth-*` 파생 | 🟢 Locked | sunken→base→raised→overlay 4단, OKLCH `oklch(from ... l c h)` 자동 파생 |
| P-05 | Color as Role | `role` + `tone` + `text` + `surface` | 🟢 Locked | tone 5semantic × dim, text 4단 위계 |
| P-06 | Chroma Scale + Paired FG | `palette` + `tone-{dim/mid/bright/hover/fg}` | 🟢 Locked | OKLCH L 분리, foreground pair 자동 |
| P-07 | Accent Constraint | `tone` 5개 (accent/danger/success/warning/neutral) | 🟢 Locked | 제약된 집합. Miller 7±2 하한. 단 "brand" 확장은 미구현 |
| P-08 | Focus Visibility | `--focus-ring-shadow`, `:focus-visible` | ⚠ Exposed | oklch alpha 0.35로 계산되지만 **APCA Lc 측정 없음**. 특정 surface에서 실패 가능 |
| P-09 | Interactive States | `interactive` (6) + `.ax-interactive` + `:where()` | 🟢 Locked | item/tab/check/cell/button/input 각각 hover/active/focus/selected 대칭. Mac Finder 모델 |
| P-10 | Density Modes (Cowan) | **축 부재** | ✗ Missing | density 축 없음. Cowan 4 상한 enforcement 없음 |
| P-11 | Typography Hierarchy | `textStyle` (9) + `weight` + `text` + textStylePreset | 🟢 Locked | composite token 방식, `resolveTextStylePreset`이 weight/text 주입 |
| P-12 | Shape Family | `shape` (8) + role 자동 radius | 🟢 Locked | shape-2xs(2) ~ shape-xl(16) + pill. role별 자동 주입 |
| P-13 | Token Tiering (3-tier) | L0 palette → L1 tokens → L2 depth | 🟢 Locked | **`palette.css` OKLCH primitive → `tokens.css` semantic → `depth-*` component alias 명시 3층** |
| P-14 | Mode Switching | `tokens.css` :root (dark default) + light override (`project_light_theme_color_direction`) | ⚠ Exposed | light 전환은 tokens.css 단일 파일 내부. **High-Contrast/brand modes는 미지원** |
| P-15 | Perceptual Color Space (OKLCH) | `palette.css` 전면 OKLCH + `oklch(from ...)` 파생 | 🟢 Locked | **HSL 사용 0건 확인**. Hue 고정, L/C 분리 |
| P-16 | Fitts Target Size (44px) | `--control-height: 36px`, `--item-height: 28px` | ✱ **Conflicts** | WCAG 2.1 AAA = 44px vs 프로젝트 36/28px 규약. Linear 레퍼런스 기반 데스크톱 키보드 우선 |
| P-17 | Slot Recipe (multi-part) | ax scope 외. `ui/composites/`가 담당 | ∅ N/A | `project_a2ui_composites` — ax는 단일 함수, 복합 컴포넌트는 ui/composites |
| P-19 | Saccade Line Length (45-75ch) | `width: 'prose'` → max-width 72ch | ⚠ Exposed | 72ch는 Bringhurst 75 상한에 근접. 65ch 이상값 미설정, 기본값 미강제 |
| P-20 | Figure-Ground Contrast | `surface` base/raised/overlay 암묵 처리 | ⚠ Exposed | 명시적 figure/ground 구분 없음. Gestalt 이분이 amici axis에 없음 |
| P-21 | Optical Alignment | ax scope 외. 폰트/SVG 수준 | ∅ N/A | overshoot는 아이콘 SVG 제작 수준, 폰트 `Inter` 기본값에 의존 |

---

## §3. 원리별 상세 분석 (주요 항목)

### 🟢 Locked 원리들 — 이 프로젝트의 기존 성취

#### P-01 Role → Structure Derivation
- **구현 근거:** `src/styles/rolePreset.ts`의 `resolveRolePreset()`이 `role × surface × (content|interactive)` 키로 Private 값(padding/gap/shape/weight/text/motion)을 cascade 주입
- **잠금 메커니즘:** `ax.ts` 타입 시그니처 `Axes = AxPublic & Partial<AxPrivate>` — 마이그레이션 이후 Public만 수용 예정
- **우회 경로:** `ax.raw()` escape hatch만 허용
- **판정 근거:** 1761 ax() 호출 스캔 → rolePresetTable이 주입 SSOT (주석 라인 25)

#### P-03 Spatial Rhythm
- **구현 근거:** `--space-xs..5xl = 4, 8, 16, 24, 32, 48, 64, 80, 96` — **모두 4px 배수, xs(4) 제외 전부 8px 배수**
- **잠금 메커니즘:** space 토큰 자체가 SSOT, 다른 수치 인라인 금지는 `@layer` + stylelint 보완 필요 (Exposed 레이어 존재)
- **Müller-Brockmann 정합:** ✓
- **Loc 수정 가능성:** xs(4)를 제거하고 sm(8) 이상만 유지하면 **완벽한 8px grid** 승격

#### P-04 Surface Hierarchy
- **구현 근거:** `--depth-{sunken|base|raised|overlay}-{hover|active|sel|sel-cursor}` 전체가 `oklch(from var(--elev-base-*) calc(l + delta * direction) c h)`로 **자동 파생**
- **잠금 메커니즘:** surface 축이 sunken/base/raised/overlay 4값만 허용(타입), 개별 bg 지정 불가
- **DESIGN.md 불변식:** "각 depth의 hover 밝기 = 한 단계 위 depth의 기본 밝기" — tokens.css delta 0.03/0.07/0.11이 이것을 보장

#### P-13 Token Tiering (3-tier)
- **구현 근거:** 3층이 **파일 단위로 분리**
  - **L0 Primitive:** `palette.css` — `--blue-500: oklch(60.6% 0.155 252)` 등
  - **L1 Semantic:** `tokens.css` — `--tone-primary-base: var(--blue-500)`
  - **L2 Component alias:** `--depth-base-hover`, `--text-bright` 등
- **잠금 메커니즘:** palette.css 파일 헤더 "No hex/rgb/oklch literals here" (L1에서) — SSOT 명시
- **W3C DTCG 2025.10 stable 정합** ✓

#### P-15 Perceptual Color Space (OKLCH)
- **구현 근거:** palette.css **전면 OKLCH**, HSL 사용 0건 (grep 확인)
- **Hue 고정:** stone 90°, blue 246-255°, red 19-23°, green 158-159°, amber 81-83° — L/C 변동, Hue 안정
- **자동 파생:** `oklch(from var(--base) calc(l + delta) c h)` 패턴 다수
- **Ottosson Oklab 정합** ✓

### ⚠ Exposed 원리들 — 보정 대상

#### P-02 Size Ladder SSOT — 부분 Exposed
- **현상:** `cs: xs|sm|md|lg|xl` 5단은 있으나, 이것이 padding/gap/shape/icon/square/type-size를 **자동 구동하지 않음** (rolePreset이 role-level에서 주입하지만 cs→계단 파생은 미구현)
- **다중 스케일:**
  - padding 6단 (none/xs/sm/md/lg/xl)
  - gap 6단 (xs/sm/md/lg/xl/2xl)
  - shape 8단 (none/2xs/xs/sm/md/lg/xl/pill)
  - icon 4단 (xs/sm/md/lg)
  - square 6단 (xs/sm/md/lg/xl/2xl)
- **Typography 비율 비단조:** 12→14(1.167), 14→16(1.143), 16→24(1.5), 24→32(1.333), 32→40(1.25) — **단일 modular scale 아님**
- **보정 방향:** cs→파생 SSOT 강화 or "계단별 독립 SSOT" 인정 후 각 계단을 modular ratio 검증

#### P-08 Focus Visibility — APCA 측정 부재
- **현상:** `--focus-ring-shadow: 0 0 0 3px oklch(from var(--focus) l c h / 0.35)` — alpha 0.35 고정
- **문제:** surface 밝기가 focus 색과 비슷한 경우 Lc 60 미달 가능. 검증 도구 없음
- **보정:** 자동 검증 layer 추가 — CI에서 모든 surface × focus 조합 APCA Lc 측정

#### P-14 Mode Switching — 부분 지원
- **현재:** Light/Dark는 `tokens.css` 파일 내부에서 media query 또는 class 분기 (추정)
- **미지원:** High-Contrast, brand theme multi
- **보정:** W3C DTCG modes 구조 채택, mode matrix 확장

#### P-19 Saccade Line Length — 단일 값만
- **현재:** `width: 'prose'` → `max-width: 72ch`
- **문제:** 72ch는 Bringhurst 75 상한에 근접. **이상값 66ch / 권장 45-75** 범위 미반영
- **보정:** prose 계단 추가 (prose-narrow 50ch, prose 65ch, prose-wide 75ch)

#### P-20 Figure-Ground — 명시 부재
- **현재:** surface base+raised로 부분 Gestalt 처리
- **부재:** "figure(콘텐츠) vs ground(컨테이너)" 이분을 **선언하는 축 없음**
- **보정:** content 축 확장 or 신규 `figure` 축 (후보 보류)

### ✗ Missing 원리 — 축 부재

#### P-10 Density Modes
- **현재:** density 축 자체 없음. `feedback_padding_by_layout_type` memory에 "바(xs) < 입력(sm) < 콘텐츠(md)" 간접 기록
- **보정 옵션:**
  - A) density 축 신규 (compact/default/comfortable) + cs와 독립
  - B) role 축 확장 (role-compact / role-comfortable)
  - C) 보류 — "데이터 집약 UI(CMS, TreeGrid)에 국한, 현재 불필요"
- **제 판단:** A 또는 C. B는 role 폭증 위험

### ✱ Conflicts 원리 — 프로젝트 규약 우선

#### P-16 Fitts Target Size (44px) — **프로젝트 36/28px 규약과 충돌**

**외부 증거 (02-principles.md):**
- WCAG 2.1 SC 2.5.5 Target Size = 44×44 CSS px (AAA)
- Material 3 = 48dp, Apple HIG = 44pt
- MIT Touch Lab 손가락 폭 45-57 CSS px

**프로젝트 규약:**
- `--control-height: 36px`, `--item-height: 28px`
- DESIGN.md "28px 법칙" — 사이드바/탭/리스트/커맨드 아이템 높이
- Linear 레퍼런스 (28px) — `user_fe_developer` memory "키보드 우선 FE 개발자"
- `project_target_vibe_coding_engine` — Anthropic 앱 빌더 = 데스크톱 중심

**Judgment (feedback_judgment_priority):**
- **프로젝트 규약 > 표준** — 28/36px 유지
- 단 **Touch UI 커버리지 확장 시 재검토 필수**
- P-16을 "**조건부 원리**"로 재분류: Desktop/keyboard 전용에서는 non-applicable, Touch에선 applicable

**04-gap-plan 투입물:** P-16을 기각하지 말고 "조건부 원리"로 카드 수정 (02 revision). 현재 프로젝트 스코프에서는 충돌이지만 원리 자체는 유효.

### ∅ N/A 원리 — ax scope 외

#### P-17 Slot Recipe
- ax는 단일 함수. 복합 컴포넌트 조립은 **`src/interactive-os/ui/composites/`**가 담당
- `project_a2ui_composites` memory 참조
- **이 원리는 ax가 아닌 ui layer에서 검증/강제**

#### P-21 Optical Alignment
- 아이콘 SVG 제작 단계 (overshoot 2-3%) + 폰트 내부 metrics
- ax 축이 커버할 영역 아님
- **체크리스트나 design-review 에이전트에서 감시**

---

## §4. 주요 쟁점 토론

### 쟁점 1: P-16 기각 vs 조건부 수용

**기각 논변:**
- 외부 수렴 95%에도 프로젝트 규약과 충돌 → 원리가 이 프로젝트에서 유효하지 않음

**조건부 수용 논변 (채택):**
- 원리 자체는 유효 (Fitts 공식은 물리적 진실)
- "touch = 44px, desktop+keyboard = 28-36px 허용"이라는 **조건부 진술**로 수정하면 프로젝트 규약과 외부 수렴 양립
- 프로젝트가 Touch UI로 확장하면 원리가 자동 활성화

**결론:** 02-principles.md의 P-16 카드를 revision — "Condition: Touch primary. Desktop+keyboard는 28-36px 허용 조건."

### 쟁점 2: P-10 Density를 신규 축으로 승격할지

**승격 논변:**
- 02 카드에서 즉시 승격 아닌 "🔄 보정"이었으나, 매핑 결과 축 자체가 없음
- `project_visual_cms_service`, `project_chat_module_gen_ui` 등 데이터 집약 UI에서 필요

**보류 논변:**
- CLAUDE.md 제1원칙 "있는 걸로 만든다" — 지금 바로 필요한가?
- cs 축으로 근사 가능

**결론 (제안):** 04-gap-plan.md에서 "**조건부 신규 축**"으로 기록. 실제 필요한 pages가 등장하면 도입.

### 쟁점 3: cs 계단 vs 복수 계단

**cs→전파 SSOT 논변 (P-02 Locked 강화):**
- cs xs/sm/md/lg/xl이 padding/gap/shape/icon/square 자동 파생
- 단일 modular ratio 1.25 고정
- Radix 9-step과 근사

**복수 계단 유지 논변 (현재 상태):**
- padding과 shape의 스케일 분리가 의도적 (padding 6 vs shape 8)
- Material 3도 typography 3단 / shape 7단 분리
- "계단별 독립 SSOT" 허용

**결론:** 판단 보류. 04에서 검증 — shape/padding/icon 비율이 각각 modular scale 통과하는지 측정.

---

## §5. 원리 타당성 종합

외부 수렴도와 별개로 **이 프로젝트에서의 타당성**:

| 분류 | 개수 | 원리 |
|------|:----:|------|
| **타당성 인증 (Locked + 충돌 없음)** | 10 | P-01, P-03, P-04, P-05, P-06, P-07, P-09, P-11, P-12, P-13, P-15 |
| **타당성 있으나 구현 강화 필요** | 6 | P-02, P-08, P-10, P-14, P-19, P-20 |
| **조건부 타당성 (touch 전용)** | 1 | P-16 |
| **ax scope 외 (상위 레이어 담당)** | 2 | P-17, P-21 |
| **기각** | 0 | — |

**핵심 통찰:** 외부 수렴 95%로 "즉시 승격"된 원리도 프로젝트 타당성 단계에서 1건이 조건부로 수정됨. 이것이 `feedback_judgment_priority`·`feedback_design_over_request`가 경고한 외부 표준 과신의 실증 사례.

---

## §6. 04-gap-plan.md 투입물

### 6개 Exposed + 1개 Missing + 1개 Conflicts 보정 우선순위

| Priority | 원리 | 상태 | 보정 방향 | Enforcement Layer 제안 |
|:---:|------|:----:|-----------|-----------------------|
| P0 | P-16 Fitts | ✱ Conflicts | 02 카드 조건부 revision | 문서만 |
| P1 | P-08 Focus APCA | ⚠ Exposed | CI APCA 측정 스크립트 | 7 자동검증 |
| P1 | P-03 Spatial Rhythm | 🟢 (강화) | stylelint baseline 검사 | 6 린트 |
| P1 | P-02 Size Ladder | ⚠ Exposed | 계단별 modular 검증 스크립트 | 7 자동검증 |
| P2 | P-10 Density | ✗ Missing | 조건부 신규 축 (CMS 필요 시) | 5 타입 |
| P2 | P-19 Line Length | ⚠ Exposed | prose 계단 확장 | 5 타입 |
| P2 | P-14 Mode Switching | ⚠ Exposed | DTCG modes 채택 | 5 타입 |
| P3 | P-20 Figure-Ground | ⚠ Exposed | 암묵 유지 + agent 감시 | 3 에이전트 |

P0 = 즉시 (카드 수정만). P1 = 2026-Q2 우선. P2 = 필요 시. P3 = agent 수동 점검.

---

## §7. 요약

- 20 원리 중 **10개 Locked** — 이 프로젝트가 이미 "현대 UI 메타 원리 좌표계" 상당 부분 구현
- **6개 Exposed** — 대부분 7 enforcement layer 중 **자동 검증 layer 부재**가 원인
- **1개 Missing (P-10)** — 조건부 신규 축 후보
- **1개 Conflicts (P-16)** — 02 카드 조건부 revision
- **2개 N/A (P-17, P-21)** — ax scope 외 (ui/composites, 폰트/SVG)
- **0개 완전 기각** — 외부 수렴과 프로젝트 타당성이 대체로 정합

다음: `04-gap-plan.md`에서 원리별 **7 enforcement layer** 현재 상태 + 이상 상태 + 보정 액션 작성.
