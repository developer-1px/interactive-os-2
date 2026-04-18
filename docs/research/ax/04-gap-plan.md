# 04 Gap Plan — 원리 × 7 Enforcement Layer + 보정 로드맵

**작성일:** 2026-04-18
**입력:** `02-principles.md` (20 원리) + `03-ax-mapping.md` (현재 상태 판정) + `feedback_enforcement_multilayer` memory
**목적:** 원리별 **7 enforcement layer** 현재/이상 상태 매핑 → 보정 액션 P0~P3 우선순위화 → DESIGN.md 재편 플랜

---

## Executive Summary

### 핵심 gap 6건 (03에서 Exposed + Missing + Conflicts)

| Priority | 원리 | gap | 핵심 보정 layer | 일정 |
|:---:|------|-----|----------------|------|
| **P0** | P-16 Fitts 44px | 프로젝트 규약과 충돌 | 1 프롬 (문서 revision) | 즉시 |
| **P1** | P-08 Focus APCA | 자동 검증 부재 | 7 자동검증 | 2026-Q2 |
| **P1** | P-03 Spatial Rhythm | stylelint 부재 | 6 린트 | 2026-Q2 |
| **P1** | P-02 Size Ladder | modular ratio 미검증 | 7 자동검증 | 2026-Q2 |
| **P2** | P-14 Mode Switching | HC/brand mode 미지원 | 5 타입 + 2 스킬 | 2026-Q3 |
| **P2** | P-19 Line Length | 계단 단일 (prose 72ch만) | 5 타입 | 2026-Q3 |
| **P2** | P-10 Density | 축 부재 (조건부) | 5 타입 | 2026-Q3 (필요 시) |
| **P3** | P-20 Figure-Ground | 명시 부재 | 3 에이전트 | 2026-Q3-Q4 |
| **P3** | P-21 Optical | ax scope 외 | 3 에이전트 | 2026-Q3-Q4 |

### 주요 통찰

1. **gap의 대다수는 "자동 검증 layer 부재"** — Focus APCA, Spatial baseline, Size modular ratio. 관찰 가능한 수치인데 측정 파이프라인이 없음
2. **타입 layer는 이미 강함** — Public/Private 분리, Role/Surface/Tone 열거형 등이 compile-time 잠금
3. **훅 layer 강함** — `guardOsPatterns`, `scanOsViolations` 등 이미 4 layer 도구 풍부 (`project_os_violation_scan_runner`)
4. **린트 layer 약함** — stylelint 일부 규칙만. CSS 축 관련 새 규칙 필요
5. **스킬 layer 선택적** — `/keyline-audit`, `/improve-design`, `/use`가 있지만 자동 실행 아님. P0~P1은 자동 layer 확충이 우선

---

## §1. 원리 × 7 Enforcement Layer 매트릭스

범례: ◎ 핵심 방어 / ○ 보조 / ⚠ 약함/부재 / · 해당 없음

| 원리 | 1 프롬 | 2 스킬 | 3 에이전트 | 4 훅 | 5 타입 | 6 린트 | 7 자동검증 |
|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| P-01 Role→Structure | ◎ | · | · | ◎ guardOsPatterns | ◎ rolePreset SSOT | · | · |
| P-02 Size Ladder | ○ | keyline-audit | · | · | ⚠ cs 단일이나 파생 느슨 | ○ stylelint 부분 | ⚠ **modular ratio 검증 부재** |
| P-03 Spatial Rhythm | · | keyline-audit | · | · | · | ⚠ **baseline 배수 검사 부재** | · |
| P-04 Surface Hierarchy | ○ | · | · | ○ | ◎ AxSurface 열거 | · | · |
| P-05 Color as Role | ◎ CLAUDE.md | · | · | ◎ no-hex 훅 | ◎ AxTone + AxText | ◎ stylelint 색상 금지 | · |
| P-06 Chroma Scale | · | · | design-review | · | ◎ tone-{dim\|mid\|bright} | · | ⚠ **ΔE 측정 부재** |
| P-07 Accent Constraint | · | · | · | · | ◎ AxTone 5개 | · | · |
| P-08 Focus Visibility | ○ | · | design-review | · | · | · | ⚠ **APCA Lc 측정 부재** |
| P-09 Interactive States | ○ | · | · | · | ◎ AxInteractive 6값 | · | · |
| P-10 Density Modes | · | · | · | · | ✗ **축 자체 부재** | · | ⚠ Cowan 4 검사 부재 |
| P-11 Typography Hierarchy | ○ | · | · | · | ◎ textStyle composite | · | · |
| P-12 Shape Family | · | · | · | · | ◎ AxShape 8값 | · | · |
| P-13 Token Tiering | ○ | · | · | ◎ import 경계 | ◎ L0/L1/L2 분리 | ○ stylelint | · |
| P-14 Mode Switching | · | · | · | · | ⚠ light만 | · | ⚠ mode matrix test |
| P-15 OKLCH | ○ DESIGN.md | · | · | ◎ no-hex/no-hsl | · | ○ stylelint | · |
| P-16 Fitts 44px | ⚠ **조건부 미문서화** | /use | design-review | · | · | · | ⚠ touch 시 screenshot |
| P-17 Slot Recipe | ○ | · | · | · | ◎ ui/composites | · | · |
| P-19 Line Length | · | · | · | · | ⚠ **prose 단일** | · | ⚠ max-width 검사 |
| P-20 Figure-Ground | · | · | design-review | · | · | · | · |
| P-21 Optical | ○ | · | design-review | · | · | · | · |

