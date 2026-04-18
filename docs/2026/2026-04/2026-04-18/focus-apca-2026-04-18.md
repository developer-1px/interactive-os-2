---
id: research/ax/reports/focus-apca-2026-04-18
type: note
slug: focusApca
title: 'Focus APCA Measurement — 2026-04-18'
tags: [research]
created: 2026-04-18
updated: 2026-04-18
summary: '**기준:** APCA Lc ≥ 60 (24px body, P-08 Focus Visibility)'
legacy:
  status: research
  kind: note
  topics: [research]
  relates: []
  supersedes: []
---
# Focus APCA Measurement — 2026-04-18

**기준:** APCA Lc ≥ 60 (24px body, P-08 Focus Visibility)

**결과:** 0/22 pass, 22 fail. ❌ FAIL

## Theme: `dark`

| surface | surface oklch | focus+alpha blended | Lc | pass? |
|---------|---------------|---------------------|-----|:-----:|
| action | oklch(32.0% 0.006 90) | rgb(60, 88, 109) | 10.3 | ❌ |
| input | oklch(21.4% 0.004 90) | rgb(43, 71, 93) | 8.8 | ❌ |
| display | oklch(23.3% 0.004 90) | rgb(46, 74, 96) | 9.2 | ❌ |
| overlay | oklch(32.0% 0.006 90) | rgb(60, 88, 109) | 10.3 | ❌ |
| trap | oklch(35.9% 0.006 90) | rgb(67, 95, 115) | 10.0 | ❌ |
| ghost | oklch(23.3% 0.004 90) | rgb(46, 74, 96) | 9.2 | ❌ |
| placeholder | oklch(16.3% 0.003 90) | rgb(35, 64, 86) | 7.3 | ❌ |
| sunken | oklch(16.3% 0.003 90) | rgb(35, 64, 86) | 7.3 | ❌ |
| base | oklch(23.3% 0.004 90) | rgb(46, 74, 96) | 9.2 | ❌ |
| raised | oklch(32.0% 0.006 90) | rgb(60, 88, 109) | 10.3 | ❌ |
| inverted | oklch(100.0% 0.000 0) | rgb(192, 221, 244) | 19.8 | ❌ |

## Theme: `light`

| surface | surface oklch | focus+alpha blended | Lc | pass? |
|---------|---------------|---------------------|-----|:-----:|
| action | oklch(100.0% 0.000 0) | rgb(182, 212, 242) | 24.7 | ❌ |
| input | oklch(100.0% 0.000 0) | rgb(182, 212, 242) | 24.7 | ❌ |
| display | oklch(98.0% 0.005 90) | rgb(178, 207, 236) | 23.4 | ❌ |
| overlay | oklch(100.0% 0.000 0) | rgb(182, 212, 242) | 24.7 | ❌ |
| trap | oklch(100.0% 0.000 0) | rgb(182, 212, 242) | 24.7 | ❌ |
| ghost | oklch(98.0% 0.005 90) | rgb(178, 207, 236) | 23.4 | ❌ |
| placeholder | oklch(94.8% 0.010 90) | rgb(172, 201, 226) | 20.8 | ❌ |
| sunken | oklch(94.8% 0.010 90) | rgb(172, 201, 226) | 20.8 | ❌ |
| base | oklch(98.0% 0.005 90) | rgb(178, 207, 236) | 23.4 | ❌ |
| raised | oklch(100.0% 0.000 0) | rgb(182, 212, 242) | 24.7 | ❌ |
| inverted | oklch(16.3% 0.003 90) | rgb(25, 55, 84) | 0.0 | ❌ |

## 실패 목록

- `dark` · `action` — Lc 10.3 (< 60). button·toggle 주면
- `dark` · `input` — Lc 8.8 (< 60). input·textarea
- `dark` · `display` — Lc 9.2 (< 60). 카드 배경
- `dark` · `overlay` — Lc 10.3 (< 60). popover·menu
- `dark` · `trap` — Lc 10.0 (< 60). dialog center
- `dark` · `ghost` — Lc 9.2 (< 60). transparent → parent
- `dark` · `placeholder` — Lc 7.3 (< 60). skeleton/empty
- `dark` · `sunken` — Lc 7.3 (< 60). sidebar·blockquote
- `dark` · `base` — Lc 9.2 (< 60). page bg
- `dark` · `raised` — Lc 10.3 (< 60). card (+shadow)
- `dark` · `inverted` — Lc 19.8 (< 60). 역전 tooltip
- `light` · `action` — Lc 24.7 (< 60). button·toggle 주면
- `light` · `input` — Lc 24.7 (< 60). input·textarea
- `light` · `display` — Lc 23.4 (< 60). 카드 배경
- `light` · `overlay` — Lc 24.7 (< 60). popover·menu
- `light` · `trap` — Lc 24.7 (< 60). dialog center
- `light` · `ghost` — Lc 23.4 (< 60). transparent → parent
- `light` · `placeholder` — Lc 20.8 (< 60). skeleton/empty
- `light` · `sunken` — Lc 20.8 (< 60). sidebar·blockquote
- `light` · `base` — Lc 23.4 (< 60). page bg
- `light` · `raised` — Lc 24.7 (< 60). card (+shadow)
- `light` · `inverted` — Lc 0.0 (< 60). 역전 tooltip

## 권고 조치

- **alpha 상향**: `--focus-ring-shadow` alpha 0.35 → 0.5~0.6 검토
- **lightness 대비**: `--focus` 후보 blue-400 (67.4%) vs blue-500 (60.6%) 중 theme별 최적 재선택
- **ring 폭 확대**: `--focus-ring: 1px` → 2px로 ring 면적 증가 (APCA는 font weight/size 기반이므로 측정 대리 안 됨. 정성 검토용)
- **surface별 다른 focus hue**: sunken/placeholder처럼 어두운 surface에는 brighter focus (blue-300 등)

---

> 측정: `apca-w3` 0.1.9 · 스크립트: `scripts/measureFocusContrast.mjs`
> 참고: `docs/research/ax/04-gap-plan.md` §3.1

#kind/note #topic/research
