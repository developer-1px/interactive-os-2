---
id: 2-areas/design/prds/3layer-color-system-prd
type: prd
slug: layerColorSystem
title: '3층 색상 체계 (sys/brand/tone) + oklch 파생 — PRD'
tags: [untagged]
created: 2026-04-09
updated: 2026-04-09
summary: 'Discussion: accent가 focus/CTA/semantic 3역할을 겸임 → sys/brand/tone 분리. oklch h,c 2-input → 모든 상태 색상 + 전경색(흑/백) 자동 파생. `--selection` depth 토큰 폐기.'
legacy:
  status: active
  kind: prd
  topics: [2-areas]
  relates: []
  supersedes: []
---
# 3층 색상 체계 (sys/brand/tone) + oklch 파생 — PRD

> Discussion: accent가 focus/CTA/semantic 3역할을 겸임 → sys/brand/tone 분리. oklch h,c 2-input → 모든 상태 색상 + 전경색(흑/백) 자동 파생. `--selection` depth 토큰 폐기.

## ① 동기

### WHY

- **Impact**: interactive 상태(selected/focused/checked)의 배경색이 WCAG 1.4.11 대비 3:1 미달. 연한 회색 밴드(Radio), 미세한 배경 차이(Accordion), 배경 명도 차이만(Spinbutton). tone 축을 선언해도 interactive가 무시하고 독자 토큰 사용.
- **Forces**: tone은 `--_bg/--_fg`를 설정하지만 surface=action만 소비. interactive는 depth 토큰(`--selection`)과 하드코딩(`--tone-primary-dim`)으로 독자 경로. accent(blue)가 focus-ring + CTA + selection 3역할 겸임.
- **Decision**: 3층 분리 — sys(blue, focus/cursor), brand(orange, CTA/action), tone(semantic). oklch h,c 2개 입력 → lightness 조작으로 모든 상태 자동 파생. 기각: fallback 두 경로 공존(디버깅 지옥), 배경색 대비만 올리기(근본 해결 안 됨).
- **Non-Goals**: 전체 팔레트(stone/blue/red/green) 재설계는 범위 밖. cream→cool white 전환도 별도.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | RadioGroup에 `tone: 'danger'` 선언 | selected 아이템 렌더 | selected 배경 = danger dim(연한 빨강), 전경 = 자동(검정), WCAG 3:1+ | |
| M2 | ListBox에 tone 없음 | selected 아이템 렌더 | selected 배경 = neutral dim(stone), 전경 = 자동(흰색/검정) — 기존과 시각적 동일 | |
| M3 | Button에 `surface: 'action', tone: 'brand'` | 렌더 | 배경 = brand base(orange), 전경 = 자동(흰색) | |
| M4 | 키보드 focus가 아이템에 도달 | focus-ring 렌더 | outline 색상 = sys(blue), tone과 무관 | |
| M5 | warning Alert 렌더 | border-left 색상 | tone-warning의 base(yellow hue85) 사용 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `tokens.css` 변경 | h,c 입력 정의 (`--brand-h`, `--sys-h`, `--danger-h` 등). `--tone-primary-*` → oklch 파생. `--focus` → sys 기반. `--selection`/`--selection-cursor` depth 토큰 폐기 | |
| `ax.css` 변경 | `.tn-brand`(신규, `.tn-accent` 대체). `.tn-*` oklch 파생 (`--_sel`, `--_sel-fg`, `--_focus-bg` 추가). `.ia-*` 소비 구조: `--_sel`/`--_sel-fg` 참조. `.st-*` 동기화 | |
| `ax.ts` 변경 | `Tone` 타입: `'accent'` → `'brand'`. `'accent-dim'` → `'brand-dim'` | |
| `palette.css` 변경 | warning amber→yellow 주석 갱신 | |
| 전 코드베이스 rename | `tone: 'accent'` → `tone: 'brand'` (TS ~21파일), CSS 클래스명 (ax.css, PageThemeCreator.css), 스크립트/hook (2파일), 문서 (DESIGN.md 등) | |
| `DESIGN.md` 갱신 | 3층 색상 체계 설명, accent→brand, warning hue 변경 | |

완성도: 🟢

## ③ 인터페이스