### Layer별 커버리지 현황

| Layer | 강함 | 약함 | 전체 |
|-------|:----:|:----:|:----:|
| 1 프롬프트 | 9 | 1 | 10/20 커버 |
| 2 스킬 | 3 | — | 3/20 |
| 3 에이전트 | 4 | — | 4/20 |
| 4 훅 | 6 | — | 6/20 |
| 5 타입 | 10 | 3 | 10/20 (주력) |
| 6 린트 | 4 | 1 | 5/20 |
| 7 자동검증 | 0 | **6** | **6/20 약함 집중** |

**결론:** 자동검증 layer가 ax 연구의 **최대 gap**. P1 작업은 모두 여기에 집중.

---

## §2. 보정 액션 — P0 (즉시)

### P0-1. P-16 카드 조건부 revision

**대상:** `02-principles.md` P-16 Fitts Target Size

**현재 문제:** 외부 수렴 95%이지만 프로젝트 규약(28/36px)과 충돌. `feedback_judgment_priority`에 따라 프로젝트 규약 우선.

**보정 내용:**

```markdown
## P-16 Fitts Target Size 🆕 ⚡ [조건부]

**원리**
Touch primary UI에서 인터랙티브 타깃은 최소 44×44 CSS px.
Desktop+keyboard primary에서는 28-36px 허용 (프로젝트 규약).

**조건부 판정:**
- Touch/모바일 UI → 44×44 px 엄격 적용
- Desktop 키보드 우선 (현 프로젝트) → control 36px / item 28px 수용
- Hybrid → primary 채널 기준으로 판단

**이 프로젝트 스코프:**
- 현재: Desktop/keyboard 우선 → 28/36px 유지
- Touch UI 확장 시 재활성화

(나머지 업계 증거/수학 근거/예시 유지)
```

**Enforcement:** 1 프롬프트 layer만 (문서 수정). 훅/타입 강제 없음.

**작업:** `02-principles.md` P-16 카드 수정 1회.

---

## §3. 보정 액션 — P1 (2026-Q2, 4-5월)

### P1-1. Focus APCA 자동 측정 파이프라인

**대상 원리:** P-08 Focus Visibility

**현재:** `--focus-ring-shadow: oklch(from var(--focus) l c h / 0.35)` — alpha 0.35 고정, surface별 대비 측정 없음

**이상:** 모든 `(surface, focus)` 조합에서 APCA Lc ≥ 60 보장

**액션:**

1. **스크립트:** `scripts/measureFocusContrast.mjs`
   - 11 surfaces × focus color → Lc 매트릭스 출력
   - Lc < 60 발생 시 exit 1
2. **CI 통합:** `package.json` scripts에 `check:focus-apca` 추가, pre-commit 또는 CI에서 실행
3. **의존:** `apca-w3` npm 패키지
4. **보고서:** `docs/research/ax/reports/focus-apca-{date}.md` 생성

**Enforcement:** 7 자동검증 신규.

---

### P1-2. Spatial Rhythm baseline 검사

**대상 원리:** P-03 Spatial Rhythm

**현재:** 토큰은 baseline 정합 (`--space-*`가 4/8 배수). 하지만 `*.module.css`나 인라인 `margin: 7px` 등 비배수 사용 감시 없음

**이상:** 모든 `padding/margin/gap` 수치가 **4px 배수** (8px 권장)

**액션:**

1. **stylelint 커스텀 규칙:** `stylelint-plugin-ax-baseline`
   ```js
   // .stylelintrc.mjs
   {
     rules: {
       'ax/baseline-grid': [4, { preferred: 8 }]
     }
   }
   ```
2. **검사 대상:** padding, margin, gap, top/left/right/bottom 등 spatial 속성
3. **허용:** `1px`, `0.5px` (border), `100%`, `var(--*)` — 수치 유한값만
4. **배제:** `transform: translateY(3px)` (애니메이션 미세 조정)

**Enforcement:** 6 린트 신규.

---

### P1-3. Size Ladder modular ratio 검증

**대상 원리:** P-02 Size Ladder SSOT

