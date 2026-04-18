---
id: 2-areas/axis/prds/selection-neutral-prd
title: 'Selection Neutral — PRD'
created: 2026-04-04
updated: 2026-04-08
summary: 'Discussion: selected를 accent→neutral로 전환하여, accent 예산을 activate에 확보'
legacy:
  status: active
  kind: prd
  topics: [2-areas]
  relates: []
  supersedes: []
---
# Selection Neutral — PRD

> Discussion: selected를 accent→neutral로 전환하여, accent 예산을 activate에 확보

## ① 동기

### WHY

- **Impact**: selected 상태가 accent(hue 250 chroma)를 차지 → activate가 들어올 시각적 자리 없음. 3상태(focus/selected/activate)를 구분할 수 없다
- **Forces**: accent는 상태당 1채널만 사용해야 "시각 예산"이 유지됨. 현재 selected가 accent bg를 선점하여 activate와 충돌
- **Decision**: selected를 stone 래더(neutral elevation)로 전환. 트렌드 조사 결과 Shadcn/Linear/Vercel/Apple 모두 selected=neutral surface, accent=CTA/focus만. 대안 "selected에 미세 chroma 남기기"는 activate와 경계 모호해져 기각
- **Non-Goals**: activate 시각 정의 자체는 이 PRD 범위 밖. accent bg 자리를 비워두는 것까지만

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | Listbox에 5개 항목 | 3번 항목을 선택 | neutral raised bg (stone elevation), accent 없음 | ✅ 일치 |
| S2 | TreeGrid에 행 3개 | 2번 행 선택 + 셀 포커스 | 행=neutral context, 셀=neutral cursor, accent 없음 | ✅ 일치 |
| S3 | Tab 3개 | 2번 탭 선택됨 | neutral 처리 (accent border/color 제거) | ✅ 일치 |
| S4 | Listbox 포커스 활성 | 항목에 포커스 이동 | focus=accent outline(1채널), selected bg와 독립 | ✅ 일치 |
| S5 | 선택된 항목에 포커스 | focus + selected 동시 | neutral cursor bg + accent outline | ✅ 일치 |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `tokens.css` — `--selection-context` (dark) | `oklch(24% 0.020 250)` → `var(--stone-850)` | ✅ `tokens.css::--selection-context` |
| `tokens.css` — `--selection` (dark) | `oklch(28% 0.037 250)` → `var(--stone-750)` | ✅ `tokens.css::--selection` |
| `tokens.css` — `--selection-cursor` (dark) | `oklch(31% 0.047 250)` → `var(--stone-700)` | ✅ `tokens.css::--selection-cursor` |
| `tokens.css` — `--selection-context` (light) | `var(--blue-50)` → `var(--stone-100)` | ✅ `tokens.css::--selection-context` |
| `tokens.css` — `--selection` (light) | `var(--blue-100)` → `var(--stone-200)` | ✅ `tokens.css::--selection` |
| `tokens.css` — `--selection-cursor` (light) | `var(--blue-200)` → `var(--stone-300)` | ✅ `tokens.css::--selection-cursor` |
| `interactive.css` — Tab selected | accent border/color → `--text-bright` neutral | ✅ `interactive.css::[role="tab"][aria-selected="true"]` |
| `tokens.css` — 주석 | "chroma ladder" → "stone ladder (neutral elevation)" + 이 PRD 참조 | ✅ 주석 갱신 완료 |

완성도: 🟢

## ③ 인터페이스

