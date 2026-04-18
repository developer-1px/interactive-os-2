---
id: research/ax/README
title: 'ax 메타 원리 연구 (research/ax/)'
status: research
kind: readme
created: 2026-04-18
updated: 2026-04-18
summary: 'ax()를 "현대 UI 디자인 메타 원리의 공식 좌표계"로 정립하기 위한 연구 산출물 모음.'
topics: [research]
relates: []
supersedes: []
---
# ax 메타 원리 연구 (research/ax/)

ax()를 "현대 UI 디자인 메타 원리의 공식 좌표계"로 정립하기 위한 연구 산출물 모음.

## 파일

| 순번 | 파일 | 역할 | 상태 |
|------|------|------|------|
| 00 | [mandate.md](00-mandate.md) | 연구 선언 — 목적·비전·스코프 | 🟢 작성 |
| 01 | [literature-review.md](01-literature-review.md) | 1·2·3군 외부 탐색 통합 리포트 | 🟢 작성 |
| 02 | [principles.md](02-principles.md) | 원리 카드 20개 (Name/Def/Evidence/Math/Falsifier/Examples) | 🟢 작성 v1 |
| 03 | [ax-mapping.md](03-ax-mapping.md) | 원리 × 25축 Locked/Exposed/Missing/Conflicts/N/A 매트릭스 | 🟢 작성 |
| 04 | [gap-plan.md](04-gap-plan.md) | 7 enforcement layer 매트릭스 + 보정 로드맵 P0~P3 | 🟢 작성 |

## 승격 파이프라인

```
research/ax/ (연구 단계)
       ↓
02 + 03 🟢 확정
       ↓
DESIGN.md 재편 (메타 원리 선언 → 24축 파생 증명)
```

## 참조 memory

- `project_ax_codification` — 이 연구의 정체성
- `project_ax_design_system` — 24축 설계 결정 기록 (SSOT: DESIGN.md)
- `project_ax_shadcn_insight` — 구조 잠금 + 스타일 개방
- `project_ax_combination_invariants` — 조합 불변 규칙
- `project_ax_public_private_split` — Public 3축 + Private 프리셋 주입
- `feedback_ax_semantic_not_css` — ax 축은 의도·역할 기준 (CSS 1:1 아님)
- `feedback_role_axis_design` — role축=크기SSOT
- `feedback_color_system` — 3층 색상 + accent + chroma 5단계