**현재:** 계단별 값은 있으나 ratio 검증 없음
- typography 12→14→16→24→32→40 = 비단조 ratio (1.167/1.143/1.5/1.333/1.25)
- shape 2→4→6→8→12→16 = 대체로 1.5 근사

**이상:** 각 계단이 `r ∈ [1.067, 2.0]` 범위의 modular scale 통과

**액션:**

1. **스크립트:** `scripts/verifyModularScale.mjs`
   - tokens.css에서 `--type-*-size`, `--space-*`, `--shape-*-radius`, `--icon-*` 파싱
   - 인접 단계 ratio 계산
   - `[1.067, 2.0]` 벗어나면 경고
2. **리포트:** 각 계단별 ratio 목록 + 권장 수정
3. **정책 제안:** typography는 1.25 Major Third 기반 재정렬 후보 (12 → 15 → 18.75 → 23.44 → 29.3 → 36.6)

**단, 판정:** 비단조 ratio도 "의도된 비대칭"일 수 있음. Material 3도 typography 3단, shape 7단 분리. **검증 통과 실패가 즉시 수정 의무를 만들지 않음** — 경고 리포트로 의도 검토

**Enforcement:** 7 자동검증 신규.

---

### P1-4. OKLCH 단독 사용 stylelint

**대상 원리:** P-15 Perceptual Color Space

**현재:** palette.css는 OKLCH 순수. 하지만 컴포넌트 CSS에서 hex/hsl 사용 금지 강제 없음

**이상:** 모든 color 값이 `var(--*)` 또는 `oklch(...)` 형식. `#hex`, `hsl()`, `rgb()` 0건

**액션:**

1. **stylelint 규칙:** `color-no-hex`, `color-named: never`, `function-disallowed-list: [hsl, rgb]`
2. **예외:** `rgba(0,0,0,0.04)` 등 shadow 미세 alpha 유지 (legacy). 2026-Q3까지 OKLCH 전환
3. **검사:** CI 차단

**Enforcement:** 6 린트 신규.

---

## §4. 보정 액션 — P2 (2026-Q3, 6-7월)

### P2-1. P-14 Mode Switching 확장 (DTCG modes)

**현재:** tokens.css 단일 파일 light/dark 분기 (`project_light_theme_color_direction`)
**이상:** W3C DTCG modes 표준 구조 — light/dark/hc-light/hc-dark/brand-X 파일 복제 없이 공존

**액션:**
1. tokens.css → `tokens/` 디렉토리 분리 (modes별 파일)
2. W3C DTCG Format 2025.10 채택
3. Build step에서 mode 합성 (Tokens Studio 유사)
4. mode 전환 screen test 추가

**선행:** DTCG 스펙 실독, 현재 light/dark 분기 로직 파악

---

### P2-2. P-19 Line Length 계단 확장

**현재:** `width: 'prose'` → 72ch 단일
**이상:** prose-narrow (50ch), prose (65ch = Bringhurst 이상값), prose-wide (75ch)

**액션:**

```ts
// src/styles/axPublic.ts
export type AxWidth =
  | 'full' | 'auto' | 'fit'
  | 'sm' | 'md' | 'lg' | 'xl'
  | 'prose-narrow' | 'prose' | 'prose-wide'  // ← 기존 'prose' 값 확장
```

```css
/* ax.css */
.w-prose-narrow { width: 100%; max-width: 50ch; margin-inline: auto; }
.w-prose        { width: 100%; max-width: 65ch; margin-inline: auto; }
.w-prose-wide   { width: 100%; max-width: 75ch; margin-inline: auto; }
```

**마이그레이션:** 기존 `width: 'prose'`(72ch) → 그대로 두고 디폴트를 65ch로 (1회 수정). 필요 시 prose-wide로 명시.

---

### P2-3. P-10 Density 조건부 신규 축

**Trigger 조건:** `pages/cms`, `pages/replay/SubAgentViewer`, `pages/catalog` 등 **데이터 집약 UI에서 실제 요청**이 발생하면 도입

**액션 (조건 충족 시):**

```ts
// src/styles/axPublic.ts
export type AxDensity = 'compact' | 'default' | 'comfortable'

export type AxPublic = {
  // ...기존...
  density?: AxDensity
}
```

```css
.dn-compact     { --pd-ratio: 1;   --space-unit: calc(var(--space-sm) * 0.75); }
.dn-default     { /* base — no override */ }
.dn-comfortable { --pd-ratio: 1.5; --space-unit: calc(var(--space-sm) * 1.25); }
```

**제약 검증 (7 자동검증):** 단일 그룹 요소 ≤ 4 (Cowan) 또는 ≤ 7 (Miller) 초과 시 agent 경고

**우선순위 낮음:** 현재 cs 축으로 근사 가능.

---

## §5. 보정 액션 — P3 (2026-Q3-Q4, Agent 중심)