| 입력 (상태 조합) | 현재 시각 | 왜 이 결과가 나는가 | 결과 시각 | 역PRD |
|-----------------|----------|-------------------|----------|-------|
| selected (단독) | accent bg `--selection` | selected=상태, accent 불필요 | neutral bg stone-750(dark) / stone-200(light) | |
| selected row (grid) | accent `--selection-context` | row=공간 맥락, cursor보다 약해야 | neutral stone-850(dark) / stone-100(light) | |
| focused cell (grid) | accent `--selection-cursor` | cursor=가장 강한 위치 표시 | neutral stone-700(dark) / stone-300(light) | |
| focused+selected | accent cursor bg + accent outline | focus outline만 accent, bg는 neutral | neutral cursor bg + accent outline | |
| tab selected | accent color + accent border-bottom | 탭 선택=상태, accent는 activate용 | text-bright color + text-bright border-bottom | |
| checked (radio/switch) | accent `--selection` | checked=지속 상태, :active 순간만 accent | neutral stone-750(dark) / stone-200(light) | |
| disabled+selected | accent `--selection` + opacity | 비활성 선택도 동일 neutral | neutral + opacity 0.4 | |
| :active (press) | accent `--tone-primary-bright` | 순간 피드백은 accent 유지 | **변경 없음** | |
| focus (단독) | accent outline `--focus` | focus=accent 1채널(outline) 유지 | **변경 없음** | |
| focus active (focus-within) | accent `--tone-primary-dim` bg | focus bg는 outline 보조 시그널, neutral이면 focus-idle과 구분 불가 | **변경 없음** | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 역PRD |
|----------|------------------------|----------|-------|
| hover + selected 동시 | hover=일시적(subtle), selected=지속적(raised) — selected 우선 | selected bg 유지 (specificity 보장) | |
| 전체 항목 selected (multi) | neutral이라 과하지 않음 | 정상 동작 | |
| light theme selected | stone-200(L=92%) on stone-0(L=100%) — 8% L차이 | 최소 구분 가능 | |
| light theme cursor | stone-300(L=86.6%) on stone-0 — 13.4% L차이 | 충분한 구분 | |
| checked radio/switch | ON=지속 상태, :active 순간만 accent | neutral bg, 토글 순간만 accent flash | |
| Tab 비선택 vs 선택 | weight semi + text-bright + border-bottom 3중 시그널 | 충분한 구분 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 역PRD |
|---|------------|----------|----------|-------|
| 1 | focus/selection/activation 별개 (`feedback_apg_three_concepts`) | ③ 전체 | ✅ 준수 — PRD 핵심 동기 | |
| 2 | accent 1채널 규칙 (discuss 제약) | ③ focus/selected/:active | ✅ 준수 | |
| 3 | ax()만 사용 (`CLAUDE.md`) | ② 토큰 변경 | ✅ 준수 | |
| 4 | surface 소유 속성 last-mile 금지 (`feedback_surface_no_lastmile`) | ② Tab | ✅ 준수 | |
| 5 | 기존 chroma-ladder PRD (`2026-04-04-chroma-ladder-prd.md`) | ② 주석 | ⚠️ 주석 갱신 필요 | |
| 6 | 디자인=기능 (`feedback_design_css_principles`) | ③ 시각 변경 | ✅ 준수 | |

완성도: 🟢

## ⑥ 부작용

| # | 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|----------------|-----------|--------|------|-------|
| 1 | `tokens.css` selection 3토큰 | 참조하는 모든 곳 일괄 neutral화 | 낮 | 허용 (의도) | |
| 2 | `interactive.css` Tab selected | Tab 시각 변경 | 낮 | 허용 | |
| 3 | `cms.css` Tab | 이미 neutral(`--surface-raised`) — 영향 없음 | 없음 | — | |
| 4 | 기존 chroma-ladder PRD 주석 | 추적 불일치 | 낮 | 이 PRD로 주석 대체 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---------------|------|------|-------|
| 1 | selection 토큰에 chroma(hue 250) 남기기 | ⑤#2 | accent=행동, neutral=상태 경계 붕괴 | |
| 2 | focus bg(`--tone-primary-dim`)를 neutral로 변경 | ③ focus | focus-idle과 구분 불가 | |
| 3 | :active를 neutral로 변경 | ③ :active | 순간 피드백은 accent가 맞음 | |
| 4 | Tab selected에 accent 채널 남기기 | ①S3 | selected=neutral 원칙 일관성 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | ①S1 | Listbox 항목 선택 | bg=stone-750(dark), accent 없음 | ✅ 토큰 변경으로 보장 |
| V2 | ①S2 | TreeGrid 행 선택 + 셀 포커스 | 행=stone-850, 셀=stone-700 | ✅ 토큰 변경으로 보장 |
| V3 | ①S3 | Tab 선택 | color=text-bright, border=text-bright, bg=transparent | ✅ `interactive.css` 셀렉터 변경 |
| V4 | ①S4 | Listbox 포커스 이동 | focus outline=accent, bg=tone-primary-dim | ✅ 변경 없음 (의도) |
| V5 | ①S5 | 선택+포커스 동시 | bg=stone-700 + accent outline | ✅ 토큰 변경으로 보장 |
| V6 | ④ hover+selected | hover 중 selected 항목 | selected bg 우선 | ✅ CSS specificity로 보장 |
| V7 | ④ checked | radio/switch ON | bg=stone-750, :active만 accent | ✅ 토큰 변경으로 보장 |
| V8 | ④ light | light theme 선택 | stone-200 bg, hover(stone-100)와 구분 | ✅ 토큰 변경으로 보장 |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

### 교차 검증

1. ✅ 동기 S1~S5 → 검증 V1~V5 커버
2. ✅ 산출물 8개 → 인터페이스 10개 상태 조합 커버
3. ✅ 경계 6개 → 검증 V6~V8 포함
4. ✅ 금지 4개 → 출처(⑤/③) 유효
5. ✅ 원칙 대조 위반 없음, #5 주석 갱신은 ② 산출물에 포함

#kind/prd #topic/axis
