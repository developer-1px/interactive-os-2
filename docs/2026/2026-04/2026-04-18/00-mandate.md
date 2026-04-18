---
id: research/ax/00-mandate
title: '00 Mandate — ax 메타 원리 연구'
status: research
kind: note
created: 2026-04-18
updated: 2026-04-18
summary: '**선언일:** 2026-04-18 **이전 상태:** ax = 24축 CSS-in-JS 시스템 (실험 중) **재정의 후:** ax = **현대 UI 디자인 메타 원리의 공식 좌표계**'
topics: [research]
relates: []
supersedes: []
---
# 00 Mandate — ax 메타 원리 연구

**선언일:** 2026-04-18
**이전 상태:** ax = 24축 CSS-in-JS 시스템 (실험 중)
**재정의 후:** ax = **현대 UI 디자인 메타 원리의 공식 좌표계**

---

## 1. 선언

ax의 궁극 목적은 현대 UI 디자인이 공통으로 따르는 **메타 원리**들을 공식적으로 **명명화·개념화**하여 하나의 좌표계로 고정하는 것이다.

## 2. 배경 — 지금까지는 사전 탐색이었다

지금까지 24축을 운영하며 축적한 실험들은 각각이 메타 원리의 **부분 증명**이었다:

| 실험 | 형상화한 메타 원리 |
|------|--------------------|
| `project_ax_shadcn_insight` | Role → Structure 파생 + Size × Role 프리셋 |
| `project_ax_public_private_split` | Token Tiering (Public/Private 2계층) |
| `project_depth_ladder` | Surface Hierarchy (sunken→base→raised→overlay) |
| `feedback_role_axis_design` | role축=크기 SSOT, surface=색칠 |
| `feedback_color_system` | Color as Role + Chroma Scale |
| `feedback_padding_by_layout_type` | Spatial Rhythm (레이아웃 타입별 padding) |
| `feedback_cs_padding_content` | Size Ladder 비율 (text 2:1) |
| `project_keyline_audit_pipeline` | 수치 검증 루프 (반증 조건 도구화) |
| `feedback_ax_semantic_not_css` | ax = 의미축, CSS 1:1 아님 |

이 실험들이 개별적으로 살아있던 상태에서, 이제 **공통 상위 원리로 집약**한다.

## 3. 비전

**구조·비례·배치·위계·페어링 원리는 축 내부에 잠기고, 색상·수치 변형만 외부에 열린다.** 컨셉 다양성 + 일관 품질이 동시 성립하는 시스템.

shadcn의 "구조 잠금 + 스타일 개방"의 심화판 — shadcn이 Radix로 행동/구조를, Tailwind로 스타일을 분리한다면, ax는 **디자이너가 평생 훈련해야 익히는 암묵지**(비례, 박자, 위계, 페어링)까지 축 내부에 잠근다.

## 4. Why — 수학적 조건

컨셉 다양성과 일관 품질이 동시에 성립하는 수학적 조건은:

```
관계/비율/순서/페어링을 잠그고 → 값 선택만 연다
```

각 원리는 **정량 반증 조건**을 갖춰야 한다. 반증 불가능한 주장은 원리가 아니라 취향이다 (FRT 게이트 정신).

## 5. 스코프

**In scope:**
- 현대 UI 디자인이 공통으로 따르는 메타 원리의 추출·명명·정의
- 각 원리의 수학/인지과학 근거 탐색 및 정량 반증 조건 작성
- 원리 × ax 24축 역매핑 (Locked/Exposed/Missing)
- Gap 해소 플랜
- 최종적으로 DESIGN.md를 "메타 원리 선언 → 24축 파생 증명" 구조로 재편

**Out of scope (이 연구에서 다루지 않음):**
- 새 컴포넌트 추가 (ui/ 레이어)
- 새 프로덕트 기능 (pages/ 레이어)
- APG/ARIA 패턴 확장 (interactive-os/pattern)
- ax 엔진 재구현 (스타일 처리 파이프라인)

## 6. 산출물

| # | 산출물 | 목적 |
|---|--------|------|
| 00 | mandate.md | 연구 선언 (이 문서) |
| 01 | literature-review.md | 1·2·3군 통합 리포트 |
| 02 | principles.md | 원리 카드 N개 (확정본) |
| 03 | ax-mapping.md | 원리 × 24축 매트릭스 |
| 04 | gap-plan.md | 보정 액션 |
| → | DESIGN.md 재편 | 원리 선언을 축 정의 상위에 배치 |

## 7. 제약

- **프로젝트 규약 우선** — Best Practice/표준과 충돌하면 프로젝트 규약이 이긴다 (예: ax가 이미 채택한 경로 유지)
- **24축은 재설계 아닌 재정립** — 축 개수·책임은 현재를 존중. 원리 언어로 재서술
- **한국어 + 원어 병기** — Token Tiering, Modular Scale 같은 원어 용어는 원어 유지
- **LLM + 사람 양쪽 가독** — 문서가 LLM 프롬프트에도, 디자이너/개발자 온보딩에도 쓰여야 함

## 8. 관련 memory

- [project_ax_codification](../../../.claude/projects/-Users-user-Desktop-aria/memory/project_ax_codification.md) — 이 연구의 정체성 선언
- [project_ax_design_system](../../../.claude/projects/-Users-user-Desktop-aria/memory/project_ax_design_system.md) — 24축 설계 결정 기록
- [feedback_ax_semantic_not_css](../../../.claude/projects/-Users-user-Desktop-aria/memory/feedback_ax_semantic_not_css.md) — 의도 기준 원칙