> CSS 레벨 인터페이스. "입력" = ax() 선언, "결과" = 렌더링된 색상.

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `ax({ tone: 'brand' })` | tone 없음 | `.tn-brand` 클래스 적용 | brand의 h=55, c=0.15에서 oklch(55% 0.15 55) = base, oklch(from base round(1.21-l) 0 0) = fg | `--_bg`=orange, `--_fg`=white(L<0.72), `--_sel`=orange-dim, `--_sel-fg`=auto | |
| `ax({ tone: 'neutral' })` | tone 없음 | `.tn-neutral` 클래스 적용 | c=0이므로 oklch lightness만 → stone과 동일 | `--_sel`=stone-dim(기존 `--selection`과 동등), `--_sel-fg`=auto | |
| `ax({ interactive: 'item' })` + `aria-selected="true"` | 선택 안 됨 | selected 배경 적용 | interactive가 `var(--_sel, var(--neutral-sel))` 소비. tone 없으면 fallback=neutral | selected 배경 = tone의 dim, 전경 = `--_sel-fg` | |
| focus-visible outline | unfocused | focus ring 렌더 | `--sys-focus`가 sys h,c에서 파생 (blue) | outline = sys blue, tone과 독립 | |
| `ax({ surface: 'action', tone: 'brand' })` + hover | idle | hover 배경 적용 | surface가 `var(--_bg-hover)` 소비, tone이 설정한 값 | brand hover = oklch(50% 0.15 55) | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| tone 없이 `interactive: 'item'` 사용 | 현재 대부분의 ui/ 컴포넌트 | 마이그레이션 무충격 — 기존 시각 유지 | neutral fallback 적용. `var(--_sel, ...)` CSS fallback | stone 배경 (기존과 동일) | |
| light theme에서 warning selected | brand tone + light theme | warning(hue85, yellow) + light theme → 밝은 노랑 배경 | `--_sel` lightness 92% + auto fg → 연노랑 + 검정글씨 | WCAG 3:1 충족 | |
| dark theme에서 brand selected | brand tone + dark theme | brand(hue55, orange) + dark theme → 어두운 오렌지 배경 | `--_sel` lightness 30% + auto fg → 어두운 오렌지 + 흰글씨 | WCAG 3:1 충족 | |
| `relative color syntax` 미지원 브라우저 | 구형 브라우저 | 2024 전 엔진 출시, 93%+ 지원. 미지원 시 graceful degrade | `--_fg` fallback 값 CSS variable로 제공 | fg fallback = inherit | |
| depth 토큰 폐기 후 raised/overlay surface의 selection | overlay surface + selected item | surface별로 depth가 달라야 함 → surface가 `--_sel` lightness offset을 조정 | surface별 CSS에서 `--_sel-l-offset` 오버라이드 또는 tone 파생 시 surface 컨텍스트 반영 | surface-aware selection 배경 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | chroma ladder: selection=neutral stone (`feedback_chroma_ladder`) | ③ tone별 `--_sel` | **위반** — 3층 체계가 대체(supersede) | feedback 갱신: "selection은 해당 tone의 dim 파생. tone 없으면 neutral" | |
| 2 | accent budget: selected=neutral, focus=accent outline (`feedback_accent_budget`) | ③ sys/brand 분리 | **용어 갱신** — accent→brand, focus=sys(blue) | feedback 갱신: "selected=tone dim, focus-ring=sys(blue), CTA=brand" | |
| 3 | surface 소유 속성에 last-mile 금지 (`feedback_surface_no_lastmile`) | ② ax.css 변경 | 정합 — tone 파생을 surface가 소비하는 구조. module.css 개입 없음 | | |
| 4 | ax() semantic not CSS (`feedback_ax_semantic_not_css`) | ② ax.ts Tone 타입 | 정합 — tone='brand'는 역할 의미, CSS 속성이 아님 | | |
| 5 | style={} 금지 (`feedback_style_is_hatch`) | ⑥ devtools inspector | **기존 위반 발견** — 3파일에서 `style={{ color: 'var(--focus)' }}` | rename 시 함께 수정: ax() 사용으로 전환 | |
| 6 | 디자인=기능, 색은 강조만 (`feedback_design_css_principles`) | ① 3층 구조 | 정합 — neutral(c=0) 기본, brand/sys만 유채색 | | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | cms.css에서 `--tone-primary-*` 직접 참조 6개소 | accent→brand 색상(blue→orange) 변경 시 CMS UI 색상 전면 변경 | 높음 | `--tone-primary-*` → `--sys-*` 또는 `--brand-*`로 의미에 맞게 재매핑. cms.css는 대부분 focus/selection 용도이므로 sys 경로가 적절 | |
| 2 | app.css에서 `--tone-primary-*` 직접 참조 5개소 | 링크, 뱃지, 코드 강조 색상 변경 | 중간 | 각각 의미 분석 후 sys/brand/tone 중 적절한 경로로 교체 | |
| 3 | `--border-accent` 미정의 (TabGroup.css) | 기존 버그. rename 시 함께 해결 | 낮음 | `--border-accent` 참조를 sys/brand 기반 토큰으로 교체 | |
| 4 | warning 색상 변경 (hue 82→85) | warning Alert, Badge, Chip 색상이 약간 변경 | 낮음 | 의도적 변경. hue 3도 차이로 미미 | |
| 5 | depth 토큰 폐기 → overlay/raised surface의 selection 색상 | surface별 selection 명도 차이가 사라질 수 있음 | 중간 | tone 파생 시 surface context를 반영하는 lightness offset 도입. 또는 surface CSS에서 `--_sel` 재정의 | |
| 6 | devtools inspector 3파일 style={} 위반 | rename 시 함께 수정 필요 | 낮음 | ax() 사용으로 전환 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | `--tone-primary-*` 토큰명을 `--tone-brand-*`로 단순 rename | ⑤#1 chroma ladder 대체 | primary는 blue 전용 naming. brand는 orange. sys/brand 분리 후 primary 토큰 자체를 oklch 파생 구조로 재설계해야 함 | |
| 2 | interactive 상태에 `style={}` 사용 | ⑤#5 style 금지 | ax() 축으로만 색상 제어 | |
| 3 | module.css에서 `--_sel`/`--_sel-fg` 직접 오버라이드 | ⑤#3 surface last-mile 금지 | tone 파생 색상은 tone/surface 축에서만 설정 | |
| 4 | `--selection` depth 토큰을 남겨두고 fallback으로 사용 | discuss 결정 | 두 경로 공존 = 디버깅 지옥. 완전 폐기 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | M1 | RadioGroup `tone:'danger'` → selected item | 연한 빨강 배경 + 검정/흰색 텍스트, WCAG 3:1+ | |
| V2 | M2 | ListBox tone 없음 → selected item | stone 배경 (기존과 시각 동일) | |
| V3 | M3 | Button `surface:'action' tone:'brand'` | orange 배경 + 흰색 텍스트 | |
| V4 | M4 | 키보드 Tab으로 ListBox 아이템에 focus | blue outline (sys 색상), 배경은 tone에 의존 | |
| V5 | M5 | warning Alert | yellow(hue85) border-left | |
| V6 | ④E1 | tone 없는 `interactive:'item'` selected | neutral fallback, 기존 시각 유지 | |
| V7 | ④E2 | light theme + warning selected | 연노랑 배경 + 검정 글씨 | |
| V8 | ④E3 | dark theme + brand selected | 어두운 오렌지 배경 + 흰 글씨 | |
| V9 | ④E5 | overlay surface + selected item | overlay depth에 맞는 selection 명도 | |
| V10 | ⑥#1 | CMS sidebar focus | sys(blue) outline — 기존 accent blue와 시각 유사 | |
| V11 | ⑥#4 | warning Badge/Chip 색상 | hue85 yellow — 기존 hue82 amber보다 깨끗 | |
| V12 | — | typecheck 통과 | `tone: 'accent'` → `tone: 'brand'` 전수 치환 후 타입 에러 0 | |
| V13 | — | `pnpm score:design` | WCAG 대비 점수 향상 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

## 교차 검증

1. **동기 ↔ 검증**: M1~M5 모든 동기가 V1~V5로 커버됨 ✅
2. **인터페이스 ↔ 산출물**: tone CSS 변수(--_sel/--_sel-fg) 설정→소비 구조 일치 ✅
3. **경계 ↔ 검증**: E1~E5 → V6~V9 커버됨 ✅
4. **금지 ↔ 출처**: 4개 금지 모두 ⑤/⑥/discuss에서 파생 ✅
5. **원칙 대조 ↔ 전체**: chroma_ladder/accent_budget 갱신 예정, 새 위반 없음 ✅

#kind/prd #topic/design
