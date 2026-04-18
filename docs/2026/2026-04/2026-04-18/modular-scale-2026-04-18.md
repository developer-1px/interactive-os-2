---
id: research/ax/reports/modular-scale-2026-04-18
title: 'Modular Scale Verification — 2026-04-18'
status: research
kind: note
created: 2026-04-18
updated: 2026-04-18
summary: '**기준:** 각 계단 인접 ratio `r ∈ [1.067, 2]` (P-02 Size Ladder) **권장:** 1.25 Major Third 기반 ladder (± 0.05)'
topics: [research]
relates: []
supersedes: []
---
# Modular Scale Verification — 2026-04-18

**기준:** 각 계단 인접 ratio `r ∈ [1.067, 2]` (P-02 Size Ladder)
**권장:** 1.25 Major Third 기반 ladder (± 0.05)

**정책:** 범위 밖은 **warn** (exit 0). 비대칭 ladder는 의도된 설계 가능 (Material 3 유사). 리포트로 의도 검토.

## Space (--space-...)

| step | value | ratio to prev | status |
|------|-------|--------------:|--------|
| xs | 4px | — | — |
| sm | 8px | 2.000 | ⚠ 경계 high |
| md | 16px | 2.000 | ⚠ 경계 high |
| lg | 24px | 1.500 | ⚠ 경계 high |
| xl | 32px | 1.333 | ✅ |
| 2xl | 48px | 1.500 | ⚠ 경계 high |
| 3xl | 64px | 1.333 | ✅ |
| 4xl | 80px | 1.250 | ✅ 이상적 |
| 5xl | 96px | 1.200 | ✅ |

## Shape radius (--shape-...-radius)

| step | value | ratio to prev | status |
|------|-------|--------------:|--------|
| 2xs | 2 | — | — |
| xs | 4 | 2.000 | ⚠ 경계 high |
| sm | 6 | 1.500 | ⚠ 경계 high |
| md | 8 | 1.333 | ✅ |
| lg | 12 | 1.500 | ⚠ 경계 high |
| xl | 16 | 1.333 | ✅ |

## Icon (--icon-...)

| step | value | ratio to prev | status |
|------|-------|--------------:|--------|
| xs | 14px | — | — |
| sm | 16px | 1.143 | ✅ |
| md | 18px | 1.125 | ✅ |
| lg | 24px | 1.333 | ✅ |

## Typography (--type-...-size)

| step | value | ratio to prev | status |
|------|-------|--------------:|--------|
| code | 12 | — | — |
| caption | 12 | 1.000 | ❌ 너무 작음 (<1.067) |
| control | 14 | 1.167 | ✅ |
| body | 14 | 1.000 | ❌ 너무 작음 (<1.067) |
| section | 16 | 1.143 | ✅ |
| prose | 16 | 1.000 | ❌ 너무 작음 (<1.067) |
| page | 24 | 1.500 | ⚠ 경계 high |
| display | 32 | 1.333 | ✅ |
| hero | 40 | 1.250 | ✅ 이상적 |

## Summary

- 총 경고 건수: **11**
- 범위 밖 (❌) 은 의도 검토 필요, 경계 (⚠) 는 허용 가능

## 권장 (1.25 Major Third 기반)

**Typography 후보:**
- 12 → 15 → 18.75 → 23.44 → 29.30 → 36.62 (Major Third)
- 현재 aria: 12 / 14 / 16 / 24 / 32 / 40 — 비단조 ratio (1.167, 1.143, 1.5, 1.333, 1.25)

**Space (baseline 4px/8px):**
- 4 → 8 → 16 → 24 → 32 → 48 → 64 → 80 → 96
- 배수 배수지만 ratio = 2.0 (xs→sm), 1.5, 1.33, 1.5, 1.33, 1.25, 1.2 — 상단 완만

**Shape radius:**
- 2 → 4 → 6 → 8 → 12 → 16 — ratio 2.0, 1.5, 1.33, 1.5, 1.33 — 하단 급격

**Icon:**
- 14 → 16 → 18 → 24 — ratio 1.143, 1.125, 1.33 — 하단 3단이 RATIO_MIN 경계 근접

---

> 스크립트: `scripts/verifyModularScale.mjs`
> 참고: `docs/research/ax/04-gap-plan.md` §3.3