### P3-1. P-20 Figure-Ground design-review agent 확장

**현재:** `design-review` agent가 디자인 일반 체크
**이상:** figure(콘텐츠) vs ground(컨테이너) 명시적 대비 체크 — APCA Lc 기반 판정

**액션:** `agents/design-review.md` 프롬프트에 figure-ground 체크리스트 추가

---

### P3-2. P-21 Optical Alignment — icon/font 레이어

**현재:** ax scope 외, 체크 없음
**이상:** 신규 아이콘 SVG 제작 시 overshoot 2-3% 체크

**액션:**

1. 아이콘 제작 체크리스트 문서 (`docs/3-resources/icon-guidelines.md`)
2. design-review agent가 신규 아이콘 리뷰 시 overshoot 검사

---

## §6. DESIGN.md 재편 플랜

### 현재 구조

```
1. 디자인 철학 (28px 법칙, depth ladder, ...)
2. ax() API (Public/Private, 축 목록)
3. 축 조합 규칙 (R1~R5)
4. CSS Layer 스택
```

### 재편 후 구조

```
0. 메타 원리 선언 (신규) ← 02-principles.md의 20개
   - 각 원리가 한 문장 + 반증 조건 + ax 축 매핑
1. 디자인 철학 (기존, 원리의 구체화 표현)
2. ax() API — 원리 파생 구조
   - 원리 P-01 → role + cs + rolePreset 파생
   - 원리 P-04 → surface + depth-* 파생
   - ...
3. 축 조합 규칙 (R1~R5, 기존 유지)
4. CSS Layer 스택 (기존 유지)
5. Enforcement (신규) ← 04-gap-plan.md의 7 layer 매트릭스 요약
```

### 재편 시점

- `02-principles.md`가 안정(v2 이상)되고
- P0 액션 완료 후
- 2026-Q2 말 또는 Q3 초 목표

### 재편 영향 범위

- `docs/DESIGN.md` (본체)
- `docs/2-areas/styles/axLlmPrompt.md` (LLM 프롬프트 — 원리 섹션 추가)
- `src/styles/ax.ts` JSDoc (원리 번호 인용)
- Memory `project_ax_design_system` (SSOT 업데이트)

---

## §7. 마일스톤 요약

| 시점 | 산출물 | 완료 조건 |
|------|--------|-----------|
| 2026-04-18 (오늘) | `02-principles.md` P-16 revision | 카드 수정 |
| 2026-Q2 (4-5월) | P1 4건 완료 | APCA 측정, baseline 검사, modular 검증, OKLCH lint |
| 2026-Q2 말 | DESIGN.md 재편 | 원리 선언 → 축 파생 구조 |
| 2026-Q3 | P2 3건 | Mode DTCG, prose 계단, density 조건부 |
| 2026-Q3-Q4 | P3 2건 + agent 확장 | figure-ground, optical 체크리스트 |

---

## §8. 개방 문제 (Open Questions)

- **Q1: cs 축을 size ladder SSOT로 강화할 것인가?** — padding/gap/shape/icon 파생 자동화. Radix 모델. 현재는 복수 계단 유지
- **Q2: accent family 확장 (5→7)을 허용할 것인가?** — Vercel Geist 모델. 현재는 5개 semantic만
- **Q3: P-10 Density 조건부 축을 언제 도입할 것인가?** — 현재는 보류, pages/cms 요청 시 활성
- **Q4: DTCG 2025.10 stable 포맷으로 tokens 재구성 시점?** — mode matrix 확장 연결

Q1~Q4는 원리 자체 해석보다 **구현 선택지**. 02 카드는 "원리"로 유지하고 구현 선택은 gap-plan에서 결정.

---

## §9. 연결 memory / 도구

**활용 가능한 기존 자산 (제1원칙: 있는 걸로 만든다):**

- `project_os_violation_scan_runner` — `scanOsViolations`, 훅 layer 기반
- `project_keyline_audit_pipeline` — `/keyline-audit` 스킬 layer
- `feedback_design_convergence_loop` — 디자인 수렴 루프 A(측정)→B(루프)
- `feedback_design_review_checklist` — 스크린샷 검수 기준
- `feedback_harness_convergence` — 하네스는 수렴, 부품이 쌓이면 hook 안내
- `screen-test` agent — 화면 수준 검증

**신규 필요:**

- `scripts/measureFocusContrast.mjs` (P1-1)
- `stylelint-plugin-ax-baseline` (P1-2)
- `scripts/verifyModularScale.mjs` (P1-3)
- stylelint 색상 제한 규칙 (P1-4)
- tokens/ 디렉토리 분리 (P2-1)

**갱신 대상:**

- `docs/DESIGN.md` (재편, §6)
- `02-principles.md` P-16 카드 (P0)
- `agents/design-review.md` 프롬프트 (P3)
