---
id: 4-archive/design/summary
type: note
slug: designSummary
title: 'Design — 결정 요약'
tags: [retro]
created: 2026-04-11
updated: 2026-04-11
legacy:
  status: archived
  kind: summary
  topics: [4-archive, retro]
  relates: []
  supersedes: []
---
# Design — 결정 요약

## 구조적 CSS의 LLM 한계 발견 (2026-03-25)

- CSS 구조 변경(grid→flex) 때마다 overflow/스크롤 부작용이 연쇄 발생하는 상황
- → LLM이 CSS↔JSX 교차 참조를 못해서 반복 실수, 예측 불가한 부작용
- **구조적 CSS를 어떻게 안전하게 다룰 것인가?**
  - 선언적 OCP 설계 철학 정립 (3원칙 문서화)
  - page grid→flex 전환으로 gridColumn 반복 실수 구조적 제거
  - 근본 해결은 미결 — 이후 ax() 디자인 시스템으로 수렴

```mermaid
flowchart TD
  S["CSS 구조 변경 때마다 overflow/스크롤 부작용 연쇄"] --> C["LLM이 CSS↔JSX 교차 참조 불가, 반복 실수"]
  C --> Q{{"구조적 CSS를 어떻게 안전하게 다룰 것인가?"}}
  Q --> A["CSS 변경 시 수동 검증 강화"]
  Q --> B["선언적 OCP + grid→flex 전환"]
  A -. "✗ LLM 한계 해소 안 됨" .-> X[기각]
  B -- "✓ 부작용 구조적 감소" --> OK[채택]
  OK -.- R{{근본 해결은 ax() 디자인 시스템으로 수렴 예정}}
```

> 원본: [archive/54-[retro]structuralCssSessionSummary.md](archive/54-[retro]structuralCssSessionSummary.md)

---

## CSS Writing Rules: stylelint 기반 규칙 강제 (2026-03-25)

- CSS 작성 시 margin, raw 수치, unlayered 스타일이 반복적으로 발생하는 상태
- → 리뷰 때마다 같은 피드백 반복, 자동화 필요
- **CSS 규칙을 어떻게 자동 강제할 것인가?**
  - stylelint.config.mjs에 margin 금지 등 구현
  - :where() 강제와 structure 속성 경고는 커스텀 플러그인 필요로 미구현

```mermaid
flowchart TD
  S["CSS에서 margin·raw수치·unlayered 스타일 반복 발생"] --> C["리뷰마다 같은 피드백 반복"]
  C --> Q{{"CSS 규칙을 어떻게 자동 강제?"}}
  Q --> A["리뷰 체크리스트로 수동 검증"]
  Q --> B["stylelint 규칙 자동화"]
  A -. "✗ 반복 노동, 누락" .-> X[기각]
  B -- "✓ margin 금지 구현" --> OK[채택]
  OK -.- R{{:where() 강제·structure 경고는 커스텀 플러그인 필요 — 미구현}}
```

> 원본: [archive/55-[retro]cssWritingRules.md](archive/55-[retro]cssWritingRules.md)

#kind/note #archived
